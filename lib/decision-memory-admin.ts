import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import type { StoredDecision } from "./decision-memory";

// Admin SDK counterpart to lib/decision-memory.ts, for server-only callers
// (lib/decision-engine.ts, invoked from app/api/v1/decisions/route.ts).
// The client-SDK version in decision-memory.ts is unauthenticated when run
// from a server route (no browser session to forward), so it hits
// Firestore Security Rules and fails with permission-denied — this bypasses
// rules the same way functions/'s Admin SDK reads do for tasks/goals.
// Mirrors decision-memory.ts's exact key/dedup/timesAsked behavior.

function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

export async function getStoredDecision(question: string) {
  const key = normalizeQuestion(question);
  const decisionRef = adminDb.collection("decisions").doc(key);
  const snapshot = await decisionRef.get();

  if (!snapshot.exists) {
    return null;
  }

  await decisionRef.update({ timesAsked: FieldValue.increment(1) });

  const decision = snapshot.data() as StoredDecision;
  return { ...decision, timesAsked: decision.timesAsked + 1 };
}

export async function storeDecision(
  question: string,
  decision: Omit<StoredDecision, "question" | "createdAt" | "timesAsked">
) {
  const key = normalizeQuestion(question);

  await adminDb.collection("decisions").doc(key).set({
    question,
    createdAt: new Date().toISOString(),
    timesAsked: 1,
    ...decision,
  });
}
