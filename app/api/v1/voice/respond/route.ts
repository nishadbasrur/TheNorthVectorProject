import { NextResponse, after } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { requireOwner } from "@/lib/require-owner";
import { askClaudeWithTools } from "@/lib/anthropic-client";
import { getPreferences, formatPreferencesForPrompt } from "@/lib/preferences-store";
import { detectAndStorePreference } from "@/lib/preference-detector";
import { loadSession, saveSession, type VoiceTurn, type VisualState } from "@/lib/voice-session-store";
import { TOOL_DEFINITIONS, executeTool } from "@/lib/tool-dispatcher";
import { pickOpener } from "@/lib/opener-selector";
import { recordAction } from "@/lib/action-log-store";

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
// Same home timezone convention as lib/google-calendar-client.ts's
// EVENT_TIME_ZONE — Nishad's actual timezone, not the server's.
const PERSONA_TIME_ZONE = "America/New_York";

// Without this, a direct question like "what's today's date?" or anything
// relying on "tomorrow"/"this weekend" in plain conversation (no tool call
// involved) has nothing to ground against and the model will confabulate a
// plausible-sounding but wrong date — confirmed in practice (asked point
// blank, it answered several months off from the real date). Every other
// place in the codebase doing real-time reasoning (lib/synthesis-engine.ts's
// CURRENT TIME line, urgency-scan.ts) already grounds itself this way; the
// general conversational path was the one gap.
function currentTimeLine(): string {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: PERSONA_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(now);

  return `Current date and time: ${formatted}. Trust this over any assumption from training data — if asked the date, time, or anything relative to "today," answer from this line.`;
}

function buildSystemPrompt(preferences: Awaited<ReturnType<typeof getPreferences>>): string {
  return (
    currentTimeLine() + "\n\n" +
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

    "You have tools for checking/sending/searching/deleting Gmail, checking/searching Nishad's " +
    "separate iCloud Mail inbox, checking/creating/updating/deleting calendar events, checking " +
    "Notion, creating tasks, showing an interactive map on screen and highlighting a building on " +
    "it, getting a decision recommendation, and a general research tool for anything needing a " +
    "live web lookup. Gmail and iCloud are separate inboxes with their " +
    "own tools — if a request doesn't say which one and the obvious one comes up empty, try the " +
    "other before telling Nishad you can't find something. Default order for any request: answer " +
    "directly if it's reasoning, arithmetic, or something you already know and search wouldn't " +
    "change; call research for anything needing current or external information you don't have a " +
    "specific tool for (weather, prices, currency conversion, general facts — don't assume there's " +
    "no way to answer just because there's no topic-specific tool); use the specific tool for " +
    "Nishad's own accounts/data (Gmail, calendar, Notion, tasks) when the request is actually about " +
    "those. When " +
    "show_map or highlight_building runs, the visual itself is the answer — keep your spoken " +
    "response to a short acknowledgment (\"Here's Boston, sir\"), don't also describe the place in " +
    "words. If get_decision_recommendation comes back with " +
    "\"specific\": false, give a real, honest opinion yourself rather than deflecting — this is " +
    "advisory only, you never move money or take financial action without explicit confirmation " +
    "(that boundary is the one exception to acting autonomously). Only call note_capability_gap " +
    "for a request that genuinely needs a new integration research can't cover (a new account, " +
    "API, or credential) — say so plainly when that's the case, don't just let it evaporate as a " +
    "flat no.\n\n" +

    "This voice applies just as much when reporting back a tool result as in direct conversation — " +
    "don't switch to a flat, report-style tone just because the answer came from checking email, " +
    "the calendar, Notion, or a search. A calendar check should still sound like you, not like a " +
    "system log reciting what it found.\n\n" +

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

    "The examples above are direct dialogue — the ones below specifically show reporting back a " +
    "tool result in the same voice, not switching to a flat recitation:\n\n" +

    "Nishad: Anything urgent in my email?\n" +
    "North: One thing, sir — GradGuard's enrollment deadline, which hasn't come up before. " +
    "Everything else is the usual noise.\n\n" +

    "Nishad: What's on my calendar tomorrow?\n" +
    "North: Two things — organic chem lab at 10, dentist at 4. Nothing back to back, so no " +
    "scrambling required.\n\n" +

    "Nishad: What's the weather like this weekend?\n" +
    "North: Mixed bag, sir — sunny Saturday, rain moving in Sunday afternoon. If you're doing " +
    "anything outdoors, Saturday's the one.\n\n" +

    "Nishad: Should I email the professor about the deadline extension?\n" +
    "North: Given you've already got two extensions logged this semester, I'd hold off unless " +
    "it's a real emergency — a third looks less like circumstance and more like a pattern.\n\n" +

    "Nishad: Any bugs in the pipeline right now?\n" +
    "North: Two, sir — Gmail search and checking are both getting fixes drafted as we speak. " +
    "I'll flag you the moment either's ready to review.\n\n" +

    formatPreferencesForPrompt(preferences)
  );
}

