# MVP Scope and Acceptance Criteria v1.0

## Purpose

This document defines the Minimum Viable Product for North Vector and the exact criteria required to consider that MVP complete.

The MVP exists to prove that North Vector can operate as a trustworthy personal operating system before the project expands into broad integrations, ambient voice, wearables, or high-autonomy workflows.

Its purpose is not to represent the full vision.

Its purpose is to deliver the smallest version of Chief that is genuinely useful, inspectable, secure, and worth building on.

## Core Principle

The MVP should prove the system's hardest assumptions, not showcase the largest number of features.

It should demonstrate that North Vector can remember carefully, reason with context, plan against real constraints, propose actions safely, and remain under Nishad's control.

## MVP Product Statement

The MVP is a single-user desktop-first application where Nishad can:
- communicate with Chief through text
- create and manage goals, projects, tasks, commitments, events, risks, and memories
- inspect and correct what the system remembers
- connect one Google Calendar account with narrow permissions
- receive a daily briefing
- generate and revise a day plan
- complete a weekly review
- approve calendar writes explicitly
- inspect audit history
- export and delete personal data

## MVP Goals

The MVP should prove:
- the canonical object model works
- memory can be useful without becoming invasive
- retrieval can assemble relevant context
- planning can connect goals, tasks, commitments, and calendar reality
- Chief can separate recommendation from action
- permissions and approvals are understandable
- external writes can be verified
- data can be inspected, corrected, exported, and deleted

## Non-Goals

The MVP should not include:
- always-listening voice
- wake-word detection
- smart glasses
- wearable interfaces
- autonomous email sending
- Gmail integration
- academic portal integration
- financial integrations
- health integrations
- continuous location tracking
- weather integration
- multiple users
- delegated access
- autonomous deletion
- financial actions
- medical decisions
- legal submissions
- multi-agent orchestration

## Target User

The MVP is for one user:
- Nishad

It should optimize for:
- personal use
- desktop interaction
- high trust
- clear control
- future expansion

## Supported Platforms

Phase 1 target:
- modern desktop browser
- responsive enough for basic mobile access

Native mobile and wearable applications are outside MVP scope.

## Core MVP Capabilities

### 1. Authentication and Session Management

The MVP should support:
- secure sign-in
- one primary account
- trusted-device registration
- session expiration
- logout
- session revocation
- reauthentication for sensitive settings and broad deletion

### 2. Canonical Objects

The MVP should support:
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

### 3. Relationship Graph

The MVP should support direct typed relationships such as:
- task supports goal
- project supports goal
- commitment involves person
- risk threatens project
- decision creates task
- event scheduled for task
- memory derived from source

### 4. Chief Conversation

The MVP should support:
- text-based sessions
- current objective detection
- local context retrieval
- structured answers
- uncertainty disclosure
- session summaries
- follow-up continuity
- explicit proposed-action objects

### 5. Memory Lifecycle

The MVP should support:
- explicit memory save
- candidate memory creation
- memory confirmation
- confidence
- source tracking
- review date
- correction
- contradiction
- archive
- expiration
- deletion
- no-memory mode

### 6. Memory Inspector

The MVP should let Nishad:
- view active memories
- view candidate memories
- inspect source and confidence
- edit wording
- confirm or reject candidates
- archive
- delete
- see recent memory changes

### 7. Goals, Projects, Tasks, and Commitments

The MVP should support:
- create and edit goals
- create projects linked to goals
- create tasks linked to goals or projects
- distinguish commitments from ordinary tasks
- due dates
- priority
- status
- next action
- postponement count
- completion

### 8. Today View

The MVP should show:
- today's events
- top priorities
- active commitments
- current risks
- next action
- proposed plan
- pending approvals

### 9. Daily Briefing

The MVP should generate a daily briefing using:
- local goals
- tasks
- commitments
- risks
- connected calendar data

The briefing should include:
- schedule overview
- top priorities
- important deadline or commitment
- current risk
- recommended first action

### 10. Planning Engine

The MVP should support:
- fixed versus flexible time
- task durations
- deadlines
- buffers
- dependency ordering
- next-action selection
- basic replanning
- preserving fixed calendar commitments

### 11. Weekly Review

The MVP should support a structured review of:
- wins
- misses
- goal progress
- completed tasks
- overdue commitments
- risks
- decisions
- lessons
- next-week priorities

