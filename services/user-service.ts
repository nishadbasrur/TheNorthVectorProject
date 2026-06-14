import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type UpdateUserInput = {
  name?: string;
  preferredName?: string | null;
  email?: string;
  timezone?: string | null;
  status?: string;
};

export async function getUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

export async function updateUser(userId: string, input: UpdateUserInput) {
  const [user] = await db
    .update(users)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return user ?? null;
}
