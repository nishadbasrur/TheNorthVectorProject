import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { getUpcomingEvents } from "../../lib/google-calendar-client";
import { generateHourlyCheckinText } from "../../lib/checkin-briefing";
import { enqueueSpontaneousSpeech, isClientPresent } from "../../lib/spontaneous-speech-queue";

// Dependency-free structural shape, not imported from lib/task-store.ts
// (pulls in the client Firestore SDK) — same reasoning as
// lib/risk-engine.ts's RiskEvaluationTask. Reads Firestore directly via the
// Admin SDK, same as dailyRiskScan in index.ts, rather than
// lib/task-store-admin.ts (which has a "server-only" guard that blocks
// import from this esbuild-bundled Cloud Functions runtime).
type CheckinTask = { title: string; status: string; dueDate?: string };

const HOUR_MS = 60 * 60 * 1000;

// How near "near-term" means for deciding whether there's anything worth
// speaking up about this hour — matches the calendar fetch window below
// (getUpcomingEvents(24)) so a task and an event are held to the same bar.
// A task due next semester existing in Firestore shouldn't make every
// single hour "notable."
const NOTABLE_WINDOW_HOURS = 24;

export type HourlyCheckinScanResult =
  | { ranCheckin: true }
  | { ranCheckin: false; reason: string };

// Trigger source #2 of always-on spontaneous speech (see
// app/api/v1/voice/spontaneous-stream/route.ts). Two independent reasons
// this can be a no-op, both deliberate:
//   1. Skips entirely (does NOT queue a catch-up for later) whenever the
//      app's spontaneous-speech connection hasn't been seen recently — see
//      lib/spontaneous-speech-queue.ts's isClientPresent() for what that
//      actually proxies for (and its known limitations).
//   2. Skips entirely — no model call, nothing spoken — when there's
//      nothing near-term to report. An hourly "nothing to report" ping
//      would get old fast; this is meant to speak up only when there's
//      genuinely something worth saying, not to prove it's still running.
export async function runHourlyCheckinScan(): Promise<HourlyCheckinScanResult> {
  if (!(await isClientPresent())) {
    logger.info("[hourly-checkin-scan] Skipping — client not present (Mac asleep or app not running).");
    return { ranCheckin: false, reason: "client not present" };
  }

  const db = getFirestore();
  const tasksSnapshot = await db.collection("tasks").get();
  const tasks = tasksSnapshot.docs.map((doc) => doc.data()) as CheckinTask[];

  const nextTask = tasks
    .filter((task) => task.status !== "completed" && task.status !== "cancelled" && task.dueDate)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))[0];

  const upcomingEvents = await getUpcomingEvents(NOTABLE_WINDOW_HOURS);
  const nextEvent = upcomingEvents[0];

  const taskIsNearTerm =
    nextTask !== undefined && new Date(nextTask.dueDate!).getTime() - Date.now() <= NOTABLE_WINDOW_HOURS * HOUR_MS;

  if (!taskIsNearTerm && !nextEvent) {
    logger.info("[hourly-checkin-scan] Skipping — nothing near-term to report.");
    return { ranCheckin: false, reason: "nothing notable" };
  }

  const text = await generateHourlyCheckinText({
    now: new Date(),
    nextTaskDue: taskIsNearTerm ? { title: nextTask!.title, dueDate: nextTask!.dueDate! } : undefined,
    nextCalendarEvent: nextEvent ? { title: nextEvent.title, start: nextEvent.start } : undefined,
  });

  if (!text) {
    // Generation genuinely failed (API error/cap) — skip speaking rather
    // than fall back to a canned line that might contradict "there IS
    // something notable" (which we already confirmed above).
    logger.warn("[hourly-checkin-scan] Skipping — text generation failed.");
    return { ranCheckin: false, reason: "generation failed" };
  }

  await enqueueSpontaneousSpeech({ text, urgency: "routine", source: "hourly-checkin" });
  logger.info("[hourly-checkin-scan] Check-in enqueued.");
  return { ranCheckin: true };
}
