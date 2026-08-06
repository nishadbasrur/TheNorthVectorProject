import "server-only";
import { askOpenAI, MODEL_CLASSIFIER } from "@/lib/openai-client";

// Repeat/clarify requests ("what did you say", "can you repeat that", "sorry,
// what?") are pure noise in the 12-turn session window — they add nothing
// worth remembering and would otherwise silently push a real exchange out
// of the budget. Classified with a cheap nano call (blocking, not
// fire-and-forget like preference/intent detection — the caller branches on
// the result before deciding whether to run the real turn at all) rather
// than a keyword list, since "come again?" and "wait what" don't share a
// stable trigger phrase the way preference/intent statements mostly do.
function buildPrompt(lastResponse: string): string {
  return (
    "North (a voice assistant) just said the following to Nishad:\n" +
    `"${lastResponse}"\n\n` +
    "Nishad's next message, given as the input below, is his very next reply. Determine whether " +
    "that reply is PURELY a repeat or clarification request about what North just said — e.g. " +
    "\"what did you say\", \"can you repeat that\", \"say that again\", \"sorry, what?\", \"huh?\" — " +
    "with no new question, instruction, or content of its own. Be strict: if the message adds any " +
    "new content, asks a follow-up, or changes the subject even slightly, this is NOT a repeat.\n\n" +
    "Respond with EXACTLY one word: REPEAT or NEW."
  );
}

export async function isRepeatRequest(userMessage: string, lastResponse: string): Promise<boolean> {
  try {
    const result = await askOpenAI({
      systemPrompt: buildPrompt(lastResponse),
      userMessage,
      maxTokens: 16, // OpenAI's Responses API hard-rejects anything below
                     // this for max_output_tokens (confirmed live) — a
                     // single word answer still needs this floor even
                     // though it's more than the answer itself requires.
      model: MODEL_CLASSIFIER,
    });

    if (!result.ok) return false;
    return result.text.trim().toUpperCase().startsWith("REPEAT");
  } catch (error) {
    console.error("[repeat-detector] Failed to classify repeat request:", error);
    return false; // fail open — treat as a real turn rather than risk silently
                   // dropping a genuine message's session slot
  }
}
