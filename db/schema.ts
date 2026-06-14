import { pgTable, text, timestamp, uuid, date } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  preferredName: text('preferred_name'),
  email: text('email').notNull(),
  timezone: text('timezone'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const memories = pgTable('memories', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  memoryType: text('memory_type').notNull(),
  reviewState: text('review_state').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull(),
  targetDate: date('target_date'),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull(),
});

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull(),
});

export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  status: text('status').notNull(),
});

export const approvals = pgTable('approvals', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  status: text('status').notNull(),
});

export const executions = pgTable('executions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  status: text('status').notNull(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  reviewType: text('review_type').notNull(),
  status: text('status').notNull(),
});