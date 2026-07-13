"use client";

import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
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

// FCM's onBackgroundMessage (in public/firebase-messaging-sw.js) only fires
// when the app isn't focused — it does NOT cover the case where the PWA/tab
// is open and in the foreground at the moment a push arrives. For that case
// the app itself has to be listening and construct the notification itself;
// nothing shows up otherwise, which is exactly what produced a silent,
// never-appeared test push on a foregrounded Mac PWA.
let foregroundListenerRegistered = false;

async function registerForegroundListener(): Promise<void> {
  if (foregroundListenerRegistered) return;
  if (!(await isSupported())) return;

  const messaging = getMessaging(app);

  onMessage(messaging, (payload) => {
    const { title, body } = payload.notification ?? {};
    if (title) {
      const notification = new Notification(title, { body, icon: "/icon-192.png" });
      // Foreground counterpart to firebase-messaging-sw.js's
      // notificationclick handler — same "tap opens the PR" behavior when
      // the app happens to be focused when the push arrives.
      const url = payload.data?.url;
      if (url) {
        notification.onclick = () => window.open(url, "_blank");
      }
    }
  });

  foregroundListenerRegistered = true;
}

// Called once on app load (see components/auth/auth-gate.tsx) so a device
// that already granted permission on a previous visit keeps getting
// foreground pushes without needing to re-tap "Enable urgent alerts".
// No-op if permission was never granted — nothing to listen for yet.
export async function initForegroundPushListenerIfEnabled(): Promise<void> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  await registerForegroundListener();
}

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

    await registerForegroundListener();

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "error", error: error instanceof Error ? error.message : "Unknown error" };
  }
}
