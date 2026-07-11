import "server-only";
import { adminDb } from "./firebase-admin";
import type { CreateTaskInput } from "./task-store";

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
