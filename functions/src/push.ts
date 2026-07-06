import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { logger } from "firebase-functions";

// Resilience pattern mirrors email.ts: never throw, always return whether
// delivery succeeded, and let the caller decide what to do if it didn't —
// the underlying alert/alert_state Firestore write must never be lost just
// because notification delivery had a bad day.
export async function sendPushNotification(title: string, body: string): Promise<boolean> {
  const db = getFirestore();
  const subscriptions = await db.collection("push_subscriptions").get();

  if (subscriptions.empty) {
    logger.warn("No push_subscriptions registered — nothing to notify.");
    return false;
  }

  const messaging = getMessaging();
  let sentCount = 0;

  for (const doc of subscriptions.docs) {
    const token = doc.data().token as string | undefined;
    if (!token) continue;

    try {
      await messaging.send({ token, notification: { title, body } });
      sentCount += 1;
    } catch (error) {
      logger.error(`Push send failed for a registered device (doc ${doc.id})`, error);
    }
  }

  if (sentCount === 0) {
    logger.warn("Push notification did not reach any device.");
    return false;
  }

  return true;
}
