import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Session/turn-history storage for text-chat mode — deliberately its own
// Firestore collection ("text_sessions"), never lib/voice-session-store.ts's
// "voice_sessions". This is the actual mechanism behind the text-chat-mode
// fix note's core requirement: text and voice must not share session state
// in any way that could let one channel's turn accidentally get treated as
// the other's. The two stores happen to look structurally similar (both
// are "an id maps to a list of turns") because that's the natural shape
// for this kind of state, not because one imports the other — there is no
// import between this file and voice-session-store.ts.
//
// Simpler than the voice store on purpose: no idle-TTL expiry (a text
// thread is explicitly meant to be a persistent, revisit-able history per
// the fix note's point 8 — "Persistent history for this thread" — not an
// ephemeral live-call session that should reset itself after 10 quiet
// minutes), and no LLM-summarization-on-overflow step. A plain larger raw
// window (see MAX_TURNS_KEPT below) is a fine, honest v1 — revisit with
// real summarization only if a real thread actually grows long enough for
// it to matter.

export type TextTurn = { role: "user" | "assistant"; content: string };

const MAX_TURNS_KEPT = 60; // ~30 exchanges — generous relative to voice's 12,
                            // since this is meant to persist across visits,
                            // not just one live call

export async function loadTextSession(sessionId: string): Promise<TextTurn[]> {
  const doc = await adminDb.collection("text_sessions").doc(sessionId).get();
  if (!doc.exists) return [];

  const data = doc.data();
  return Array.isArray(data?.turns) ? data.turns : [];
}

export async function saveTextSession(sessionId: string, turns: TextTurn[]): Promise<void> {
  const trimmed = turns.slice(-MAX_TURNS_KEPT);

  await adminDb.collection("text_sessions").doc(sessionId).set(
    {
      turns: trimmed,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
