// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (reachable via lib/capability-gap-store.ts's
// logMemoryPromotionProposal, called from lib/memory-promotion-engine.ts,
// called from functions/src/weekly-retrospective-scan.ts), same reasoning
// as lib/google-calendar-client.ts and lib/opportunity-store.ts. getApps()
// guard below already makes this safe to share — it reuses whatever app
// Cloud Functions' own firebase-admin/app init already created rather than
// double-initializing.
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
