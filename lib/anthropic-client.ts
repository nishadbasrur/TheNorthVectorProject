// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/synthesis-scan.ts, via
// lib/synthesis-engine.ts), same reasoning already established for
// lib/google-calendar-client.ts, lib/notion-client.ts, and
// lib/gmail-client.ts. Removing the guard doesn't change any Next.js
// server-side behavior — it only relaxes a client-bundle safety net that
// was never relevant here to begin with.
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

// Simple in-memory daily counter — not persisted, resets on redeploy/restart.
// Good enough as a first-pass sanity check; a real budget tracker against
// Firestore (or the Anthropic Usage API) is a natural follow-up, not this task.
let callsToday = 0;
const SOFT_DAILY_CALL_CAP = 200; // generous; flags runaway loops long before $ matters

export async function askClaude(params: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  // Optional override for callers that deliberately want a stronger model
  // than the shared Haiku default for a specific reasoning task — e.g.
  // lib/synthesis-engine.ts's cross-source connection-finding pass, per
  // North_Vector_Synthesis_Engine_Plan.md Section 5.4. Omit to use the
  // global default.
  model?: string;
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
      model: params.model ?? DEFAULT_MODEL,
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

// Multi-turn, tool-aware sibling of askClaude — used by the voice
// tool-calling loop (app/api/v1/voice/respond/route.ts), which needs the raw
// stop_reason/content blocks to drive its own loop rather than a single
// extracted text string. askClaude stays as-is for genuinely single-turn,
// no-tools callers (lib/gmail-urgency.ts's per-message evaluation,
// lib/preference-detector.ts) that shouldn't pay for this extra shape.
// Shares the same module-level callsToday/SOFT_DAILY_CALL_CAP guard — see
// North_Vector_JARVIS_Tool_Calling_Migration_Plan.md Section 7.2 for why
// that cap's effective headroom needs re-examining now that one voice turn
// can cost more than one call.
export async function askClaudeWithTools(params: {
  systemPrompt: string;
  messages: Anthropic.MessageParam[];
  tools: Anthropic.Tool[];
  maxTokens?: number;
}): Promise<
  | { ok: true; stopReason: string; content: Anthropic.ContentBlock[] }
  | { ok: false; error: string }
> {
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
      model: DEFAULT_MODEL,
      max_tokens: params.maxTokens ?? 400,
      system: params.systemPrompt,
      messages: params.messages,
      tools: params.tools,
    });

    return { ok: true, stopReason: response.stop_reason ?? "end_turn", content: response.content };
  } catch (err) {
    console.error("[anthropic-client] Tool-use API call failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Synchronous, single-call helper for on-demand web-grounded questions —
// currently only lib/tool-dispatcher.ts's research_scholarships. Uses
// Claude's server-side web_search tool, which Anthropic executes and
// returns inline within one response (search + synthesis both happen
// server-side), so this needs no client-side tool loop the way
// askClaudeWithTools does. Not used by the bi-daily scholarship scan
// (functions/src/scholarship-scan.ts) — that goes through the Batch API
// directly for the 50% cost discount on a job nothing is waiting on, a
// different submit/poll shape this synchronous helper doesn't fit.
export async function askClaudeWithWebSearch(params: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  maxSearches?: number;
  model?: string;
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
      model: params.model ?? DEFAULT_MODEL,
      max_tokens: params.maxTokens ?? 1200,
      system: params.systemPrompt,
      messages: [{ role: "user", content: params.userMessage }],
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: params.maxSearches ?? 5 }],
    });

    // Response content interleaves text blocks with server_tool_use /
    // web_search_tool_result blocks — only the text blocks are the actual
    // answer.
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n\n");

    if (!text) {
      return { ok: false, error: "No text content in response" };
    }

    return { ok: true, text };
  } catch (err) {
    console.error("[anthropic-client] Web-search API call failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
