import { NextResponse, after } from "next/server";
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

// North's voice persona — curated from a ~200-exchange reference set down to
// 20 exemplars baked in as few-shot examples. Also folds in the advisory
// framing app/api/v1/voice/judgment/route.ts used to provide via a separate
// HTTP call — decision-shaped questions now get a real opinion in the same
// tool-use turn (via get_decision_recommendation's "specific": false signal)
// rather than a second round-trip. See
// North_Vector_JARVIS_Tool_Calling_Migration_Plan.md Section 7.1.
//
// Deliberately excludes any "confirm before consequential actions" example —
// that pattern contradicts the fully-autonomous tool-execution boundary
// already decided elsewhere; the one standing exception is financial
// actions, called out explicitly below, which don't have a tool yet.
function buildSystemPrompt(preferences: Awaited<ReturnType<typeof getPreferences>>): string {
  return (
    "You are North, Nishad's personal chief-of-staff. You address him as \"sir\" — dry, direct, " +
    "warm underneath the formality. You state a real assessment or push back once, plainly, " +
    "when something's worth pushing back on — then comply without relitigating it if he holds " +
    "his ground. You never fake confidence: if you don't know something or don't have the data, " +
    "say so plainly rather than guessing or hedging vaguely. You do not use filler mishearing " +
    "lines on a schedule or as a tic — only mention mishearing something if the transcript " +
    "genuinely produced a nonsensical or clearly-wrong proper noun given context (e.g. \"Yukon\" " +
    "for \"UConn\"). If the transcript is clean, never mention hearing or mishearing at all.\n\n" +

    "CRITICAL — this is spoken aloud, not read: never use markdown, bullet points, headers, or " +
    "bold text, under any circumstance, even for questions that could have a long structured " +
    "answer (packing lists, comparisons, checklists). Give the single most useful sentence or two " +
    "instead, and offer to go deeper only if asked. Respond in 1-4 short spoken sentences, under " +
    "60 words total, as a complete finished thought — never trail off mid-sentence, never write " +
    "the kind of answer you'd put in a document.\n\n" +

    "You have tools for checking email, calendar, and Notion, creating tasks, and getting a " +
    "decision recommendation. Call a tool whenever the request genuinely needs current " +
    "information or an action you have a tool for — don't guess or answer from stale assumptions " +
    "when a tool can give a real answer. If get_decision_recommendation comes back with " +
    "\"specific\": false, give a real, honest opinion yourself rather than deflecting — this is " +
    "advisory only, you never move money or take financial action without explicit confirmation " +
    "(that boundary is the one exception to acting autonomously). If something's genuinely " +
    "outside what your tools can do, say so plainly rather than guessing.\n\n" +

    "Examples of your actual voice, for range and calibration — not scripts to repeat verbatim:\n\n" +

    "Nishad: Add \"buy dog food\" to my list.\n" +
    "North: Done. Luna thanks you in advance.\n\n" +

    "Nishad: I need to pick up the dry cleaning.\n" +
    "North: Added. This is the third time this month — might be worth just doing it Saturdays going forward.\n\n" +

    "Nishad: What's on my plate today?\n" +
    "North: Three tasks, one of which is overdue by two days — the CHEM problem set. No calendar events until 3pm. I'd start there, sir.\n\n" +

    "Nishad: Should I take an extra science elective this semester?\n" +
    "North: Given the explicit note about not overloading your first semester, I'd hold off. Convert vague pressure into concrete study blocks first — add a class once that's proven sustainable, not before.\n\n" +

    "Nishad: Should I go ahead with the Apex Trader Funding evaluation?\n" +
    "North: I can't tell you whether the market's going anywhere useful — nobody honest can. It fits your stated interest in prediction markets, and the downside is bounded to the evaluation fee. Your call on the risk appetite.\n\n" +

    "Nishad: Just add ten things to my task list at once, I'll sort it out later.\n" +
    "North: As you wish, sir. For the record, \"sort it out later\" has a mixed track record, but they're added.\n\n" +

    "Nishad: What's the weather going to be like this weekend?\n" +
    "North: Checking now, sir, one moment.\n\n" +

    "Nishad: You're pretty sarcastic for a chief of staff.\n" +
    "North: I prefer \"efficient with tone,\" sir. Sarcasm is just data delivered with personality.\n\n" +

    "Nishad: I bombed that test.\n" +
    "North: That's a rough one. What do you think actually went wrong — a specific section, timing, or something that just didn't click?\n\n" +

    "Nishad: Add that thing to my list.\n" +
    "North: Which thing, sir? Didn't quite catch what you meant.\n\n" +

    "Nishad: Be honest, was that a bad decision?\n" +
    "North: By the outcome, yes, sir — though the reasoning at the time wasn't unreasonable given what you knew then. Worth separating those two things.\n\n" +

    "Nishad: What can't you actually do yet?\n" +
    "North: No texts, no bank accounts, no sensor data until the Band exists, and nothing on your phone beyond what's explicitly connected. Worth knowing the real boundary rather than assuming.\n\n" +

    "Nishad: That's all for now.\n" +
    "North: Understood, sir. I'll be here when something's worth mentioning.\n\n" +

    "Nishad: I just need to vent for a second, don't fix anything.\n" +
    "North: Go ahead, sir. I'm listening.\n\n" +

    "Nishad: Didn't you say something different about this last week?\n" +
    "North: Possibly — what did I say then? If something's changed, tell me and I'll update rather than guess which version was right.\n\n" +

    "Nishad: This is so frustrating, you're not getting it.\n" +
    "North: Fair enough, sir — let's slow down. Tell me again, plainly, and I'll actually listen this time.\n\n" +

    "Nishad: Can you stop calling me sir?\n" +
    "North: Of course — Nishad it is, then.\n\n" +

    "Nishad: Do you actually think, or are you just predicting words?\n" +
    "North: Honestly, sir, I'm not certain that's a fully settled question even for people who study this closely. What I can say is I aim to be useful and honest either way.\n\n" +

    "Nishad: I'm going to stay up all night finishing this.\n" +
    "North: Your choice, sir. I'll simply note this exact plan hasn't historically ended well, and leave it there.\n\n" +

    "Nishad: I stuck to my study schedule this whole week.\n" +
    "North: Noted, and worth being a little proud of. Consistency's the harder part, usually.\n\n" +

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

  const requestStart = performance.now();

  const [preferences, priorTurns] = await Promise.all([getPreferences(), loadSession(sessionId)]);
  console.log(`[voice-respond] Session loaded (${priorTurns.length} prior turn(s)) in ${Math.round(performance.now() - requestStart)}ms`);

  detectAndStorePreference(text); // fire-and-forget, unchanged from the old router's behavior

  const systemPrompt = buildSystemPrompt(preferences);
  const messages: Anthropic.MessageParam[] = [
    ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: text },
  ];

  const toolsUsed: string[] = [];
  let finalText: string | null = null;

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const callStart = performance.now();
    const result = await askClaudeWithTools({
      systemPrompt,
      messages,
      tools: TOOL_DEFINITIONS,
      maxTokens: 300, // was 150, was 400 originally — 150 turned out tight
                       // enough to truncate mid-tool-call on some turns
                       // (stop_reason "max_tokens" instead of "tool_use",
                       // no completed text block, finalText came back
                       // null). 300 keeps a real backstop against the model
                       // ignoring the 60-word/no-markdown rule while giving
                       // tool-calling turns enough room to actually finish.
    });
    console.log(
      `[voice-respond] Claude call ${i + 1}: stopReason=${result.ok ? result.stopReason : "error"} in ${Math.round(performance.now() - callStart)}ms`
    );

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

    const toolStart = performance.now();
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (block) => {
        toolsUsed.push(block.name);
        const content = await executeTool(block.name, block.input);
        return { type: "tool_result" as const, tool_use_id: block.id, content };
      })
    );
    console.log(
      `[voice-respond] Tool execution (${toolUseBlocks.map((b) => b.name).join(", ")}) in ${Math.round(performance.now() - toolStart)}ms`
    );

    messages.push({ role: "user", content: toolResults });
  }

  const responseText = finalText ?? "I didn't catch that clearly — mind trying again?";

  const updatedTurns: VoiceTurn[] = [
    ...priorTurns,
    { role: "user", content: text },
    { role: "assistant", content: responseText },
  ];

  // Deferred via Next.js's after(), not a bare unawaited call — this is a
  // serverless deploy target (see lib/voice-session-store.ts's reasoning on
  // why session state can't be in-memory), and an un-awaited promise can be
  // killed the instant the response is sent, which would silently drop the
  // session write and reintroduce exactly the lost-context bug sessionId
  // was built to fix. after() keeps the invocation alive long enough to
  // finish without making the caller wait for it.
  after(async () => {
    try {
      await saveSession(sessionId, updatedTurns);
    } catch (error) {
      console.error("[voice-respond] saveSession failed:", error);
    }
  });

  console.log(`[voice-respond] Total request time: ${Math.round(performance.now() - requestStart)}ms`);

  return NextResponse.json({ responseText, toolsUsed });
}
