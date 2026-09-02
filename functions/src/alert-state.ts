import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Extracted/generalized out of urgency-scan.ts (which originally had these
// as private local functions covering only "calendar" | "notion" |
// "back_to_back") — task-reminder-scan.ts and class-end-scan.ts need the
// exact same "have we already alerted on this external thing" dedup
// mechanic, and duplicating it a third time wasn't worth it. Behavior is
// unchanged from the original: alert_state doc ids are namespaced by
// source so ids from different sources (a Calendar event id, a Notion page
// id, a task id) can never collide.
export type AlertSource = "calendar" | "notion" | "back_to_back" | "task-reminder" | "class-end";

export function alertStateId(source: AlertSource, externalId: string): string {
  return `${source}-${externalId}`;
}

export async function alreadyAlerted(source: AlertSource, externalId: string): Promise<boolean> {
  const db = getFirestore();
  const doc = await db.collection("alert_state").doc(alertStateId(source, externalId)).get();
  return doc.exists;
}

export async function recordAlert(source: AlertSource, externalId: string, summary: string): Promise<void> {
  const db = getFirestore();

  await db.collection("alert_state").doc(alertStateId(source, externalId)).set({
    source,
    externalId,
    alertedAt: FieldValue.serverTimestamp(),
  });

  // Audit log — summary only, never raw source content (matters most for
  // Gmail, but kept consistent here too).
  await db.collection("alerts").add({
    source,
    summary,
    sentAt: FieldValue.serverTimestamp(),
  });
}
