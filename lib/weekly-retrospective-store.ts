// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/weekly-retrospective-scan.ts), same
// reasoning as lib/synthesis-store.ts.
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "./ensure-firebase-app";

export type WeeklyRetrospective = {
  weekId: string;
  summary: string;
  wins: string[];
  misses: string[];
  nextWeekSuggestion: string;
  // goalId -> progress at the time this retrospective ran — read back by
  // NEXT week's run to compute a real planned-vs-actual delta, not just a
  // current-state snapshot. The first-ever run has nothing to diff against
  // (see lib/weekly-retrospective-context.ts's priorGoalProgressSnapshot).
  goalProgressSnapshot: Record<string, number>;
};

// Sunday's date (America/New_York) the retrospective ran on, e.g.
// "2026-07-20" — deterministic doc id, same dedup-by-id precedent as
// lib/synthesis-store.ts's connectionKey, and simpler/safer than a
// hand-rolled ISO-8601 week-number calculation (which is genuinely easy to
// get off-by-one at year boundaries). "This week" and "last week" are both
// trivial to compute from a plain date.
export function weekIdFor(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function getRetrospective(weekId: string): Promise<WeeklyRetrospective | null> {
  ensureFirebaseApp();
  const db = getFirestore();

  const doc = await db.collection("weekly_retrospectives").doc(weekId).get();
  if (!doc.exists) return null;

  const data = doc.data() ?? {};
  return {
    weekId,
    summary: typeof data.summary === "string" ? data.summary : "",
    wins: Array.isArray(data.wins) ? data.wins : [],
    misses: Array.isArray(data.misses) ? data.misses : [],
    nextWeekSuggestion: typeof data.nextWeekSuggestion === "string" ? data.nextWeekSuggestion : "",
    goalProgressSnapshot:
      data.goalProgressSnapshot && typeof data.goalProgressSnapshot === "object" ? data.goalProgressSnapshot : {},
  };
}

// Backs the /weekly-review page — the most recently generated retrospective
// regardless of exact week, so the page shows something useful mid-week too,
// not just on the one day getRetrospective(weekIdFor(now)) would actually
// have a doc. Plain single-field orderBy, no composite index needed.
export async function getMostRecentRetrospective(): Promise<WeeklyRetrospective | null> {
  ensureFirebaseApp();
  const db = getFirestore();

  const snapshot = await db.collection("weekly_retrospectives").orderBy("generatedAt", "desc").limit(1).get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    weekId: doc.id,
    summary: typeof data.summary === "string" ? data.summary : "",
    wins: Array.isArray(data.wins) ? data.wins : [],
    misses: Array.isArray(data.misses) ? data.misses : [],
    nextWeekSuggestion: typeof data.nextWeekSuggestion === "string" ? data.nextWeekSuggestion : "",
    goalProgressSnapshot:
      data.goalProgressSnapshot && typeof data.goalProgressSnapshot === "object" ? data.goalProgressSnapshot : {},
  };
}

export async function saveRetrospective(retro: WeeklyRetrospective): Promise<void> {
  ensureFirebaseApp();
  const db = getFirestore();

  await db.collection("weekly_retrospectives").doc(retro.weekId).set({
    summary: retro.summary,
    wins: retro.wins,
    misses: retro.misses,
    nextWeekSuggestion: retro.nextWeekSuggestion,
    goalProgressSnapshot: retro.goalProgressSnapshot,
    generatedAt: FieldValue.serverTimestamp(),
  });
}
