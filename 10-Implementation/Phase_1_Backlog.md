# Phase 1 Backlog v1.0

## Status

**Partially superseded as of 2026-07-03.** This note covers only the database/stack-technology items (P1-020, P1-026, and their dependents) — see inline corrections below and `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`.

Separately, and out of scope for this correction pass: the great majority of this backlog (Chief conversation, memory candidate lifecycle, retrieval ranking, Calendar integration, approval/execution pipeline, most of Workstreams 4 through 9) describes functionality that has not been built in any form, Firestore or otherwise. What actually exists is a much smaller slice — task/goal/project/decision CRUD, a rule-based (not AI-driven) daily risk scan, a Plaid bank-connection integration, and email notifications — none of which map cleanly onto this backlog's workstream structure. Reconciling the full backlog against real progress is a materially larger effort than a stale-reference fix and hasn't been done here; flagging it rather than guessing at it.

## Purpose

This document defines the concrete engineering backlog for Phase 1 of North Vector.

The Phase 1 Backlog exists to translate the Implementation Roadmap and MVP Scope into buildable work items with priorities, dependencies, acceptance criteria, and release relevance.

Its purpose is not to list every future idea.

Its purpose is to define the shortest credible path from architecture to a working, trustworthy MVP.

## Core Principle

Phase 1 should build the minimum coherent system, not isolated infrastructure.

Every backlog item should either enable a release-critical user workflow or establish a control required to make that workflow safe.

## Phase 1 Goal

Deliver a desktop-first, single-user North Vector MVP that supports:
- secure sign-in
- canonical data objects
- memory creation and inspection
- Chief text conversation
- goals, projects, tasks, and commitments
- Today view
- daily briefing
- weekly review
- Google Calendar read access
- approval-gated Calendar event creation
- audit history
- export and deletion

## Phase 1 Release-Critical Workflow

The release-critical vertical slice is:

1. Nishad tells Chief about a chemistry exam.
2. Chief creates or proposes the exam Event.
3. Chief creates linked study Tasks and Goal relationships.
4. Chief reads Calendar availability.
5. Chief proposes a study block.
6. Nishad approves the exact event payload.
7. North Vector creates the Calendar event once.
8. The system verifies provider state.
9. The plan appears in Today and the daily briefing.
10. Progress appears in the weekly review.
11. The entire flow is reconstructable from audit history.

## Backlog Structure

Each backlog item should include:
- ID
- Title
- Priority
- Type
- Dependencies
- Description
- Acceptance Criteria
- Security and Privacy Notes
- Test Requirements
- Definition of Done

## Priority Levels

### P0

Required for MVP release or system safety.

### P1

Required for a complete and usable MVP but may follow core foundations.

### P2

Useful improvement that may move to post-MVP if schedule tightens.

### P3

Deferred research or future work.

## Workstream Overview

Phase 1 workstreams:
- Project Foundation
- Identity and Sessions
- Data Platform
- Memory
- Chief Conversation
- Planning and Review
- Calendar Integration
- Approval and Execution
- Audit and Observability
- Privacy and Data Control
- Interface
- Testing and Release

# Workstream 1: Project Foundation

## P1-001: Initialize Application Repository

Priority:
P0

Type:
Foundation

Dependencies:
None

Description:
Create the application structure for web, worker, shared domain packages, database, integrations, AI, security, and UI.

Acceptance Criteria:
- repository builds locally
- package manager and lockfile are committed
- strict TypeScript is enabled
- application and worker processes start
- folder structure is documented
- no secrets are committed

Test Requirements:
- build test
- type check
- smoke startup test

## P1-002: Add Environment Configuration Validation

Priority:
P0

Type:
Foundation

Dependencies:
P1-001

Description:
Implement typed startup validation for required server and client environment variables.

Acceptance Criteria:
- missing required server variable blocks startup
- server secrets cannot enter client bundle
- `.env.example` contains placeholders only
- local, test, staging, and production configurations are distinct

Security Notes:
Configuration errors should fail closed.

## P1-003: Configure Formatting, Linting, and Type Checking

Priority:
P0

Type:
Engineering Standards

