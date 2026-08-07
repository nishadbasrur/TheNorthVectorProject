import { addDoc, collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export type TaskStatus = "scheduled" | "active" | "completed" | "paused" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskEnergy = "low" | "medium" | "high";
export type TaskDomain = "academic" | "career" | "health" | "personal" | "north-vector";

export type TaskRecord = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  energy: TaskEnergy;
  domain: TaskDomain;
  goalId?: string;
  projectId?: string;
  // The day this task is "locked to" for Today's Focus / the Previous
  // Dates history view — distinct from createdAt (a timestamp, never
  // changes) and dueDate (an external deadline, unrelated to which day's
  // focus list a task belongs on). Set once at creation (defaulting to
  // the creation day — see todayFocusDate below) and only ever changes
  // via an explicit move (see lib/task-store-admin.ts's
  // moveTaskDateAsAdmin). Today's Focus is just `focusDate ===
  // todayFocusDate()` — nothing rolls a task over at midnight; it simply
  // stops matching "today" once the calendar moves on, and starts
  // showing up under its own day in history instead.
  focusDate: string; // YYYY-MM-DD
  dueDate?: string;
  estimatedMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

// Same "home timezone, not server/browser-local" convention as
// lib/google-calendar-client.ts's EVENT_TIME_ZONE and
// app/api/v1/voice/respond/route.ts's PERSONA_TIME_ZONE — deliberately
// duplicated locally rather than imported from a shared constant (see
// those files' own comments on why this repo doesn't centralize it).
// Kept in sync with lib/task-store-admin.ts's own copy, used server-side
// to default a newly-created task's focusDate.
const TASK_FOCUS_TIME_ZONE = "America/New_York";

export function todayFocusDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TASK_FOCUS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // en-CA formats as YYYY-MM-DD
}

export type CreateTaskInput = Omit<TaskRecord, "id" | "createdAt" | "updatedAt" | "completedAt">;

export async function createTask(input: CreateTaskInput) {
  const now = new Date().toISOString();

  const taskData = {
    ...input,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  Object.keys(taskData).forEach((key) => {
    if (taskData[key as keyof typeof taskData] === undefined) {
      delete taskData[key as keyof typeof taskData];
    }
  });

  return addDoc(collection(db, "tasks"), taskData);
}


export async function getTasks() {
  const taskQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(taskQuery);

  return snapshot.docs.map((taskDoc) => ({
    id: taskDoc.id,
    ...taskDoc.data(),
  })) as TaskRecord[];
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const now = new Date().toISOString();

  return updateDoc(doc(db, "tasks", taskId), {
    status,
    updatedAt: now,
    completedAt: status === "completed" ? now : null,
  });
}
