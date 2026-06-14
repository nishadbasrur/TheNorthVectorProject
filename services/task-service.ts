import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";

export type CreateTaskInput = {
  userId: string;
  projectId?: string | null;
  planId?: string | null;
  title: string;
  description?: string | null;
  priority?: string | null;
  dueDate?: Date | null;
  status: string;
};

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, "userId">>;

export async function createTask(input: CreateTaskInput) {
  const [task] = await db.insert(tasks).values(input).returning();
  return task;
}

export async function listTasks(userId: string) {
  return db.select().from(tasks).where(eq(tasks.userId, userId));
}

export async function getTaskById(taskId: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return task ?? null;
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  const [task] = await db.update(tasks).set({ ...input, updatedAt: new Date() }).where(eq(tasks.id, taskId)).returning();
  return task ?? null;
}

export async function completeTask(taskId: string) {
  return updateTask(taskId, { status: "completed" });
}

export async function cancelTask(taskId: string) {
  return updateTask(taskId, { status: "cancelled" });
}
