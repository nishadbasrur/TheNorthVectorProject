import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Deliberately no "server-only" guard — shared cross-runtime, same
// reasoning as lib/calendar-watch-store.ts. Read/written from the Cloud
// Functions runtime (functions/src/gmail-webhook.ts).
function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

// Gmail's watch() has no separate channel/resource id the way Calendar
// does — historyId is both the delta cursor and, implicitly, the only
// state that identifies "the current watch." Singleton doc, one watch
// active at a time, same shape as calendar_watch_state.
export interface GmailWatchState {
  historyId: string;
  expiration: string; // epoch-ms string, as returned by Gmail's watch() call
}

const WATCH_STATE_DOC = "gmail_watch_state/current";

export async function getGmailWatchState(): Promise<GmailWatchState | null> {
  ensureAdminApp();
  const db = getFirestore();
  const doc = await db.doc(WATCH_STATE_DOC).get();
  const data = doc.data();
  if (!data) return null;
  return {
    historyId: data.historyId,
    expiration: data.expiration,
  };
}

export async function saveGmailWatchState(state: GmailWatchState): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(WATCH_STATE_DOC).set({
    ...state,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function updateGmailHistoryId(historyId: string): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(WATCH_STATE_DOC).set({ historyId }, { merge: true });
}
