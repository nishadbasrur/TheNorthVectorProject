# Automation Architecture v1.0

## Purpose

This document defines how North Vector should design, trigger, authorize, execute, monitor, and review automations.

The Automation Architecture exists to convert repeated intentions into reliable system behavior without creating invisible or uncontrolled action.

Its purpose is not to automate everything.

Its purpose is to automate the right things, within clear boundaries, while preserving Nishad's awareness and authority.

## Core Principle

Automation should reduce friction, not reduce control.

Every automation should have a clear trigger, bounded action, permission level, failure mode, and audit trail.

## Primary Objectives

The architecture should help Chief answer:
- What can be automated?
- What should remain manual?
- What triggers the automation?
- What action will occur?
- What permissions are required?
- What happens if the automation fails?
- How can it be paused, reviewed, or removed?

## Automation Lifecycle

Idea
↓
Definition
↓
Risk Review
↓
Permission Review
↓
Testing
↓
Activation
↓
Execution
↓
Monitoring
↓
Review
↓
Revision, Pause, or Retirement

## Automation Types

### Scheduled Automation

Runs at a defined time or cadence.

Examples:
- morning briefing
- weekly review reminder
- monthly strategy review

### Event-Triggered Automation

Runs when a specific event occurs.

Examples:
- assignment added
- calendar event changed
- email from mentor received
- task completed

### Condition-Based Automation

Runs when a monitored condition becomes true.

Examples:
- chemistry preparation falls behind
- account balance drops below threshold
- opportunity deadline is within three days

### User-Initiated Automation

Runs only when Nishad explicitly invokes it.

Examples:
- replan my day
- generate weekly review
- draft follow-up emails

### Approval-Gated Automation

Prepares an action automatically but waits for confirmation before execution.

Examples:
- draft email
- propose calendar changes
- prepare GitHub commit

### Multi-Step Workflow

Coordinates several actions in sequence.

Example:
- read academic deadlines
- create tasks
- create study blocks
- update briefing

## Standard Automation Record

Each automation should contain:
- automation_id
- title
- description
- automation_type
- status
- trigger
- conditions
- actions
- permission_scope
- approval_mode
- priority
- failure_policy
- retry_policy
- timeout
- dependencies
- related_goal_ids
- related_project_ids
- owner
- created_at
- updated_at
- last_run_at
- next_run_at
- last_result
- audit_log_reference

## Automation Statuses

Suggested statuses:
- Draft
- Testing
- Active
- Paused
- Failed
- Disabled
- Retired

## Trigger Model

Triggers may include:
- time
- calendar event
- email received
- file changed
- task status changed
- location entered
- risk threshold crossed
- opportunity detected
- voice command
- manual button

Each trigger should be explicit and inspectable.

## Condition Model

Conditions may include:
- time window
- priority threshold
- risk level
- location
- device state
- user availability
- permission state
- data freshness
- previous run result

The system should avoid running automations on stale or incomplete data.

## Action Model

Actions may include:
- generate briefing
- create task
- update memory
- draft email
- create calendar event
- send notification
- create GitHub file
- update dashboard
- request confirmation

Actions should be atomic where possible.

## Permission Model

Every automation should declare:
- data it may read
- actions it may perform
- scope
- approval requirement
- expiration
- device restrictions

Automations should inherit the Integration Permission Model and never exceed it.

## Approval Modes

### Fully Manual

Automation only prepares recommendations.

### Confirm Every Run

Each execution requires approval.

### Confirm High-Impact Actions

Routine steps may proceed; sensitive actions wait for approval.

### Scoped Autonomous

Automation may execute within narrow approved boundaries.

### Disabled

No action may occur.

## Risk Classification

Each automation should be classified as:
- Low Risk
- Moderate Risk
- High Risk
- Restricted

Low-risk examples:
- generate daily briefing
- create local note

High-risk examples:
- send external message
- modify shared calendar
- delete files

Restricted examples:
- financial transaction
- medical decision
- legal submission

## Pre-Execution Checks

Before running, the automation should verify:
- trigger is valid
- data is fresh enough
- permissions remain active
- dependencies are available
- action is within scope
- no conflicting automation is running
- no user override blocks execution

## Execution Model

Recommended execution steps:
1. Load automation definition.
2. Validate trigger.
3. Check conditions.
4. Check permissions.
5. Assemble minimal context.
6. Execute actions in order.
7. Record results.
8. Notify only when useful.
9. Update related systems.

## Idempotency

Automations should avoid duplicate effects.

Examples:
- do not create the same task twice
- do not send the same reminder repeatedly
- do not create duplicate calendar events

Each run should use a unique execution key where possible.

## Retry Policy

Retries should depend on failure type.

