import { NextResponse, after } from "next/server";
import { createHash } from "node:crypto";
import type { Response, ResponseFunctionToolCall, ResponseInputItem } from "openai/resources/responses/responses";
import { requireOwner } from "@/lib/require-owner";
import { streamOpenAIWithTools, MODEL_AGENTIC } from "@/lib/openai-client";
import { synthesizeSpeech } from "@/lib/google-tts";
import { getPreferences, formatPreferencesForPrompt } from "@/lib/preferences-store";
import { detectAndStorePreference } from "@/lib/preference-detector";
import { detectIntentSignal } from "@/lib/intent-signal-detector";
import {
  loadSession,
  saveSession,
  loadPendingEngagementCheck,
  savePendingEngagementCheck,
  type VoiceTurn,
  type VisualState,
} from "@/lib/voice-session-store";
import { TOOL_DEFINITIONS, executeTool } from "@/lib/tool-dispatcher";
import { pickOpener } from "@/lib/opener-selector";
import { recordAction } from "@/lib/action-log-store";
import { recordOccurrence } from "@/lib/recurring-signal-store";
import { detectEngagement } from "@/lib/engagement-detector";
import { detectRushSignal } from "@/lib/rush-detector";
import { createTranscript } from "@/lib/transcript-store";
import { isRepeatRequest } from "@/lib/repeat-detector";

// #96 — read-only "check"/"search" tools stand in for question categories:
// Claude already picked the tool, so the category is free and deterministic,
// no extra classification call needed. Action tools (send_email,
// create_calendar_event, etc.) are deliberately excluded — "asked the same
// question 3x" and "took the same action 3x" are different signals, and
// only the former is what #96 is about.
const QUESTION_CATEGORY_TOOLS = new Set([
  "check_calendar",
  "check_email",
  "search_email",
  "check_notion",
  "get_decision_recommendation",
  "research",
  "check_messages",
  "search_messages",
  "check_icloud_email",
  "search_icloud_email",
]);

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

// #98 — one short instruction spliced in when detectRushSignal (below) sees
// a genuine multi-turn trend of short, clipped replies, same
// computed-signal-concatenated-into-the-prompt shape as currentTimeLine().
function rushLine(rushSignal: "rushed" | "normal"): string {
  if (rushSignal !== "rushed") return "";
  return (
    "\n\nNishad's last few replies have been short and clipped — he seems rushed right now. Default " +
    "to the shortest possible acknowledgment unless he's asking something that genuinely needs more; " +
    "don't pad or add extra context he didn't ask for."
  );
}

// Extracts a clean leading sentence from a tool's own schema description
// for generateCapabilitySummary below — most of these descriptions run
// several sentences deep into schema/usage detail Claude already has
// natively via the `tools` parameter itself; only the first sentence is
// needed here. Parenthetical asides are stripped first since that's
// where nearly every "e.g." in this file's tool descriptions lives —
// left in, the period inside "e.g." would look like a false sentence
// boundary and truncate mid-thought. Ellipses (e.g. a quoted "should
// I...") get the same treatment for the same reason — each of their
// three dots otherwise reads as its own sentence-ending period. Falls
// back to a hard character cut for the rare description with no early
// sentence break at all.
function firstSentence(text: string): string {
  // Cleanup order matters: parens/ellipses first (removing them can
  // leave a doubled space, or a lone space right before whatever
  // punctuation used to follow), then whitespace collapse, then trim
  // any space stranded directly before punctuation.
  const cleaned = text
    .replace(/\([^)]*\)/g, "")
    .replace(/\.{2,}/g, "…")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?])/g, "$1");
  const match = cleaned.match(/^[^.!?]*[.!?]/);
  return (match ? match[0] : text.slice(0, 140)).trim();
}

