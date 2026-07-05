# North Vector Implementation Tickets v1.0

## Status

**Partially superseded as of 2026-07-03.** Phase 2 (NV-004 through NV-008) describes PostgreSQL/Drizzle work that was never completed as specified — Postgres was deleted before real migrations existed. Phase 3 and Phase 4 tickets (NV-009 through NV-025) each bundle multiple entities together; within each, `goals`/`projects`/`tasks`/`decisions` work has real Firestore-backed equivalents (though not "Services" in the originally designed shape — see notes inline), while `memories`/`plans`/`approvals`/`executions`/`reviews` work was never started in any form. Notes are added inline per ticket rather than rewriting them, so it's clear which specific part of each bundled ticket is stale. See `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`.

## Purpose

This document breaks the North Vector V1 Build Plan into concrete implementation tickets.

These tickets are intended to be executed sequentially.

The goal is to move North Vector from architecture into working software without losing the structure defined by the Constitution, ADRs, Domain Model, ERD, Database Schema, API Surface, and V1 Build Plan.

---

# Ticket Format

Each ticket includes:

- objective
- scope
- deliverable
- acceptance criteria

---

# Phase 1: Project Infrastructure

## NV-001: Confirm Application Stack

Objective:

Decide and document the core application stack.

Scope:

- frontend framework
- backend framework
- database
- ORM or query layer
- package manager
- deployment target if known

Deliverable:

A short implementation note confirming the stack.

Acceptance Criteria:

- stack choices are documented
- choices align with existing ADRs
- no major implementation begins before this is settled

---

## NV-002: Create Runnable App Skeleton

Objective:

Create a local runnable application foundation.

Scope:

- initialize application structure
- configure TypeScript
- configure package scripts
- create basic home route
- create basic health route if applicable

Deliverable:

A local app that runs successfully.

Acceptance Criteria:

- app starts locally
- TypeScript compiles
- basic route renders or responds

---

## NV-003: Configure Environment Management

Objective:

Set up environment configuration.

Scope:

- create environment variable template
- document required variables
- avoid committing secrets
- configure local development values

Deliverable:

Environment configuration files and documentation.

Acceptance Criteria:

- required variables are documented
- missing required variables fail clearly
- secrets are not committed

---

# Phase 2: Database Implementation

**Superseded.** None of NV-004 through NV-008 happened as specified — PostgreSQL was deleted before real migrations existed. What actually happened instead: `lib/firebase.ts` (client SDK) and `lib/firebase-admin.ts` (Admin SDK, trusted server code) initialize a connection to Firestore, with no separate migration step since Firestore has no migration framework. See `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md` and the "Actual Firestore Shape" section of `10-Implementation/System-Blueprint/North-Vector-Database-Schema-v1.md`.

## NV-004: Configure Database Connection

Objective:

Connect the application to Postgres.

Scope:

- database connection module
- local database instructions
- connection validation

Deliverable:

Working database connection.

Acceptance Criteria:

- app can connect to local database
- failed connection produces clear error

---

## NV-005: Configure Migration Tooling

Objective:

Set up schema migration workflow.

Scope:

- migration command
- migration folder
- local migration workflow

Deliverable:

Migration tooling ready for schema creation.

Acceptance Criteria:

- migrations can be generated or written
- migrations can be applied locally
- migration instructions are documented

---

## NV-006: Implement Core Tables

Objective:

Create the main V1 database tables.

Scope:

- users — not implemented; identity is Firebase Auth, not an app-owned collection (ADR-0102)
- memories — not started, no Firestore collection exists
- goals — done, as a `goals` Firestore collection (`lib/goal-store.ts`), not a migrated table
- projects — done, as a `projects` Firestore collection (`lib/project-store.ts`)
- tasks — done, as a `tasks` Firestore collection (`lib/task-store.ts`)
- plans — not started, no Firestore collection exists
- decisions — done, as a `decisions` Firestore collection with deterministic document IDs (`lib/decision-memory.ts`), a different pattern from goals/projects/tasks — see the Database Schema doc
- approvals — not started
- executions — not started
- reviews — not started