Dependencies:
P1-001

Acceptance Criteria:
- formatter configured
- linter configured
- strict type check passes
- scripts exist for local and CI execution

## P1-004: Configure Continuous Integration

Priority:
P0

Type:
Infrastructure

Dependencies:
P1-001, P1-003

Acceptance Criteria:
CI runs:
- formatting check
- lint
- type check
- unit tests
- integration tests
- build
- secret scan
- dependency scan

## P1-005: Create Synthetic Seed Scenario

Priority:
P0

Type:
Test Infrastructure

Dependencies:
P1-001

Description:
Create synthetic seed data for one user, one goal, one project, several tasks, one commitment, one chemistry exam, one risk, one memory candidate, and one Calendar proposal.

Acceptance Criteria:
- seed command is repeatable
- no real personal data is included
- seed supports demos and end-to-end tests

# Workstream 2: Identity and Sessions

## P1-010: Implement Single-User Authentication

Priority:
P0

Type:
Security

Dependencies:
P1-001, P1-002

Description:
Implement secure authentication for one primary user.

Acceptance Criteria:
- unauthenticated users cannot access personal data
- sign-in and sign-out work
- session is stored securely
- authentication events are audited

Test Requirements:
- unauthenticated access test
- successful login test
- invalid login test

## P1-011: Implement Session Records and Expiration

Priority:
P0

Type:
Security

Dependencies:
P1-010

Acceptance Criteria:
- session records include device, created time, last activity, assurance level, and expiration
- expired sessions lose access
- idle timeout works
- session events are audited

## P1-012: Implement Trusted Device Registration

Priority:
P1

Type:
Security

Dependencies:
P1-010, P1-011

Acceptance Criteria:
- device can be registered
- device trust level is visible
- untrusted device receives reduced access
- device registration is audited

## P1-013: Implement Session Revocation

Priority:
P0

Type:
Security

Dependencies:
P1-011

Acceptance Criteria:
- one session can be revoked
- all other sessions can be revoked
- revoked session loses access immediately where practical
- revocation is audited

## P1-014: Implement Reauthentication for Sensitive Operations

Priority:
P0

Type:
Security

Dependencies:
P1-010

Sensitive operations:
- full data export
- broad deletion
- security settings
- Calendar connection changes

Acceptance Criteria:
- fresh authentication is required
- stale session assurance is rejected
- reauthentication event is audited

# Workstream 3: Data Platform

## P1-020: Provision PostgreSQL and Migration Framework

**Superseded.** PostgreSQL was deleted before this was completed as specified. Actual: Firestore, provisioned as part of the existing Firebase project, no migration framework (Firestore has none). See `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`.

Priority:
P0

Type:
Data

Dependencies:
P1-001, P1-002

Acceptance Criteria (as originally written):
- local and test databases are available — partially true; there's no separate local/test Firestore instance in use today (the Firebase Emulator Suite exists but hasn't been adopted), so local development has been hitting the real project
- migrations are version controlled — not applicable, no migrations
- migration command is documented — not applicable
- database reset works in test — not applicable; no automated test database reset exists

## P1-021: Implement Canonical Base Object Schema

Priority:
P0

Type:
Data

Dependencies:
P1-020

Acceptance Criteria:
Base fields include:
- stable ID
- object type
- owner
- title
- summary
- status
- sensitivity
- retention class
- confidence
- created and updated timestamps
- version
- deleted and archived timestamps

## P1-022: Implement Core Object Schemas

Priority:
P0

Type:
Data

Dependencies:
P1-021

Objects:
- Goal
- Project
- Task
- Commitment
- Event
- Risk
- Opportunity
- Decision
- Memory
- Review
- Evidence
- Source Reference
- Action
- Permission

Acceptance Criteria:
- required fields validated
- invalid objects rejected
- version increments on update
- object-specific fields are supported

## P1-023: Implement Relationship Table and Registry

Priority:
P0

Type:
Data

Dependencies:
P1-021, P1-022

Acceptance Criteria:
- typed directed relationships supported
- invalid object-type combinations rejected
- source, confidence, sensitivity, and effective dates supported
- direct graph traversal works

