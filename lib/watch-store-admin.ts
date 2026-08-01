// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/gmail-webhook.ts, via
// lib/gmail-watch-evaluator.ts, needs to read active watches on every
// real-time Gmail push), same reasoning as lib/action-log-store.ts.
// ensureFirebaseApp/getFirestore rather than lib/firebase-admin.ts's
// adminDb for the same cross-runtime reason lib/gmail-urgency.ts uses its
// own lazy init instead of importing that module directly.
import { getFirestore } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "./ensure-firebase-app";

// An ad-hoc watch North evaluates every new email against — see
// lib/gmail-watch-evaluator.ts for the actual matching logic.
// `criteria` is the matching rule fed verbatim into that evaluator's
// classification prompt; `description` is a short human/spoken label,
// distinct from criteria the same way a task's title is distinct from
// its description — shown back when listing, not used for matching.
export type WatchRecord = {
  id: string;
  criteria: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateWatchInput = { criteria: string; description: string };

export async function createWatchAsAdmin(input: CreateWatchInput): Promise<string> {
  ensureFirebaseApp();
  const db = getFirestore();
  const now = new Date().toISOString();

  const ref = await db.collection("watches").add({
    ...input,
    createdAt: now,
    updatedAt: now,
  });

  return ref.id;
}

// No "active" flag — a watch either exists or it's been stopped
// (deleteWatchAsAdmin below). Nothing in this feature asked for a
// pause/resume distinct from delete, so there's nothing to toggle.
export async function listWatchesAsAdmin(): Promise<WatchRecord[]> {
  ensureFirebaseApp();
  const db = getFirestore();
  const snapshot = await db.collection("watches").get();
  const watches = snapshot.docs.map((watchDoc) => ({ id: watchDoc.id, ...watchDoc.data() })) as WatchRecord[];

  return watches.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function deleteWatchAsAdmin(watchId: string): Promise<void> {
  ensureFirebaseApp();
  const db = getFirestore();
  await db.collection("watches").doc(watchId).delete();
}
