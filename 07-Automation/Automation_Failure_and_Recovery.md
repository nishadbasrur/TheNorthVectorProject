# Automation Failure and Recovery v1.0

## Purpose

This document defines how North Vector should detect automation failures, contain damage, preserve truth, retry safely, recover state, and communicate clearly when something goes wrong.

The Automation Failure and Recovery system exists because automation without recovery is brittle.

Its purpose is not to pretend failures can be eliminated.

Its purpose is to make failure understandable, bounded, and recoverable.

## Core Principle

When an automation fails, North Vector should stop guessing.

The system should establish what happened, what did not happen, what remains uncertain, and what the safest next step is.

## Primary Objectives

The recovery system should help Chief answer:
- What failed?
- Why did it fail?
- What actions already occurred?
- What remains incomplete?
- Is the current state safe?
- Can the action be retried?
- Can the change be rolled back?
- Does Nishad need to intervene?

## Failure Lifecycle

Failure Detected
↓
Execution Halt or Isolation
↓
State Assessment
↓
Failure Classification
↓
Impact Assessment
↓
Retry or Recovery Decision
↓
Rollback or Compensating Action
↓
Verification
↓
User Communication
↓
Post-Incident Review

## Failure Classes

### Trigger Failure

The expected trigger did not arrive, arrived late, or fired incorrectly.

### Condition Failure

Required conditions could not be evaluated or were invalid.

### Permission Failure

The automation lacked required scope or approval.

### Authentication Failure

A token, session, or credential expired or became invalid.

### Provider Failure

An external service returned an error or became unavailable.

### Rate-Limit Failure

The provider rejected the request because usage limits were exceeded.

### Data Failure

Required data was missing, stale, malformed, or contradictory.

### Conflict Failure

The target object changed after the automation prepared its action.

### Timeout Failure

The provider did not return a clear result before the timeout.

### Validation Failure

The proposed action failed a pre-execution safety or integrity check.

### Execution Failure

The action was attempted but did not complete.

### Verification Failure

The provider claimed success, but the resulting state could not be confirmed.

### Rollback Failure

The system could not restore the prior state.

### Security Failure

The system detected suspicious access, scope violation, or secret exposure.

### Logic Failure

The automation executed according to code but produced an incorrect or misaligned result.

## Failure Severity

Suggested levels:
- Informational
- Low
- Moderate
- High
- Critical

Severity should consider:
- consequence
- reversibility
- external visibility
- affected goals
- data sensitivity
- uncertainty
- whether another person or institution is affected

## Standard Failure Record

Each failure should contain:
- failure_id
- run_id
- automation_id
- failure_type
- severity
- detected_at
- failed_step
- target_system
- target_object
- error_code
- error_message
- known_completed_actions
- known_failed_actions
- uncertain_actions
- affected_goal_ids
- affected_task_ids
- affected_event_ids
- affected_people_ids
- retry_eligibility
- rollback_eligibility
- user_action_required
- containment_status
- recovery_status
- final_resolution
- review_required

## Immediate Containment

When a meaningful failure occurs, North Vector should first prevent additional damage.

Possible containment actions:
- stop remaining workflow steps
- pause the automation
- block retries
- lock the target object
- revoke temporary permission
- suppress duplicate triggers
- preserve current state snapshot
- notify Nishad when necessary

## Safe Failure Rule

When safety checks cannot be completed, the system should fail closed for consequential actions.

Examples:
- do not send if recipient cannot be verified
- do not overwrite if file version is uncertain
- do not delete if rollback is unavailable
- do not retry if send status is unknown

## State Assessment

The system should determine:
- what was attempted
- what provider accepted
- what was independently verified
- what remains uncertain
- whether partial state exists

This assessment should happen before retry or rollback.

## Known vs Uncertain State

North Vector should classify every action as:
- Confirmed Succeeded
- Confirmed Failed
- Not Attempted
- Uncertain

Uncertain state should never be silently treated as failure or success.

## Retry Eligibility

A failure may be retryable when:
- network error is temporary
- provider rate limit has a reset window
- authentication can be refreshed safely
- no irreversible action may already have occurred
- input remains valid
- idempotency protection exists

## Non-Retryable Failures

Automatic retry should not occur when:
- email send status is uncertain
- destructive action may have partially completed
- financial action is involved
- target object changed
- approval expired
- user intent is ambiguous
- security anomaly exists

## Retry Policy

Each retry should define:
- maximum attempts
- delay strategy
- provider-specific limits
- idempotency key
- stop conditions
- escalation threshold

Recommended delay strategies:
- fixed delay
- exponential backoff
- provider-specified retry time

## Retry Record

Each retry should record:
- attempt number
- reason
- scheduled_at
- started_at
- result
- error
- final decision

## Rollback Eligibility

Rollback may be possible for:
- newly created calendar event
- new task
- file update with prior version
- label change
- reversible configuration update

