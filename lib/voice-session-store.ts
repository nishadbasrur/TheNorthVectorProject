import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type VoiceTurn = { role: "user" | "assistant"; content: string };

// "What's currently on screen," distinct from the turn history above — a
// follow-up like "zoom in" needs to know a map is showing and where, which
// isn't answerable from the spoken conversation text alone. Only one shape
// today (map); a discriminated union once a second visual type exists.
export type VisualState = { type: "map"; location: string; lat: number; lon: number; zoom: number };

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

  // merge: true — without it, this overwrites the whole doc and would wipe
  // out `visual` (see below) on every turn save, including within the same
  // request that just wrote it via saveVisualState.
  await adminDb.collection("voice_sessions").doc(sessionId).set(
    {
      turns: trimmed,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function loadVisualState(sessionId: string): Promise<VisualState | null> {
  const doc = await adminDb.collection("voice_sessions").doc(sessionId).get();
  if (!doc.exists) return null;

  const data = doc.data();
  const updatedAtMs = data?.updatedAt?.toMillis?.() ?? 0;
  if (Date.now() - updatedAtMs > SESSION_IDLE_TTL_MS) return null; // expired — treat as fresh

  return (data?.visual as VisualState | undefined) ?? null;
}

export async function saveVisualState(sessionId: string, visual: VisualState | null): Promise<void> {
  await adminDb.collection("voice_sessions").doc(sessionId).set(
    {
      visual,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