Deliverable:

Database migration for core tables. **Superseded** for the four entities that exist — there is no migration, since Firestore collections come into existence on first write. See the "Actual Firestore Shape" section of `10-Implementation/System-Blueprint/North-Vector-Database-Schema-v1.md`.

Acceptance Criteria (as originally written, not all met):

- all core tables exist — false; 4 of 10 have a Firestore equivalent, 6 were never built
- primary keys exist — Firestore document IDs serve this role for the 4 that exist
- user ownership is represented — not per-document; enforced instead at the Firestore Security Rules layer for the whole database (single-user)
- status fields exist — true for the 4 that exist
- timestamp fields exist — true for the 4 that exist, though inconsistently: `createdAt`/`updatedAt` are client-set ISO strings on tasks/goals/projects/decisions, not Firestore's `serverTimestamp()` (contrast with the `daily-runs` collection, added later, which does use `serverTimestamp()` deliberately)

---

## NV-007: Implement Junction Tables

Objective:

Create many-to-many relationship tables.

Scope:

- goal_projects
- goal_tasks
- goal_plans
- memory_entities
- review_entities

Deliverable:

Database migration for junction tables.

**Superseded — none of this exists.** Firestore has no equivalent implemented. Where a relationship exists at all in the real data (`goalId` on `tasks` and `projects`), it's a plain unvalidated string field, not a table, not enforced, not queryable in reverse without a collection scan. See "Relationships and Junction Tables in Firestore" in `10-Implementation/System-Blueprint/North-Vector-Database-Schema-v1.md`.

Acceptance Criteria:

- junction tables exist — false
- composite primary keys exist where appropriate — not applicable
- foreign keys exist where possible — not applicable; Firestore has no foreign key concept

---

## NV-008: Add Initial Indexes

Objective:

Add basic indexes for common query paths.

Scope:

- user_id indexes
- project_id indexes
- plan_id indexes
- status indexes where useful

Deliverable:

Index migration. **Superseded** — Firestore auto-indexes single fields; composite indexes are declared in `firestore.indexes.json`, which doesn't exist yet. Every current query (`getTasks`, `getGoals`, `getProjects`, `getDecisions`) is a single `orderBy("createdAt", "desc")` with no additional filter, so this hasn't been a real constraint.

Acceptance Criteria:

- common list queries have supporting indexes — true by default so far, no composite index has been needed
- indexes match Database Schema v1.0 recommendations — not applicable; those recommendations were SQL-specific

---

# Phase 3: Core Services

**Partially superseded.** `goals`/`projects`/`tasks`/`decisions` have working equivalents, but not as "Service" classes — they're Firestore store modules (`lib/goal-store.ts`, `lib/project-store.ts`, `lib/task-store.ts`, `lib/decision-memory.ts`) called directly from pages and API routes, with no repository/service abstraction layer in between (see ADR-0101's "Decision" section). `user`/`memory`/`plan`/`approval`/`execution`/`review` services were never built, in either the originally planned form or a Firestore-adapted one. Note also: Drizzle-backed `services/*.ts` files (a distinct, now-deleted implementation attempt from partway through the project, separate from both this original plan and the current Firestore stores) briefly existed for several of these entities before being deleted — `decision-service.ts` and `approval-service.ts` had zero real callers by the time they were removed.

## NV-009: Implement User Service

## NV-009: Implement User Service

**Status: not started.** No UserService or equivalent exists; identity is Firebase Auth only (ADR-0102).

Objective:

Create service operations for the current user.

Scope:

- get current user
- update profile fields

Deliverable:

UserService.

Acceptance Criteria:

- user can be fetched
- user profile can be updated

---

## NV-010: Implement Memory Service

