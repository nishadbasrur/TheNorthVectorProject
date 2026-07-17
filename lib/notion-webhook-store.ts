import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Deliberately no "server-only" guard — shared cross-runtime pattern, same
// reasoning as lib/calendar-watch-store.ts / lib/gmail-watch-store.ts.
function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

// Notion webhooks need no renewal/expiry the way Gmail/Calendar watches
// do — this just persists the one-time verification_token Notion sends
// when a subscription is first created (see functions/src/notion-webhook.ts),
// which then doubles as the HMAC secret for verifying every future event's
// X-Notion-Signature header. Written exactly once, at verification time.
const STATE_DOC = "notion_webhook_state/current";

export async function getNotionWebhookToken(): Promise<string | null> {
  ensureAdminApp();
  const db = getFirestore();
  const doc = await db.doc(STATE_DOC).get();
  const token = doc.data()?.verificationToken;
  return typeof token === "string" ? token : null;
}

export async function saveNotionWebhookToken(token: string): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.doc(STATE_DOC).set({ verificationToken: token });
}
