import "server-only";
import { askClaude } from "@/lib/anthropic-client";
import { recordOccurrence } from "@/lib/recurring-signal-store";

// #88 — "opportunity-cost" detection: the same stated intent ("I keep
// meaning to X") mentioned repeatedly without ever being acted on. Mirrors
// lib/preference-detector.ts's shape exactly (cheap keyword prefilter, then
// a real classification call) — a stated intent isn't a standing
// instruction (wrong store), but the same "don't classify every turn" cost
// concern applies.
const INTENT_TRIGGERS = [
  "i need to",
  "i keep meaning to",
  "i really should",
  "i want to",
  "i've been meaning to",
  "i keep forgetting to",
  "i should probably",
  "i gotta",
  "i have to",
];

function matchesTrigger(lowerText: string): boolean {
  return INTENT_TRIGGERS.some((trigger) => lowerText.includes(trigger));
}

const WINDOW_DAYS = 14;
const THRESHOLD = 3;

function buildExtractionPrompt(): string {
  return (
    "Someone is talking to their personal chief-of-staff assistant. Determine whether their message " +
    "states an INTENT to do something they haven't done yet — something they want, need, or keep " +
    "meaning to do (e.g. \"I really should call the dentist\", \"I keep meaning to clean my room\") — " +
    "as opposed to a completed action, a question, or small talk with no forward-looking intent. Be " +
    "strict: most messages do NOT state this kind of intent.\n\n" +
    "If it does, invent a short snake_case key naming the underlying task/topic (e.g. " +
    "call_dentist, clean_room) and a short plain-sentence label describing it.\n\n" +
    "Respond with EXACTLY one line in this format, nothing else:\n" +
    "INTENT: yes|no | KEY: <snake_case_key or none> | LABEL: <plain sentence, or none>"
  );
}

function parseExtraction(text: string): { hasIntent: boolean; key: string; label: string } {
  const match = text.match(/INTENT:\s*(yes|no)\s*\|\s*KEY:\s*(\S+)\s*\|\s*LABEL:\s*(.+)/i);

  if (!match || match[1].toLowerCase() !== "yes") {
    return { hasIntent: false, key: "", label: "" };
  }

  const key = match[2].trim().toLowerCase();
  const label = match[3].trim();

  if (!key || key === "none" || !label || label.toLowerCase() === "none") {
    return { hasIntent: false, key: "", label: "" };
  }

  return { hasIntent: true, key, label };
}

// Fire-and-forget alongside detectAndStorePreference, same discipline: never
// let detection failure affect the actual voice response.
export async function detectIntentSignal(userMessage: string): Promise<void> {
  const lower = userMessage.toLowerCase();
  if (!matchesTrigger(lower)) return;

  try {
    const result = await askClaude({
      systemPrompt: buildExtractionPrompt(),
      userMessage,
      maxTokens: 100,
    });

    if (!result.ok) return;

    const { hasIntent, key, label } = parseExtraction(result.text);
    if (!hasIntent) return;

    await recordOccurrence("stated_intent", key, label, WINDOW_DAYS, THRESHOLD);
  } catch (error) {
    console.error("[intent-signal-detector] Failed to detect/record intent signal:", error);
  }
}
