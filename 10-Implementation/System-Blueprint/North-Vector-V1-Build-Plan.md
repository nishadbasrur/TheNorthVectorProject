# North Vector V1 Build Plan

## Purpose

This document translates the North Vector architecture artifacts into an actionable implementation sequence.

It defines what should be built first, what should wait, and how the V1 system should come together.

North Vector V1 should prove the core operating model before expanding into advanced automation.

---

# Current Foundation

The following artifacts are complete:

- North Vector Constitution
- ADR-0001 through ADR-0100
- Domain Model v1.0
- ERD v1.0
- Database Schema v1.0
- API Surface v1.0

The next step is implementation.

---

# V1 Product Goal

North Vector V1 should answer one question:

```text
Can Chief help the user remember, organize, plan, and review life better than scattered notes and chat history?
```

V1 does not need full autonomy.

V1 needs coherent structure.

---

# V1 Scope

North Vector V1 includes:

- authentication-ready user model
- memory management
- goal management
- project management
- task management
- plan management
- decision records
- approval records
- execution records
- review records
- Chief dashboard
- weekly review draft workflow

---

# V1 Exclusions

North Vector V1 excludes:

- autonomous external actions
- email sending
- calendar writes
- multi-agent orchestration
- third-party integrations
- advanced workflow engine
- embeddings and vector search
- mobile app
- payment systems
- organization accounts

These should wait until the core operating model works.

---

# Implementation Phases

## Phase 1: Project Infrastructure

Goal:

Create a clean application foundation.

Tasks:

- confirm repository structure
- choose app framework
- configure TypeScript
- configure linting and formatting
- configure environment variables
- configure database connection
- configure migration tooling
- create basic local development workflow

Deliverable:

A runnable local application skeleton.

---

## Phase 2: Database Implementation

Goal:

Turn Database Schema v1.0 into real database definitions.

Tasks:

- create users table
- create memories table
- create goals table
- create projects table
- create tasks table
- create plans table
- create decisions table
- create approvals table
- create executions table
- create reviews table
- create junction tables
- add basic indexes
- create migrations
- test migration up/down behavior if supported

Deliverable:

A working database schema matching the V1 design.

---

## Phase 3: Core Backend Services

Goal:

Create service-layer operations for the core domain objects.

Services:

- UserService
- MemoryService
- GoalService
- ProjectService
- TaskService
- PlanService
- DecisionService
- ApprovalService
- ExecutionService
- ReviewService

Each service should support:

- create
- read
- update
- list
- status transitions where applicable

Deliverable:

A service layer that can manipulate the V1 domain model safely.

---

## Phase 4: API Routes

Goal:

Implement the API Surface v1.0.

Route groups:

- /api/v1/me
- /api/v1/memories
- /api/v1/goals
- /api/v1/projects
- /api/v1/tasks
- /api/v1/plans
- /api/v1/decisions
- /api/v1/approvals
- /api/v1/executions
- /api/v1/reviews
- /api/v1/chief/dashboard
- /api/v1/chief/weekly-review-draft
- /api/v1/chief/planning-context

Deliverable:

A backend API that exposes the V1 domain model.

---

## Phase 5: Frontend Foundation

Goal:

Create the first usable product interface.

Screens:

- Dashboard
- Memories
- Goals
- Projects
- Tasks
- Plans
- Decisions
- Reviews

The UI should be simple, functional, and fast to iterate.

Deliverable:

A usable web interface for managing the core North Vector objects.

---

## Phase 6: Chief Dashboard

Goal:

Create the first Chief-facing operating view.

Dashboard should show:

- active goals
- active projects
- scheduled goals
- scheduled projects
- upcoming tasks
- pending approvals
- scheduled reviews
- recently completed work
- items needing attention

Deliverable:

A single screen that gives situational awareness.

---

## Phase 7: Weekly Review Workflow

Goal:

Create the first true Chief workflow.

Weekly review should summarize:

- what moved forward
- what stalled
- what is scheduled
- what is overdue
- what requires a decision
- what requires approval
- what should be prioritized next week

V1 may generate this from database records without advanced AI.

Deliverable:

A structured weekly review draft that helps the user run their life system.

---

## Phase 8: Seed Data and Demo Mode

Goal:

Make the system testable and demonstrable.

Seed data should include:

- example user
- example memories
- example goals
- example projects
- example tasks
- example plans
- example reviews

Deliverable:

A repeatable demo environment.

---

## Phase 9: Quality Pass

Goal:

Stabilize V1 before expansion.

Tasks:

- validate status transitions
- validate user scoping
- validate relationship handling
- test dashboard data
- test weekly review workflow
- test CRUD operations
- identify missing indexes
- clean up UI rough edges

Deliverable:

A stable V1 product foundation.

---

# Suggested Build Order

The recommended order is:

```text
1. App skeleton
2. Database schema
3. Core services
4. API routes
5. Basic UI
6. Dashboard
7. Weekly review
8. Seed data
9. Quality pass
```

Do not start with advanced AI.

Do not start with integrations.

Do not start with autonomy.

Start with the operating system.

---

# First Implementation Milestone

The first real milestone is:

```text
User can create and manage goals, projects, tasks, memories, and reviews through the app.
```

This milestone proves that North Vector can represent the user's life system.

---

# Second Implementation Milestone

The second milestone is:

```text
Chief Dashboard shows current life operating status.
```

This proves that the system can synthesize information into useful awareness.

---

# Third Implementation Milestone

The third milestone is:

```text
Weekly Review Draft works from real user data.
```

This proves that North Vector can support structured reflection and planning.

---

# V1 Success Criteria

North Vector V1 succeeds if:

- important memories can be stored and reviewed
- goals can be tracked
- projects can be tracked
- tasks can be scheduled and completed
- plans can organize work
- decisions can preserve rationale
- reviews can evaluate progress
- Chief Dashboard creates situational awareness
- Weekly Review creates planning clarity

---

# Immediate Next Task

The next engineering artifact should be:

```text
North Vector Implementation Tickets v1.0
```

That document should break this build plan into concrete tickets that can be executed one at a time.

---

# Outcome

This Build Plan turns North Vector from architecture into an implementation sequence.

The project is now ready to move from design documents into executable engineering work.