Retryable:
- temporary network failure
- provider rate limit
- short service outage

Not automatically retryable:
- permission denied
- ambiguous target
- destructive conflict
- invalid input

Retries should be limited and logged.

## Failure Policy

Each automation should define what happens when it fails.

Possible policies:
- stop immediately
- skip failed step and continue
- retry later
- request user input
- roll back prior actions
- create an alert

## Rollback

Where technically possible, automations should preserve a rollback path.

Examples:
- remove newly created event
- revert file update
- restore prior task status

Rollback should not be assumed for irreversible external actions.

## Conflict Handling

Automations may conflict when they:
- modify the same event
- update the same file
- create competing schedules
- send duplicate alerts

Conflict resolution should prioritize:
1. Safety and health
2. User-approved manual changes
3. Newer explicit instruction
4. Higher-priority automation
5. More specific scope

## Rate Limits and Throttling

The system should limit:
- notification frequency
- API calls
- repeated scans
- duplicate checks
- expensive reasoning cycles

Automation should not become a background resource drain.

## Human-in-the-Loop Design

North Vector should keep Nishad involved when:
- stakes are high
- intent is ambiguous
- action is externally visible
- consequences are hard to reverse
- confidence is low

## Audit Logging

Every run should record:
- automation
- trigger
- data sources
- conditions evaluated
- actions attempted
- actions completed
- approvals requested
- errors
- retries
- final result
- timestamp

## Notification Policy

Automations should notify Nishad when:
- action requires approval
- important action completed
- failure affects a meaningful goal
- risk or opportunity threshold changed

Routine successful runs may remain silent.

## Testing

Before activation, automations should support:
- dry run
- sandbox mode
- sample data
- preview of actions
- permission simulation
- failure simulation

## Automation Templates

Possible templates:
- Morning Briefing
- Weekly Review
- Assignment Intake
- Exam Preparation Monitor
- Mentor Follow-Up
- Opportunity Deadline Watch
- Calendar Conflict Monitor
- Financial Payment Reminder
- Health Recovery Check

Templates should remain editable.

## Example Automation

Title:
`Morning Briefing`

Trigger:
Every day at 7:00 AM.

Conditions:
- user is not in travel override mode
- calendar and task data are less than one hour old

Actions:
1. Read today's schedule.
2. Read active priorities.
3. Evaluate risks and opportunities.
4. Generate briefing.
5. Deliver to phone and dashboard.

Approval Mode:
Scoped Autonomous.

Risk:
Low.

## Example Approval-Gated Workflow

Title:
`Mentor Follow-Up Assistant`

Trigger:
Commitment due within 24 hours.

Actions:
1. Read relationship context.
2. Draft email.
3. Present draft.
4. Wait for approval.
5. Send only after explicit confirmation.

## Privacy

Automations should use the minimum necessary data.

They should:
- avoid broad background scanning
- respect no-memory mode
- hide sensitive details on public devices
- expire temporary context
- preserve permission boundaries

## Security

Automations should never:
- expose secrets
- bypass authentication
- expand scope without approval
- execute restricted actions silently
- continue after permission revocation

## Monitoring

The system should monitor:
- run success rate
- failure rate
- average latency
- duplicate actions
- unnecessary alerts
- stale data usage
- user overrides

## Review Cadence

Suggested review cadence:
- new automation: after first three runs
- high-risk automation: monthly
- stable low-risk automation: quarterly
- unused automation: pause or retire

## Retirement

An automation should be retired when:
- goal no longer exists
- trigger is obsolete
- value is low
- failure rate is high
- user no longer wants it
- a better workflow replaces it

Retirement should preserve historical logs when useful.

## Failure Modes

### Invisible Automation

Actions occur without clear awareness.

### Automation Sprawl

Too many workflows accumulate.

### Scope Creep

Automation gradually exceeds original authority.

### Duplicate Action

The same effect occurs more than once.

### Stale Data Execution

Automation acts on outdated information.

### Alert Spam

Every run generates a notification.

### Fragile Workflow

One failed step breaks everything without recovery.

### Over-Automation

Judgment-heavy tasks are automated too early.

## Phase 1 Implementation

Phase 1 should support:
- scheduled automations
- manual and event triggers
- approval-gated actions
- narrow scoped autonomy
- dry runs
- audit logs
- retries
- duplicate protection
- pause and disable controls
- basic templates

Complex multi-agent workflows and restricted-action automation should come later.

## Success Criteria

The Automation Architecture succeeds if Nishad can always understand:
- what will run
- why it will run
- what it can access
- what it will do
- what requires approval
- what happened last time
- how to stop it

## Final Principle

The best automation is not the one that does the most.

It is the one that removes friction while preserving judgment, visibility, and control.