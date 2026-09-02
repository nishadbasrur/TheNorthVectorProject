import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { alreadyAlerted, recordAlert } from "./alert-state";
import { enqueueSpontaneousSpeech } from "../../lib/spontaneous-speech-queue";

// Dependency-free structural shape, not imported from lib/task-store.ts —
// same reasoning as lib/risk-engine.ts's RiskEvaluationTask and
// hourly-checkin-scan.ts's CheckinTask.
type ReminderTask = { title: string; status: string; dueDate?: string };

const HOUR_MS = 60 * 60 * 1000;

function hoursUntil(dateString: string): number {
  return (new Date(dateString).getTime() - Date.now()) / HOUR_MS;
}

// A task is "due soon" once it's within this many hours of its due date
// (and hasn't already passed it — see the overdue branch below, which is
// unbounded). Proposed default, trivial to retune.
const DUE_SOON_WINDOW_HOURS = 3;

export type TaskReminderScanResult = { tasksChecked: number; remindersSent: number };

// Trigger source #3 of always-on spontaneous speech (see
// app/api/v1/voice/spontaneous-stream/route.ts). Dedups per task+due-date
// via alert-state.ts (functions/src/alert-state.ts) so the same task
// doesn't re-remind every 30-minute tick — keyed on the due date too, not
// just the task id, so editing a task's due date after it already alerted
// produces a fresh reminder rather than staying silently suppressed.
export async function runTaskReminderScan(): Promise<TaskReminderScanResult> {
  const db = getFirestore();
  const tasksSnapshot = await db.collection("tasks").get();
  const tasks = tasksSnapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as ReminderTask) }))
    .filter((task) => task.status !== "completed" && task.status !== "cancelled" && task.dueDate);

  let remindersSent = 0;

  for (const task of tasks) {
    const hours = hoursUntil(task.dueDate!);
    const isOverdue = hours < 0;
    const isDueSoon = hours >= 0 && hours <= DUE_SOON_WINDOW_HOURS;
    if (!isOverdue && !isDueSoon) continue;

    const externalId = `${task.id}-${task.dueDate}`;
    if (await alreadyAlerted("task-reminder", externalId)) continue;

    const text = isOverdue
      ? `Heads up, sir — "${task.title}" is overdue.`
      : `Heads up, sir — "${task.title}" is due in about ${Math.max(1, Math.round(hours))} hour${Math.round(hours) === 1 ? "" : "s"}.`;

    await enqueueSpontaneousSpeech({ text, urgency: "routine", source: "task-reminder" });
    await recordAlert("task-reminder", externalId, task.title);
    remindersSent += 1;
  }

  logger.info(`[task-reminder-scan] Checked ${tasks.length} task(s), sent ${remindersSent} reminder(s).`);
  return { tasksChecked: tasks.length, remindersSent };
}
