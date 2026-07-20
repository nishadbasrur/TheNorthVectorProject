// Deliberately no "server-only" guard, no "@/" imports, no lib/task-store.ts
// or lib/goal-store.ts (client SDK) or lib/firebase-admin.ts (Next.js-only
// singleton) — shared with the esbuild-bundled Cloud Functions runtime
// (functions/src/weekly-retrospective-scan.ts), same self-contained
// constraint lib/synthesis-context.ts documents at the top of its own file.
import { getFirestore } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "./ensure-firebase-app";
import { getEventsInRange, type UpcomingEvent } from "./google-calendar-client";
import { getRetrospective, weekIdFor } from "./weekly-retrospective-store";

export type WeeklyTaskSummary = { id: string; title: string };
export type WeeklyGoalSummary = { id: string; title: string; progress: number };

export type WeeklyRetrospectiveContext = {
  weekId: string;
  weekStart: Date;
  weekEnd: Date;
  tasksCreated: WeeklyTaskSummary[];
  tasksCompleted: WeeklyTaskSummary[];
  tasksStillOpen: WeeklyTaskSummary[];
  calendarEventsThisWeek: UpcomingEvent[];
  activeGoals: WeeklyGoalSummary[];
  // null on the very first-ever run (nothing to diff against yet) — see
  // lib/weekly-retrospective-store.ts's goalProgressSnapshot for why this
  // self-corrects starting the second week.
  priorGoalProgressSnapshot: Record<string, number> | null;
};

// Pulls everything the reasoning pass in lib/weekly-retrospective-engine.ts
// needs to compare "what was planned" against "what actually happened" —
// same "gather everything in parallel, reason once" shape as
// lib/synthesis-context.ts's assembleSynthesisContext.
export async function assembleWeeklyRetrospectiveContext(): Promise<WeeklyRetrospectiveContext> {
  ensureFirebaseApp();
  const db = getFirestore();

  const weekEnd = new Date();
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekId = weekIdFor(weekEnd);
  const weekStartIso = weekStart.toISOString();

  const [tasksSnapshot, goalsSnapshot, calendarEventsThisWeek, priorRetro] = await Promise.all([
    db.collection("tasks").get(),
    db.collection("goals").get(),
    getEventsInRange(weekStart, weekEnd),
    getRetrospective(weekIdFor(weekStart)), // last week's saved doc, if any
  ]);

  const tasksCreated: WeeklyTaskSummary[] = [];
  const tasksCompleted: WeeklyTaskSummary[] = [];
  const tasksStillOpen: WeeklyTaskSummary[] = [];

  for (const doc of tasksSnapshot.docs) {
    const data = doc.data();
    const id = doc.id;
    const title = typeof data.title === "string" ? data.title : "(untitled task)";
    const status = typeof data.status === "string" ? data.status : "scheduled";
    const createdAt = typeof data.createdAt === "string" ? data.createdAt : "";
    const completedAt = typeof data.completedAt === "string" ? data.completedAt : null;

    if (createdAt >= weekStartIso) tasksCreated.push({ id, title });
    if (completedAt && completedAt >= weekStartIso) tasksCompleted.push({ id, title });
    if (status !== "completed" && status !== "cancelled") tasksStillOpen.push({ id, title });
  }

  const activeGoals: WeeklyGoalSummary[] = goalsSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: typeof data.title === "string" ? data.title : "(untitled goal)",
        status: typeof data.status === "string" ? data.status : "active",
        progress: typeof data.progress === "number" ? data.progress : 0,
      };
    })
    .filter((goal) => goal.status !== "completed" && goal.status !== "cancelled")
    .map(({ id, title, progress }) => ({ id, title, progress }));

  return {
    weekId,
    weekStart,
    weekEnd,
    tasksCreated,
    tasksCompleted,
    tasksStillOpen,
    calendarEventsThisWeek,
    activeGoals,
    priorGoalProgressSnapshot: priorRetro?.goalProgressSnapshot ?? null,
  };
}
