import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { sseEvent, sseResponse } from "@/lib/sse-helpers";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

// Never statically analyze/cache this — every open connection is a live,
// per-client stream.
const PRESENCE_REFRESH_MS = 60 * 1000;

// Self-closes with a clean "reconnect" frame before Cloud Run's own request
// timeout could kill the connection mid-stream — the client (see
// app/sandbox/voice-session-context.tsx) treats this frame as a planned
// handoff (reconnect immediately, no backoff) rather than a drop
// (exponential backoff). Comfortably under Cloud Run's default request
// timeout ceiling.
const CONNECTION_ROTATE_MS = 6 * 60 * 1000;

// The one persistent connection this whole feature is built around — see
// the plan's "Delivery channel" section. Opened once by VoiceSessionProvider
// on mount and kept alive (with reconnects) for as long as the Tauri app is
// running, regardless of window focus/visibility (see the plan's answer to
// that open question). Firestore is the pub/sub layer: every trigger source
// (Gmail-urgent, hourly check-in, task reminder, class-end) writes a doc to
// spontaneous_speech_queue via lib/spontaneous-speech-queue.ts's
// enqueueSpontaneousSpeech(), and this route forwards each undelivered doc
// down the stream — working correctly regardless of which Cloud Run
// instance is holding either side, since Firestore's own realtime
// replication is what bridges them, not any in-memory state.
export async function GET(request: Request): Promise<Response> {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const encoder = new TextEncoder();
  const presenceRef = adminDb.collection("client_presence").doc("main");

  let closed = false;
  let unsubscribe: (() => void) | null = null;
  let presenceInterval: ReturnType<typeof setInterval> | null = null;
  let rotateTimeout: ReturnType<typeof setTimeout> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const markPresent = () => {
        // Fire-and-forget — a failed presence write shouldn't tear down the
        // stream itself; worst case the hourly check-in scan later treats
        // this session as "not present" and skips a check-in, which is a
        // far smaller problem than dropping the connection over it.
        presenceRef.set({ lastSeenAt: FieldValue.serverTimestamp() }).catch(() => {});
      };

      markPresent();
      presenceInterval = setInterval(markPresent, PRESENCE_REFRESH_MS);

      unsubscribe = adminDb
        .collection("spontaneous_speech_queue")
        .where("delivered", "==", false)
        .orderBy("createdAt", "asc")
        .onSnapshot(
          (snapshot) => {
            if (closed) return;
            for (const change of snapshot.docChanges()) {
              if (change.type !== "added") continue;
              const doc = change.doc;
              const data = doc.data();

              controller.enqueue(
                sseEvent(encoder, "spontaneous_speech", {
                  id: doc.id,
                  text: data.text,
                  urgency: data.urgency,
                  source: data.source,
                })
              );

              // Best-effort — if this fails, worst case the same item gets
              // forwarded again on a future snapshot (still gated by the
              // client's own idle/dormant check, so a duplicate spoken line
              // is the worst outcome, not a crash).
              doc.ref.update({ delivered: true, deliveredAt: FieldValue.serverTimestamp() }).catch(() => {});
            }
          },
          (error) => {
            if (closed) return;
            controller.enqueue(sseEvent(encoder, "error", { error: error.message }));
          }
        );

      rotateTimeout = setTimeout(() => {
        if (closed) return;
        controller.enqueue(sseEvent(encoder, "reconnect", {}));
        closed = true;
        unsubscribe?.();
        if (presenceInterval) clearInterval(presenceInterval);
        controller.close();
      }, CONNECTION_ROTATE_MS);
    },
    cancel() {
      // Client disconnected (tab closed, app quit, network drop). Does NOT
      // clear client_presence — a disconnect doesn't necessarily mean the
      // Mac went to sleep, and lastSeenAt will naturally go stale within
      // isClientPresent()'s own window if no reconnect follows, which is
      // exactly the signal the hourly check-in scan wants.
      closed = true;
      unsubscribe?.();
      if (presenceInterval) clearInterval(presenceInterval);
      if (rotateTimeout) clearTimeout(rotateTimeout);
    },
  });

  return sseResponse(stream);
}
