// Firebase Cloud Messaging service worker — handles push delivery while the
// app isn't in the foreground. Must live at the origin root (not under a
// subpath) for the browser's push subscription scope to cover the whole app.
importScripts("https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js");

// Static public/ files can't read process.env or run through Next's env
// substitution, so these are hardcoded — same treatment apphosting.yaml
// already gives them (plain, non-secret values, not `secret:` references).
// They identify the Firebase project; they don't grant privileged access —
// that comes from Firestore/Auth rules, not from hiding these.
firebase.initializeApp({
  apiKey: "AIzaSyDvNHxEhbyXnm1Bk9da1mXHCsWB7wew9JE",
  authDomain: "the-north-vector-project.firebaseapp.com",
  projectId: "the-north-vector-project",
  storageBucket: "the-north-vector-project.firebasestorage.app",
  messagingSenderId: "1011959080844",
  appId: "1:1011959080844:web:9273e8b816e7831c35d8a9",
});

// Without these, a browser that already has an older version of this file
// active keeps running it — service workers only take over from a prior
// version once every tab/client controlled by the old one closes, which
// for an installed PWA that's rarely fully quit can mean "never." That's a
// real trap: a fix landing here doesn't help anyone still on the stale
// worker. skipWaiting + clients.claim force the new version to take over
// as soon as it's installed, on the very next push/click.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

const messaging = firebase.messaging();

// payload has no top-level `notification` field on purpose — see
// functions/src/push.ts's sendPushNotification for why (data-only messages
// are the only way to guarantee this handler — not the browser's own
// default notification/click behavior — is what actually runs).
messaging.onBackgroundMessage((payload) => {
  const { title, body, link } = payload.data ?? {};
  self.registration.showNotification(title ?? "North Vector", {
    body: body ?? "",
    icon: "/icon-192.png",
    data: { url: link },
  });
});

// Tapping a notification with a data.url (currently the capability-gap-
// logged and capability-draft-ready pings, see lib/capability-gap-store.ts
// and functions/src/index.ts's notifyCapabilityDraftReady) opens that URL
// — lands on the actual in-app review page, not just the app's default
// screen. Without this handler, tapping a background notification does
// nothing beyond the browser's own default (usually just focusing the
// origin, which is exactly the bug this replaced).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (!url) return;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
