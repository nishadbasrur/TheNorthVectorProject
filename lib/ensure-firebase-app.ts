// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime, same reasoning as lib/synthesis-context.ts.
// Idempotent, self-contained Firebase Admin app initialization for modules
// that must work in both the Next.js app (FIREBASE_SERVICE_ACCOUNT_KEY, per
// lib/firebase-admin.ts) and Cloud Functions (Application Default
// Credentials, per functions/src/index.ts) without depending on either of
// those environment-specific entry points directly.
import { cert, getApps, initializeApp } from "firebase-admin/app";

export function ensureFirebaseApp(): void {
  if (getApps().length) return;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
    return;
  }

  initializeApp();
}