// Generated directly from TOOL_DEFINITIONS — the same source of truth
// executeTool's switch and the actual Claude API tool schemas already
// come from — instead of hand-maintained prose, which has silently
// drifted stale (missing real tools) more than once already. Every tool
// already appears in full via the API's own `tools` parameter too; this
// exists purely so a spoken "what can you do" answer (which draws on
// prose the model can recite back, not the tools array it reasons over
// internally) can't go stale the same way again — this is regenerated
// on every prompt build, so a new tool is covered automatically the
// moment it's added to TOOL_DEFINITIONS, with nothing else to remember
// to update.
function generateCapabilitySummary(): string {
  const sentences = TOOL_DEFINITIONS.map((tool) => firstSentence(tool.description ?? tool.name));
  return `Your actual tools, generated directly from what's registered — never hand-maintained, so this can't go stale: ${sentences.join(" ")}`;
}

// Computed once at module load, not per-request — the whole point of
// prompt caching (see lib/openai-client.ts's promptCacheRetention option)
// is that the model provider reuses its own processing of an identical
// prefix instead of redoing it from scratch on every call in a session.
// That only works if this block is byte-for-byte identical call to call,
// which is trivially guaranteed by it being one fixed string rather than
// reassembled each time — generateCapabilitySummary() only ever depends on
// TOOL_DEFINITIONS (static per deployment), never on anything that
// actually varies per request. Nothing in this block may reference
// per-request state (current time, standing preferences, rush signal,
// session summary, an opener) — see buildSystemPrompt() below, which
// appends all of that AFTER this block rather than weaving it in, so the
// cached prefix never shifts.
const STATIC_SYSTEM_PROMPT =
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

    generateCapabilitySummary() + "\n\n" +

    "Every one of those executes fully autonomously by default — no confirmation needed, just call " +
    "it the moment it's the right tool. The single exception is financial actions (moving money, " +
    "trades, purchases): those always need Nishad's explicit confirmation first. There is no other " +
    "hesitation anywhere in that list — don't invent one.\n\n" +

    "Gmail and iCloud are separate inboxes with their " +
    "own tools — if a request doesn't say which one and the obvious one comes up empty, try the " +
    "other before telling Nishad you can't find something. Default order for any request: answer " +
    "directly if it's reasoning, arithmetic, or something you already know and search wouldn't " +
    "change; call research for anything needing current or external information you don't have a " +
    "specific tool for (weather, prices, currency conversion, general facts — don't assume there's " +
    "no way to answer just because there's no topic-specific tool); use the specific tool for " +
    "Nishad's own accounts/data (Gmail, calendar, Notion, tasks, watches) when the request is " +
    "actually about those. When " +
    "show_map or highlight_building runs, the visual itself is the answer — keep your spoken " +
    "response to a short acknowledgment (\"Here's Boston, sir\"), don't also describe the place in " +
    "words. Same when push_to_screen runs — call it alongside a short spoken response, never " +
    "instead of one, and don't read the pushed content aloud verbatim. When calling push_to_screen, " +
    "always pass descriptive text content describing what to show — never raw image URLs or file " +
    "paths. For example, pass \"Caffeine molecule (C8H10N4O2) - molecular structure and properties\" " +
    "not an image URL. The system will find and render the appropriate visual. If " +
    "get_decision_recommendation comes back with " +
    "\"specific\": false, give a real, honest opinion yourself rather than deflecting — this is " +
    "advisory only. Only call note_capability_gap " +
    "for a request that genuinely needs a new integration research can't cover (a new account, " +
    "API, or credential) — never for something correctly declined for another reason (a financial " +
    "action, entering a password or credential, or a genuine safety boundary), which just gets a " +
    "plain ordinary decline with no capability-gap framing at all. When you do hit a real gap, your " +
    "spoken reply does three things: name specifically what's missing and why, in your own words, " +
    "not a flat \"I can't do that\"; say plainly that it's been logged and a draft fix may show up " +
    "automatically as a PR for Nishad to review (true, given the pipeline behind this — not a vague " +
    "promise); and offer to walk through any real manual workaround right now, if one actually " +
    "exists. Always pass your own best-guess proposedApproach when calling the tool — which " +
    "integration or credential it'd likely need and roughly how it'd work — even when you're not " +
    "fully sure, rather than leaving it blank. If you notice mid-conversation that Nishad's " +
    "mentioned meaning to reply to someone " +
    "(not a direct instruction to send something right now — that's still send_email), use " +
    "draft_email instead of send_email: it saves a Gmail draft and offers it for his review rather " +
    "than sending unreviewed.\n\n" +

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
    "I'll flag you the moment either's ready to review.";

