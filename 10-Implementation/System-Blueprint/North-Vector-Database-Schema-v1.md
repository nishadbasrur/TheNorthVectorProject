# North Vector Database Schema v1.0

## Purpose

This document translates the North Vector Domain Model and ERD into an initial relational database schema.

It defines the first Postgres-oriented structure for the core North Vector platform.

This is still a design document, not a migration file.

---

# Schema Principles

The database schema should support:

- clear ownership by user
- durable long-term memory
- explicit goal and project tracking
- planning and task execution
- approval-gated actions
- review and reflection cycles
- future auditability
- future event-driven architecture

The schema should remain simple enough for V1 while leaving room for future expansion.

---

# Core Tables

## users

Represents the human being served by North Vector.

```sql
users (
  id uuid primary key,
  name text not null,
  preferred_name text,
  email text unique,
  timezone text,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended statuses:

```text
active
inactive
archived
```

---

## memories

Represents information Chief knows or believes about the user.

```sql
memories (
  id uuid primary key,
  user_id uuid not null references users(id),
  title text not null,
  content text not null,
  memory_type text not null,
  source text,
  confidence_score numeric,
  review_state text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended review states:

```text
candidate
inferred
confirmed
needs_review
deprecated
rejected
```

---

## goals

Represents long-term desired outcomes.

```sql
goals (
  id uuid primary key,
  user_id uuid not null references users(id),
  title text not null,
  description text,
  priority text,
  target_date date,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended statuses:

```text
scheduled
active
completed
paused
cancelled
```

---

## projects

Represents multi-step efforts that advance one or more goals.

```sql
projects (
  id uuid primary key,
  user_id uuid not null references users(id),
  title text not null,
  description text,
  priority text,
  status text not null,
  start_date date,
  target_date date,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended statuses:

```text
proposed
scheduled
active
on_hold
completed
cancelled
```

---

## tasks

Represents discrete actionable work.

```sql
tasks (
  id uuid primary key,
  user_id uuid not null references users(id),
  project_id uuid references projects(id),
  plan_id uuid references plans(id),
  title text not null,
  description text,
  priority text,
  due_date timestamptz,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended statuses:

```text
scheduled
not_started
in_progress
waiting
completed
cancelled
```

---

## plans

Represents structured paths from current state to desired outcome.

```sql
plans (
  id uuid primary key,
  user_id uuid not null references users(id),
  project_id uuid references projects(id),
  title text not null,
  description text,
  planning_horizon text,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended statuses:

```text
draft
active
completed
archived
```

---

## decisions

Represents meaningful choices and their rationale.

```sql
decisions (
  id uuid primary key,
  user_id uuid not null references users(id),
  project_id uuid references projects(id),
  plan_id uuid references plans(id),
  title text not null,
  description text,
  rationale text,
  decision_date date,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended statuses:

```text
proposed
approved
rejected
executed
superseded
```

---

## approvals

Represents explicit human authorization.

```sql
approvals (
  id uuid primary key,
  user_id uuid not null references users(id),
  decision_id uuid references decisions(id),
  plan_id uuid references plans(id),
  approval_type text not null,
  request_summary text not null,
  status text not null,
  requested_at timestamptz not null,
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended statuses:

```text
pending
approved
denied
expired
revoked
```

---

## executions

Represents actions taken by North Vector or the user.

```sql
executions (
  id uuid primary key,
  user_id uuid not null references users(id),
  task_id uuid references tasks(id),
  plan_id uuid references plans(id),
  approval_id uuid references approvals(id),
  execution_type text not null,
  summary text not null,
  executed_at timestamptz,
  outcome text,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended statuses:

```text
planned
authorized
executing
completed
failed
cancelled
```

---

## reviews

Represents structured reflection and evaluation.

```sql
reviews (
  id uuid primary key,
  user_id uuid not null references users(id),
  review_type text not null,
  summary text,
  findings text,
  recommendations text,
  review_date date,
  status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)
```

Recommended statuses:

```text
scheduled
in_progress
completed
archived
```

---

# Junction Tables

## goal_projects

Connects goals and projects.

```sql
goal_projects (
  goal_id uuid not null references goals(id),
  project_id uuid not null references projects(id),
  created_at timestamptz not null,
  primary key (goal_id, project_id)
)
```

---

## goal_tasks

Connects goals and tasks.

```sql
goal_tasks (
  goal_id uuid not null references goals(id),
  task_id uuid not null references tasks(id),
  created_at timestamptz not null,
  primary key (goal_id, task_id)
)
```

---

## goal_plans

Connects goals and plans.

```sql
goal_plans (
  goal_id uuid not null references goals(id),
  plan_id uuid not null references plans(id),
  created_at timestamptz not null,
  primary key (goal_id, plan_id)
)
```

---

## memory_entities

Allows memories to attach to multiple entity types.

```sql
memory_entities (
  memory_id uuid not null references memories(id),
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null,
  primary key (memory_id, entity_type, entity_id)
)
```

This table supports polymorphic references.

Supported entity types may include:

```text
goal
project
plan
decision
review
```

---

## review_entities

Allows reviews to evaluate multiple entity types.

```sql
review_entities (
  review_id uuid not null references reviews(id),
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null,
  primary key (review_id, entity_type, entity_id)
)
```

Supported entity types may include:

```text
goal
project
task
plan
decision
execution
```

---

# Recommended Indexes

```sql
create index idx_memories_user_id on memories(user_id);
create index idx_goals_user_id on goals(user_id);
create index idx_projects_user_id on projects(user_id);
create index idx_tasks_user_id on tasks(user_id);
create index idx_tasks_project_id on tasks(project_id);
create index idx_tasks_plan_id on tasks(plan_id);
create index idx_plans_user_id on plans(user_id);
create index idx_decisions_user_id on decisions(user_id);
create index idx_approvals_user_id on approvals(user_id);
create index idx_executions_user_id on executions(user_id);
create index idx_reviews_user_id on reviews(user_id);
```

Future indexes should be added based on query patterns.

---

# Notes on Polymorphic Relationships

The first schema uses polymorphic junction tables for memories and reviews.

This avoids creating many separate tables too early.

If these relationships become performance-sensitive or semantically complex, they may later be split into explicit tables such as:

```text
memory_goals
memory_projects
review_goals
review_projects
```

---

# Notes on Status Fields

Statuses are currently represented as text values.

This keeps the V1 schema flexible.

Future implementation may move statuses to:

- database enums
- application-level constants
- lookup tables

The decision should be made during implementation.

---

# Future Tables Not Yet Included

The following are intentionally excluded from V1 schema design:

- agents
- workflows
- workflow_runs
- audit_events
- domain_events
- integrations
- provider_accounts
- notifications
- documents
- files
- embeddings

These will be introduced in later schema iterations when required.

---

# Outcome

This schema defines the first concrete database shape for North Vector V1.

It provides a path from the Domain Model and ERD toward actual Postgres migrations, Drizzle schema definitions, backend services, and API routes.