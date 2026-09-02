// Deliberately no "server-only" guard — called from
// functions/src/hourly-checkin-scan.ts (esbuild-bundled Cloud Functions
// runtime), same reasoning as lib/google-calendar-client.ts and
// lib/spontaneous-speech-queue.ts.
//
// Models lib/briefing-engine.ts's runStateOfEverythingBriefing, but
// deliberately lighter: that one assembles a full SynthesisContext
// (calendar, inbox, Notion, texts, tasks, goals, memories) for an
// explicitly-requested "give me everything" briefing. This fires
// potentially every hour (see hourly-checkin-scan.ts's presence gating for
// why it's not literally every hour in practice) — a fraction of the
// context and a much smaller prompt/token budget, not the same "connect
// everything" reasoning pass.
import { askOpenAI, MODEL_CLASSIFIER } from "./openai-client";

export type HourlyCheckinContext = {
  now: Date;
  nextTaskDue?: { title: string; dueDate: string };
  nextCalendarEvent?: { title: string; start: Date };
};

// Caller (hourly-checkin-scan.ts) only ever invokes this once it's already
// confirmed there's a near-term task or event to report — an hourly
// "nothing to report" ping would get old fast, so that decision is made
// before this function is even called, not left to the model to decide
// per-call. The prompt below can assume something real is always present.
const CHECKIN_SYSTEM_PROMPT = `
You are North, giving Nishad an unprompted, brief hourly check-in — he didn't ask for this, you're speaking up on your own. You'll be given whatever's next on his calendar and/or task list — there's always at least one real, near-term thing to mention here, never nothing.

Keep it genuinely brief — one short sentence, spoken aloud, no markdown. Address him as "sir" the way you normally would. Don't repeat "check-in" or announce that this is a check-in; just say the thing.

Respond with ONLY the spoken text, nothing else.
`.trim();

function serializeContext(context: HourlyCheckinContext): string {
  const lines = [`CURRENT TIME: ${context.now.toISOString()}`];

  lines.push(
    context.nextTaskDue
      ? `NEXT TASK DUE: "${context.nextTaskDue.title}" (due ${context.nextTaskDue.dueDate})`
      : "NEXT TASK DUE: (none)"
  );

  lines.push(
    context.nextCalendarEvent
      ? `NEXT CALENDAR EVENT: "${context.nextCalendarEvent.title}" at ${context.nextCalendarEvent.start.toISOString()}`
      : "NEXT CALENDAR EVENT: (none)"
  );

  return lines.join("\n");
}

// Returns null on generation failure — deliberately not a canned fallback
// string like "nothing urgent right now" (the old behavior), since the
// caller only ever invokes this when something IS notable; a fallback
// claiming otherwise would just be wrong. The caller skips speaking
// entirely on null rather than say something misleading.
export async function generateHourlyCheckinText(context: HourlyCheckinContext): Promise<string | null> {
  const result = await askOpenAI({
    systemPrompt: CHECKIN_SYSTEM_PROMPT,
    userMessage: serializeContext(context),
    maxTokens: 120,
    model: MODEL_CLASSIFIER,
  });

  if (!result.ok) return null;
  return result.text.trim();
}
