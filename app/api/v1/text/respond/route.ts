import { NextResponse } from "next/server";
import type { Response, ResponseFunctionToolCall, ResponseInputItem } from "openai/resources/responses/responses";
import { requireOwner } from "@/lib/require-owner";
import { sseEvent, sseResponse } from "@/lib/sse-helpers";
import { streamOpenAIWithTools, MODEL_AGENTIC } from "@/lib/openai-client";
import { getPreferences } from "@/lib/preferences-store";
import { buildSystemPrompt, STATIC_SYSTEM_PROMPT_HASH } from "@/lib/persona-prompt";
import { detectAndStorePreference } from "@/lib/preference-detector";
import { detectIntentSignal } from "@/lib/intent-signal-detector";
import { loadTextSession, saveTextSession, type TextTurn } from "@/lib/text-session-store";
import { TOOL_DEFINITIONS, executeTool } from "@/lib/tool-dispatcher";
import { recordAction } from "@/lib/action-log-store";
import { recordOccurrence } from "@/lib/recurring-signal-store";
import { createTranscript } from "@/lib/transcript-store";

// Text-chat mode's own independent turn-processing route — deliberately a
// separate file from app/api/v1/voice/respond/route.ts, not a mode flag on
// it (2026-09-30 fix note's explicit requirement: two clean, independent
// paths, so a voice interaction can never accidentally resolve through the
// text path or vice versa). What IS shared with the voice route, on
// purpose, per the same fix note: buildSystemPrompt (lib/persona-prompt.ts)
// and executeTool/TOOL_DEFINITIONS (lib/tool-dispatcher.ts) — "the same
// brain," identical knowledge/personality/tool access. What's NOT shared:
// session/turn-history storage (lib/text-session-store.ts's own
// "text_sessions" collection, never voice's "voice_sessions"), the output
// channel (no TTS/audio pipeline at all here — see the missing
// createAudioPipeline/synthesizeSpeech/google-tts imports, on purpose),
// and every voice-specific behavior that wouldn't make sense for typed
// text: no wake word, no barge-in, no repeat/"say that again" detection
// (the user can just scroll up), no rush-signal detection, no
// conversational opener (openers are explicitly a proactive/unprompted
// touch — this fix note requires text mode be reactive-only, never
// spontaneous, so there's nothing here that could ever speak first).
const MAX_TOOL_ITERATIONS = 4; // same cap as voice, same reasoning — no
                                // realistic single turn should need more
                                // than a couple of tool calls

// Same category-tool set voice's route uses for #96 question-category
// occurrence tracking — duplicated rather than imported from the voice
// route file specifically so this file has zero import dependency on it
// (importing a `const` two files deep from the voice route would be a
// harmless-today coupling that's easy to accidentally deepen later; this
// keeps the independence trivially verifiable by inspection).
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

// Loads this thread's persistent history — called by the client on mount
// so a revisit to /text shows prior messages, per the fix note's "Persistent
// history for this thread" requirement. Plain GET, not folded into POST,
// since it's a pure read with no side effects.
export async function GET(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing 'sessionId' query param." }, { status: 400 });
  }

  const turns = await loadTextSession(sessionId);
  return NextResponse.json({ turns });
}

