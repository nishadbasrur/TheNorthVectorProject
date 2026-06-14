import { date, numeric, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  preferredName: text("preferred_name"),
  email: text("email").notNull().unique(),
  timezone: text("timezone"),
  status: text("status").notNull(),
  ...timestamps,
});

export const memories = pgTable("memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  memoryType: text("memory_type").notNull(),
  source: text("source"),
  confidenceScore: numeric("confidence_score"),
  reviewState: text("review_state").notNull(),
  ...timestamps,
});

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority"),
  targetDate: date("target_date"),
  status: text("status").notNull(),
  ...timestamps,
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority"),
  status: text("status").notNull(),
  startDate: date("start_date"),
  targetDate: date("target_date"),
  ...timestamps,
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  projectId: uuid("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  planningHorizon: text("planning_horizon"),
  status: text("status").notNull(),
  ...timestamps,
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  projectId: uuid("project_id").references(() => projects.id),
  planId: uuid("plan_id").references(() => plans.id),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: text("status").notNull(),
  ...timestamps,
});

export const decisions = pgTable("decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  projectId: uuid("project_id").references(() => projects.id),
  planId: uuid("plan_id").references(() => plans.id),
  title: text("title").notNull(),
  description: text("description"),
  rationale: text("rationale"),
  decisionDate: date("decision_date"),
  status: text("status").notNull(),
  ...timestamps,
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  decisionId: uuid("decision_id").references(() => decisions.id),
  planId: uuid("plan_id").references(() => plans.id),
  approvalType: text("approval_type").notNull(),
  requestSummary: text("request_summary").notNull(),
  status: text("status").notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  ...timestamps,
});

export const executions = pgTable("executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  taskId: uuid("task_id").references(() => tasks.id),
  planId: uuid("plan_id").references(() => plans.id),
  approvalId: uuid("approval_id").references(() => approvals.id),
  executionType: text("execution_type").notNull(),
  summary: text("summary").notNull(),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  outcome: text("outcome"),
  status: text("status").notNull(),
  ...timestamps,
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  reviewType: text("review_type").notNull(),
  summary: text("summary"),
  findings: text("findings"),
  recommendations: text("recommendations"),
  reviewDate: date("review_date"),
  status: text("status").notNull(),
  ...timestamps,
});

export const goalProjects = pgTable("goal_projects", {
  goalId: uuid("goal_id").notNull().references(() => goals.id),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.goalId, table.projectId] }),
}));

export const goalTasks = pgTable("goal_tasks", {
  goalId: uuid("goal_id").notNull().references(() => goals.id),
  taskId: uuid("task_id").notNull().references(() => tasks.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.goalId, table.taskId] }),
}));

export const goalPlans = pgTable("goal_plans", {
  goalId: uuid("goal_id").notNull().references(() => goals.id),
  planId: uuid("plan_id").notNull().references(() => plans.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.goalId, table.planId] }),
}));

export const memoryEntities = pgTable("memory_entities", {
  memoryId: uuid("memory_id").notNull().references(() => memories.id),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.memoryId, table.entityType, table.entityId] }),
}));

export const reviewEntities = pgTable("review_entities", {
  reviewId: uuid("review_id").notNull().references(() => reviews.id),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.reviewId, table.entityType, table.entityId] }),
}));
