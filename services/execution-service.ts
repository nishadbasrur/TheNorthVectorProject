import { eq } from "drizzle-orm";
import { db } from "@/db";
import { executions } from "@/db/schema";

export type CreateExecutionInput = {
  userId: string;
  taskId?: string | null;
  planId?: string | null;
  approvalId?: string | null;
  executionType: string;
  summary: string;
  executedAt?: Date | null;
  outcome?: string | null;
  status: string;
};

export type UpdateExecutionInput = Partial<Omit<CreateExecutionInput, "userId">>;

export async function createExecution(input: CreateExecutionInput) {
  const [execution] = await db.insert(executions).values(input).returning();
  return execution;
}

export async function listExecutions(userId: string) {
  return db.select().from(executions).where(eq(executions.userId, userId));
}

export async function getExecutionById(executionId: string) {
  const [execution] = await db.select().from(executions).where(eq(executions.id, executionId)).limit(1);
  return execution ?? null;
}

export async function updateExecution(executionId: string, input: UpdateExecutionInput) {
  const [execution] = await db.update(executions).set({ ...input, updatedAt: new Date() }).where(eq(executions.id, executionId)).returning();
  return execution ?? null;
}

export async function completeExecution(executionId: string, outcome?: string) {
  return updateExecution(executionId, { status: "completed", outcome, executedAt: new Date() });
}

export async function failExecution(executionId: string, outcome?: string) {
  return updateExecution(executionId, { status: "failed", outcome, executedAt: new Date() });
}