export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const rawBody = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.warn(`[text-respond] Rejected: invalid JSON body. Received: ${rawBody.slice(0, 500)}`);
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body as Record<string, unknown>)?.text;
  const sessionId = (body as Record<string, unknown>)?.sessionId;
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'text' field." }, { status: 400 });
  }
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'sessionId' field." }, { status: 400 });
  }

  const requestStart = performance.now();

  // Tier 1 of the shared memory pipeline — same Transcripts/ folder voice
  // writes to, tagged "text" instead of "voice" so the nightly extraction
  // job (and anyone reading the vault directly) can tell them apart. See
  // lib/transcript-store.ts's own comment for the full shared-memory
  // rationale. Awaited directly, try/caught, same discipline as the voice
  // route — a transcript failure must never break the actual reply.
  try {
    await createTranscript(text, "text");
  } catch (error) {
    console.error("[text-respond] createTranscript failed:", error);
  }

  const [preferences, priorTurns] = await Promise.all([getPreferences(), loadTextSession(sessionId)]);
  console.log(`[text-respond] Session loaded (${priorTurns.length} prior turn(s)) in ${Math.round(performance.now() - requestStart)}ms`);

  detectAndStorePreference(text); // fire-and-forget, same as voice
  detectIntentSignal(text); // fire-and-forget, same as voice

  // No repeat/"say that again" short-circuit here — that exists to work
  // around imperfect speech-to-text, meaningless for typed text the user
  // can already see and scroll back to.

  const systemPrompt = buildSystemPrompt(preferences, "normal"); // text mode
  // never computes a rush signal — see this file's own header comment

  const messages: ResponseInputItem[] = [
    ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: text },
  ];

  const toolsUsed: string[] = [];
  let finalText: string | null = null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      (async () => {
        try {
          for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
            const callStart = performance.now();
            let iterationContent: Response["output"] = [];
            let iterationFinishReason: "tool_calls" | "stop" = "stop";
            let iterationError: string | null = null;
            let iterationUsage: Response["usage"] | undefined;

            for await (const event of streamOpenAIWithTools({
              systemPrompt,
              messages,
              tools: TOOL_DEFINITIONS,
              model: MODEL_AGENTIC,
              promptCacheRetention: "24h", // same cached-prefix benefit as
                                           // voice — STATIC_SYSTEM_PROMPT is
                                           // now byte-identical between the
                                           // two routes (lib/persona-prompt.ts),
                                           // so this genuinely shares the
                                           // provider-side cache hit, not
                                           // just the source code
              maxTokens: 2000, // same headroom as voice — push_to_screen's
                                // `content` can run long
            })) {
              // No sentence-buffering/TTS handoff here (compare voice's
              // extractCompleteSentences use) — text mode streams raw
              // deltas straight through as its own SSE event, since a chat
              // UI just appends text to the screen, it doesn't need
              // sentence-boundary chunking the way a TTS queue does.
              if (event.type === "text_delta") {
                controller.enqueue(sseEvent(encoder, "text_delta", { text: event.text }));
              } else if (event.type === "done") {
                iterationContent = event.output;
                iterationFinishReason = event.finishReason;
                iterationUsage = event.usage;
              } else if (event.type === "error") {
                iterationError = event.error;
              }
            }

            if (iterationError) {
              controller.enqueue(sseEvent(encoder, "error", { error: iterationError }));
              controller.close();
              return;
            }

            console.log(
              `[text-respond] Call ${i + 1}: finishReason=${iterationFinishReason} in ${Math.round(performance.now() - callStart)}ms`
            );
            console.log(
              `[text-respond] Prompt cache: staticPromptHash=${STATIC_SYSTEM_PROMPT_HASH} ` +
                `cachedTokens=${iterationUsage?.input_tokens_details?.cached_tokens ?? "n/a"} ` +
                `cacheWriteTokens=${iterationUsage?.input_tokens_details?.cache_write_tokens ?? "n/a"} ` +
                `inputTokens=${iterationUsage?.input_tokens ?? "n/a"}`
            );

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
                  console.error(`[text-respond] Failed to parse arguments for ${block.name}:`, err);
                }
                const result = await executeTool(block.name, toolInput, sessionId);
                // Tool-result takeover parity with voice (fix note point 4)
                // — same three event types, same "fire the instant the
                // tool call resolves" timing, so the client can render a
                // hologram/display panel exactly the way sandbox does.
                // `visual` (the map type) intentionally isn't surfaced as
                // its own thing here the way voice's "done" event carries
                // it — display/hologram/ui_action cover push_to_screen and
                // control_ui, which is everything the fix note's own scope
                // (point 4) actually asked for; show_map's full-screen map
                // takeover is a voice-HUD-specific visual this text-chat
                // window has no equivalent surface for yet.
                if (result.display) {
                  controller.enqueue(sseEvent(encoder, "display", result.display));
                }
                if (result.hologram) {
                  controller.enqueue(sseEvent(encoder, "hologram", result.hologram));
                }
                if (result.uiAction) {
                  controller.enqueue(sseEvent(encoder, "ui_action", result.uiAction));
                }
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
              `[text-respond] Tool execution (${toolUseBlocks.map((b) => b.name).join(", ")}) in ${Math.round(performance.now() - toolStart)}ms`
            );

            messages.push(...toolResults);
          }

          const responseText = finalText ?? "I didn't catch that clearly — mind trying again?";

          const updatedTurns: TextTurn[] = [
            ...priorTurns,
            { role: "user", content: text },
            { role: "assistant", content: responseText },
          ];

          try {
            await saveTextSession(sessionId, updatedTurns);
          } catch (error) {
            console.error("[text-respond] saveTextSession failed:", error);
          }

          console.log(`[text-respond] Total request time: ${Math.round(performance.now() - requestStart)}ms`);

          controller.enqueue(sseEvent(encoder, "done", { responseText, toolsUsed }));
        } catch (error) {
          console.error("[text-respond] Streaming turn failed:", error);
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
