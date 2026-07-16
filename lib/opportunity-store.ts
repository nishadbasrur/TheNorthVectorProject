import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Deliberately no "server-only" guard — shared between the Next.js app
// (app/api/v1/opportunities' browse route) and the Cloud Functions runtime
// (functions/src/opportunity-scan.ts's bi-daily batch scan), same
// reasoning as lib/google-calendar-client.ts and lib/error-log-store.ts.
// Lazy admin-app init guarded by getApps().length so it's safe to call
// from either runtime regardless of init order.
function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

export interface OpportunityRecord {
  title: string;
  category: string;
  description: string;
  amount: string;
  deadline: string;
  eligibilitySummary: string;
  applyUrl: string;
}

export interface StoredOpportunity extends OpportunityRecord {
  id: string;
  dedupeKey: string;
  discoveredAt: string;
}

// Normalized-title dedup — good enough for "don't re-surface the same
// opportunity every scan," not meant to catch every near-duplicate (e.g. a
// listing renamed between scans would slip through). A stricter match is a
// reasonable future improvement, not needed for the foundation this is.
function dedupeKeyFor(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

// Returns only the candidates NOT already known — callers use this to
// decide what's actually new before saving or notifying.
export async function filterNewOpportunities(
  candidates: OpportunityRecord[]
): Promise<OpportunityRecord[]> {
  ensureAdminApp();
  const db = getFirestore();
  const snapshot = await db.collection("opportunities").select("dedupeKey").get();
  const known = new Set(snapshot.docs.map((doc) => doc.data().dedupeKey));
  return candidates.filter((c) => !known.has(dedupeKeyFor(c.title)));
}

export async function saveOpportunities(entries: OpportunityRecord[]): Promise<void> {
  if (entries.length === 0) return;
  ensureAdminApp();
  const db = getFirestore();
  const writeBatch = db.batch();
  const collection = db.collection("opportunities");

  for (const entry of entries) {
    const ref = collection.doc();
    writeBatch.set(ref, {
      ...entry,
      dedupeKey: dedupeKeyFor(entry.title),
      discoveredAt: FieldValue.serverTimestamp(),
    });
  }

  await writeBatch.commit();
}

// Backs the /opportunities browse page — most recently discovered first.
export async function getStoredOpportunities(maxResults = 50): Promise<StoredOpportunity[]> {
  ensureAdminApp();
  const db = getFirestore();
  const snapshot = await db
    .collection("opportunities")
    .orderBy("discoveredAt", "desc")
    .limit(maxResults)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: typeof data.title === "string" ? data.title : "",
      category: typeof data.category === "string" ? data.category : "",
      description: typeof data.description === "string" ? data.description : "",
      amount: typeof data.amount === "string" ? data.amount : "",
      deadline: typeof data.deadline === "string" ? data.deadline : "",
      eligibilitySummary: typeof data.eligibilitySummary === "string" ? data.eligibilitySummary : "",
      applyUrl: typeof data.applyUrl === "string" ? data.applyUrl : "",
      dedupeKey: typeof data.dedupeKey === "string" ? data.dedupeKey : "",
      discoveredAt: data.discoveredAt?.toDate ? data.discoveredAt.toDate().toISOString() : "",
    };
  });
}

// Tracks at most one outstanding Anthropic batch submission at a time — a
// singleton doc rather than a collection, since only one scan should ever
// be in-flight. Both opportunityScanSubmit (bi-daily) and
// opportunityScanPoll (every 30 min) check this before acting, so a slow
// batch can't cause overlapping submissions.
const SCAN_STATE_DOC = "opportunity_scan_state/current";

export async function recordBatchSubmission(batchId: string): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(SCAN_STATE_DOC).set({
    batchId,
    status: "submitted",
    submittedAt: FieldValue.serverTimestamp(),
  });
}

export async function getPendingBatch(): Promise<{ batchId: string } | null> {
  ensureAdminApp();
  const db = getFirestore();
  const doc = await db.doc(SCAN_STATE_DOC).get();
  const data = doc.data();
  if (!data || data.status !== "submitted") return null;
  return { batchId: data.batchId };
}

export async function markBatchProcessed(): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(SCAN_STATE_DOC).set(
    { status: "processed", processedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}
