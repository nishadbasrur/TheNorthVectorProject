import { eq } from "drizzle-orm";
import { db } from "@/db";
import { plans } from "@/db/schema";

export type CreatePlanInput = {
  userId: string;
  projectId?: string | null;
  title: string;
  description?: string | null;
  planningHorizon?: string | null;
  status: string;
};

export type UpdatePlanInput = Partial<Omit<CreatePlanInput, "userId">>;

export async function createPlan(input: CreatePlanInput) {
  const [plan] = await db.insert(plans).values(input).returning();
  return plan;
}

export async function listPlans(userId: string) {
  return db.select().from(plans).where(eq(plans.userId, userId));
}

export async function getPlanById(planId: string) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  return plan ?? null;
}

export async function updatePlan(planId: string, input: UpdatePlanInput) {
  const [plan] = await db.update(plans).set({ ...input, updatedAt: new Date() }).where(eq(plans.id, planId)).returning();
  return plan ?? null;
}

export async function activatePlan(planId: string) {
  return updatePlan(planId, { status: "active" });
}

export async function archivePlan(planId: string) {
  return updatePlan(planId, { status: "archived" });
}
