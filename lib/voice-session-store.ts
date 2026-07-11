import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type VoiceTurn = { role: "user" | "assistant"; content: string };

// Firestore-backed, not in-memory: Next.js API routes on serverless hosting
// (Firebase App Hosting, this project's deploy target) are not guaranteed to
// share memory across invocations/instances, so an in-memory session map
// would silently drop context on a cold start or instance rotation. See
// North_Vector_JARVIS_Tool_Calling_Migration_Plan.md Section 6.1.
const SESSION_IDLE_TTL_MS = 10 * 60 * 1000; // flat default — see that plan's
                                             // Section 9.2 for why this isn't
                                             // the full session-type-aware
                                             // expiration policy
                                             // 04-Voice-Interface/Voice_Session_Manager.md
                                             // describes
const MAX_TURNS_KEPT = 12; // ~6 exchanges — enough for pronoun continuity
                            // within a conversation, bounded so the prompt
                            // doesn't grow unbounded

// Single-owner app (see lib/owner.ts) — no per-user partitioning needed,
// same assumption every other Firestore collection in this codebase makes.
export async function loadSession(sessionId: string): Promise<VoiceTurn[]> {
  const doc = await adminDb.collection("voice_sessions").doc(sessionId).get();
  if (!doc.exists) return [];

  const data = doc.data();
  const updatedAtMs = data?.updatedAt?.toMillis?.() ?? 0;
  if (Date.now() - updatedAtMs > SESSION_IDLE_TTL_MS) return []; // expired — treat as fresh

  return Array.isArray(data?.turns) ? data.turns : [];
}

export async function saveSession(sessionId: string, turns: VoiceTurn[]): Promise<void> {
  const trimmed = turns.slice(-MAX_TURNS_KEPT);

  await adminDb.collection("voice_sessions").doc(sessionId).set({
    turns: trimmed,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
