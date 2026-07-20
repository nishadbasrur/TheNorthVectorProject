import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// Backs #96 (same question category asked repeatedly in a day) and #88
// (the same stated intent mentioned repeatedly without acting on it) — one
// shared "accumulate keyed occurrences, surface once past a threshold,
// never re-offer" substrate for both, distinguished only by `kind`. Doc id
// is deterministic (`${kind}:${key}`), same dedup-by-id precedent as
// lib/synthesis-store.ts's connectionKey.
export type RecurringSignalKind = "question_category" | "stated_intent";

export type RecurringSignal = {
  kind: RecurringSignalKind;
  key: string;
  label: string;
  count: number;
  windowDays: number;
  threshold: number;
  status: "accumulating" | "surfaced";
};

function docId(kind: RecurringSignalKind, key: string): string {
  return `${kind}:${key}`;
}

// Records one occurrence. Resets the count if the sliding window has
// elapsed since the first occurrence (an approximation of a real sliding
// window, same tradeoff lib/synthesis-store.ts's alreadySurfacedConnection
// makes with its flat 6h re-surface check, rather than tracking every
// individual occurrence timestamp). Once a key has been surfaced it's never
// re-offered — recordOccurrence becomes a no-op for it, which is the actual
// "name it once, non-naggy" mechanism for #88.
export async function recordOccurrence(
  kind: RecurringSignalKind,
  key: string,
  label: string,
  windowDays: number,
  threshold: number
): Promise<void> {
  const ref = adminDb.collection("recurring_signals").doc(docId(kind, key));
  const doc = await ref.get();

  if (!doc.exists) {
    await ref.set({
      kind,
      key,
      label,
      count: 1,
      firstOccurrenceAt: FieldValue.serverTimestamp(),
      lastOccurrenceAt: FieldValue.serverTimestamp(),
      windowDays,
      threshold,
      status: "accumulating",
    });
    return;
  }

  const data = doc.data() ?? {};
  if (data.status === "surfaced") return;

  const firstOccurrenceAt = data.firstOccurrenceAt as Timestamp | undefined;
  const windowElapsed =
    firstOccurrenceAt && Date.now() - firstOccurrenceAt.toMillis() > windowDays * 24 * 60 * 60 * 1000;

  if (windowElapsed) {
    await ref.set({
      kind,
      key,
      label,
      count: 1,
      firstOccurrenceAt: FieldValue.serverTimestamp(),
      lastOccurrenceAt: FieldValue.serverTimestamp(),
      windowDays,
      threshold,
      status: "accumulating",
    });
    return;
  }

  await ref.set(
    {
      label,
      count: FieldValue.increment(1),
      lastOccurrenceAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

// Backs lib/opener-selector.ts's #96/#88 candidate — the first
// still-accumulating signal of this kind that's crossed its threshold.
// Two equality filters only (kind, status) — no orderBy, so no composite
// index needed, same reasoning as functions/src/index.ts's onToolError
// dedup query. Threshold comparison happens client-side since it's a
// per-doc value, not a fixed constant to filter on server-side.
export async function getSurfaceableSignal(kind: RecurringSignalKind): Promise<RecurringSignal | null> {
  const snapshot = await adminDb
    .collection("recurring_signals")
    .where("kind", "==", kind)
    .where("status", "==", "accumulating")
    .get();

  const surfaceable = snapshot.docs
    .map((doc) => doc.data())
    .filter((data) => (data.count ?? 0) >= (data.threshold ?? Infinity));

  if (surfaceable.length === 0) return null;

  const chosen = surfaceable[0];
  return {
    kind: chosen.kind,
    key: chosen.key,
    label: chosen.label,
    count: chosen.count,
    windowDays: chosen.windowDays,
    threshold: chosen.threshold,
    status: chosen.status,
  };
}

export async function markSignalSurfaced(kind: RecurringSignalKind, key: string): Promise<void> {
  await adminDb.collection("recurring_signals").doc(docId(kind, key)).set({ status: "surfaced" }, { merge: true });
}