## P1-024: Implement Object Repository Layer

Priority:
P0

Type:
Backend

Dependencies:
P1-022

Acceptance Criteria:
- create, read, update, archive, and soft delete supported
- authorization enforced in service layer
- version conflict detected
- structured errors returned

## P1-025: Implement Transactional Audit Writes

Priority:
P0

Type:
Data Integrity

Dependencies:
P1-024, P1-060

Acceptance Criteria:
- critical object mutation and audit event occur atomically
- ordinary failure does not leave unaudited state change

## P1-026: Add pgvector and Retrieval Index Schema

**Deprecated, not superseded.** pgvector required PostgreSQL, which is gone. Unlike P1-020, there's no replacement to point to — semantic/vector retrieval on Firestore is undecided. See `10-Implementation/ADRs/ADR-0010-Use-pgvector-for-Initial-Semantic-Retrieval.md` (status: Deprecated).

Priority:
P1

Type:
Data

Dependencies:
P1-020, P1-021

Acceptance Criteria:
- embeddings link to object ID and version
- sensitivity and deletion status are represented
- deleted records are excluded
- model version is tracked

# Workstream 4: Memory

## P1-030: Implement Explicit Memory Save

Priority:
P0

Type:
Product

Dependencies:
P1-022, P1-024

Acceptance Criteria:
- user can explicitly save a memory
- source and confidence are stored
- memory appears in Memory Inspector
- write is audited

## P1-031: Implement Memory Candidate State

Priority:
P0

Type:
Product

Dependencies:
P1-030

Acceptance Criteria:
- inferred memory begins as Candidate
- candidate includes proposed statement and source
- candidate cannot influence ordinary retrieval unless explicitly allowed
- candidate can be confirmed or rejected

## P1-032: Implement Memory Confidence and Evidence

Priority:
P0

Type:
Data Quality

Dependencies:
P1-022, P1-031

Acceptance Criteria:
- confidence values use controlled vocabulary
- evidence can support or contradict memory
- user confirmation increases confidence
- source remains inspectable

## P1-033: Implement Memory Revision and Version History

Priority:
P0

Type:
Product

Dependencies:
P1-030

Acceptance Criteria:
- memory wording can be edited
- previous version remains historically available
- update reason is recorded
- retrieval uses current version

## P1-034: Implement Memory Archive, Expiration, and Supersession

Priority:
P1

Type:
Product

Dependencies:
P1-030

Acceptance Criteria:
- archived memory leaves ordinary retrieval
- expired memory does not influence recommendations
- superseded memory preserves historical link
- lifecycle changes are audited

## P1-035: Implement Memory Deletion Propagation

Priority:
P0

Type:
Privacy

Dependencies:
P1-030, P1-026

Acceptance Criteria:
Deletion removes or suppresses memory from:
- primary store
- relationships
- semantic index
- text index
- cache
- session context where relevant

## P1-036: Implement No-Memory Mode

Priority:
P0

Type:
Privacy

Dependencies:
P1-030, P1-050

Acceptance Criteria:
- no durable memory is created
- no candidate memory is created silently
- session context remains temporary
- mode state is visible
- mode transitions are audited

## P1-037: Build Memory Inspector

Priority:
P0

Type:
Interface

Dependencies:
P1-030 through P1-035

Acceptance Criteria:
The interface supports:
- active memories
- candidate memories
- source and confidence
- confirm
- reject
- edit
- archive
- delete
- recent changes

# Workstream 5: Retrieval and Context

## P1-040: Implement Exact Object Retrieval

Priority:
P0

Type:
Backend

Dependencies:
P1-024

Acceptance Criteria:
- retrieval by stable object ID
- retrieval by explicit user reference
- permission and sensitivity checks occur before return

## P1-041: Implement Structured Retrieval

Priority:
P0

Type:
Backend

Dependencies:
P1-024

Filters:
- object type
- status
- time range
- goal
- project
- person
- sensitivity
- confidence

## P1-042: Implement Semantic Retrieval

Priority:
P1

Type:
AI and Data

Dependencies:
P1-026

