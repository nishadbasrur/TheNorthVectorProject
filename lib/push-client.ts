"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { app, auth, db } from "@/lib/firebase";

// The Web Push public key from Firebase Console → Project Settings → Cloud
// Messaging → Web Push certificates. Public by design (embedded in client
// JS), unlike the Calendar/Gmail/Notion credentials — not a secret.
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type PushEnableFailureReason = "unsupported" | "permission-denied" | "not-signed-in" | "error";

export type PushEnableResult =
  | { ok: true }
  | { ok: false; reason: PushEnableFailureReason; error?: string };

// Requests Notification permission, registers the FCM service worker,
// obtains a device token, and stores it in this owner's push_subscriptions
// collection (keyed by token itself, so re-enabling on the same device is
// idempotent rather than accumulating duplicate docs).
export async function enableUrgentAlerts(): Promise<PushEnableResult> {
  if (!(await isSupported())) {
    return { ok: false, reason: "unsupported" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "permission-denied" };
  }

  if (!auth.currentUser) {
    return { ok: false, reason: "not-signed-in" };
  }

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return { ok: false, reason: "error", error: "No token returned." };
    }

    await setDoc(doc(db, "push_subscriptions", token), {
      token,
      createdAt: new Date().toISOString(),
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "error", error: error instanceof Error ? error.message : "Unknown error" };
  }
}