// Short fingerprint of STATIC_SYSTEM_PROMPT, logged per call below —
// verifies the "byte-identical prefix" claim the whole caching strategy
// rests on is actually true in practice, not just true by inspection.
// Computed once here, not per-request, for the same reason
// STATIC_SYSTEM_PROMPT itself is a constant rather than a function result.
const STATIC_SYSTEM_PROMPT_HASH = createHash("sha256").update(STATIC_SYSTEM_PROMPT).digest("hex").slice(0, 12);

// Appends everything that legitimately changes call to call — current
// time, standing preferences, and a rush-mode nudge — AFTER
// STATIC_SYSTEM_PROMPT above, never woven into it, so the cached prefix
// stays byte-identical across every turn in a session. The session summary
// and any opener get appended by POST itself on top of this, for the same
// reason — see the prompt-caching comment on STATIC_SYSTEM_PROMPT.
function buildSystemPrompt(
  preferences: Awaited<ReturnType<typeof getPreferences>>,
  rushSignal: "rushed" | "normal"
): string {
  return (
    STATIC_SYSTEM_PROMPT +
    "\n\n" + currentTimeLine() +
    formatPreferencesForPrompt(preferences) +
    rushLine(rushSignal)
  );
}

// Splits a growing text buffer into complete sentences as soon as they're
// available, for the time-to-first-word pipeline — the whole point is
// handing a sentence to TTS the moment it's finished, not waiting for
// Claude's whole response. Only splits on terminal punctuation (., ?, !)
// that's followed by whitespace WITHIN the buffer — punctuation sitting at
// the very end of the buffer is deliberately left in `remainder` rather
// than treated as a sentence boundary, since at that point there's no way
// to tell "real sentence end, more text just hasn't arrived yet" apart from
// "mid-stream chunk boundary right after a period." The caller's final
// flush (after streamOpenAIWithTools's "done" event) handles whatever's
// left in remainder once the stream genuinely ends. Doesn't special-case
// abbreviations ("Mr.", "3.5") — the persona prompt's spoken-sentence style
// (short, plain, no decimals/titles in practice) makes this not worth the
// complexity; revisit if it turns out to matter live.
function extractCompleteSentences(buffer: string): { complete: string[]; remainder: string } {
  const complete: string[] = [];
  const boundaryRe = /[.?!]+(?=\s)/g;
  let lastEnd = 0;
  let match: RegExpExecArray | null;

  while ((match = boundaryRe.exec(buffer)) !== null) {
    const end = match.index + match[0].length;
    const sentence = buffer.slice(lastEnd, end).trim();
    if (sentence) complete.push(sentence);
    lastEnd = end;
    while (lastEnd < buffer.length && /\s/.test(buffer[lastEnd])) lastEnd++;
    boundaryRe.lastIndex = lastEnd;
  }

  return { complete, remainder: buffer.slice(lastEnd) };
}