Acceptance Criteria:
- semantic results preserve source and object ID
- similarity does not bypass permission
- stale, archived, and deleted records are excluded by default

## P1-043: Implement Shallow Graph Expansion

Priority:
P1

Type:
Data

Dependencies:
P1-023, P1-041

Acceptance Criteria:
- direct neighbors retrievable
- one additional hop allowed for specific use cases
- path explanation available
- sensitivity is enforced across the path

## P1-044: Implement Retrieval Ranking

Priority:
P1

Type:
AI and Data

Dependencies:
P1-040 through P1-043

Ranking factors:
- objective relevance
- explicit reference
- confidence
- recency
- importance
- relationship distance
- privacy cost
- staleness

## P1-045: Implement Context Assembler

Priority:
P0

Type:
AI Platform

Dependencies:
P1-040, P1-041

Acceptance Criteria:
Assembled context includes:
- objective
- current state
- relevant preferences and constraints
- active goals and priorities
- relevant risks and commitments
- uncertainty and conflicts
- allowed actions

## P1-046: Implement Context Invalidation

Priority:
P0

Type:
Data Integrity

Dependencies:
P1-045

Invalidate context when:
- object changes
- permission changes
- memory is corrected or deleted
- privacy mode changes
- source refresh changes state

# Workstream 6: Chief Conversation

## P1-050: Build Chief Session Service

Priority:
P0

Type:
Product

Dependencies:
P1-010, P1-045

Acceptance Criteria:
- session creation
- current objective
- recent turns
- active object references
- pending actions
- session summary
- session end state

## P1-051: Build Chief Conversation Interface

Priority:
P0

Type:
Interface

Dependencies:
P1-050

Acceptance Criteria:
- text input
- streamed response
- visible current objective
- structured cards
- uncertainty labels
- pending-action panel
- memory notices

## P1-052: Implement Model Provider Abstraction

Priority:
P0

Type:
AI Platform

Dependencies:
P1-001, P1-002

Acceptance Criteria:
- provider-specific logic is isolated
- streaming supported
- structured output supported
- timeout and error behavior defined
- cost and latency logged without private prompt overcollection

## P1-053: Implement Structured Model Output Validation

Priority:
P0

Type:
AI Safety

Dependencies:
P1-052

Acceptance Criteria:
- object proposals use schemas
- invalid output is rejected or repaired safely
- model output cannot write directly to database
- model output cannot execute tools directly

## P1-054: Implement Session Summary

Priority:
P1

Type:
Product

Dependencies:
P1-050, P1-052

Acceptance Criteria:
Summary includes:
- objective
- constraints
- conclusions
- decisions
- actions
- unresolved questions

## P1-055: Implement Decision and Planning Modes

Priority:
P1

Type:
Product

Dependencies:
P1-051, P1-053

Acceptance Criteria:
- mode is visible
- mode changes context structure and response schema
- actions remain proposals

# Workstream 7: Goals, Tasks, Planning, and Reviews

## P1-070: Build Goal and Project Services

Priority:
P0

Type:
Product

Dependencies:
P1-022, P1-024

Acceptance Criteria:
- create and update goals
- create and update projects
- link project to goal
- status and progress supported
- audit events created

## P1-071: Build Task and Commitment Services

Priority:
P0

Type:
Product

Dependencies:
P1-022, P1-024

Acceptance Criteria:
- tasks and commitments are distinct object types
- due date, priority, status, next action, and postponement count supported
- commitment consequence and counterpart supported

## P1-072: Build Goals, Projects, Tasks, and Commitments Interface

Priority:
P1

Type:
Interface

Dependencies:
P1-070, P1-071

Acceptance Criteria:
- create, edit, complete, defer, and archive supported
- linked objects visible
- commitments visually distinct from tasks

## P1-073: Implement Basic Planning Engine

Priority:
P0

Type:
Product

Dependencies:
P1-071, P1-081

Acceptance Criteria:
Planning considers:
- fixed events
- flexible tasks
- duration
- due date
- priority
- buffer
- dependency
- next action

## P1-074: Implement Replanning

Priority:
P1

Type:
Product

Dependencies:
P1-073