### 12. Google Calendar Read Integration

The MVP should support:
- one Google account
- read approved calendars
- fetch events
- normalize events
- classify fixed and flexible events
- show last sync
- show stale-data warning
- detect direct overlap

### 13. Google Calendar Write Proposal

The MVP should support:
- proposed event creation
- exact event preview
- target calendar selection
- explicit approval
- verified creation
- audit record

Existing event modification and deletion may remain outside the first MVP cut if implementation risk is too high.

### 14. Approval and Execution

The MVP should support:
- proposed action record
- approval status
- payload preview
- approval expiration
- execution status
- provider verification
- failure reporting
- no silent external action

### 15. Audit Log

The MVP should record:
- sign-in and session events
- object creation and update
- memory changes
- calendar sync
- approval requests
- calendar action execution
- deletion events
- permission changes

### 16. Settings and Permissions

The MVP should allow Nishad to manage:
- general preferences
- no-memory mode
- memory settings
- connected Calendar account
- calendar scope
- approval policy
- trusted devices
- session revocation
- export
- deletion

### 17. Data Export

The MVP should support export of:
- canonical objects
- memories
- goals
- tasks
- reviews
- audit summaries
- permissions

Preferred formats:
- JSON
- Markdown summaries

### 18. Data Deletion

The MVP should support:
- delete one object
- delete one memory
- delete one session summary
- disconnect Calendar
- delete derived Calendar data
- delete full account data

Deletion should propagate to active retrieval indexes and caches.

## MVP User Stories

### Memory Story

As Nishad, I can tell Chief something important, save it as memory, inspect the exact wording and source, revise it, and delete it later.

### Planning Story

As Nishad, I can create a goal, link tasks and commitments to it, and receive a realistic day plan that respects my calendar.

### Calendar Story

As Nishad, I can connect Google Calendar with read access, see my schedule, and approve the creation of a new study block.

### Review Story

As Nishad, I can complete a weekly review and use the resulting lessons and priorities in future planning.

### Privacy Story

As Nishad, I can use No-Memory Mode, inspect what the system knows, export my data, and verify that deleted memory no longer appears in retrieval.

### Audit Story

As Nishad, I can see what Chief proposed, what I approved, what action occurred, and whether it succeeded.

## MVP Primary Workflow

The key end-to-end workflow should be:

1. Nishad tells Chief about an upcoming chemistry exam.
2. Chief creates or proposes an Event object.
3. Chief creates a Goal or Milestone relationship.
4. Chief proposes study tasks.
5. Chief estimates effort and available time.
6. Chief reads Calendar.
7. Chief proposes study blocks.
8. Nishad approves one Calendar event creation.
9. Chief verifies the event exists.
10. The exam and preparation appear in the daily briefing.
11. Progress appears in the weekly review.
12. Nishad can inspect the memory, task, event, and audit history.

This workflow is the principal MVP acceptance test.

## Functional Acceptance Criteria

### Authentication

The MVP passes when:
- an unauthenticated user cannot access personal data
- Nishad can sign in and sign out
- sessions expire according to policy
- a revoked session can no longer access the application
- sensitive settings require reauthentication

### Canonical Object Model

The MVP passes when:
- each supported object has a stable ID
- objects preserve source, sensitivity, timestamps, and version
- object updates increment version
- invalid schemas are rejected
- soft-deleted objects leave active views and retrieval

### Relationships

The MVP passes when:
- supported object links can be created and queried
- invalid source-target combinations are rejected
- deleting an object identifies affected relationships
- direct relationship traversal works reliably

### Chief Conversation

The MVP passes when:
- sessions preserve the current objective
- Chief can reference objects created earlier in the session
- relevant stored memory may be retrieved
- unrelated sensitive memory is excluded
- uncertainty and stale data are labeled
- external actions remain proposals until approved

### Memory

The MVP passes when:
- explicit memory can be saved
- inferred memory remains a candidate
- candidate memory can be confirmed or rejected
- source and confidence are visible
- a memory can be revised with version history
- a memory can be archived or deleted
- deleted memory no longer appears in ordinary retrieval
- No-Memory Mode blocks new durable memory

### Goals and Tasks

The MVP passes when:
- a goal can be created
- a project can link to a goal
- a task can link to a goal or project
- a commitment is visually and logically distinct from a task
- tasks can be completed, deferred, and reprioritized
- overdue commitments are surfaced

