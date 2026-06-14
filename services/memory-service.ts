import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memories } from "@/db/schema";

export type CreateMemoryInput = {
  userId: string;
  title: string;
  content: string;
  memoryType: string;
  source?: string | null;
  confidenceScore?: string | null;
  reviewState: string;
};

export type UpdateMemoryInput = Partial<Omit<CreateMemoryInput, "userId">>;

export async function createMemory(input: CreateMemoryInput) {
  const [memory] = await db.insert(memories).values(input).returning();
  return memory;
}

export async function listMemories(userId: string) {
  return db.select().from(memories).where(eq(memories.userId, userId));
}

export async function getMemoryById(memoryId: string) {
  const [memory] = await db.select().from(memories).where(eq(memories.id, memoryId)).limit(1);
  return memory ?? null;
}

export async function updateMemory(memoryId: string, input: UpdateMemoryInput) {
  const [memory] = await db.update(memories).set({ ...input, updatedAt: new Date() }).where(eq(memories.id, memoryId)).returning();
  return memory ?? null;
}

export async function deprecateMemory(memoryId: string) {
  return updateMemory(memoryId, { reviewState: "deprecated" });
}