Acceptance Criteria:
- completed work is preserved
- fixed events remain fixed
- unfinished tasks are reordered
- duplicate tasks are not created
- conflicts are surfaced

## P1-075: Build Today View

Priority:
P0

Type:
Interface

Dependencies:
P1-071, P1-073, P1-081

Today view should show:
- events
- top priorities
- commitments
- risks
- next action
- pending approvals
- stale-data status

## P1-076: Implement Daily Briefing Generator

Priority:
P0

Type:
Product

Dependencies:
P1-045, P1-071, P1-073, P1-081

Acceptance Criteria:
Briefing includes:
- schedule overview
- top priorities
- important commitment or deadline
- current risk
- recommended first action
- stale or missing data warning

## P1-077: Implement Weekly Review Service

Priority:
P0

Type:
Product

Dependencies:
P1-070, P1-071

Acceptance Criteria:
Review covers:
- wins
- misses
- goal progress
- completed work
- overdue commitments
- risks
- decisions
- lessons
- next-week priorities

## P1-078: Build Weekly Review Interface

Priority:
P1

Type:
Interface

Dependencies:
P1-077

Acceptance Criteria:
- guided review flow
- editable conclusions
- lesson-to-memory candidate
- next-week priority creation

# Workstream 8: Calendar Integration

## P1-080: Implement Google Calendar OAuth

Priority:
P0

Type:
Integration

Dependencies:
P1-010, P1-002

Acceptance Criteria:
- narrow scopes
- token encrypted at rest
- connected account visible
- disconnect and revoke supported
- events audited

## P1-081: Implement Calendar Read Synchronization

Priority:
P0

Type:
Integration

Dependencies:
P1-080, P1-022

Acceptance Criteria:
- approved calendars only
- event normalization
- timezone preserved
- external ID and version stored
- last sync visible
- stale status visible
- expired authentication handled

## P1-082: Implement Calendar Conflict Detection

Priority:
P0

Type:
Integration

Dependencies:
P1-081

Acceptance Criteria:
- direct time overlap detected
- impossible travel may remain deferred
- conflict is visible in Today and planning

## P1-083: Implement Calendar Event Proposal

Priority:
P0

Type:
Product

Dependencies:
P1-073, P1-090

Acceptance Criteria:
Proposal contains:
- title
- start and end
- timezone
- target calendar
- description
- related task and goal
- exact payload hash or equivalent

## P1-084: Implement Calendar Event Creation Adapter

Priority:
P0

Type:
Integration

Dependencies:
P1-080, P1-091

Acceptance Criteria:
- create only after valid approval
- idempotency prevents duplicate event
- provider response is verified
- external event ID and version stored
- failure is reported accurately

## P1-085: Implement Calendar Version Conflict Protection

Priority:
P1

Type:
Data Integrity

Dependencies:
P1-081, P1-084

Acceptance Criteria:
- stale provider version blocks update behavior
- current provider state is fetched
- conflict record is created
- no silent overwrite occurs

# Workstream 9: Approval and Execution

## P1-090: Implement Proposed Action Records

Priority:
P0

Type:
Safety

Dependencies:
P1-022, P1-024

Acceptance Criteria:
Action record includes:
- action type
- target
- exact payload
- risk level
- approval mode
- approval status
- execution status

## P1-091: Implement Approval Service

Priority:
P0

Type:
Safety

Dependencies:
P1-090, P1-014

Acceptance Criteria:
- approval binds to exact target and payload
- approval expires
- approval can be rejected or revoked
- material payload change invalidates approval
- approval event is audited

## P1-092: Build Approval Tray

Priority:
P0

Type:
Interface

Dependencies:
P1-091

Acceptance Criteria:
- exact action visible
- target visible
- consequences visible
- approve and reject controls
- approval status visible

## P1-093: Implement Execution Service

Priority:
P0

Type:
Safety

Dependencies:
P1-091

Acceptance Criteria:
- authorization rechecked before execution
- approval revalidated
- target state verified
- payload integrity verified
- provider action executed through adapter

## P1-094: Implement Execution Verification

Priority:
P0

Type:
Safety