Rollback may not be possible for:
- sent email
- external publication
- some deletions
- financial transfer
- message already delivered

## Rollback Strategy

Possible rollback actions:
- delete newly created object
- restore previous version
- revert task status
- restore prior calendar time
- remove newly applied label
- cancel queued action

## Compensating Actions

When direct rollback is impossible, use compensating actions.

Examples:
- send correction email
- create replacement event
- restore file from commit history
- notify affected person
- create follow-up task

Compensating actions require their own approval when externally visible.

## Partial Failure Handling

For multi-step workflows, the system should report each step separately.

Example:
- task created successfully
- calendar event failed
- notification not sent

The workflow should not be labeled simply `Failed` when useful state exists.

## Recovery Plans

Each automation should define a recovery plan before activation.

The plan should include:
- expected failure modes
- retry rules
- rollback options
- manual recovery steps
- notification policy
- escalation owner

## Manual Recovery

Some failures require Nishad to intervene.

The system should provide:
- plain-language problem
- exact current state
- recommended steps
- affected systems
- links or controls
- warning about what not to repeat

## Provider Recovery

For provider outages:
- preserve queued work
- respect expiration windows
- refresh state before execution
- do not replay stale actions blindly
- notify only if timing or consequence matters

## Authentication Recovery

When authentication expires:
- stop dependent actions
- request reauthentication
- preserve pending proposals
- revalidate data and payload after reconnection
- do not continue using stale approvals automatically

## Permission Recovery

When permission is missing:
- explain the exact capability required
- avoid requesting broader access than necessary
- preserve the proposed action
- resume only after permission and context are revalidated

## Conflict Recovery

When target data changed:
- fetch latest version
- compare differences
- preserve both states
- merge when safe
- request review when consequential

Examples:
- GitHub file changed
- calendar event moved
- task edited externally
- document updated by collaborator

## Timeout Recovery

After timeout:
1. mark result as uncertain
2. query provider state
3. use idempotency or object search
4. avoid immediate duplicate retry
5. notify Nishad if the action is consequential

## Data Recovery

If source data is stale or malformed:
- stop dependent action
- refresh source
- validate normalization
- fall back to last confirmed data only when explicitly safe
- label any estimate clearly

## Security Incident Recovery

If a security anomaly occurs:
- pause affected automation
- revoke or isolate credentials
- stop queued actions
- notify Nishad promptly
- preserve audit evidence
- require explicit reactivation

## Notification Policy

Notify immediately when:
- critical or high-impact action fails
- result remains uncertain
- rollback fails
- external party may be affected
- security issue exists
- manual action is required before deadline

Routine low-risk failures may appear in the monitoring dashboard.

## Failure Message Structure

Every user-facing failure message should include:
- what failed
- what succeeded
- what remains uncertain
- what was not changed
- what happens next

Example:
`The task was created, but the calendar event was not. No duplicate event exists. I can retry after Calendar reconnects.`

## Recovery Verification

Recovery is complete only when:
- desired state is restored or replaced
- unresolved uncertainty is cleared
- dependent records are updated
- notifications are resolved
- automation health is reassessed

## Incident Review

High-severity or repeated failures should produce a review.

Questions:
- What was the root cause?
- Why was the failure not prevented?
- Was containment fast enough?
- Did communication remain accurate?
- Should the automation change, pause, or retire?

## Root Cause Categories

Suggested categories:
- Design Flaw
- Provider Limitation
- Permission Misconfiguration
- Data Quality
- User Input Ambiguity
- Race Condition
- Missing Validation
- Incorrect Assumption
- Infrastructure Failure
- Unknown

## Corrective Actions

A failure review may produce:
- new validation rule
- narrower permission scope
- revised retry policy
- additional confirmation
- new idempotency key
- better monitoring
- changed trigger
- automation pause or retirement

## Recovery Metrics

Useful metrics include:
- mean time to detect
- mean time to contain
- mean time to recover
- repeat failure rate
- rollback success rate
- uncertain outcome rate
- manual intervention rate

Metrics should improve reliability, not create false precision.

## Failure Simulation

Before activation, important automations should test:
- provider outage
- permission expiration
- duplicate trigger
- stale data
- partial completion
- timeout
- rollback failure
- conflicting user edit

## Phase 1 Implementation

Phase 1 should support:
- failure classification
- severity
- immediate containment
- retry eligibility
- limited retries
- rollback where supported
- uncertain-state handling
- partial-failure reporting
- manual recovery instructions
- incident review
- automatic pause for serious failures

Advanced self-healing and predictive fault detection can come later.

## Success Criteria

The Automation Failure and Recovery system succeeds if Nishad can always understand:
- what broke
- what changed
- what remains uncertain
- whether anything needs to be undone
- whether retry is safe
- what action is required next

## Final Principle

Failure is not the opposite of reliable automation.

Uncontrolled failure is.

North Vector should fail visibly, contain damage, and recover with honesty.