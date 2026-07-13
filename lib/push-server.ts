import "server-only";
import { adminDb, adminMessaging } from "./firebase-admin";

// Next.js-app-side equivalent of functions/src/push.ts's sendPushNotification
// — same push_subscriptions collection and per-token-failure-tolerant
// pattern (app/api/v1/push/test/route.ts's own inline copy of this logic),
// but usable from lib/tool-dispatcher.ts, which runs in the Next.js app, not
// the Cloud Functions bundle. Never throws — delivery failure shouldn't
// block whatever Firestore write the caller already made.
// Deliberately a DATA-ONLY message (no top-level `notification` field) —
// when a message has both `notification` and `data`, some browsers/SDK
// paths auto-display the notification and handle its click themselves
// before public/firebase-messaging-sw.js's own onBackgroundMessage/
// notificationclick handlers run, silently dropping any custom link
// (confirmed live: a PR-ready notification opened the app but ignored its
// target URL). Data-only messages guarantee onBackgroundMessage always
// fires, so this app's own code — not the browser's default — controls
// both what's shown and what tapping it does.
export async function sendPushNotification(title: string, body: string, link?: string): Promise<boolean> {
  const subscriptions = await adminDb.collection("push_subscriptions").get();
  if (subscriptions.empty) return false;

  let sentCount = 0;
  for (const doc of subscriptions.docs) {
    const token = doc.data().token as string | undefined;
    if (!token) continue;

    try {
      await adminMessaging.send({ token, data: { title, body, ...(link ? { link } : {}) } });
      sentCount += 1;
    } catch (error) {
      console.error(`[push-server] Push send failed for a registered device (doc ${doc.id}):`, error);
    }
  }

  return sentCount > 0;
}