**Status: not started.** No MemoryService, no Firestore collection. `lib/memory-store.ts` exists as a minimal, separate scaffold (`createMemory(content)`/`getMemories()`) but is not wired to any route and doesn't implement review states as scoped here.

Objective:

Create service operations for memories.

Scope:

- create memory
- list memories
- get memory
- update memory
- deprecate or remove memory

Deliverable:

MemoryService.

Acceptance Criteria:

- CRUD operations work
- review states are supported
- memories are user-scoped

---

## NV-011: Implement Goal Service

**Status: done, different shape.** `lib/goal-store.ts` — a Firestore store module (`createGoal`, `getGoals`, `updateGoalStatus`), not a `GoalService` class. Status set is also different from what's scoped here: `active | completed | paused | cancelled` (no `scheduled`), plus a `horizon` field (`now | mid | long`) not mentioned in this ticket.

Objective:

Create service operations for goals.

Scope:

- create goal
- list goals
- get goal
- update goal
- status transitions

Deliverable:

GoalService.

Acceptance Criteria:

- scheduled goals are supported
- active goals are supported
- completed, paused, and cancelled states are supported

---

## NV-012: Implement Project Service

**Status: done, different shape.** `lib/project-store.ts` — Firestore store module, not a class. Status set: `planning | active | completed | paused | cancelled` (no `proposed`/`on_hold` as scoped here). Linked to goals via an unvalidated `goalId` string field.

Objective:

Create service operations for projects.

Scope:

- create project
- list projects
- get project
- update project
- status transitions

Deliverable:

ProjectService.

Acceptance Criteria:

- proposed, scheduled, active, on hold, completed, and cancelled states are supported
- projects can be linked to goals

---

## NV-013: Implement Task Service

**Status: done, different shape.** `lib/task-store.ts` — Firestore store module, not a class. Status set: `scheduled | active | completed | paused | cancelled` (not `scheduled | not_started | in_progress | waiting | completed | cancelled` as scoped here). Tasks link to goals and projects via unvalidated string fields; plans don't exist, so the "belong to... plans" criterion doesn't apply.

Objective:

Create service operations for tasks.

Scope:

- create task
- list tasks
- get task
- update task
- complete task
- cancel task

Deliverable:

TaskService.

Acceptance Criteria:

- scheduled, not started, in progress, waiting, completed, and cancelled states are supported
- tasks can belong to projects and plans

---

## NV-014: Implement Plan Service

**Status: not started.** No PlanService, no Firestore collection.

Objective:

Create service operations for plans.

Scope:

- create plan
- list plans
- get plan
- update plan
- activate plan
- archive plan

Deliverable:

PlanService.

Acceptance Criteria:

- draft, active, completed, and archived states are supported
- plans can contain tasks

---

## NV-015: Implement Decision Service

**Status: done, materially different shape.** `lib/decision-memory.ts` — not a CRUD service. Decisions are keyed by a normalized version of the question text (deterministic document ID), not a generated ID, specifically so repeat questions resolve to the same document; there's a `timesAsked` counter instead of update/supersede operations. This ticket's scoped operations (update, supersede) don't exist. Also powers `lib/decision-engine.ts`, a separate rule-based recommendation engine not scoped in this ticket at all.

Objective:

Create service operations for decision records.

Scope:

- create decision
- list decisions
- get decision
- update decision
- supersede decision

Deliverable:

DecisionService.

Acceptance Criteria:

- rationale is preserved
- decisions can be linked to projects and plans

---

## NV-016: Implement Approval Service

**Status: not started.** No ApprovalService, no Firestore collection.

Objective:

Create service operations for approvals.

Scope:

- create approval request
- list approvals
- get approval
- grant approval
- deny approval
- revoke approval

Deliverable:

ApprovalService.

Acceptance Criteria:

- approval states are enforced
- granted, denied, expired, and revoked states are represented

