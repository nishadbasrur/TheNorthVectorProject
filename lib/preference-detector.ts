import "server-only";
import { askClaude } from "@/lib/anthropic-client";
import { getPreferences, setPreference } from "@/lib/preferences-store";

// Cheap rule-based pre-filter — only pay for an extraction call when the
// message plausibly states a standing instruction, rather than classifying
// every single turn. A false-positive trigger just costs one wasted
// classification call (which will come back "no"), not a correctness bug.
const PREFERENCE_TRIGGERS = [
  "from now on",
  "always ",
  "never ",
  "stop calling me",
  "please call me",
  "call me ",
  "remember that i",
  "remember i",
  "i prefer",
  "i'd prefer",
  "please always",
  "please don't",
  "please stop",
];

function matchesTrigger(lowerText: string): boolean {
  return PREFERENCE_TRIGGERS.some((trigger) => lowerText.includes(trigger));
}

function buildExtractionPrompt(existingKeys: string[]): string {
  const keysList = existingKeys.length > 0 ? existingKeys.join(", ") : "(none yet)";

  return (
    "Someone is talking to their personal chief-of-staff assistant. Determine whether their message " +
    "states a STANDING instruction about how the assistant should behave or what it should consider " +
    "going forward (e.g. how to address them, a lasting preference, a rule to always/never follow) — " +
    "as opposed to a one-off question, a fact, or small talk with no lasting instruction. Be strict: " +
    "most messages are NOT a standing instruction.\n\n" +
    `Existing preference keys already stored: ${keysList}\n` +
    "If this message updates or restates one of those same topics, reuse the EXACT same key. " +
    "Otherwise invent a short new snake_case key (e.g. address_style, hard_task_time_preference).\n\n" +
    "Respond with EXACTLY one line in this format, nothing else:\n" +
    "PREFERENCE: yes|no | KEY: <snake_case_key or none> | VALUE: <plain sentence describing the instruction, or none>"
  );
}

function parseExtraction(text: string): { isPreference: boolean; key: string; value: string } {
  const match = text.match(/PREFERENCE:\s*(yes|no)\s*\|\s*KEY:\s*(\S+)\s*\|\s*VALUE:\s*(.+)/i);

  if (!match || match[1].toLowerCase() !== "yes") {
    return { isPreference: false, key: "", value: "" };
  }

  const key = match[2].trim().toLowerCase();
  const value = match[3].trim();

  if (!key || key === "none" || !value || value.toLowerCase() === "none") {
    return { isPreference: false, key: "", value: "" };
  }

  return { isPreference: true, key, value };
}

// Fire this alongside generating a response — never lets a detection/storage
// failure break the actual reply, since this is a side effect, not the main
// point of the request.
export async function detectAndStorePreference(userMessage: string): Promise<void> {
  const lower = userMessage.toLowerCase();
  if (!matchesTrigger(lower)) return;

  try {
    const existing = await getPreferences();
    const existingKeys = existing.map((p) => p.key);

    const result = await askClaude({
      systemPrompt: buildExtractionPrompt(existingKeys),
      userMessage,
      maxTokens: 100,
    });

    if (!result.ok) return;

    const { isPreference, key, value } = parseExtraction(result.text);
    if (!isPreference) return;

    await setPreference(key, value);
  } catch (error) {
    console.error("[preference-detector] Failed to detect/store preference:", error);
  }
}
