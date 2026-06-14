# Approval and Execution Model v1.0

## Purpose

This document defines how North Vector turns proposed actions into approved, executed, verified, and auditable outcomes.

The Approval and Execution Model exists to preserve a clear boundary between recommendation and action.

Its purpose is to make sure Chief does not silently cross from thinking into doing.

## Core Principle

Every consequential action should have a visible authority path.

North Vector should know:
- what it is allowed to do
- what requires approval
- who approved it
- what exactly was executed
- whether the action succeeded
- how to recover if it failed

## Primary Objectives

The model should help Chief answer:
- Is this action authorized?
- What approval level applies?
- What exactly will happen?
- What data or service will be changed?
- Is the action reversible?
- Did execution succeed?
- What should happen if something goes wrong?

## Action Lifecycle

Proposal
↓
Risk Classification
↓
Permission Check
↓
Approval Request
↓
Approval Decision
↓
Pre-Execution Validation
↓
Execution
↓
Verification
↓
Audit Logging
↓
Rollback or Follow-Up if Needed

## Action Types

The model should support:
- Read
- Create
- Update
- Send
- Publish
- Delete
- Move
- Merge
- Schedule
- Notify
- Financial
- Administrative

## Action Risk Levels

### Low Risk

Examples:
- create local note
- generate briefing
- create internal task

### Moderate Risk

Examples:
- create calendar event
- update project file
- apply label

### High Risk

Examples:
- send email
- modify shared event
- publish externally
- delete file

### Restricted

Examples:
- transfer money
- place trade
- alter medication instruction
- submit legal filing

Restricted actions should remain disabled unless governed by a separate high-assurance system.

## Approval Modes

### No Approval Required

Used for low-risk internal actions within approved scope.

### Light Confirmation

Used when the action is low risk but externally persisted.

Example:
`Add this task?`

### Explicit Confirmation

Used for externally visible or hard-to-reverse actions.

Example:
`Send this email to Professor Smith now?`

### Strong Reauthentication

Used for highly sensitive actions.

Possible methods:
- biometric
- passcode
- trusted-device confirmation

### Disabled

Action cannot be executed.

## Standard Action Record

Each action should contain:
- action_id
- action_type
- title
- description
- target_system
- target_object
- proposed_payload
- permission_scope
- risk_level
- approval_mode
- approval_status
- approved_by
- approved_at
- execution_status
- execution_started_at
- execution_completed_at
- result
- rollback_status
- related_goal_ids
- related_task_ids
- related_automation_ids
- audit_log_reference

## Approval Statuses

Suggested statuses:
- Not Required
- Pending
- Approved
- Rejected
- Expired
- Revoked
- Superseded

## Execution Statuses

Suggested statuses:
- Proposed
- Queued
- Validating
- Executing
- Succeeded
- Partially Succeeded
- Failed
- Rolled Back
- Canceled

## Approval Request Design

Every approval request should show:
- exact action
- target
- affected system
- reason
- expected result
- whether the action is reversible
- possible consequences
- confirm and cancel controls

Bad request:
`Continue?`

Better request:
`Send this reply to Professor Smith now?`

## Approval Granularity

Approval should apply only to the stated action.

Examples:
- approve one email send
- approve one calendar update
- approve one file deletion

Approval should not silently expand to similar future actions unless a broader policy was explicitly created.

## Approval Expiration

Approvals should expire when:
- time window passes
- target object changes
- payload changes materially
- permission scope changes
- user revokes approval
- risk level increases

## Payload Integrity

The executed payload should match the approved payload.

If meaningful content changes after approval, Chief should request approval again.

Examples:
- recipient changes
- email body changes materially
- event time changes
- file diff changes
- amount changes

## Pre-Execution Validation

Before execution, Chief should verify:
- approval is valid
- permission remains active
- target still exists
- target version is current
- payload matches approval
- dependencies are available
- no conflicting action is in progress
- data is fresh enough

## Idempotency

Each execution should use an idempotency key where possible.

This prevents:
- duplicate email sends
- duplicate calendar events
- duplicate file creation
- duplicate task creation

## Execution Ordering

For multi-step workflows, actions should execute in dependency order.

Example:
1. Create study task.
2. Create calendar block.
3. Link task to event.
4. Update briefing.

## Atomicity

Where possible, related actions should behave atomically.

If one step fails:
- roll back prior steps when safe
- or clearly report partial completion

The system should never imply full success when only part of the workflow completed.

## Verification

