import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";

export type CreateProjectInput = {
  userId: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  status: string;
  startDate?: string | null;
  targetDate?: string | null;
};

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, "userId">>;

export async function createProject(input: CreateProjectInput) {
  const [project] = await db.insert(projects).values(input).returning();
  return project;
}

export async function listProjects(userId: string) {
  return db.select().from(projects).where(eq(projects.userId, userId));
}

export async function getProjectById(projectId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return project ?? null;
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const [project] = await db.update(projects).set({ ...input, updatedAt: new Date() }).where(eq(projects.id, projectId)).returning();
  return project ?? null;
}

export async function setProjectStatus(projectId: string, status: string) {
  return updateProject(projectId, { status });
}