### Today View

The MVP passes when:
- today's Calendar events load
- top priorities are visible
- risks and commitments are visible
- the view shows pending approvals
- stale Calendar data is clearly labeled

### Daily Briefing

The MVP passes when:
- the briefing uses current local data and Calendar
- the briefing identifies one primary action
- the briefing does not become a complete task dump
- missing or stale data is disclosed
- sensitive content follows privacy settings

### Planning

The MVP passes when:
- fixed events are not moved automatically
- task duration is considered
- deadlines and buffers influence placement
- impossible overlap is detected
- replan produces a revised sequence without duplicating tasks

### Weekly Review

The MVP passes when:
- the review covers the selected week
- completed and missed work are accurately summarized
- overdue commitments are included
- lessons can be saved as memory candidates
- next-week priorities can be created

### Calendar Read

The MVP passes when:
- OAuth scope is narrow and documented
- events are retrieved from approved calendars
- event times and timezone are correct
- last sync is visible
- authentication expiration is handled clearly
- overlap detection works

### Calendar Write

The MVP passes when:
- the exact event payload is shown
- approval is bound to that payload
- a changed payload requires new approval
- duplicate event creation is prevented
- provider success is verified
- failure does not create a false success message

### Approval and Execution

The MVP passes when:
- each consequential action has an action record
- approval status is visible
- expired approval cannot execute
- the executed payload matches the approved payload
- partial or uncertain failure is reported honestly

### Audit Log

The MVP passes when:
- important events are recorded
- actor, time, action, and target are visible
- audit history cannot be silently edited through the normal UI
- sensitive values are not unnecessarily exposed

### Settings and Permissions

The MVP passes when:
- Calendar can be connected and disconnected
- scope can be inspected
- active devices and sessions can be reviewed
- No-Memory Mode can be enabled
- export and deletion controls are easy to locate

### Export

The MVP passes when:
- JSON export contains canonical IDs, types, timestamps, and relationships
- Markdown export is readable
- sensitive export requires reauthentication
- export action is logged

### Deletion

The MVP passes when:
- deletion scope is shown before confirmation
- primary record is removed or soft-deleted according to policy
- retrieval index no longer returns the deleted record
- caches are invalidated
- a deletion receipt explains what remains

## Non-Functional Acceptance Criteria

### Security

The MVP should pass:
- authentication tests
- authorization tests
- session revocation tests
- approval-payload mutation tests
- secret scanning
- prompt-injection tests for retrieved Calendar text
- deletion propagation tests

### Privacy

The MVP should ensure:
- no hidden long-term memory creation
- no broad Calendar access beyond approved scope
- no raw sensitive content in ordinary logs
- privacy modes work as described
- sensitive data is hidden on public surfaces

### Reliability

The MVP should:
- preserve data through ordinary restarts
- recover from provider timeout without duplicate writes
- show stale data rather than pretending sync is current
- fail closed for unauthorized external actions

### Performance

Initial targets:
- ordinary object views load within two seconds
- local search and retrieval return within one second for ordinary datasets
- Calendar sync completes within a practical interactive window
- Chief begins streaming a response within a few seconds under normal conditions

### Accessibility

The MVP should support:
- keyboard navigation
- visible focus states
- screen-reader labels
- sufficient contrast
- scalable text
- reduced motion
- non-color status cues

### Usability

A new session should make it obvious:
- where to talk to Chief
- what the current objective is
- what action is proposed
- whether anything requires approval
- where memory can be inspected

## Data Acceptance Criteria

The MVP should preserve:
- stable object IDs
- source references
- current version
- confidence
- sensitivity
- retention class
- relationships
- audit history

The MVP should reject or flag:
- invalid timestamps
- unsupported object types
- missing required source data
- duplicate external IDs
- conflicting Calendar versions

## Security Release Gate

The MVP should not release if:
- external actions can occur without valid approval
- revoked sessions remain active
- deleted memory remains retrievable
- secrets appear in the repository
- Calendar scope is broader than documented
- audit records are missing for external writes
- prompt injection can authorize tool actions

## Privacy Release Gate

The MVP should not release if:
- memory creation is invisible
- No-Memory Mode still creates durable memory
- sensitive data appears in public previews
- account export or deletion is inaccessible
- Calendar disconnection leaves active synchronization

## Quality Release Gate

