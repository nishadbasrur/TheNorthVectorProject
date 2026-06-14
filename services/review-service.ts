import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";

export type CreateReviewInput = {
  userId: string;
  reviewType: string;
  summary?: string | null;
  findings?: string | null;
  recommendations?: string | null;
  reviewDate?: string | null;
  status: string;
};

export type UpdateReviewInput = Partial<Omit<CreateReviewInput, "userId">>;

export async function createReview(input: CreateReviewInput) {
  const [review] = await db.insert(reviews).values(input).returning();
  return review;
}

export async function listReviews(userId: string) {
  return db.select().from(reviews).where(eq(reviews.userId, userId));
}

export async function getReviewById(reviewId: string) {
  const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  return review ?? null;
}

export async function updateReview(reviewId: string, input: UpdateReviewInput) {
  const [review] = await db.update(reviews).set({ ...input, updatedAt: new Date() }).where(eq(reviews.id, reviewId)).returning();
  return review ?? null;
}

export async function completeReview(reviewId: string) {
  return updateReview(reviewId, { status: "completed" });
}

export async function archiveReview(reviewId: string) {
  return updateReview(reviewId, { status: "archived" });
}
