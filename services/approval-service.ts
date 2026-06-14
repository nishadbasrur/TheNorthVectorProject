import { eq } from "drizzle-orm";
import { db } from "@/db";
import { approvals } from "@/db/schema";

export type CreateApprovalInput = {
  userId: string;
  decisionId?: string | null;
  planId?: string | null;
  approvalType: string;
  requestSummary: string;
  status: string;
  expiresAt?: Date | null;
};

export type UpdateApprovalInput = Partial<Omit<CreateApprovalInput, "userId">> & {
  decidedAt?: Date | null;
};

export async function createApproval(input: CreateApprovalInput) {
  const [approval] = await db.insert(approvals).values(input).returning();
  return approval;
}

export async function listApprovals(userId: string) {
  return db.select().from(approvals).where(eq(approvals.userId, userId));
}

export async function getApprovalById(approvalId: string) {
  const [approval] = await db.select().from(approvals).where(eq(approvals.id, approvalId)).limit(1);
  return approval ?? null;
}

export async function updateApproval(approvalId: string, input: UpdateApprovalInput) {
  const [approval] = await db.update(approvals).set({ ...input, updatedAt: new Date() }).where(eq(approvals.id, approvalId)).returning();
  return approval ?? null;
}

export async function grantApproval(approvalId: string) {
  return updateApproval(approvalId, { status: "approved", decidedAt: new Date() });
}

export async function denyApproval(approvalId: string) {
  return updateApproval(approvalId, { status: "denied", decidedAt: new Date() });
}

export async function revokeApproval(approvalId: string) {
  return updateApproval(approvalId, { status: "revoked" });
}
