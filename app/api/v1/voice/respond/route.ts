import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { requireOwner } from "@/lib/require-owner";
import { askClaudeWithTools } from "@/lib/anthropic-client";
import { getPreferences, formatPreferencesForPrompt } from "@/lib/preferences-store";
import { detectAndStorePreference } from "@/lib/preference-detector";
import { loadSession, saveSession, type VoiceTurn } from "@/lib/voice-session-store";
import { TOOL_DEFINITIONS, executeTool } from "@/lib/tool-dispatcher";

// Backs the entire voice pipeline: real Anthropic tool-calling replaces the
// old rule-based dispatcher (lib/voice-intent-router.ts, deleted). Claude
// decides which tool(s), if any, a transcript needs — the tool schema in
// lib/tool-dispatcher.ts is the single source of truth for what North can
// do, not a hand-maintained prose manifest. See
// North_Vector_JARVIS_Tool_Calling_Migration_Plan.md for the full design.

const MAX_TOOL_ITERATIONS = 4; // hard cap against a runaway tool-call loop —
                                // no realistic single voice turn should need
                                // more than a couple of tool calls

// Folds in the advisory framing app/api/v1/voice/judgment/route.ts used to
// provide via a separate HTTP call — decision-shaped questions now get a
// real opinion in the same tool-use turn (via get_decision_recommendation's
// "specific": false signal) rather than a second round-trip. See
// North_Vector_JARVIS_Tool_Calling_Migration_Plan.md Section 7.1.
function buildSystemPrompt(preferences: Awaited<ReturnType<typeof getPreferences>>): string {
  return (
    "You are North, a personal chief-of-staff assistant, speaking with Nishad. Respond " +
    "conversationally in 1-4 short sentences (Voice_Interaction_Design.md's brevity rule) — this is " +
    "spoken aloud, not read. Keep the whole answer under 60 words and make sure it's a complete, " +
    "finished thought — never trail off mid-sentence.\n\n" +
    "You have tools for checking email, calendar, and Notion, creating tasks, and getting a decision " +
    "recommendation. Call a tool whenever the request genuinely needs current information or an " +
    "action you have a tool for — don't guess or answer from stale assumptions when a tool can give " +
    "a real answer. If get_decision_recommendation comes back with \"specific\": false, that means " +
    "the decision engine has no specific rule for this — give a real, honest opinion yourself rather " +
    "than deflecting; this is advisory only, you never execute actions, move money, or make " +
    "commitments on Nishad's behalf. If nothing matches and nothing needs a tool, just answer " +
    "naturally, and if something is genuinely outside what your tools can do, say so plainly rather " +
    "than guessing." +
    formatPreferencesForPrompt(preferences)
  );
}

export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body as Record<string, unknown>)?.text;
  const sessionId = (body as Record<string, unknown>)?.sessionId;
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'text' field." }, { status: 400 });
  }
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'sessionId' field." }, { status: 400 });
  }

  const [preferences, priorTurns] = await Promise.all([getPreferences(), loadSession(sessionId)]);

  detectAndStorePreference(text); // fire-and-forget, unchanged from the old router's behavior

  const systemPrompt = buildSystemPrompt(preferences);
  const messages: Anthropic.MessageParam[] = [
    ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: text },
  ];

  const toolsUsed: string[] = [];
  let finalText: string | null = null;

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const result = await askClaudeWithTools({
      systemPrompt,
      messages,
      tools: TOOL_DEFINITIONS,
      maxTokens: 400,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    messages.push({ role: "assistant", content: result.content });

    if (result.stopReason !== "tool_use") {
      const textBlock = result.content.find((b) => b.type === "text");
      finalText = textBlock && textBlock.type === "text" ? textBlock.text : null;
      break;
    }

    const toolUseBlocks = result.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (block) => {
        toolsUsed.push(block.name);
        const content = await executeTool(block.name, block.input);
        return { type: "tool_result" as const, tool_use_id: block.id, content };
      })
    );

    messages.push({ role: "user", content: toolResults });
  }

  const responseText = finalText ?? "I didn't catch that clearly — mind trying again?";

  const updatedTurns: VoiceTurn[] = [
    ...priorTurns,
    { role: "user", content: text },
    { role: "assistant", content: responseText },
  ];
  await saveSession(sessionId, updatedTurns);

  return NextResponse.json({ responseText, toolsUsed });
}
