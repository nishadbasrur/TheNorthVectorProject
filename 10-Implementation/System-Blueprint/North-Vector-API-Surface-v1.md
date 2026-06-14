# North Vector API Surface v1.0

## Purpose

This document defines the first application API surface for North Vector V1.

It translates the Domain Model, ERD, and Database Schema into endpoint groups and service operations.

This is a design document, not implementation code.

---

# API Principles

North Vector APIs should be:

- resource-oriented
- predictable
- user-scoped
- permission-aware
- reviewable for important state changes
- simple enough for V1
- extensible enough for future Chief workflows

V1 should prioritize clarity over clever abstraction.

---

# Resource Groups

The V1 API is organized around the core domain objects:

- Users
- Memories
- Goals
- Projects
- Tasks
- Plans
- Decisions
- Approvals
- Executions
- Reviews

---

# Users API

## Get Current User

```http
GET /api/v1/me
```

Returns the current user's profile and basic account context.

## Update Current User

```http
PATCH /api/v1/me
```

Updates user profile fields such as preferred name or timezone.

---

# Memories API

## List Memories

```http
GET /api/v1/memories
```

Returns memories belonging to the user.

Common filters:

- memory_type
- review_state
- confidence_score

## Create Memory

```http
POST /api/v1/memories
```

Creates a new memory.

## Get Memory

```http
GET /api/v1/memories/{memory_id}
```

Returns a single memory.

## Update Memory

```http
PATCH /api/v1/memories/{memory_id}
```

Updates memory content, confidence, or review state.

## Remove or Deprecate Memory

```http
DELETE /api/v1/memories/{memory_id}
```

Removes or deprecates a memory depending on retention policy.

---

# Goals API

## List Goals

```http
GET /api/v1/goals
```

Returns user goals.

Common filters:

- status
- priority
- target_date

## Create Goal

```http
POST /api/v1/goals
```

Creates a new goal.

## Get Goal

```http
GET /api/v1/goals/{goal_id}
```

Returns goal details, including linked projects, plans, and tasks where appropriate.

## Update Goal

```http
PATCH /api/v1/goals/{goal_id}
```

Updates goal fields or status.

## Cancel or Archive Goal

```http
DELETE /api/v1/goals/{goal_id}
```

Cancels, archives, or removes a goal depending on retention policy.

---

# Projects API

## List Projects

```http
GET /api/v1/projects
```

Returns user projects.

Common filters:

- status
- priority
- goal_id

## Create Project

```http
POST /api/v1/projects
```

Creates a new project.

## Get Project

```http
GET /api/v1/projects/{project_id}
```

Returns project details, linked goals, tasks, plans, and decisions.

## Update Project

```http
PATCH /api/v1/projects/{project_id}
```

Updates project fields or status.

## Cancel or Archive Project

```http
DELETE /api/v1/projects/{project_id}
```

Cancels, archives, or removes a project depending on retention policy.

---

# Tasks API

## List Tasks

```http
GET /api/v1/tasks
```

Returns user tasks.

Common filters:

- status
- priority
- project_id
- plan_id
- due_date

## Create Task

```http
POST /api/v1/tasks
```

Creates a new task.

## Get Task

```http
GET /api/v1/tasks/{task_id}
```

Returns task details and related project, plan, goal, and activity context.

## Update Task

```http
PATCH /api/v1/tasks/{task_id}
```

Updates task fields or status.

## Mark Task Complete

```http
POST /api/v1/tasks/{task_id}/complete
```

Marks a task completed and may create an activity record.

## Cancel Task

```http
POST /api/v1/tasks/{task_id}/cancel
```

Cancels a task without deleting history.

---

# Plans API

## List Plans

```http
GET /api/v1/plans
```

Returns plans.

Common filters:

- status
- planning_horizon
- goal_id
- project_id

## Create Plan

```http
POST /api/v1/plans
```

Creates a structured plan.

## Get Plan

```http
GET /api/v1/plans/{plan_id}
```

Returns plan details and contained tasks.

## Update Plan

```http
PATCH /api/v1/plans/{plan_id}
```

Updates plan fields or status.

## Activate Plan

```http
POST /api/v1/plans/{plan_id}/activate
```

Moves a plan from draft to active.

## Archive Plan

```http
POST /api/v1/plans/{plan_id}/archive
```

Archives a completed or inactive plan.

---

# Decisions API

## List Decisions

```http
GET /api/v1/decisions
```

Returns important decisions.

Common filters:

- status
- project_id
- plan_id

