import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Deliberately no "server-only" guard — shared cross-runtime pattern (same
// reasoning as lib/google-calendar-client.ts, lib/opportunity-store.ts).
// Currently only read/written from the Cloud Functions runtime
// (functions/src/calendar-webhook.ts), but kept guard-free for consistency
// and in case a Next.js route ever needs to read watch status directly.
function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

// Single outstanding Calendar push-notification channel — a singleton doc,
// not a collection, since there's only ever one primary-calendar watch
// active at a time. channelToken is a random secret generated at
// registration and echoed back by Google on every webhook call
// (X-Goog-Channel-Token header) — Google doesn't sign these requests, so
// this token is the actual authentication boundary, not just the channel
// ID (which is a UUID, not secret).
export interface CalendarWatchState {
  channelId: string;
  resourceId: string;
  channelToken: string;
  syncToken: string | null;
  expiration: string; // ISO timestamp, as returned by Google's watch() call
}

const WATCH_STATE_DOC = "calendar_watch_state/current";

export async function getCalendarWatchState(): Promise<CalendarWatchState | null> {
  ensureAdminApp();
  const db = getFirestore();
  const doc = await db.doc(WATCH_STATE_DOC).get();
  const data = doc.data();
  if (!data) return null;
  return {
    channelId: data.channelId,
    resourceId: data.resourceId,
    channelToken: data.channelToken,
    syncToken: typeof data.syncToken === "string" ? data.syncToken : null,
    expiration: data.expiration,
  };
}

export async function saveCalendarWatchState(state: CalendarWatchState): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(WATCH_STATE_DOC).set({
    ...state,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function updateCalendarSyncToken(syncToken: string): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(WATCH_STATE_DOC).set({ syncToken }, { merge: true });
}
