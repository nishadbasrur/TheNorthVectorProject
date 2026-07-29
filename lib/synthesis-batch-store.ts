import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Firestore state for synthesisScan's Batch API submit/poll split — mirrors
// lib/opportunity-store.ts's singleton-doc "at most one outstanding batch"
// pattern exactly. Also carries a small context summary (generatedAt +
// source counts) between submit and poll, since the full SynthesisContext
// (Gmail bodies, calendar events, etc.) is deliberately never persisted —
// lib/synthesis-store.ts's recordSynthesisRun only ever needed these counts,
// not the raw context, even before this moved to Batch.
//
// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime, same reasoning as lib/opportunity-store.ts.
function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

export type SynthesisContextSummary = {
  generatedAt: string; // ISO
  calendarEvents: number;
  inboxMessages: number;
  notionUrgentItems: number;
  activeTasks: number;
  activeGoals: number;
};

const SCAN_STATE_DOC = "synthesis_scan_state/current";

export async function recordBatchSubmission(
  batchId: string,
  contextSummary: SynthesisContextSummary
): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(SCAN_STATE_DOC).set({
    batchId,
    contextSummary,
    status: "submitted",
    submittedAt: FieldValue.serverTimestamp(),
  });
}

export async function getPendingBatch(): Promise<{ batchId: string; contextSummary: SynthesisContextSummary } | null> {
  ensureAdminApp();
  const db = getFirestore();
  const doc = await db.doc(SCAN_STATE_DOC).get();
  const data = doc.data();
  if (!data || data.status !== "submitted") return null;
  return { batchId: data.batchId, contextSummary: data.contextSummary };
}

export async function markBatchProcessed(): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(SCAN_STATE_DOC).set(
    { status: "processed", processedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}
