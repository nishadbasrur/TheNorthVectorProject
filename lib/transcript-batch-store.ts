import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

// Firestore state for the nightly Transcripts → General batch job — see
// North_Vector_Three_Tier_Memory_Pipeline_Plan.md and
// functions/src/transcript-batch-scan.ts. Mirrors lib/opportunity-store.ts's
// singleton-doc "at most one outstanding batch" pattern exactly, extended
// with two things opportunity-scan.ts didn't need: a lastRunAt watermark
// (opportunity-scan always re-runs the same static research query; this
// job needs "transcripts since when") and a requestMap (opportunity-scan
// submits exactly one request per batch; this job submits one request PER
// TRANSCRIPT, so poll needs to know which custom_id maps back to which
// source transcript filename to write it into the General note's
// original-transcript frontmatter field).
//
// Deliberately no "server-only" guard — shared between the Cloud Functions
// runtime only (this job has no Next.js-side reader, unlike
// lib/opportunity-store.ts which also backs a browse page), but kept
// guard-free for consistency with every other *-store.ts file shared with
// functions/, and in case a future admin/debug page wants to read it.
function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

const SCAN_STATE_DOC = "transcript_batch_state/current";

export type TranscriptBatchRequestMap = Record<string, string>; // custom_id -> transcript file name

export async function getLastRunAt(): Promise<Date> {
  ensureAdminApp();
  const db = getFirestore();
  const doc = await db.doc(SCAN_STATE_DOC).get();
  const data = doc.data();

  if (data?.lastRunAt instanceof Timestamp) {
    return data.lastRunAt.toDate();
  }

  // First-ever run — 24 hours back is a reasonable, bounded first window
  // (one night's worth of voice messages), not "since the beginning of
  // time," which could otherwise try to batch years of transcripts on the
  // very first tick if this job is deployed well after Transcripts/
  // capture already started.
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

export async function getPendingBatch(): Promise<{ batchId: string; requestMap: TranscriptBatchRequestMap } | null> {
  ensureAdminApp();
  const db = getFirestore();
  const doc = await db.doc(SCAN_STATE_DOC).get();
  const data = doc.data();
  if (!data || data.status !== "submitted") return null;
  return {
    batchId: data.batchId,
    requestMap: data.requestMap && typeof data.requestMap === "object" ? data.requestMap : {},
  };
}

// watermark is the NEW lastRunAt for next time — the moment this submit
// call decided what to include, not the moment processing finishes, so a
// slow-to-poll batch doesn't cause the next submit to skip a window.
export async function recordBatchSubmission(
  batchId: string,
  requestMap: TranscriptBatchRequestMap,
  watermark: Date
): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(SCAN_STATE_DOC).set({
    batchId,
    requestMap,
    status: "submitted",
    lastRunAt: Timestamp.fromDate(watermark),
    submittedAt: FieldValue.serverTimestamp(),
  });
}

export async function markBatchProcessed(): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(SCAN_STATE_DOC).set(
    { status: "processed", processedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}