---

## NV-017: Implement Execution Service

**Status: not started.** No ExecutionService, no Firestore collection.

Objective:

Create service operations for execution records.

Scope:

- create execution record
- list executions
- get execution
- update execution status

Deliverable:

ExecutionService.

Acceptance Criteria:

- executions can link to tasks, plans, and approvals
- execution outcomes can be recorded

---

## NV-018: Implement Review Service

**Status: not started.** No ReviewService, no Firestore collection.

Objective:

Create service operations for reviews.

Scope:

- create review
- list reviews
- get review
- update review
- complete review

Deliverable:

ReviewService.

Acceptance Criteria:

- scheduled, in progress, completed, and archived states are supported
- reviews can link to evaluated entities

---

# Phase 4: API Routes

## NV-019: Implement User API Routes

**Status: stubbed, not implemented.** `GET /api/v1/me` and `PATCH /api/v1/me` exist as routes but return `501 Not Implemented` — they depended on the deleted `services/user-service.ts` and were stubbed rather than rewired, since there's no Firestore `users` collection to rewire them to (ADR-0102: identity is Firebase Auth, not an app-owned user record).

Objective:

Expose current-user API routes.

Scope:

- GET /api/v1/me
- PATCH /api/v1/me

Deliverable:

User API routes.

Acceptance Criteria:

- routes call UserService
- responses are user-scoped

---

## NV-020: Implement Memory API Routes

**Status: stubbed, not implemented.** `GET /api/v1/memories` returns `200 { items: [] }` (always empty); `POST` returns `501 Not Implemented`. Note `lib/memory-store.ts` exists as a minimal, unwired Firestore scaffold — this route was stubbed rather than rewired to it, since the store doesn't implement review states, update, or delete as scoped here.

Objective:

Expose memory API routes.

Scope:

- list
- create
- get
- update
- remove or deprecate

Deliverable:

Memory API routes.

Acceptance Criteria:

- routes match API Surface v1.0
- invalid memory IDs fail safely

---

## NV-021: Implement Goal API Routes

**Status: done, narrower than scoped.** `GET`/`POST /api/v1/goals` work against `lib/goal-store.ts` (Firestore). No `get`-by-ID, `update`, `cancel`, or `archive` routes exist — only list and create. "User scoping" isn't per-request; it's enforced at the Firestore Security Rules layer for the whole database (single-user).

Objective:

Expose goal API routes.

Scope:

- list
- create
- get
- update
- cancel or archive

Deliverable:

Goal API routes.

Acceptance Criteria:

- scheduled state works through API
- user scoping is enforced

---

## NV-022: Implement Project API Routes

**Status: done, narrower than scoped.** `GET`/`POST /api/v1/projects` work against `lib/project-store.ts` (Firestore). No get-by-ID, update, cancel, or archive routes — list and create only.

Objective:

Expose project API routes.

Scope:

- list
- create
- get
- update
- cancel or archive

Deliverable:

Project API routes.

Acceptance Criteria:

- projects can be linked to goals
- scheduled state works through API

---

## NV-023: Implement Task API Routes

**Status: done, narrower than scoped.** `GET`/`POST /api/v1/tasks` work against `lib/task-store.ts` (Firestore). No get-by-ID, dedicated complete/cancel routes here (task completion is handled client-side in `app/tasks/page.tsx` via `updateTaskStatus`, not this API route). "Completion can create or support execution records" doesn't apply — executions were never built.

Objective:

Expose task API routes.

Scope:

- list
- create
- get
- update
- complete
- cancel

Deliverable:

Task API routes.

Acceptance Criteria:

- scheduled and waiting states work through API
- completion can create or support execution records

---

## NV-024: Implement Plan API Routes

**Status: stubbed, not implemented.** `GET /api/v1/plans` returns `200 { items: [] }`; `POST` returns `501 Not Implemented`. No `lib/plan-store.ts` or equivalent exists.

