// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/gmail-webhook.ts writes here on
// every watch match), same reasoning as lib/watch-store-admin.ts.
// ensureFirebaseApp/getFirestore rather than lib/firebase-admin.ts's
// adminDb, for the same cross-runtime reason that file uses its own lazy
// init instead of importing it directly.
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "./ensure-firebase-app";

// General-purpose notification record — every notification source (the
// existing Gmail watch match today; future scholarship-automation
// triggers) writes one of these FIRST, then sends the actual push
// referencing this doc's id as the deep-link target
// (/notifications/{id}) — see functions/src/gmail-webhook.ts. `type` is
// an open string, not a fixed union, deliberately: new producers add
// their own value without a change here, matching
// lib/capability-gap-store.ts's own "kind" field precedent.
export type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  summary: string;
  // Full detail payload — free text (may be markdown-ish), whatever the
  // producer thinks is worth showing on the expanded card. Not
  // structured further; producers that need to preserve real structure
  // (e.g. a full email body vs. a short reason) fold it into this string
  // themselves at write time, the same way lib/capability-gap-store.ts's
  // various `kind`s each format their own `request`/`capability` fields.
  detail: string;
  // Optional deep-link TARGET the card itself links out to — e.g. a
  // Drive folder URL for a scholarship essay. Distinct from the push
  // notification's own /notifications/{id} link, which always points
  // back to this card first; linkPath is where the card's own "open"
  // affordance goes from there. Null when a notification has nothing to
  // link out to beyond its own detail (e.g. a Gmail watch match).
  linkPath: string | null;
  read: boolean;
  createdAt: string | null;
};

export type CreateNotificationInput = {
  type: string;
  title: string;
  summary: string;
  detail: string;
  linkPath?: string;
};

export async function createNotification(input: CreateNotificationInput): Promise<string> {
  ensureFirebaseApp();
  const db = getFirestore();

  const ref = await db.collection("notifications").add({
    type: input.type,
    title: input.title,
    summary: input.summary,
    detail: input.detail,
    linkPath: input.linkPath ?? null,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return ref.id;
}

function parseNotification(id: string, data: FirebaseFirestore.DocumentData): NotificationRecord {
  return {
    id,
    type: typeof data.type === "string" ? data.type : "unknown",
    title: typeof data.title === "string" ? data.title : "",
    summary: typeof data.summary === "string" ? data.summary : "",
    detail: typeof data.detail === "string" ? data.detail : "",
    linkPath: typeof data.linkPath === "string" ? data.linkPath : null,
    read: data.read === true,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
  };
}

// Backs the /notifications list page — newest first, plain orderBy (no
// equality filter), so no composite index needed, same reasoning as
// lib/capability-gap-store.ts's getRecentCapabilityGaps.
export async function getRecentNotifications(maxResults = 50): Promise<NotificationRecord[]> {
  ensureFirebaseApp();
  const db = getFirestore();

  const snapshot = await db.collection("notifications").orderBy("createdAt", "desc").limit(maxResults).get();

  return snapshot.docs.map((doc) => parseNotification(doc.id, doc.data()));
}

export async function getNotification(id: string): Promise<NotificationRecord | null> {
  ensureFirebaseApp();
  const db = getFirestore();

  const doc = await db.collection("notifications").doc(id).get();
  if (!doc.exists) return null;

  return parseNotification(doc.id, doc.data() ?? {});
}

export async function markNotificationRead(id: string): Promise<void> {
  ensureFirebaseApp();
  const db = getFirestore();

  await db.collection("notifications").doc(id).set({ read: true }, { merge: true });
}
