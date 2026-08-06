// One-time migration: backfills `focusDate` (YYYY-MM-DD) onto every
// Firestore `tasks` document created before that field existed — see
// lib/task-store.ts's own comment on focusDate for what it means and why
// Today's Focus/the Previous Dates history view both key off it. Without
// this, every pre-existing task simply stops matching both views (its
// focusDate is undefined, which matches neither "today" nor any real
// past date), which would look like silent data loss even though nothing
// was actually deleted.
//
// Default is the task's own creation day, computed in the same
// America/New_York home-timezone convention as
// lib/task-store-admin.ts's todayFocusDateAdmin — the most honest
// available default (a task naturally "belongs" to the day it was
// created, absent any other signal), and lands each backfilled task
// under its real historical day in Previous Dates rather than dumping
// everything onto today.
//
// Safe to re-run: only ever touches docs where `focusDate` is currently
// missing, so a partial failure or a second run is a no-op for anything
// already backfilled.
//
// USAGE:
//   node --env-file=.env.local scripts/backfill-task-focus-date.mjs [--dry-run]
//
// Requires: FIREBASE_SERVICE_ACCOUNT_KEY.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DRY_RUN = process.argv.includes("--dry-run");
const FOCUS_TIME_ZONE = "America/New_York";
const FIRESTORE_BATCH_LIMIT = 500;

function focusDateFromCreatedAt(createdAt) {
  const date = createdAt ? new Date(createdAt) : new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FOCUS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // en-CA formats as YYYY-MM-DD
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const snapshot = await db.collection("tasks").get();
  const missing = snapshot.docs.filter((taskDoc) => !taskDoc.data().focusDate);

  if (missing.length === 0) {
    console.log("Every task already has a focusDate — nothing to do.");
    return;
  }

  console.log(`${missing.length} task(s) missing focusDate out of ${snapshot.size} total.`);

  const plan = missing.map((taskDoc) => ({
    id: taskDoc.id,
    title: taskDoc.data().title,
    focusDate: focusDateFromCreatedAt(taskDoc.data().createdAt),
  }));

  for (const item of plan) {
    console.log(`  [${item.id}] "${item.title}" -> focusDate ${item.focusDate}`);
  }

  if (DRY_RUN) {
    console.log("\n--dry-run: no writes performed.");
    return;
  }

  for (let i = 0; i < missing.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = missing.slice(i, i + FIRESTORE_BATCH_LIMIT);

    for (const taskDoc of chunk) {
      const focusDate = focusDateFromCreatedAt(taskDoc.data().createdAt);
      batch.update(taskDoc.ref, { focusDate });
    }

    await batch.commit();
    console.log(`Committed ${chunk.length} update(s).`);
  }

  console.log(`\nBackfilled focusDate on ${missing.length} task(s).`);
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exitCode = 1;
});