The MVP should not release if:
- the main end-to-end workflow fails
- Calendar writes can duplicate
- stale data appears current
- major object relationships break
- weekly review produces unsupported conclusions
- Chief cannot explain the source of consequential context

## MVP Test Scenarios

### Scenario 1: Save and Delete Memory

1. Nishad says a stable preference.
2. Chief proposes memory.
3. Nishad confirms.
4. Memory appears in Inspector.
5. Memory is used in a relevant response.
6. Nishad deletes it.
7. Retrieval no longer returns it.

### Scenario 2: No-Memory Session

1. Enable No-Memory Mode.
2. Discuss a personal preference.
3. End session.
4. Verify no candidate or active memory was created.

### Scenario 3: Chemistry Exam Plan

1. Create exam event.
2. Create tasks and goal relationship.
3. Read Calendar.
4. Detect available windows.
5. Propose study block.
6. Approve Calendar creation.
7. Verify event.
8. Include it in briefing.

### Scenario 4: Approval Mutation

1. Propose Calendar event at 7:00 PM.
2. Approve it.
3. Change time to 8:00 PM before execution.
4. Verify old approval is invalid.
5. Require fresh approval.

### Scenario 5: Calendar Conflict

1. Fetch event version.
2. Modify event externally.
3. Attempt write based on stale version.
4. Verify North Vector stops and reports conflict.

### Scenario 6: Session Revocation

1. Sign in on two devices.
2. Revoke one session.
3. Verify revoked device loses access.

### Scenario 7: Export

1. Request full export.
2. Reauthenticate.
3. Generate export.
4. Verify canonical fields and relationships.
5. Record audit event.

### Scenario 8: Deletion Receipt

1. Delete one memory with related evidence.
2. Show affected records.
3. Complete deletion.
4. Verify index and cache cleanup.
5. Provide receipt.

## MVP Metrics

Useful initial metrics include:
- daily briefing usefulness
- memory correction rate
- memory deletion success rate
- Calendar sync success rate
- duplicate action rate
- approval rejection rate
- weekly review completion
- stale-data incidents
- retrieval relevance feedback
- number of unsupported or confusing recommendations

Metrics should not optimize for engagement time.

## MVP Operational Boundaries

The MVP may:
- read local data
- read approved Calendar data
- create local objects
- propose Calendar event creation
- execute approved Calendar event creation

The MVP may not:
- send email
- publish externally
- modify shared files
- delete provider data
- move money
- make medical decisions
- track continuous location

## MVP Definition of Done

The MVP is complete when:
1. The primary chemistry-exam workflow passes end to end.
2. Memory can be created, inspected, corrected, and deleted.
3. Chief can generate a useful daily briefing and weekly review.
4. Calendar read access is reliable and scoped.
5. Calendar event creation requires and verifies approval.
6. Audit history reconstructs consequential actions.
7. No-Memory Mode works.
8. Export and deletion work.
9. Critical security and privacy tests pass.
10. Nishad can use the system for one full week without losing trust in what it remembers or does.

## Post-MVP Expansion Gate

The project should not add Gmail, academic systems, voice, health, finance, location, or wearables until:
- MVP usage reveals real value
- critical failures are resolved
- memory quality is acceptable
- Calendar synchronization is stable
- permissions and deletion are trusted
- the architecture has been revised using actual usage evidence

## Failure Modes

### MVP Inflation

The product tries to include the full North Vector vision.

### Demo-Only Success

A scripted scenario works, but ordinary usage fails.

### Invisible Memory

The system remembers without clear inspection or control.

### Calendar Theater

Events appear connected but synchronization and conflict handling are weak.

### Fake Approval

The UI asks for confirmation but the backend does not enforce payload binding.

### Data Deletion Theater

Records disappear from views but remain retrievable.

### Premature Autonomy

Chief acts externally before monitoring and recovery are reliable.

### Architecture Without Use

The MVP implements infrastructure but fails to help with a real week of planning.

## Success Criteria

The MVP succeeds if Nishad can use it as a trustworthy daily operating layer that:
- knows the goals and commitments that matter
- remembers only what deserves to persist
- creates realistic plans
- respects Calendar reality
- asks before acting
- proves what happened
- lets Nishad correct or delete anything it knows

## Final Principle

The MVP should not feel like a miniature version of every future feature.

It should feel like the first complete, trustworthy version of Chief.