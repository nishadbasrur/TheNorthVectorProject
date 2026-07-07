import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";

function createAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccountKey)),
    });
  }

  // On Firebase App Hosting / Cloud Run, no explicit credential is needed —
  // the runtime's Application Default Credentials are used automatically.
  return initializeApp();
}

export const adminApp = createAdminApp();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminMessaging = getMessaging(adminApp);
