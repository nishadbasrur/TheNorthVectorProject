# North Vector ERD v1.0

## Purpose

This document translates the North Vector Domain Model into explicit entity relationships.

The goal is to define how core objects connect before designing database tables and APIs.

---

# Core Relationship Diagram

```text
User
├── Memories
├── Goals
├── Projects
├── Tasks
├── Plans
├── Decisions
└── Reviews

Goal
├── Projects
├── Tasks
├── Plans
└── Reviews

Project
├── Tasks
├── Plans
├── Decisions
└── Reviews

Plan
├── Tasks
├── Decisions
└── Executions

Task
└── Executions

Decision
└── Approvals

Approval
└── Executions

Execution
└── Reviews
```

---

# Entity Relationships

## User → Memory

Relationship:

```text
1 : Many
```

A User may have many Memories.

Each Memory belongs to a single User.

---

## User → Goal

Relationship:

```text
1 : Many
```

A User may have many Goals.

Each Goal belongs to a single User.

---

## Goal ↔ Project

Relationship:

```text
Many : Many
```

A Goal may be advanced by multiple Projects.

A Project may contribute to multiple Goals.

Examples:

- North Vector
- Research Initiative
- EMT Certification

may support several goals simultaneously.

---

## Goal ↔ Task

Relationship:

```text
Many : Many
```

A Task may contribute directly to multiple Goals.

A Goal may contain many Tasks.

---

## Goal ↔ Plan

Relationship:

```text
Many : Many
```

Plans may support multiple Goals.

Goals may be advanced by multiple Plans.

---

## Project → Task

Relationship:

```text
1 : Many
```

A Project contains many Tasks.

A Task may optionally belong to a Project.

---

## Project → Plan

Relationship:

```text
1 : Many
```

A Project may contain multiple Plans.

---

## Project → Decision

Relationship:

```text
1 : Many
```

Projects frequently generate Decisions.

---

## Plan → Task

Relationship:

```text
1 : Many
```

A Plan is composed of Tasks.

Tasks may belong to a Plan.

---

## Task → Execution

Relationship:

```text
1 : Many
```

A Task may generate multiple Executions.

Example:

A task may require several attempts before completion.

---

## Decision → Approval

Relationship:

```text
1 : Many
```

A Decision may require one or more Approvals.

---

## Approval → Execution

Relationship:

```text
1 : Many
```

An Approval may authorize one or more Executions.

---

## Review Relationships

A Review may evaluate:

- Goals
- Projects
- Tasks
- Plans
- Decisions
- Executions

Relationship:

```text
Many : Many
```

Reviews act as evaluative objects that can reference multiple entities.

---

## Memory Relationships

Memories may reference:

- Goals
- Projects
- Plans
- Decisions
- Reviews

Relationship:

```text
Many : Many
```

Memories function as contextual knowledge attached to other entities.

---

# Junction Tables Required

The following many-to-many relationships will require junction tables in the future database schema:

```text
goal_projects
goal_tasks
goal_plans
memory_entities
review_entities
```

Additional junction tables may be introduced as the system evolves.

---

# Future Scope

This ERD intentionally excludes:

- AI Agents
- Workflow Engine
- Event Bus
- Notifications
- Integrations
- External Providers

These infrastructure components will be modeled separately.

---

# Outcome

This ERD establishes the relational structure of the North Vector core domain.

It serves as the bridge between the Domain Model and the future Database Schema v1.0.