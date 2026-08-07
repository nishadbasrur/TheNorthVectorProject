import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { SynthesisConnection } from "./synthesis-engine";
import { askOpenAI, MODEL_CLASSIFIER } from "./openai-client";

export type VoiceTurn = { role: "user" | "assistant"; content: string };

export type SessionData = {
  turns: VoiceTurn[];
  // Rolling gist of everything that's aged out of `turns` — see saveSession
  // below. Empty string for a session that's never overflowed the window.
  summary: string;
};

// "What's currently on screen," distinct from the turn history above — a
// follow-up like "zoom in" needs to know a map is showing and where, which
// isn't answerable from the spoken conversation text alone. Only one shape
// today (map); a discriminated union once a second visual type exists.
export type VisualState = {
  type: "map";
  location: string;
  lat: number;
  lon: number;
  zoom: number;
  // Nearest building footprint to (lat, lon), set by highlight_building —
  // [lat, lon] pairs tracing the outline. Cleared (undefined) whenever the
  // map recenters to a new location via show_map, since a highlight from
  // the previous place no longer applies.
  highlightFootprint?: [number, number][];
};

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
export async function loadSession(sessionId: string): Promise<SessionData> {
  const doc = await adminDb.collection("voice_sessions").doc(sessionId).get();
  if (!doc.exists) return { turns: [], summary: "" };

  const data = doc.data();
  const updatedAtMs = data?.updatedAt?.toMillis?.() ?? 0;
  if (Date.now() - updatedAtMs > SESSION_IDLE_TTL_MS) return { turns: [], summary: "" }; // expired — treat as fresh

  return {
    turns: Array.isArray(data?.turns) ? data.turns : [],
    summary: typeof data?.summary === "string" ? data.summary : "",
  };
}

const SUMMARY_SYSTEM_PROMPT = `
You maintain a short running summary of an ongoing spoken conversation between Nishad and his voice assistant North, so older exchanges aren't lost outright once they age out of the raw turn window kept for pronoun continuity.

You will be given the EXISTING summary so far (may be empty, for a conversation that hasn't overflowed the window before) and a batch of the OLDEST turns that are about to be dropped from that raw window. Fold the new turns into the existing summary, producing ONE updated summary — not two separate blocks. Keep it to 2-4 short plain sentences covering the actual substance (topics discussed, decisions made, facts established) — drop pleasantries, filler, and anything already superseded by a later part of the same batch. This is read by North as background context on future turns, never spoken aloud, so it doesn't need to be conversational — just accurate and dense.

Respond with ONLY the updated summary text, nothing else.
`.trim();

function serializeOverflowTurns(turns: VoiceTurn[]): string {
  return turns.map((t) => `${t.role === "user" ? "Nishad" : "North"}: ${t.content}`).join("\n");
}

async function summarizeOverflow(previousSummary: string, overflowTurns: VoiceTurn[]): Promise<string> {
  const userMessage =
    `EXISTING SUMMARY:\n${previousSummary || "(none yet — first summarization for this conversation)"}\n\n` +
    `TURNS BEING DROPPED FROM THE RAW WINDOW:\n${serializeOverflowTurns(overflowTurns)}`;

  const result = await askOpenAI({
    systemPrompt: SUMMARY_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 200,
    model: MODEL_CLASSIFIER,
  });

  if (!result.ok) {
    console.error("[voice-session-store] Summary compression failed, keeping previous summary:", result.error);
    return previousSummary; // fail conservative — never lose the existing
                             // summary just because this one call failed
  }

  return result.text.trim();
}

// previousSummary comes from the same loadSession() call the caller already
// made earlier in the request, not a fresh read here — single-writer-per-
// session in this single-owner app, so there's no real risk of it going
// stale between that read and this write within one request's lifetime.
export async function saveSession(sessionId: string, turns: VoiceTurn[], previousSummary: string): Promise<void> {
  const overflowCount = turns.length - MAX_TURNS_KEPT;
  const trimmed = turns.slice(-MAX_TURNS_KEPT);

  // Real overflow only — a repeat/clarify turn (lib/repeat-detector.ts)
  // never reaches this function at all, so every turn that does is genuine
  // content worth preserving in gist form rather than silently discarding.
  const summary =
    overflowCount > 0 ? await summarizeOverflow(previousSummary, turns.slice(0, overflowCount)) : previousSummary;

  // merge: true — without it, this overwrites the whole doc and would wipe
  // out `visual` (see below) on every turn save, including within the same
  // request that just wrote it via saveVisualState.
  await adminDb.collection("voice_sessions").doc(sessionId).set(
    {
      turns: trimmed,
      summary,
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

// #75 — the connection an opener just delivered (or get_proactive_updates
// just surfaced), waiting to see whether the very next user turn actually
// engages with it. 0 or 1 elements, same array shape getUnspokenConnections
// already returns rather than inventing a new single-value convention.
// Cleared back to [] once lib/engagement-detector.ts has classified it.
export async function savePendingEngagementCheck(
  sessionId: string,
  connections: SynthesisConnection[]
): Promise<void> {
  await adminDb.collection("voice_sessions").doc(sessionId).set(
    {
      pendingEngagementCheck: connections,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function loadPendingEngagementCheck(sessionId: string): Promise<SynthesisConnection[]> {
  const doc = await adminDb.collection("voice_sessions").doc(sessionId).get();
  if (!doc.exists) return [];

  const data = doc.data();
  const updatedAtMs = data?.updatedAt?.toMillis?.() ?? 0;
  if (Date.now() - updatedAtMs > SESSION_IDLE_TTL_MS) return []; // expired — treat as fresh

  return Array.isArray(data?.pendingEngagementCheck) ? data.pendingEngagementCheck : [];
}
