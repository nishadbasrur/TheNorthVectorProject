import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

// Simple in-memory daily counter — not persisted, resets on redeploy/restart.
// Good enough as a first-pass sanity check; a real budget tracker against
// Firestore (or the Anthropic Usage API) is a natural follow-up, not this task.
let callsToday = 0;
const SOFT_DAILY_CALL_CAP = 200; // generous; flags runaway loops long before $ matters

export async function askClaude(params: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<{ text: string; ok: true } | { ok: false; error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "ANTHROPIC_API_KEY not configured" };
  }

  if (callsToday >= SOFT_DAILY_CALL_CAP) {
    console.warn(`[anthropic-client] Soft daily call cap (${SOFT_DAILY_CALL_CAP}) reached — refusing call.`);
    return { ok: false, error: "Daily call cap reached" };
  }

  try {
    callsToday += 1;
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: params.maxTokens ?? 300,
      system: params.systemPrompt,
      messages: [{ role: "user", content: params.userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "No text content in response" };
    }

    return { ok: true, text: textBlock.text };
  } catch (err) {
    console.error("[anthropic-client] API call failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