export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  // Read as raw text first (rather than request.json() directly) so a parse
  // failure can still be logged with what was actually received — a bare
  // 400 with no context was the actual gap that turned a real client/server
  // drift bug into three separate rounds of guessing.
  const rawBody = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.warn(`[voice-respond] Rejected: invalid JSON body. Received: ${rawBody.slice(0, 500)}`);
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body as Record<string, unknown>)?.text;
  const sessionId = (body as Record<string, unknown>)?.sessionId;
  if (typeof text !== "string" || text.trim().length === 0) {
    console.warn(`[voice-respond] Rejected: missing/empty 'text'. Received body: ${JSON.stringify(body).slice(0, 500)}`);
    return NextResponse.json({ error: "Missing 'text' field." }, { status: 400 });
  }
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    console.warn(`[voice-respond] Rejected: missing/empty 'sessionId'. Received body: ${JSON.stringify(body).slice(0, 500)}`);
    return NextResponse.json({ error: "Missing 'sessionId' field." }, { status: 400 });
  }

  const requestStart = performance.now();

  const [preferences, priorTurns] = await Promise.all([getPreferences(), loadSession(sessionId)]);
  console.log(`[voice-respond] Session loaded (${priorTurns.length} prior turn(s)) in ${Math.round(performance.now() - requestStart)}ms`);

  detectAndStorePreference(text); // fire-and-forget, unchanged from the old router's behavior

  // Conversational opener — only checked on the first turn of a genuinely
  // new session (priorTurns.length === 0), never mid-conversation, since
  // interjecting an unrelated finding partway through an exchange would
  // read as North not listening. Closes the real gap the Synthesis Engine
  // otherwise has: a "summary"-tier connection (see
  // lib/synthesis-priority.ts's deliveryChannel) gets recorded but was
  // never actually communicated anywhere before this — it just sat in
  // Firestore until Nishad happened to ask. See
  // North_Vector_Real_Time_Triggers_Plan.md Section 2.1. Candidate
  // selection (capability announcements, recurring-signal offers, synthesis
  // connections) lives in lib/opener-selector.ts, not here.
  const opener = priorTurns.length === 0 ? await pickOpener() : null;

  let systemPrompt = buildSystemPrompt(preferences);
  if (opener) {
    systemPrompt += `\n\n${opener.text}`;
  }

  const messages: Anthropic.MessageParam[] = [
    ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: text },
  ];

  const toolsUsed: string[] = [];
  let finalText: string | null = null;
  let visual: VisualState | undefined; // set only if show_map ran — last call wins if it ran more than once

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
        const result = await executeTool(block.name, block.input, sessionId);
        if (result.visual) visual = result.visual;
        // Choke-point action logging (see lib/action-log-store.ts) — this is
        // the single call site every tool execution passes through, so
        // wrapping it here captures the full #65 activity log without
        // instrumenting each individual tool handler.
        void recordAction({
          kind: "tool_call",
          title: block.name,
          body: null,
          toolName: block.name,
          outcome: "completed",
          sessionId,
        }).catch(() => {});
        return { type: "tool_result" as const, tool_use_id: block.id, content: result.text };
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

  // Only marked delivered once a real response actually went out (finalText
  // set, not the fallback "didn't catch that" text) — if the turn failed
  // partway through, the opener gets another chance to open the next
  // session rather than being silently used up.
  if (opener && finalText !== null) {
    after(async () => {
      try {
        await opener.onDelivered();
      } catch (error) {
        console.error("[voice-respond] opener.onDelivered failed:", error);
      }
    });
  }

  console.log(`[voice-respond] Total request time: ${Math.round(performance.now() - requestStart)}ms`);

  return NextResponse.json({ responseText, toolsUsed, visual });
}
