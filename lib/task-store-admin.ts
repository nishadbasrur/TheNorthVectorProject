import "server-only";
import { adminDb } from "./firebase-admin";
import type { CreateTaskInput, TaskRecord, TaskStatus } from "./task-store";

// Admin SDK counterpart to lib/task-store.ts's createTask, for server-only
// callers (lib/tool-dispatcher.ts). The client-SDK version is unauthenticated
// when run from a server route — same reasoning as
// lib/decision-memory-admin.ts's relationship to lib/decision-memory.ts.
export async function createTaskAsAdmin(input: CreateTaskInput): Promise<void> {
  const now = new Date().toISOString();

  const taskData: Record<string, unknown> = {
    ...input,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  Object.keys(taskData).forEach((key) => {
    if (taskData[key] === undefined) {
      delete taskData[key];
    }
  });

  await adminDb.collection("tasks").add(taskData);
}

// Same "home timezone, not server-local" convention as lib/task-store.ts's
// own TASK_FOCUS_TIME_ZONE (see that file's comment on why this is
// duplicated rather than imported — pulling a server module's default
// off a client-SDK module just for one constant isn't worth also
// dragging in that module's ./firebase client init). Exported so
// lib/tool-dispatcher.ts's create_task handler can default a task's
// focusDate to "today" the same way, server-side.
const TASK_FOCUS_TIME_ZONE = "America/New_York";

export function todayFocusDateAdmin(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TASK_FOCUS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // en-CA formats as YYYY-MM-DD
}

export type TaskListFilter = { focusDate?: string; status?: TaskStatus };

// Backs the list_tasks tool — the read access North was completely
// missing before this. Filters are plain equality .where() calls only
// (no .orderBy() alongside them) so this never needs a manually-
// provisioned Firestore composite index; sorting happens in JS instead,
// newest-created first, same ordering getTasks() already uses client-side.
export async function getTasksAsAdmin(filter: TaskListFilter = {}): Promise<TaskRecord[]> {
  let taskQuery: FirebaseFirestore.Query = adminDb.collection("tasks");
  if (filter.focusDate) taskQuery = taskQuery.where("focusDate", "==", filter.focusDate);
  if (filter.status) taskQuery = taskQuery.where("status", "==", filter.status);

  const snapshot = await taskQuery.get();
  const tasks = snapshot.docs.map((taskDoc) => ({ id: taskDoc.id, ...taskDoc.data() })) as TaskRecord[];

  return tasks.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export type TaskUpdateFields = Partial<Omit<TaskRecord, "id" | "createdAt" | "updatedAt" | "completedAt">>;

// Backs the update_task tool — arbitrary field edits, including marking
// complete/incomplete via `status`. completedAt is only touched when
// `status` is actually part of this particular update (so editing just
// a title, say, never clobbers it) — same completedAt-tracks-status
// behavior as lib/task-store.ts's own updateTaskStatus, generalized to
// cover any field.
export async function updateTaskAsAdmin(taskId: string, fields: TaskUpdateFields): Promise<void> {
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { ...fields, updatedAt: now };

  if (fields.status !== undefined) {
    updateData.completedAt = fields.status === "completed" ? now : null;
  }

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) delete updateData[key];
  });

  await adminDb.collection("tasks").doc(taskId).update(updateData);
}

// Backs the delete_task tool.
export async function deleteTaskAsAdmin(taskId: string): Promise<void> {
  await adminDb.collection("tasks").doc(taskId).delete();
}

// Backs the move_task_date tool — the explicit "move it to another day"
// action. A thin wrapper over updateTaskAsAdmin rather than its own
// Firestore call, so it gets the same updatedAt bookkeeping for free.
export async function moveTaskDateAsAdmin(taskId: string, newFocusDate: string): Promise<void> {
  await updateTaskAsAdmin(taskId, { focusDate: newFocusDate });
}