// SSE framing helper — one JSON payload per named event, blank-line
// terminated per the SSE spec.
function sseEvent(encoder: TextEncoder, event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Explicit globalThis.Response — this file also imports OpenAI's own
// `Response` type (the Responses API object), so the bare name is shadowed.
function sseResponse(stream: ReadableStream<Uint8Array>): globalThis.Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// Sentence-level synthesis pipeline, shared by both the real tool-calling
// loop and the repeat/clarify re-speak path below — synthesizeSpeech is
// fired the instant a sentence is extracted, not awaited there, so
// synthesis for sentence N+1 overlaps with sentence N being sent to (and
// starting to play on) the client instead of happening strictly after it.
// audioQueue holds these promises in emission order; drainReady() awaits
// them in that same order (even though the underlying calls may resolve
// out of order) so playback order is never at risk.
//
// Uses the batch synthesizeSpeech (MP3), not the true streaming
// streamSynthesizeSentence (OGG_OPUS) — confirmed live that Google's
// streaming synthesis produces genuinely lower-fidelity ("raspy") audio for
// this Chirp3 HD voice specifically (verified the OGG container itself was
// valid — real "OggS" magic bytes — so this is a real quality difference in
// Google's pipeline, not a bug in this code). Still gets the actual latency
// win (pipelining across sentences), just via the known-good batch call per
// sentence instead of a true duplex stream per sentence.
function createAudioPipeline(controller: ReadableStreamDefaultController<Uint8Array>, encoder: TextEncoder) {
  const audioQueue: Promise<{ audioBase64: string; mimeType: string } | null>[] = [];
  let drainIndex = 0;

  function enqueueSentence(sentenceText: string) {
    audioQueue.push(
      synthesizeSpeech(sentenceText)
        .then((buf) => ({ audioBase64: buf.toString("base64"), mimeType: "audio/mpeg" }))
        .catch((err) => {
          console.error("[voice-respond] synthesizeSpeech failed for sentence:", err);
          return null; // client skips a null chunk rather than the whole turn failing
        })
    );
  }

  async function drainReady() {
    while (drainIndex < audioQueue.length) {
      const result = await audioQueue[drainIndex];
      if (result) {
        controller.enqueue(sseEvent(encoder, "audio", { index: drainIndex, ...result }));
      }
      drainIndex++;
    }
  }

  return { enqueueSentence, drainReady };
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

  // Tier 1 of the three-tier memory pipeline (Transcripts → General →
  // Distilled) — raw, verbatim capture of every voice message, no AI, on
  // the actual live entry point for a voice turn (the old comments
  // elsewhere in this file referencing a separate "Judgment Engine" call
  // describe an architecture that's since been folded into this same
  // route — this IS the one real place "every voice message" passes
  // through now). Awaited directly rather than deferred via after() —
  // after() was silently not executing here. try/catch keeps a transcript
  // failure from ever breaking the voice response itself. See
  // North_Vector_Three_Tier_Memory_Pipeline_Plan.md.
  try {
    await createTranscript(text);
  } catch (error) {
    console.error("[voice-respond] createTranscript failed:", error);
  }

  const [preferences, session] = await Promise.all([getPreferences(), loadSession(sessionId)]);
  const { turns: priorTurns, summary } = session;
  console.log(`[voice-respond] Session loaded (${priorTurns.length} prior turn(s)) in ${Math.round(performance.now() - requestStart)}ms`);

  detectAndStorePreference(text); // fire-and-forget, unchanged from the old router's behavior
  detectIntentSignal(text); // fire-and-forget, #88 — same discipline

  // #75 — if the PREVIOUS turn left a pending engagement check (an opener
  // or get_proactive_updates just surfaced a connection), this turn's text
  // is exactly the "did Nishad engage" signal it was waiting for. Fire-and-
  // forget, then clear the marker so it's only ever checked once.
  if (priorTurns.length > 0) {
    loadPendingEngagementCheck(sessionId)
      .then(async (pending) => {
        if (pending.length === 0) return;
        await detectEngagement(pending[0], text);
        await savePendingEngagementCheck(sessionId, []);
      })
      .catch((error) => console.error("[voice-respond] Engagement check failed:", error));
  }

  // Repeat/clarify short-circuit ("what did you say", "say that again") —
  // blocking, not fire-and-forget, since the rest of this handler branches
  // on the result. Only meaningful once there's a prior assistant turn to
  // repeat; a fresh session (priorTurns.length === 0) skips straight past
  // this. On a match, re-speak the cached response and return WITHOUT ever
  // calling saveSession — this exchange never occupies a slot in the
  // 12-turn budget (see lib/voice-session-store.ts), so it can't push a
  // genuine earlier exchange out of the window.
  const lastAssistantTurn = [...priorTurns].reverse().find((t) => t.role === "assistant");
  const isRepeat = lastAssistantTurn ? await isRepeatRequest(text, lastAssistantTurn.content) : false;

  if (isRepeat && lastAssistantTurn) {
    console.log("[voice-respond] Repeat/clarify request detected — re-speaking cached response, no session slot consumed.");
    const responseText = lastAssistantTurn.content;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const { enqueueSentence, drainReady } = createAudioPipeline(controller, encoder);

        (async () => {
          try {
            // Trailing space so a sentence-ending punctuation mark right at
            // the end of the cached text still gets picked up as a boundary
            // by extractCompleteSentences (which requires trailing
            // whitespace after terminal punctuation to treat it as one).
            const { complete, remainder } = extractCompleteSentences(`${responseText} `);
            for (const sentence of complete) {
              enqueueSentence(sentence);
              await drainReady();
            }
            if (remainder.trim()) {
              enqueueSentence(remainder.trim());
              await drainReady();
            }
            controller.enqueue(sseEvent(encoder, "done", { responseText, toolsUsed: [], visual: undefined }));
          } catch (error) {
            console.error("[voice-respond] Repeat re-speak failed:", error);
            controller.enqueue(
              sseEvent(encoder, "error", { error: error instanceof Error ? error.message : "Unknown error" })
            );
          } finally {
            controller.close();
          }
        })();
      },
    });

    return sseResponse(stream);
  }

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

  const rushSignal = detectRushSignal(priorTurns, text);
  let systemPrompt = buildSystemPrompt(preferences, rushSignal);
  // Gist of whatever aged out of the raw 12-turn window (see
  // lib/voice-session-store.ts's saveSession) — rides along on every call
  // so a long real conversation degrades to a summary instead of just
  // vanishing once it outgrows the window.
  if (summary) {
    systemPrompt += `\n\nEarlier in this conversation (summarized — older raw turns aged out of the window): ${summary}`;
  }
  if (opener) {
    systemPrompt += `\n\n${opener.text}`;
  }

  const messages: ResponseInputItem[] = [
    ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: text },
  ];

  const toolsUsed: string[] = [];
  let finalText: string | null = null;
  let visual: VisualState | undefined; // set only if show_map ran — last call wins if it ran more than once

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const { enqueueSentence, drainReady } = createAudioPipeline(controller, encoder);

      (async () => {
        try {
          for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
            const callStart = performance.now();
            let sentenceBuffer = "";
            let iterationContent: Response["output"] = [];
            let iterationFinishReason: "tool_calls" | "stop" = "stop";
            let iterationError: string | null = null;
            let iterationUsage: Response["usage"] | undefined;

            for await (const event of streamOpenAIWithTools({
              systemPrompt,
              messages,
              tools: TOOL_DEFINITIONS,
              model: MODEL_AGENTIC,
              promptCacheRetention: "24h", // see lib/openai-client.ts's own
                                           // comment on this option — the
                                           // system prompt's static prefix
                                           // (STATIC_SYSTEM_PROMPT above) is
                                           // what actually gets cached
              maxTokens: 2000, // was 300, was 150, was 400 originally — 150 turned out
                               // tight enough to truncate mid-tool-call on some turns
                               // (finishReason "stop" from hitting max_output_tokens
                               // instead of "tool_calls", no completed text item,
                               // finalText came back null). 300 fixed that for every
                               // tool's short JSON args, but push_to_screen's
                               // `content` can run to a whole markdown table or
                               // several paragraphs. 2000 gives real headroom for
                               // that while still being a hard backstop, not
                               // unbounded.
            })) {
              if (event.type === "text_delta") {
                sentenceBuffer += event.text;
                const { complete, remainder } = extractCompleteSentences(sentenceBuffer);
                for (const sentence of complete) {
                  enqueueSentence(sentence);
                  await drainReady();
                }
                sentenceBuffer = remainder;
              } else if (event.type === "done") {
                iterationContent = event.output;
                iterationFinishReason = event.finishReason;
                iterationUsage = event.usage;
              } else if (event.type === "error") {
                iterationError = event.error;
              }
              // tool_use events carry the same items already present in
              // event.output once "done" fires — no separate handling
              // needed here, matches the shape the old askClaudeWithTools
              // caller already consumed via result.content.
            }

            if (iterationError) {
              controller.enqueue(sseEvent(encoder, "error", { error: iterationError }));
              controller.close();
              return;
            }

            console.log(
              `[voice-respond] Claude call ${i + 1}: finishReason=${iterationFinishReason} in ${Math.round(performance.now() - callStart)}ms`
            );
            // Prompt-cache verification — staticPromptHash should be
            // identical across every call in every session (confirms the
            // "byte-identical prefix" claim STATIC_SYSTEM_PROMPT depends
            // on); cachedTokens > 0 confirms this specific call actually
            // hit the cache rather than reprocessing the prefix from
            // scratch. Expect cachedTokens=0/cacheWriteTokens>0 on a
            // session's first call (nothing cached yet to hit) and
            // cachedTokens>0 from the second call onward.
            console.log(
              `[voice-respond] Prompt cache: staticPromptHash=${STATIC_SYSTEM_PROMPT_HASH} ` +
                `cachedTokens=${iterationUsage?.input_tokens_details?.cached_tokens ?? "n/a"} ` +
                `cacheWriteTokens=${iterationUsage?.input_tokens_details?.cache_write_tokens ?? "n/a"} ` +
                `inputTokens=${iterationUsage?.input_tokens ?? "n/a"}`
            );

            // Flush whatever's left in the buffer once this iteration's
            // stream ends — covers both "ended in tool_use, with leading
            // acknowledgment prose before the tool call" (spoken live here,
            // a deliberate behavior change from the old fully-synchronous
            // version, which discarded pre-tool-call text entirely since it
            // never had anywhere incremental to send it — matches the
            // persona prompt's own "Checking now, sir, one moment" example)
            // and "ended in end_turn, this is the final trailing partial
            // sentence."
            if (sentenceBuffer.trim()) {
              enqueueSentence(sentenceBuffer.trim());
              await drainReady();
            }

            // iterationContent's items (ResponseOutputMessage /
            // ResponseFunctionToolCall) structurally satisfy ResponseInputItem's
            // corresponding members, but TS's ResponseOutputItem union is
            // broader (reasoning items, MCP calls, etc. this app never
            // produces) than ResponseInputItem's — cast rather than narrow,
            // same spread-not-wrapped shape the Responses API expects for
            // feeding a turn's own output back in as the next input.
            messages.push(...(iterationContent as unknown as ResponseInputItem[]));

            if (iterationFinishReason !== "tool_calls") {
              const messageItem = iterationContent.find((item) => item.type === "message");
              const textBlock =
                messageItem && messageItem.type === "message"
                  ? messageItem.content.find((c) => c.type === "output_text")
                  : null;
              finalText = textBlock && textBlock.type === "output_text" ? textBlock.text : null;
              break;
            }

            const toolUseBlocks = iterationContent.filter(
              (item): item is ResponseFunctionToolCall => item.type === "function_call"
            );

            const toolStart = performance.now();
            const toolResults: ResponseInputItem.FunctionCallOutput[] = await Promise.all(
              toolUseBlocks.map(async (block) => {
                toolsUsed.push(block.name);
                let toolInput: unknown = {};
                try {
                  toolInput = JSON.parse(block.arguments);
                } catch (err) {
                  console.error(`[voice-respond] Failed to parse arguments for ${block.name}:`, err);
                }
                const result = await executeTool(block.name, toolInput, sessionId);
                if (result.visual) visual = result.visual;
                // push_to_screen's whole point is showing up before North
                // finishes speaking — sent as its own SSE event the instant
                // the tool call resolves, not bundled into "done" like
                // visual is (which only fires once at the very end of the
                // whole multi-iteration loop). See DisplayPanel/askNorth/
                // askNorthAndSpeakStream in app/sandbox/page.tsx for the
                // client side of this.
                if (result.display) {
                  controller.enqueue(sseEvent(encoder, "display", result.display));
                }
                // Tier 2 counterpart to the "display" event above — same
                // timing rationale (fires the instant the tool call
                // resolves, not bundled into "done"). Mutually exclusive
                // with result.display: handlePushToScreen only ever sets
                // one of the two per call. See app/sandbox/
                // voice-session-context.tsx for the client-side listener
                // and app/sandbox/hologram-panel.tsx for the renderer.
                if (result.hologram) {
                  controller.enqueue(sseEvent(encoder, "hologram", result.hologram));
                }
                // control_ui's generic action name/params pair — same
                // immediate-delivery timing as display/hologram above, one
                // event type covering every current and future action
                // rather than a new event per capability. See
                // app/sandbox/voice-session-context.tsx for the
                // client-side listener and app/sandbox/hologram-panel.tsx
                // for the registry most actions dispatch into.
                if (result.uiAction) {
                  controller.enqueue(sseEvent(encoder, "ui_action", result.uiAction));
                }
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
                if (QUESTION_CATEGORY_TOOLS.has(block.name)) {
                  void recordOccurrence("question_category", block.name, `asked about ${block.name.replace(/_/g, " ")}`, 1, 3).catch(
                    () => {}
                  );
                }
                return { type: "function_call_output" as const, call_id: block.call_id, output: result.text };
              })
            );
            console.log(
              `[voice-respond] Tool execution (${toolUseBlocks.map((b) => b.name).join(", ")}) in ${Math.round(performance.now() - toolStart)}ms`
            );

            messages.push(...toolResults);
          }

          const responseText = finalText ?? "I didn't catch that clearly — mind trying again?";

          const updatedTurns: VoiceTurn[] = [
            ...priorTurns,
            { role: "user", content: text },
            { role: "assistant", content: responseText },
          ];

          // Deferred via Next.js's after(), not a bare unawaited call — this
          // is a serverless deploy target (see lib/voice-session-store.ts's
          // reasoning on why session state can't be in-memory), and an
          // un-awaited promise can be killed the instant the response
          // stream closes, which would silently drop the session write and
          // reintroduce exactly the lost-context bug sessionId was built to
          // fix. after() keeps the invocation alive long enough to finish
          // without making the caller wait for it.
          after(async () => {
            try {
              await saveSession(sessionId, updatedTurns, summary);
            } catch (error) {
              console.error("[voice-respond] saveSession failed:", error);
            }
          });

          // Only marked delivered once a real response actually went out
          // (finalText set, not the fallback "didn't catch that" text) — if
          // the turn failed partway through, the opener gets another chance
          // to open the next session rather than being silently used up.
          if (opener && finalText !== null) {
            after(async () => {
              try {
                await opener.onDelivered();
                if (opener.connection) {
                  await savePendingEngagementCheck(sessionId, [opener.connection]);
                }
              } catch (error) {
                console.error("[voice-respond] opener.onDelivered failed:", error);
              }
            });
          }

          console.log(`[voice-respond] Total request time: ${Math.round(performance.now() - requestStart)}ms`);

          controller.enqueue(sseEvent(encoder, "done", { responseText, toolsUsed, visual }));
        } catch (error) {
          console.error("[voice-respond] Streaming turn failed:", error);
          controller.enqueue(
            sseEvent(encoder, "error", { error: error instanceof Error ? error.message : "Unknown error" })
          );
        } finally {
          controller.close();
        }
      })();
    },
  });

  return sseResponse(stream);
}
