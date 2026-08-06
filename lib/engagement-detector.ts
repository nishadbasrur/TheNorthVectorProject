import "server-only";
import { askClaude } from "@/lib/anthropic-client";
import { setConnectionEngagement } from "@/lib/synthesis-store";
import type { SynthesisConnection } from "@/lib/synthesis-engine";

// #75 — closes the real gap in the proactive-surfacing pipeline: North
// mentions things unprompted, but nothing ever tracked whether those
// mentions actually landed vs. got ignored. Scoped deliberately narrow —
// only the opener/get_proactive_updates path, one classifier call against
// the very next user turn. Push-notification click-through engagement is
// out of scope (no FCM click analytics exist to build on).
function buildPrompt(connection: SynthesisConnection): string {
  return (
    "North (a personal chief-of-staff assistant) just opened a voice session by mentioning this to " +
    `Nishad: "${connection.connection} ${connection.whyItMatters}"\n\n` +
    "Nishad's next message, given right below as the input, is his very next reply. Determine " +
    "whether that reply actually engages with what North just brought up — asks about it, reacts to " +
    "it, acts on it, or otherwise responds to it — as opposed to ignoring it and moving straight to " +
    "something unrelated.\n\n" +
    "Respond with EXACTLY one word: ENGAGED or IGNORED."
  );
}

// Fire-and-forget from app/api/v1/voice/respond/route.ts — a classification
// failure must never affect the actual voice response.
export async function detectEngagement(connection: SynthesisConnection, nextUserTurnText: string): Promise<void> {
  try {
    const result = await askClaude({
      systemPrompt: buildPrompt(connection),
      userMessage: nextUserTurnText,
      maxTokens: 10,
    });

    if (!result.ok) return;

    const engaged = result.text.trim().toUpperCase().startsWith("ENGAGED");
    await setConnectionEngagement(connection, engaged ? "engaged" : "ignored");
  } catch (error) {
    console.error("[engagement-detector] Failed to detect engagement:", error);
  }
}
