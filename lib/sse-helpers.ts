// Shared SSE framing helpers — extracted out of
// app/api/v1/voice/respond/route.ts (where these started as private local
// functions) so the new persistent spontaneous-speech stream
// (app/api/v1/voice/spontaneous-stream/route.ts) can use the exact same
// wire format instead of a second copy-pasted implementation.

// One JSON payload per named event, blank-line terminated per the SSE spec.
export function sseEvent(encoder: TextEncoder, event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Explicit globalThis.Response — voice/respond/route.ts also imports
// OpenAI's own `Response` type (the Responses API object), so callers there
// need the bare name un-shadowed; kept as globalThis.Response here too so
// this helper works the same way regardless of what a given call site has
// imported under the name `Response`.
export function sseResponse(stream: ReadableStream<Uint8Array>): globalThis.Response {
  return new globalThis.Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
