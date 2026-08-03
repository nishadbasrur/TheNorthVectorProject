// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/synthesis-scan.ts, via
// lib/synthesis-engine.ts), same reasoning already established for
// lib/google-calendar-client.ts, lib/notion-client.ts, and
// lib/gmail-client.ts. Removing the guard doesn't change any Next.js
// server-side behavior — it only relaxes a client-bundle safety net that
// was never relevant here to begin with.
import OpenAI, { toFile } from "openai";
import type {
  FunctionTool,
  Response,
  ResponseFunctionToolCall,
  ResponseInputItem,
} from "openai/resources/responses/responses";

// Lazy singleton — constructing OpenAI({apiKey}) eagerly at module load
// broke the CI build: Next.js's build step statically loads every route to
// collect page data, which pulled in this module with no real
// OPENAI_API_KEY set (CI deliberately runs without one, same as its
// placeholder Firebase values) and the SDK throws "Missing credentials"
// immediately on construction. Deferring construction to first actual use
// means a route that never calls into this file (most of them, at build
// time) never touches the OpenAI SDK at all.
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// No hidden default model — every caller passes MODEL_AGENTIC or
// MODEL_CLASSIFIER explicitly, so rebalancing the mini/nano split is a
// one-line change at the constant, not a grep-and-replace across call sites.
export const MODEL_AGENTIC = "gpt-5.4-mini";
export const MODEL_CLASSIFIER = "gpt-5.4-nano";

// Simple in-memory daily counter — not persisted, resets on redeploy/restart.
// Good enough as a first-pass sanity check; a real budget tracker against
// Firestore (or a real usage API) is a natural follow-up, not this task.
let callsToday = 0;
const SOFT_DAILY_CALL_CAP = 200; // generous; flags runaway loops long before $ matters

// Lightweight local tool-definition type rather than the full
// OpenAI.Responses.FunctionTool — callers (lib/tool-dispatcher.ts's
// TOOL_DEFINITIONS) don't need to carry the `strict` field themselves;
// it's applied uniformly at the actual API call site below instead of at
// each of the 35 individual tool definitions.
export type ToolDefinition = {
  type: "function";
  name: string;
  description?: string;
  parameters: Record<string, unknown> | null;
};

function toFunctionTools(tools: ToolDefinition[]): FunctionTool[] {
  return tools.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    strict: false,
  }));
}

// The SDK decorates response output items with convenience fields for its
// own .parse()-based structured-output helpers — `parsed_arguments` on
// function_call items, `parsed` on message content blocks — that this app
// never uses. The Responses API itself REJECTS these if echoed straight
// back as input on a later turn ("Unknown parameter: input[N].parsed_arguments",
// confirmed live): every multi-turn conversation where a tool call
// happened would break on the very next turn without this, since callers
// (e.g. app/api/v1/voice/respond/route.ts's messages.push(...iterationContent))
// feed a turn's own output back in as the next turn's input verbatim.
// Strips both fields so `output` is safe to read now AND reuse later.
function sanitizeOutputForReuse(items: readonly unknown[]): Response["output"] {
  return items.map((rawItem) => {
    const item = { ...(rawItem as Record<string, unknown>) };
    delete item.parsed_arguments;
    if (Array.isArray(item.content)) {
      item.content = (item.content as Record<string, unknown>[]).map((block) => {
        const cleaned = { ...block };
        delete cleaned.parsed;
        return cleaned;
      });
    }
    return item;
  }) as unknown as Response["output"];
}

