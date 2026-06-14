# North Vector Domain Model v1.0

## Purpose

The North Vector Domain Model defines the core entities that make up the platform.

These entities represent the foundational objects from which database schemas, APIs, workflows, user interfaces, and future automation systems will be built.

This document intentionally focuses on business concepts rather than implementation details.

---

# 1. User

## Purpose

Represents the human being served by North Vector.

All other entities ultimately exist to support the User.

## Core Fields

- id
- name
- preferred_name
- email
- timezone
- status
- created_at
- updated_at

## Relationships

A User may have:

- many Memories
- many Goals
- many Projects
- many Tasks
- many Plans
- many Decisions
- many Reviews

## States

- Active
- Inactive
- Archived

---

# 2. Memory

## Purpose

Represents information that Chief knows or believes about the User.

Examples:

- preferences
- commitments
- personal history
- recurring patterns
- important facts

## Core Fields

- id
- title
- content
- memory_type
- source
- confidence_score
- review_state
- created_at
- updated_at

## Relationships

A Memory may relate to:

- Goals
- Projects
- Decisions
- Plans
- Reviews

## States

- Candidate
- Inferred
- Confirmed
- Needs Review
- Deprecated
- Rejected

---

# 3. Goal

## Purpose

Represents a desired future outcome.

Goals provide long-term direction.

Examples:

- Become a physician
- Graduate debt free
- Match orthopedic surgery

## Core Fields

- id
- title
- description
- priority
- target_date
- status
- created_at
- updated_at

## Relationships

A Goal may:

- contain Projects
- contain Tasks
- be referenced by Plans
- be reviewed through Reviews

## States

- Scheduled
- Active
- Completed
- Paused
- Cancelled

## State Notes

Scheduled represents a known future goal that has not begun yet but is intentionally planned.

Paused represents a goal that was active or intended to begin but has been intentionally suspended.

---

# 4. Project

## Purpose

Represents a multi-step effort intended to advance one or more Goals.

Examples:

- North Vector
- Etherea Foundation
- TechLink

## Core Fields

- id
- title
- description
- priority
- status
- start_date
- target_date
- created_at
- updated_at

## Relationships

A Project may:

- belong to one or more Goals
- contain Tasks
- contain Plans
- generate Decisions

## States

- Proposed
- Scheduled
- Active
- On Hold
- Completed
- Cancelled

## State Notes

Scheduled represents a project that has a future intended start but is not yet active.

On Hold represents a project that is suspended after being accepted or started.

---

# 5. Task

## Purpose

Represents a discrete actionable unit of work.

Tasks are the smallest operational building block.

## Core Fields

- id
- title
- description
- priority
- due_date
- status
- created_at
- updated_at

## Relationships

A Task may belong to:

- a Goal
- a Project
- a Plan

A Task may generate an Execution.

## States

- Scheduled
- Not Started
- In Progress
- Waiting
- Completed
- Cancelled

## State Notes

Scheduled represents a task intentionally planned for a future time.

Not Started represents a task that is available to begin but has not yet been started.

Waiting represents a task blocked by another person, dependency, event, or condition.

---

# 6. Plan

## Purpose

Represents a structured path from a current state to a desired outcome.

Plans connect strategy to execution.

## Core Fields

- id
- title
- description
- planning_horizon
- status
- created_at
- updated_at

## Relationships

A Plan may:

- support Goals
- support Projects
- contain Tasks
- create Decisions

## States

- Draft
- Active
- Completed
- Archived

---

# 7. Decision

## Purpose

Represents a meaningful choice.

North Vector should preserve important decisions and their rationale.

Examples:

- College selection
- Career direction
- Major purchases

## Core Fields

- id
- title
- description
- rationale
- decision_date
- status
- created_at
- updated_at

## Relationships

A Decision may:

- affect Goals
- affect Projects
- affect Plans
- trigger Approvals

## States

- Proposed
- Approved
- Rejected
- Executed
- Superseded

---

# 8. Approval

## Purpose

Represents explicit human authorization.

Approvals exist to preserve agency and governance.

## Core Fields

- id
- approval_type
- request_summary
- status
- requested_at
- decided_at

## Relationships

An Approval may authorize:

- a Decision
- a Plan
- an Execution

## States

- Pending
- Approved
- Denied
- Expired
- Revoked

---

# 9. Execution

## Purpose

Represents an action taken by North Vector or the User.

Executions transform plans into reality.

## Core Fields

- id
- execution_type
- summary
- executed_at
- outcome
- status

## Relationships

An Execution may:

- satisfy a Task
- fulfill a Plan step
- require an Approval
- be reviewed later

## States

- Planned
- Authorized
- Executing
- Completed
- Failed
- Cancelled

---

# 10. Review

## Purpose

Represents structured reflection and evaluation.

Reviews help Chief understand progress, risks, failures, opportunities, and alignment.

## Core Fields

- id
- review_type
- summary
- findings
- recommendations
- review_date

## Relationships

A Review may evaluate:

- Goals
- Projects
- Tasks
- Plans
- Decisions
- Executions

## States

- Scheduled
- In Progress
- Completed
- Archived

---

# Domain Hierarchy

The foundational flow of North Vector is:

User
→ Memory
→ Goal
→ Project
→ Plan
→ Task
→ Approval
→ Execution
→ Review

This hierarchy represents the core operating loop of the North Vector system.

---

# Scope Boundary

This document intentionally excludes:

- AI Agents
- Workflow Engine
- Event Bus
- Integrations
- Notifications
- Provider Systems
- Simulation Systems

Those are implementation and infrastructure concerns that will be defined in future design documents.

The purpose of this document is to establish the core business entities upon which the rest of North Vector will be built.