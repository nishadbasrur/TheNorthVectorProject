import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { logger } from "firebase-functions";
import { recordAction } from "../../lib/action-log-store";

// Resilience pattern mirrors email.ts: never throw, always return whether
// delivery succeeded, and let the caller decide what to do if it didn't —
// the underlying alert/alert_state Firestore write must never be lost just
// because notification delivery had a bad day.
//
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
      await messaging.send({ token, data: { title, body, ...(link ? { link } : {}) } });
      sentCount += 1;
    } catch (error) {
      logger.error(`Push send failed for a registered device (doc ${doc.id})`, error);
    }
  }

  if (sentCount === 0) {
    logger.warn("Push notification did not reach any device.");
    return false;
  }

  // Choke-point action logging (see lib/action-log-store.ts) — every
  // autonomous push, from any scan, lands in the /activity feed without
  // instrumenting each individual caller. Fire-and-forget, same discipline
  // as tool-error logging: a logging failure must never affect delivery.
  void recordAction({
    kind: "push",
    title,
    body,
    toolName: null,
    outcome: null,
    sessionId: null,
  }).catch(() => {});

  return true;
}