## Create Decision

```http
POST /api/v1/decisions
```

Creates a decision record with rationale.

## Get Decision

```http
GET /api/v1/decisions/{decision_id}
```

Returns decision details and related review records.

## Update Decision

```http
PATCH /api/v1/decisions/{decision_id}
```

Updates decision metadata, rationale, or status.

## Supersede Decision

```http
POST /api/v1/decisions/{decision_id}/supersede
```

Marks a decision as replaced by a newer decision.

---

# Approvals API

## List Approvals

```http
GET /api/v1/approvals
```

Returns approval requests.

Common filters:

- status
- approval_type
- decision_id
- plan_id

## Create Approval Request

```http
POST /api/v1/approvals
```

Creates an approval request for an important change or action.

## Get Approval

```http
GET /api/v1/approvals/{approval_id}
```

Returns approval details.

## Grant Approval

```http
POST /api/v1/approvals/{approval_id}/grant
```

Grants the requested approval.

## Deny Approval

```http
POST /api/v1/approvals/{approval_id}/deny
```

Denies the requested approval.

## Revoke Approval

```http
POST /api/v1/approvals/{approval_id}/revoke
```

Revokes a previously granted approval when still applicable.

---

# Executions API

## List Executions

```http
GET /api/v1/executions
```

Returns execution records.

Common filters:

- status
- execution_type
- task_id
- plan_id
- approval_id

## Create Execution Record

```http
POST /api/v1/executions
```

Creates a record of an action or activity.

## Get Execution

```http
GET /api/v1/executions/{execution_id}
```

Returns execution details and outcome.

## Update Execution Status

```http
PATCH /api/v1/executions/{execution_id}
```

Updates execution status or outcome.

---

# Reviews API

## List Reviews

```http
GET /api/v1/reviews
```

Returns scheduled and completed reviews.

Common filters:

- review_type
- status
- review_date

## Create Review

```http
POST /api/v1/reviews
```

Creates a review record.

## Get Review

```http
GET /api/v1/reviews/{review_id}
```

Returns review details, findings, recommendations, and evaluated entities.

## Update Review

```http
PATCH /api/v1/reviews/{review_id}
```

Updates review findings, recommendations, or status.

## Complete Review

```http
POST /api/v1/reviews/{review_id}/complete
```

Marks review completed.

---

# Relationship APIs

## Link Goal to Project

```http
POST /api/v1/goals/{goal_id}/projects/{project_id}
```

Associates a project with a goal.

## Unlink Goal from Project

```http
DELETE /api/v1/goals/{goal_id}/projects/{project_id}
```

Removes a goal-project association.

## Link Goal to Task

```http
POST /api/v1/goals/{goal_id}/tasks/{task_id}
```

Associates a task with a goal.

## Link Goal to Plan

```http
POST /api/v1/goals/{goal_id}/plans/{plan_id}
```

Associates a plan with a goal.

## Link Memory to Entity

```http
POST /api/v1/memories/{memory_id}/links
```

Links a memory to another entity using entity_type and entity_id.

## Link Review to Entity

```http
POST /api/v1/reviews/{review_id}/links
```

Links a review to an evaluated entity using entity_type and entity_id.

---

# Chief-Facing V1 Endpoints

These are product-level endpoints for structured operating views.

They do not perform autonomous external actions.

## Dashboard Summary

```http
GET /api/v1/chief/dashboard
```

Returns the current situational overview:

- active goals
- active projects
- upcoming tasks
- pending approvals
- scheduled reviews
- high-priority items

## Weekly Review Draft

```http
POST /api/v1/chief/weekly-review-draft
```

Generates a draft weekly review from existing goals, projects, tasks, decisions, and execution records.

## Planning Context

```http
GET /api/v1/chief/planning-context
```

Returns structured context for planning workflows.

---

# Access Notes

All endpoints must be scoped to the authenticated user.

A user must not access another user's records.

Important state-changing endpoints should be permission-checked and reviewable.

Examples include:

- granting approval
- revoking approval
- creating execution records
- removing or deprecating memory
- cancelling major goals or projects

---

# V1 Exclusions

The V1 API intentionally excludes:

- autonomous external action
- external calendar writes
- email sending
- third-party integrations
- payment systems
- multi-user delegation
- organization accounts
- advanced event stream APIs

These should be introduced after the core operating model is stable.

---

# Outcome

This API Surface defines the first application boundary for North Vector V1.

It provides a path from the database schema toward backend services, frontend screens, Chief workflows, and implementation tickets.