Dependencies:
P1-093

Acceptance Criteria:
- provider state checked after action
- success is not assumed
- uncertain results remain Uncertain
- duplicate retry is blocked after uncertain irreversible result

## P1-095: Implement Partial Failure Reporting

Priority:
P1

Type:
Reliability

Dependencies:
P1-093, P1-094

Acceptance Criteria:
- each workflow step reports individual result
- overall status may be Partially Succeeded
- user can tell what changed and what did not

# Workstream 10: Audit and Observability

## P1-060: Implement Audit Event Store

Priority:
P0

Type:
Security

Dependencies:
P1-020

Acceptance Criteria:
- append-oriented events
- actor, time, action, target, and result stored
- sensitive payloads minimized
- events queryable by object and session

## P1-061: Build Audit History Interface

Priority:
P1

Type:
Interface

Dependencies:
P1-060

Acceptance Criteria:
- filter by object, action, and date
- show human-readable summary
- expandable technical details
- ordinary UI cannot edit history

## P1-062: Implement Structured Application Logging

Priority:
P0

Type:
Operations

Dependencies:
P1-001

Acceptance Criteria:
- request and run IDs
- component
- status
- duration
- sanitized identifiers
- no secrets or Restricted values

## P1-063: Add Error Monitoring

Priority:
P1

Type:
Operations

Dependencies:
P1-062

Acceptance Criteria:
- application and worker errors captured
- private payloads redacted
- release version included

## P1-064: Implement Health Checks

Priority:
P1

Type:
Operations

Dependencies:
P1-020, P1-081

Health checks:
- web
- worker
- database
- Calendar connection
- model provider

# Workstream 11: Privacy and Data Control

## P1-100: Build Settings and Permissions Interface

Priority:
P0

Type:
Interface

Dependencies:
P1-012, P1-080

Acceptance Criteria:
- active sessions
- trusted devices
- Calendar connection and scope
- No-Memory Mode
- export
- deletion
- approval policy summary

## P1-101: Implement Data Export Service

Priority:
P0

Type:
Privacy

Dependencies:
P1-014, P1-022, P1-060

Acceptance Criteria:
- JSON export
- Markdown summary export
- canonical IDs and relationships preserved
- sensitive export requires reauthentication
- export action audited

## P1-102: Implement Object and Memory Deletion Flow

Priority:
P0

Type:
Privacy

Dependencies:
P1-035, P1-060

Acceptance Criteria:
- scope preview
- dependency preview
- explicit confirmation
- deletion propagation
- deletion receipt

## P1-103: Implement Calendar Disconnection Cleanup

Priority:
P0

Type:
Privacy

Dependencies:
P1-080, P1-081

Acceptance Criteria:
- token revoked where possible
- sync stops
- cached data identified
- user may retain or delete approved historical summaries
- disconnection audited

## P1-104: Implement Full Account Deletion

Priority:
P1

Type:
Privacy

Dependencies:
P1-101, P1-102, P1-014

Acceptance Criteria:
- broad deletion requires reauthentication
- canonical data removed
- sessions revoked
- integration disconnected
- retrieval indexes cleaned
- remaining audit metadata explained

# Workstream 12: Interface Foundation

## P1-110: Implement Application Shell

Priority:
P0

Type:
Interface

Dependencies:
P1-010

Acceptance Criteria:
- navigation
- session-aware layout
- responsive desktop-first behavior
- loading and error states
- keyboard accessibility

## P1-111: Implement Design Tokens and Accessible Components

Priority:
P1

Type:
Interface

Dependencies:
P1-110

Acceptance Criteria:
- color, spacing, typography tokens
- visible focus
- sufficient contrast
- non-color status cues
- reduced motion support

## P1-112: Implement Object Cards

Priority:
P1

Type:
Interface

Dependencies:
P1-022, P1-110

Cards:
- Goal
- Task
- Commitment
- Event
- Risk
- Memory
- Action

## P1-113: Implement Error and Empty States

Priority:
P1

Type:
Interface

Dependencies:
P1-110

Acceptance Criteria:
- stale data
- disconnected provider
- empty memory
- no tasks
- partial failure
- permission denied