Objective:

Expose plan API routes.

Scope:

- list
- create
- get
- update
- activate
- archive

Deliverable:

Plan API routes.

Acceptance Criteria:

- plans can contain tasks
- plans can link to goals

---

## NV-025: Implement Decision, Approval, Execution, and Review API Routes

**Status: mixed.** `decisions`: `POST /api/v1/decisions` works, but not as CRUD — it calls `lib/decision-engine.ts`'s `evaluateDecision`, which either returns a stored answer (keyed by normalized question text) or generates and stores a new one; `GET` returns a hardcoded empty list regardless of what's actually stored, which is a real, notable gap (the endpoint can't currently list past decisions even though they're persisted). `approvals`: route exists but both `GET` and `POST` are stubs (`{ items: [] }` / `501`), and no Firestore collection backs it. `executions`, `reviews`: same stub pattern as `approvals`. None of the "state changes are validated" or "match API Surface v1.0" acceptance criteria apply to the three stubbed entities.

Objective:

Expose remaining core API routes.

Scope:

- decisions
- approvals
- executions
- reviews

Deliverable:

API routes for governance and review objects.

Acceptance Criteria:

- routes match API Surface v1.0
- state changes are validated

---

# Phase 5: Frontend

## NV-026: Build App Shell

Objective:

Create the primary web UI structure.

Scope:

- navigation
- layout
- page containers
- loading and error patterns

Deliverable:

Usable app shell.

Acceptance Criteria:

- user can navigate between core sections
- layout supports future dashboard views

---

## NV-027: Build Core CRUD Screens

Objective:

Create screens for managing core entities.

Scope:

- memories
- goals
- projects
- tasks
- plans
- decisions
- reviews

Deliverable:

Basic CRUD interface.

Acceptance Criteria:

- user can create, view, edit, and update core records
- status fields are visible and editable where appropriate

---

## NV-028: Build Chief Dashboard

Objective:

Create first situational awareness dashboard.

Scope:

- active goals
- active projects
- scheduled goals
- scheduled projects
- upcoming tasks
- pending approvals
- scheduled reviews
- recently completed work

Deliverable:

Chief Dashboard screen.

Acceptance Criteria:

- dashboard pulls real data
- dashboard highlights attention areas

---

## NV-029: Build Weekly Review Draft UI

Objective:

Create UI for generating and reviewing weekly review drafts.

Scope:

- review generation trigger
- generated summary display
- editable findings and recommendations
- save as Review

Deliverable:

Weekly Review Draft screen.

Acceptance Criteria:

- draft can be generated from current records
- review can be saved

---

# Phase 6: Demo and Quality

## NV-030: Create Seed Data

Objective:

Create representative demo data.

Scope:

- example user
- memories
- goals
- projects
- tasks
- plans
- decisions
- reviews

Deliverable:

Seed script or fixture set.

Acceptance Criteria:

- local demo environment can be populated consistently
- dashboard has meaningful sample data

---

## NV-031: Add Basic Tests

Objective:

Add initial tests for critical domain behavior.

Scope:

- service tests
- status transition tests
- user scoping tests
- relationship tests

Deliverable:

Initial test suite.

Acceptance Criteria:

- tests run locally
- core service behavior is covered

---

## NV-032: Run V1 Quality Pass

Objective:

Stabilize the V1 foundation.

Scope:

- review database schema
- review APIs
- review UI flows
- review dashboard
- review weekly review workflow
- identify missing tickets

Deliverable:

V1 quality review notes.

Acceptance Criteria:

- known gaps are documented
- next implementation wave is clear

---

# First Ticket to Execute

The first ticket to execute is:

```text
NV-001: Confirm Application Stack
```

No coding should begin before the stack is confirmed.

---

# Outcome

This ticket list turns the V1 Build Plan into executable engineering work.

North Vector now has a concrete path from architecture to implementation.