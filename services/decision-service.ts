import { eq } from "drizzle-orm";
import { db } from "@/db";
import { decisions } from "@/db/schema";

export type CreateDecisionInput = {
  userId: string;
  projectId?: string | null;
  planId?: string | null;
  title: string;
  description?: string | null;
  rationale?: string | null;
  decisionDate?: string | null;
  status: string;
};

export type UpdateDecisionInput = Partial<Omit<CreateDecisionInput, "userId">>;

export async function createDecision(input: CreateDecisionInput) {
  const [decision] = await db.insert(decisions).values(input).returning();
  return decision;
}

export async function listDecisions(userId: string) {
  return db.select().from(decisions).where(eq(decisions.userId, userId));
}

export async function getDecisionById(decisionId: string) {
  const [decision] = await db.select().from(decisions).where(eq(decisions.id, decisionId)).limit(1);
  return decision ?? null;
}

export async function updateDecision(decisionId: string, input: UpdateDecisionInput) {
  const [decision] = await db.update(decisions).set({ ...input, updatedAt: new Date() }).where(eq(decisions.id, decisionId)).returning();
  return decision ?? null;
}

export async function supersedeDecision(decisionId: string) {
  return updateDecision(decisionId, { status: "superseded" });
}
