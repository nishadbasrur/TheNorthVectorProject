import type { VoiceTurn } from "@/lib/voice-session-store";

// #98 — scoped deliberately to word-count TREND, not true speaking pace:
// VoiceTurn stores only {role, content}, no timestamp or audio duration, so
// real words-per-second isn't derivable without a client-side pipeline
// change (sending duration alongside each transcript) — out of scope here.
// Pure function, no LLM call, same "computed signal" shape as
// app/api/v1/voice/respond/route.ts's own currentTimeLine().
const RECENT_TURNS_CONSIDERED = 3;
const SHORT_WORD_COUNT_THRESHOLD = 6;
const MIN_TURNS_FOR_TREND = 2; // require genuine multi-turn history, not

                                // just "this one reply happened to be
                                // short" (e.g. "yes", "thanks")

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function detectRushSignal(priorTurns: VoiceTurn[], currentText: string): "rushed" | "normal" {
  const recentUserTurns = priorTurns.filter((t) => t.role === "user").slice(-RECENT_TURNS_CONSIDERED);
  if (recentUserTurns.length < MIN_TURNS_FOR_TREND) return "normal";

  const counts = [...recentUserTurns.map((t) => wordCount(t.content)), wordCount(currentText)];
  const allShort = counts.every((count) => count > 0 && count <= SHORT_WORD_COUNT_THRESHOLD);

  return allShort ? "rushed" : "normal";
}