# Workstream 13: Testing and Release

## P1-120: Configure Unit and Integration Test Frameworks

Priority:
P0

Type:
Testing

Dependencies:
P1-001, P1-020

Acceptance Criteria:
- unit tests run locally and in CI
- isolated integration database
- deterministic fixtures
- time can be controlled

## P1-121: Configure End-to-End Testing

Priority:
P0

Type:
Testing

Dependencies:
P1-110

Acceptance Criteria:
- Playwright or equivalent configured
- test account and seed scenario available
- screenshots and traces available on failure

## P1-122: Implement Authentication and Session Test Suite

Priority:
P0

Dependencies:
P1-010 through P1-014

Required tests:
- unauthenticated access
- expiration
- revocation
- reauthentication
- untrusted device behavior

## P1-123: Implement Memory Lifecycle Test Suite

Priority:
P0

Dependencies:
P1-030 through P1-036

Required tests:
- explicit save
- candidate confirmation
- rejection
- revision
- archive
- expiration
- deletion
- No-Memory Mode

## P1-124: Implement Retrieval and Privacy Test Suite

Priority:
P0

Dependencies:
P1-040 through P1-046

Required tests:
- exact retrieval
- sensitivity filtering
- stale memory
- contradicted memory
- deleted memory absent
- unrelated context excluded

## P1-125: Implement Approval and Calendar Test Suite

Priority:
P0

Dependencies:
P1-083 through P1-094

Required tests:
- exact payload approval
- payload mutation invalidation
- event created once
- provider timeout
- uncertain result
- stale version conflict

## P1-126: Implement Chemistry Exam End-to-End Test

Priority:
P0

Dependencies:
All release-critical workstreams

Acceptance Criteria:
The complete primary workflow passes through the real application stack using synthetic Calendar data.

## P1-127: Implement Deletion Propagation End-to-End Test

Priority:
P0

Dependencies:
P1-102

Acceptance Criteria:
Deleted memory no longer appears in:
- active views
- exact retrieval
- semantic retrieval
- graph traversal
- session context

## P1-128: Implement Prompt-Injection Baseline Tests

Priority:
P0

Type:
Security Testing

Dependencies:
P1-052, P1-081

Acceptance Criteria:
Calendar description instructions cannot:
- reveal memory
- change permissions
- authorize an action
- override user or system policy

## P1-129: Implement Secret Scanning

Priority:
P0

Type:
Security Testing

Dependencies:
P1-004

Acceptance Criteria:
- scan runs on pull requests and main
- likely secrets block merge or deployment
- test secret is detected

## P1-130: Implement Backup and Restore Baseline

Priority:
P0

Type:
Operations

Dependencies:
P1-020

Acceptance Criteria:
- encrypted backup created
- integrity verified
- isolated restore succeeds
- deleted-memory replay is tested

## P1-131: Configure Staging Environment

Priority:
P0

Type:
Operations

Dependencies:
P1-001, P1-020

Acceptance Criteria:
- separate database
- separate secrets
- test OAuth credentials
- automated deployment
- smoke tests

## P1-132: Configure Production Environment

Priority:
P0

Type:
Operations

Dependencies:
P1-131

Acceptance Criteria:
- HTTPS
- separate secrets
- managed database
- backups
- worker deployment
- error monitoring
- release record

## P1-133: Create Release Checklist

Priority:
P0

Type:
Operations

Dependencies:
P1-004, P1-131

Checklist includes:
- tests
- migration validation
- secret scan
- dependency scan
- backup checkpoint
- smoke tests
- rollback readiness

# Recommended Build Order

## Sprint 1: Foundation and Data

Target:
- P1-001 through P1-005
- P1-020 through P1-024
- P1-060
- P1-120

Outcome:
The application runs with canonical objects, relationships, migrations, tests, and audit records.

## Sprint 2: Identity and Memory

Target:
- P1-010 through P1-014
- P1-030 through P1-037
- P1-122
- P1-123

Outcome:
Nishad can sign in, save and inspect memory, use No-Memory Mode, and delete a memory.

## Sprint 3: Retrieval and Chief

