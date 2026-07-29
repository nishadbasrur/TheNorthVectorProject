import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Firestore state for weeklyRetrospectiveScan's Batch API submit/poll split
// — mirrors lib/opportunity-store.ts's singleton-doc "at most one
// outstanding batch" pattern. This job submits up to TWO requests in one
// batch (the retrospective itself, plus an optional memory-promotion pass
// — see functions/src/weekly-retrospective-scan.ts), distinguished by
// custom_id at poll time, so this also carries weekId (parseRetrospective
// needs it, and it isn't knowable from the batch result alone) and whether
// the memory-promotion request was actually included (skipped at submit
// time if there were no General/ entries to review that week).
//
// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime, same reasoning as lib/opportunity-store.ts.
function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

export type WeeklyRetrospectiveBatchState = {
  batchId: string;
  weekId: string;
  includesMemoryPromotion: boolean;
};

const SCAN_STATE_DOC = "weekly_retrospective_batch_state/current";

export async function recordBatchSubmission(state: WeeklyRetrospectiveBatchState): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(SCAN_STATE_DOC).set({
    ...state,
    status: "submitted",
    submittedAt: FieldValue.serverTimestamp(),
  });
}

export async function getPendingBatch(): Promise<WeeklyRetrospectiveBatchState | null> {
  ensureAdminApp();
  const db = getFirestore();
  const doc = await db.doc(SCAN_STATE_DOC).get();
  const data = doc.data();
  if (!data || data.status !== "submitted") return null;
  return {
    batchId: data.batchId,
    weekId: data.weekId,
    includesMemoryPromotion: data.includesMemoryPromotion === true,
  };
}

export async function markBatchProcessed(): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(SCAN_STATE_DOC).set(
    { status: "processed", processedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}
