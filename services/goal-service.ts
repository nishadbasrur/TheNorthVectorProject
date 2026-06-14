import { eq } from "drizzle-orm";
import { db } from "@/db";
import { goals } from "@/db/schema";

export type CreateGoalInput = {
  userId: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  targetDate?: string | null;
  status: string;
};

export type UpdateGoalInput = Partial<Omit<CreateGoalInput, "userId">>;

export async function createGoal(input: CreateGoalInput) {
  const [goal] = await db.insert(goals).values(input).returning();
  return goal;
}

export async function listGoals(userId: string) {
  return db.select().from(goals).where(eq(goals.userId, userId));
}

export async function getGoalById(goalId: string) {
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  return goal ?? null;
}

export async function updateGoal(goalId: string, input: UpdateGoalInput) {
  const [goal] = await db.update(goals).set({ ...input, updatedAt: new Date() }).where(eq(goals.id, goalId)).returning();
  return goal ?? null;
}

export async function setGoalStatus(goalId: string, status: string) {
  return updateGoal(goalId, { status });
}
