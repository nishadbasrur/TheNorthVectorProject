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

## States

- Scheduled
- Active
- Completed
- Paused
- Cancelled

---

# 4. Project

## Purpose

Represents a multi-step effort intended to advance one or more Goals.

## States

- Proposed
- Scheduled
- Active
- On Hold
- Completed
- Cancelled

---

# 5. Task

## Purpose

Represents a discrete actionable unit of work.

## States

- Scheduled
- Not Started
- In Progress
- Waiting
- Completed
- Cancelled

---

# 6. Plan

## Purpose

Represents a structured path from a current state to a desired outcome.

## States

- Draft
- Active
- Completed
- Archived

---

# 7. Decision

## States

- Proposed
- Approved
- Rejected
- Executed
- Superseded

---

# 8. Approval

## States

- Pending
- Approved
- Denied
- Expired
- Revoked

---

# 9. Execution

## States

- Planned
- Authorized
- Executing
- Completed
- Failed
- Cancelled

---

# 10. Review

## States

- Scheduled
- In Progress
- Completed
- Archived

---

# Domain Hierarchy

User
→ Memory
→ Goal
→ Project
→ Plan
→ Task
→ Approval
→ Execution
→ Review