export async function askOpenAI(params: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  model: string;
}): Promise<{ text: string; ok: true } | { ok: false; error: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: "OPENAI_API_KEY not configured" };
  }

  if (callsToday >= SOFT_DAILY_CALL_CAP) {
    console.warn(`[openai-client] Soft daily call cap (${SOFT_DAILY_CALL_CAP}) reached — refusing call.`);
    return { ok: false, error: "Daily call cap reached" };
  }

  try {
    callsToday += 1;
    const response = await getClient().responses.create({
      model: params.model,
      instructions: params.systemPrompt,
      input: params.userMessage,
      max_output_tokens: params.maxTokens ?? 300,
    });

    if (!response.output_text) {
      return { ok: false, error: "No text content in response" };
    }

    return { ok: true, text: response.output_text };
  } catch (err) {
    console.error("[openai-client] API call failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Multi-turn, tool-aware sibling of askOpenAI. Currently has zero real
// callers (kept for API-surface parity with streamOpenAIWithTools, the one
// that actually drives the voice tool-calling loop) — see
// app/api/v1/voice/respond/route.ts for the real consumer.
export async function askOpenAIWithTools(params: {
  systemPrompt: string;
  messages: ResponseInputItem[];
  tools: ToolDefinition[];
  maxTokens?: number;
  model: string;
}): Promise<
  | { ok: true; finishReason: "tool_calls" | "stop"; output: Response["output"] }
  | { ok: false; error: string }
> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: "OPENAI_API_KEY not configured" };
  }

  if (callsToday >= SOFT_DAILY_CALL_CAP) {
    console.warn(`[openai-client] Soft daily call cap (${SOFT_DAILY_CALL_CAP}) reached — refusing call.`);
    return { ok: false, error: "Daily call cap reached" };
  }

  try {
    callsToday += 1;
    const response = await getClient().responses.create({
      model: params.model,
      instructions: params.systemPrompt,
      input: params.messages,
      max_output_tokens: params.maxTokens ?? 400,
      tools: toFunctionTools(params.tools),
    });

    const hasToolCalls = response.output.some((item) => item.type === "function_call");
    return {
      ok: true,
      finishReason: hasToolCalls ? "tool_calls" : "stop",
      output: sanitizeOutputForReuse(response.output),
    };
  } catch (err) {
    console.error("[openai-client] Tool-use API call failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Streaming sibling of askOpenAIWithTools — same tool-aware multi-turn shape,
// but yields text as it's generated instead of waiting for the full
// response, so a caller can start speaking sentence 1 while sentence 2 is
// still being generated (see app/api/v1/voice/respond/route.ts's
// sentence-boundary chunking). Text deltas stream in via
// response.output_text.delta; function calls (with final, complete
// `arguments`) arrive via response.output_item.done, so no manual
// delta-accumulation is needed for tool-call arguments the way Anthropic's
// content_block_delta stream required.
export async function* streamOpenAIWithTools(params: {
  systemPrompt: string;
  messages: ResponseInputItem[];
  tools: ToolDefinition[];
  maxTokens?: number;
  model: string;
  // "24h" extends OpenAI's automatic prefix-caching window from its short
  // default up to 24 hours — worth it for a caller like the voice
  // tool-calling loop, which resends the same large persona+tool-schema
  // system prompt on every turn of a session. Confirmed live against this
  // account (2026-08) that 24h is already the default for orgs without
  // Zero Data Retention enabled, so this mostly makes that explicit/
  // guaranteed rather than actually changing behavior — still worth
  // setting so a future account-level policy change or model-tier switch
  // can't silently shorten it. No extra write cost on mini/nano (both
  // pre-5.6) either way — see
  // https://platform.openai.com/docs/guides/prompt-caching#prompt-cache-retention.
  // Omit to leave the account default in effect.
  promptCacheRetention?: "24h" | "in_memory";
}): AsyncGenerator<
  | { type: "text_delta"; text: string }
  | { type: "tool_use"; block: ResponseFunctionToolCall }
  | {
      type: "done";
      finishReason: "tool_calls" | "stop";
      output: Response["output"];
      usage?: Response["usage"];
    }
  | { type: "error"; error: string }
> {
  if (!process.env.OPENAI_API_KEY) {
    yield { type: "error", error: "OPENAI_API_KEY not configured" };
    return;
  }

  if (callsToday >= SOFT_DAILY_CALL_CAP) {
    console.warn(`[openai-client] Soft daily call cap (${SOFT_DAILY_CALL_CAP}) reached — refusing call.`);
    yield { type: "error", error: "Daily call cap reached" };
    return;
  }

  callsToday += 1;

  try {
    const stream = getClient().responses.stream({
      model: params.model,
      instructions: params.systemPrompt,
      input: params.messages,
      max_output_tokens: params.maxTokens ?? 400,
      tools: toFunctionTools(params.tools),
      prompt_cache_retention: params.promptCacheRetention,
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        yield { type: "text_delta", text: event.delta };
      }
    }

    // stream.finalResponse() returns ParsedResponse<null> — its output items
    // are shaped slightly differently from the plain Response["output"]
    // this generator's callers expect (see sanitizeOutputForReuse above,
    // which also strips the SDK-only fields that break reuse as input).
    const final = await stream.finalResponse();
    const output = sanitizeOutputForReuse(final.output);
    const toolUseBlocks = output.filter(
      (item): item is ResponseFunctionToolCall => item.type === "function_call"
    );
    for (const block of toolUseBlocks) {
      yield { type: "tool_use", block };
    }

    const finishReason = toolUseBlocks.length > 0 ? "tool_calls" : "stop";
    yield { type: "done", finishReason, output, usage: final.usage };
  } catch (err) {
    console.error("[openai-client] Streaming tool-use API call failed:", err);
    yield { type: "error", error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Synchronous, single-call helper for on-demand web-grounded questions —
// currently lib/tool-dispatcher.ts's general-purpose research tool (any
// topic, not scoped to a specific subject). Uses the Responses API's
// server-side web_search tool, which OpenAI executes and returns inline
// within one response, so this needs no client-side tool loop the way
// askOpenAIWithTools does. Not used by the bi-daily opportunity scan
// (functions/src/opportunity-scan.ts) — that goes through the Batch API
// directly for the cost discount on a job nothing is waiting on, a
// different submit/poll shape this synchronous helper doesn't fit.
export async function askOpenAIWithWebSearch(params: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  maxSearches?: number;
  model: string;
}): Promise<{ text: string; ok: true } | { ok: false; error: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: "OPENAI_API_KEY not configured" };
  }

  if (callsToday >= SOFT_DAILY_CALL_CAP) {
    console.warn(`[openai-client] Soft daily call cap (${SOFT_DAILY_CALL_CAP}) reached — refusing call.`);
    return { ok: false, error: "Daily call cap reached" };
  }

  try {
    callsToday += 1;
    const response = await getClient().responses.create({
      model: params.model,
      instructions: params.systemPrompt,
      input: params.userMessage,
      max_output_tokens: params.maxTokens ?? 1200,
      tools: [{ type: "web_search" }],
    });

    // response.output_text already concatenates only the text portions —
    // web_search_call items are excluded automatically, unlike Anthropic's
    // interleaved content array which needed manual filtering.
    if (!response.output_text) {
      return { ok: false, error: "No text content in response" };
    }

    return { ok: true, text: response.output_text };
  } catch (err) {
    console.error("[openai-client] Web-search API call failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// --- Batch API ---------------------------------------------------------
// Architecturally different from Anthropic's inline-requests Batch API:
// OpenAI requires uploading a JSONL file of requests first, then pointing
// a batch job at that file's id. Used by the 4 Cloud Functions batch scans
// (functions/src/synthesis-scan.ts, transcript-batch-scan.ts,
// opportunity-scan.ts, weekly-retrospective-scan.ts).

export type BatchRequestSpec = {
  customId: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  model: string;
  webSearch?: boolean;
};

export type BatchStatus =
  | { ok: true; status: "pending"; batchId: string }
  | { ok: true; status: "completed"; batchId: string; results: Map<string, { ok: true; text: string } | { ok: false; error: string }> }
  | { ok: true; status: "failed"; batchId: string; error: string }
  | { ok: false; error: string };

export async function submitBatch(requests: BatchRequestSpec[], apiKeyOverride?: string): Promise<{ ok: true; batchId: string } | { ok: false; error: string }> {
  const apiKey = apiKeyOverride ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "OPENAI_API_KEY not configured" };
  }

  const batchClient = apiKeyOverride ? new OpenAI({ apiKey: apiKeyOverride }) : getClient();

  try {
    const lines = requests.map((req) =>
      JSON.stringify({
        custom_id: req.customId,
        method: "POST",
        url: "/v1/responses",
        body: {
          model: req.model,
          instructions: req.systemPrompt,
          input: req.userMessage,
          max_output_tokens: req.maxTokens ?? 1200,
          ...(req.webSearch ? { tools: [{ type: "web_search" }] } : {}),
        },
      })
    );
    const jsonl = lines.join("\n");

    const file = await batchClient.files.create({
      file: await toFile(Buffer.from(jsonl, "utf-8"), "batch-input.jsonl"),
      purpose: "batch",
    });

    const batch = await batchClient.batches.create({
      input_file_id: file.id,
      endpoint: "/v1/responses",
      completion_window: "24h",
    });

    return { ok: true, batchId: batch.id };
  } catch (err) {
    console.error("[openai-client] Batch submission failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function pollBatch(batchId: string, apiKeyOverride?: string): Promise<BatchStatus> {
  const apiKey = apiKeyOverride ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "OPENAI_API_KEY not configured" };
  }

  const batchClient = apiKeyOverride ? new OpenAI({ apiKey: apiKeyOverride }) : getClient();

  try {
    const batch = await batchClient.batches.retrieve(batchId);

    if (batch.status === "failed" || batch.status === "expired" || batch.status === "cancelled") {
      return { ok: true, status: "failed", batchId, error: `Batch ended with status: ${batch.status}` };
    }

    if (batch.status !== "completed" || !batch.output_file_id) {
      return { ok: true, status: "pending", batchId };
    }

    const outputFile = await batchClient.files.content(batch.output_file_id);
    const outputText = await outputFile.text();

    const results = new Map<string, { ok: true; text: string } | { ok: false; error: string }>();
    for (const line of outputText.split("\n")) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as {
          custom_id: string;
          response?: { status_code: number; body?: { output_text?: string; output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> } };
          error?: { message?: string } | null;
        };

        if (parsed.error) {
          results.set(parsed.custom_id, { ok: false, error: parsed.error.message ?? "Batch line reported an error" });
          continue;
        }

        const body = parsed.response?.body;
        const text =
          body?.output_text ??
          body?.output
            ?.filter((item) => item.type === "message")
            .flatMap((item) => item.content ?? [])
            .filter((block) => block.type === "output_text")
            .map((block) => block.text ?? "")
            .join("\n\n");

        if (!text) {
          results.set(parsed.custom_id, { ok: false, error: "No text content in batch result" });
          continue;
        }

        results.set(parsed.custom_id, { ok: true, text });
      } catch (err) {
        console.error("[openai-client] Failed to parse batch result line:", err);
      }
    }

    return { ok: true, status: "completed", batchId, results };
  } catch (err) {
    console.error("[openai-client] Batch poll failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
