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

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? "North Vector", {
    body: body ?? "",
    icon: "/icon-192.png",
  });
});