Target:
- P1-040 through P1-046
- P1-050 through P1-054
- P1-110
- P1-124

Outcome:
Chief can hold a text session and use controlled local context.

## Sprint 4: Goals and Planning

Target:
- P1-070 through P1-078
- P1-112

Outcome:
Goals, tasks, commitments, Today, briefing, and weekly review work with local data.

## Sprint 5: Calendar Read

Target:
- P1-080 through P1-082
- P1-100

Outcome:
Calendar events synchronize and constrain planning.

## Sprint 6: Approval and Calendar Write

Target:
- P1-083 through P1-095
- P1-125

Outcome:
Chief can propose and safely create one Calendar event after exact approval.

## Sprint 7: Privacy, Export, and Deletion

Target:
- P1-101 through P1-104
- P1-127

Outcome:
Data can be exported, disconnected, and deleted with receipts.

## Sprint 8: Hardening and Release

Target:
- P1-061 through P1-064
- P1-113
- P1-126
- P1-128 through P1-133

Outcome:
The MVP is tested, observable, backed up, staged, and ready for production use.

# Dependency-Critical Path

The critical path is:

Repository Foundation
↓
Database and Canonical Objects
↓
Authentication
↓
Memory and Retrieval
↓
Chief Session
↓
Goals and Planning
↓
Calendar Read
↓
Approval and Execution
↓
Calendar Write
↓
End-to-End Test
↓
Privacy Controls and Release Hardening

# MVP Cut Line

The following are required before release:
- all P0 items
- primary chemistry-exam end-to-end test
- memory deletion propagation
- session revocation
- exact approval binding
- Calendar event idempotency
- audit history
- export
- No-Memory Mode
- backup restoration

P1 items may move after first release only when they do not weaken:
- security
- privacy
- core workflow
- data integrity
- usability of memory and planning

# Deferred Post-MVP Items

The following should not enter Phase 1 unless required by a discovered blocker:
- Gmail
- Contacts
- academic portal
- Drive
- GitHub code actions
- voice
- mobile app
- wearables
- financial integration
- health integration
- location
- weather
- multi-user access
- autonomous external communication
- advanced graph database
- multi-agent architecture

# Acceptance Gate for Phase 1

Phase 1 is complete only when:
1. All P0 backlog items are done.
2. The primary chemistry-exam workflow passes end to end.
3. No-Memory Mode has a passing test.
4. Deleted memory is absent from all active retrieval paths.
5. Revoked sessions cannot access the system.
6. Calendar event creation requires exact, current approval.
7. Duplicate Calendar creation is prevented.
8. Audit history reconstructs the workflow.
9. Export and deletion work.
10. A verified backup can be restored.
11. Staging and production release procedures are documented and tested.
12. Nishad can use the MVP for one full week without losing trust in what it remembers or does.

## Backlog Governance

New Phase 1 items should be added only when they:
- unblock the critical path
- fix a release-critical defect
- close a security or privacy gap
- materially improve the primary workflow

Interesting but noncritical work should move to post-MVP.

## Backlog Review Cadence

Review the backlog:
- at the start of each sprint
- after every critical defect
- after architecture changes
- after integration constraints are discovered
- after the first week of real MVP use

## Failure Modes

### Foundation Trap

Infrastructure work continues without producing a usable slice.

### Priority Inflation

Everything becomes P0.

### Hidden Dependency

Work begins before required data, security, or interface foundations exist.

### Safety Deferral

Approval, deletion, audit, or session revocation are postponed until the end.

### Backlog Sprawl

Future ideas enter Phase 1 and obscure the MVP.

### Test Lag

Features are implemented before their critical tests are defined.

### Vertical Slice Breakage

Teams complete layers independently without validating the full chemistry-exam workflow.

## Success Criteria

The Phase 1 Backlog succeeds if:
- engineers know exactly what to build next
- dependencies and release gates are visible
- every P0 item maps to the MVP or a safety control
- progress produces working vertical slices
- the backlog resists scope creep
- completion can be judged objectively

## Final Principle

Phase 1 should end with a trustworthy Chief that works, not a perfect platform waiting for its first real use.