After execution, Chief should verify the result.

Examples:
- confirm event exists
- confirm email was sent
- confirm file commit was created
- confirm task status changed

Execution success should be based on provider response, not assumption.

## Result Reporting

A successful result should state:
- what happened
- where
- when
- relevant reference

Example:
`Created the study block for Tuesday at 7:00 PM on your North Vector calendar.`

A failed result should state:
- what failed
- what did not happen
- whether anything partially succeeded
- what remains available

## Partial Success

When a workflow partially succeeds, Chief should report each step.

Example:
- task created
- calendar event failed
- email draft saved

The user should not have to guess the system state.

## Rollback Model

Rollback may include:
- delete newly created object
- restore previous file version
- revert task status
- cancel unsent queued action

Rollback should only occur when:
- technically supported
- safe
- authorized
- the rollback itself does not create greater harm

## Irreversible Actions

Examples:
- sent email
- external publication
- some deletions
- financial transfer

For irreversible actions, the system should:
- require stronger approval
- show a final preview
- verify exact payload
- avoid automatic retries

## Retry Model

Automatic retry may be appropriate for:
- temporary network failure
- provider timeout
- rate limit

Automatic retry should not occur for:
- send email after uncertain provider response
- destructive action
- financial action
- ambiguous target
- permission error

## Timeout Handling

If execution times out:
- do not assume failure or success
- check provider state when possible
- mark status as uncertain
- avoid duplicate retry until resolved

## Concurrency Control

The system should prevent conflicting actions from executing simultaneously.

Examples:
- two updates to the same file
- two schedule changes to the same event
- completion and deletion of the same task

## Version Checks

Before updating or deleting versioned objects, verify current version or revision.

Examples:
- GitHub blob SHA
- calendar event revision
- document modified time
- task version

## User Overrides

Nishad should be able to:
- cancel queued action
- revoke approval
- pause workflow
- modify payload
- request rollback

## Delegated Approval Policies

Future versions may support rules such as:
- allow low-risk task creation without asking
- allow study-block changes within two hours
- always ask before external communication

Delegated policies should remain narrow and inspectable.

## Approval Memory

The system may remember preferences such as:
- always ask before sending email
- do not ask before creating internal notes

It should not infer broad approval from repeated confirmation without explicit consent.

## Device Requirements

Sensitive approvals may require:
- trusted device
- unlocked state
- biometric confirmation
- private screen

Wearables may initiate approval but should hand off restricted actions to a trusted device.

## Audit Logging

Every consequential action should record:
- proposal
- approval request
- approval decision
- payload hash or summary
- execution attempt
- provider response
- verification result
- rollback
- final status

## Notification Rules

Notify Nishad when:
- approval is required
- high-impact action completed
- partial failure occurred
- action remains uncertain
- rollback failed

Routine low-risk success may remain silent.

## Example Email Execution

Proposal:
`Send reply to Professor Smith.`

Risk:
High.

Approval:
Explicit confirmation.

Validation:
- recipient unchanged
- body unchanged
- Gmail permission active

Execution:
Send reply.

Verification:
Provider confirms sent message ID.

Result:
`Email sent successfully.`

## Example File Update

Proposal:
`Update Planning_Engine.md.`

Risk:
Moderate.

Approval:
Explicit user request already present.

Validation:
- repository scope valid
- current file SHA fetched
- intended content confirmed

Execution:
Update file and create commit.

Verification:
Commit SHA returned.

## Failure Modes

### Silent Execution

Action occurs without visible authority.

### Approval Drift

Approved payload changes before execution.

### Duplicate Execution

The same action runs twice.

### False Success

Chief claims completion without verification.

### Partial Failure Obscurity

Some steps fail without clear reporting.

### Irreversible Retry

A sent or destructive action is repeated after uncertainty.

### Scope Violation

Action exceeds approved permission boundaries.

### Weak Cancellation

The user cannot stop queued work.

## Phase 1 Implementation

Phase 1 should support:
- structured action records
- approval modes
- payload preview
- approval expiration
- permission checks
- idempotency
- execution verification
- partial-success reporting
- rollback where supported
- audit logs
- queued-action cancellation

Restricted actions should remain disabled.

## Success Criteria

The Approval and Execution Model succeeds if Nishad can always understand:
- what Chief proposes to do
- what requires approval
- what exact payload was approved
- whether the action succeeded
- what changed
- whether recovery is possible

## Final Principle

Chief should never confuse permission to think with permission to act.