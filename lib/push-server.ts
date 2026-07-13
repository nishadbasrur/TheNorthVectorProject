import "server-only";
import { adminDb, adminMessaging } from "./firebase-admin";

// Next.js-app-side equivalent of functions/src/push.ts's sendPushNotification
// — same push_subscriptions collection and per-token-failure-tolerant
// pattern (app/api/v1/push/test/route.ts's own inline copy of this logic),
// but usable from lib/tool-dispatcher.ts, which runs in the Next.js app, not
// the Cloud Functions bundle. Never throws — delivery failure shouldn't
// block whatever Firestore write the caller already made.
// `data` is optional, plain string-to-string FCM data payload — used to
// carry a deep-link URL (see public/firebase-messaging-sw.js's
// notificationclick handler) without putting it in the visible notification
// body.
export async function sendPushNotification(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const subscriptions = await adminDb.collection("push_subscriptions").get();
  if (subscriptions.empty) return false;

  let sentCount = 0;
  for (const doc of subscriptions.docs) {
    const token = doc.data().token as string | undefined;
    if (!token) continue;

    try {
      await adminMessaging.send({ token, notification: { title, body }, ...(data ? { data } : {}) });
      sentCount += 1;
    } catch (error) {
      console.error(`[push-server] Push send failed for a registered device (doc ${doc.id}):`, error);
    }
  }

  return sentCount > 0;
}
