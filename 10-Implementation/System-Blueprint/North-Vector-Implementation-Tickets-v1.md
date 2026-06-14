# North Vector Implementation Tickets v1.0

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

- users
- memories
- goals
- projects
- tasks
- plans
- decisions
- approvals
- executions
- reviews

Deliverable:

Database migration for core tables.

Acceptance Criteria:

- all core tables exist
- primary keys exist
- user ownership is represented
- status fields exist
- timestamp fields exist

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

Acceptance Criteria:

- junction tables exist
- composite primary keys exist where appropriate
- foreign keys exist where possible

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

Index migration.

Acceptance Criteria:

- common list queries have supporting indexes
- indexes match Database Schema v1.0 recommendations

---

# Phase 3: Core Services

## NV-009: Implement User Service

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