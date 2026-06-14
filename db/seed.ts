import { db } from "@/db";
import { goals, memories, projects, reviews, tasks, users } from "@/db/schema";

async function main() {
  const [user] = await db.insert(users).values({
    name: "Demo User",
    preferredName: "Demo",
    email: "demo@northvector.local",
    timezone: "America/New_York",
    status: "active",
  }).returning();

  await db.insert(memories).values({
    userId: user.id,
    title: "Prefers structured planning",
    content: "Demo user prefers clear plans, reviews, and direct next actions.",
    memoryType: "preference",
    reviewState: "confirmed",
  });

  const [goal] = await db.insert(goals).values({
    userId: user.id,
    title: "Build North Vector V1",
    description: "Create the first usable version of the personal operating system.",
    priority: "high",
    status: "active",
  }).returning();

  const [project] = await db.insert(projects).values({
    userId: user.id,
    title: "Core Operating Model",
    description: "Implement core records, dashboard, and review workflow.",
    priority: "high",
    status: "active",
  }).returning();

  await db.insert(tasks).values({
    userId: user.id,
    projectId: project.id,
    title: "Create first dashboard view",
    description: "Show active goals, projects, tasks, and reviews.",
    priority: "high",
    status: "scheduled",
  });

  await db.insert(reviews).values({
    userId: user.id,
    reviewType: "weekly",
    summary: `Initial seeded review for ${goal.title}.`,
    status: "scheduled",
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
