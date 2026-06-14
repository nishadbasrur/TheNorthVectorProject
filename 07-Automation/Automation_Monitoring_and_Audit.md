# Automation Monitoring and Audit v1.0

## Purpose

This document defines how North Vector should monitor automation health, record execution history, detect failures, measure reliability, and provide a clear audit trail.

The Automation Monitoring and Audit system exists to ensure that automated behavior remains visible, explainable, and correctable.

Its purpose is not to produce technical logs for their own sake.

Its purpose is to help Nishad understand what ran, what changed, what failed, and whether the system can be trusted.

## Core Principle

An automation that cannot explain what it did should not be trusted to run again.

Every meaningful automation should leave behind a clear, human-readable record.

## Primary Objectives

The system should help Chief answer:
- What automations ran?
- Why did they run?
- What data did they use?
- What actions did they attempt?
- What changed?
- What failed?
- Was the result verified?
- Does the automation need review, pause, or retirement?

## Monitoring Scope

Monitoring should cover:
- trigger activity
- condition evaluation
- permission checks
- approval state
- execution steps
- external provider responses
- verification results
- retries
- rollback
- notifications
- final outcome

## Standard Automation Run Record

Each run should contain:
- run_id
- automation_id
- automation_version
- trigger_id
- trigger_type
- trigger_source
- started_at
- completed_at
- execution_duration
- status
- conditions_evaluated
- permissions_checked
- approvals_used
- actions_attempted
- actions_succeeded
- actions_failed
- retries
- rollback_attempted
- rollback_result
- verification_status
- output_summary
- error_summary
- related_goal_ids
- related_task_ids
- related_event_ids
- related_risk_ids
- audit_log_reference

## Run Statuses

Suggested statuses:
- Queued
- Running
- Waiting for Approval
- Succeeded
- Partially Succeeded
- Failed
- Canceled
- Skipped
- Timed Out
- Rolled Back
- Uncertain

## Human-Readable Run Summary

Every run should produce a concise summary.

Example:
`Morning Briefing ran at 7:02 AM. Calendar, tasks, and risks were current. The briefing was generated and delivered to the dashboard and phone. No actions required approval.`

Example failure:
`The briefing was generated, but phone delivery failed. The dashboard copy is available.`

## Audit Event Types

The audit system should support events such as:
- Automation Created
- Automation Updated
- Automation Enabled
- Automation Paused
- Trigger Fired
- Condition Passed
- Condition Failed
- Permission Checked
- Approval Requested
- Approval Granted
- Approval Rejected
- Action Started
- Action Succeeded
- Action Failed
- Retry Scheduled
- Rollback Started
- Rollback Completed
- Notification Sent
- Automation Retired

## Audit Event Record

Each audit event should contain:
- audit_event_id
- run_id
- automation_id
- event_type
- timestamp
- actor
- target_system
- target_object
- summary
- structured_details
- severity
- sensitivity
- correlation_id

## Monitoring Dimensions

### Reliability

Measure:
- success rate
- partial success rate
- failure rate
- timeout rate
- uncertain result rate

### Timeliness

Measure:
- trigger-to-start delay
- execution duration
- missed-run rate
- late-run rate

### Correctness

Measure:
- verification success
- duplicate action rate
- rollback rate
- user correction rate

### Noise

Measure:
- unnecessary notifications
- repeated alerts
- user dismissals
- false-positive triggers

### Permission Health

Measure:
- expired permissions
- denied actions
- scope violations prevented
- reauthentication frequency

## Health States

Each automation should have a current health state:
- Healthy
- Degraded
- Attention Needed
- Failing
- Paused
- Disabled

The health state should be based on recent evidence, not a single isolated run unless the failure is severe.

## Failure Classification

Automation failures should be classified as:
- Trigger Failure
- Condition Error
- Permission Error
- Approval Expired
- Authentication Error
- Provider Error
- Rate Limit
- Invalid Input
- Stale Data
- Conflict
- Timeout
- Verification Failure
- Rollback Failure
- Unknown

## Severity Levels

Suggested severity levels:
- Informational
- Low
- Moderate
- High
- Critical

Severity should consider:
- consequence
- reversibility
- affected goals
- external visibility
- data sensitivity
- whether the system state is uncertain

## Verification Monitoring

The system should distinguish:
- action request accepted
- action completed
- action independently verified

Example:

Email provider accepted request:
Not enough by itself.

Sent-message record confirmed:
Verified.

## Uncertain Outcomes

If a provider times out or gives an ambiguous response, the run should become `Uncertain`.

The system should:
- avoid automatic duplicate retry
- inspect provider state when possible
- notify Nishad if the action is consequential
- preserve the exact uncertainty

## Retry Monitoring

Each retry should record:
- reason
- delay
- attempt number
- whether the failure was retryable
- final outcome

Repeated retries should not continue indefinitely.

## Rollback Monitoring

Rollback records should show:
- which actions were reversed
- which actions could not be reversed
- whether rollback succeeded
- remaining inconsistencies

## Duplicate Detection

The monitoring system should detect:
- duplicate tasks
- duplicate calendar events
- duplicate notifications
- duplicate sends
- repeated file creation

Duplicate prevention events should be logged as successful safeguards.

## Drift Detection

Automation drift occurs when behavior no longer matches the original purpose.

Signals may include:
- scope gradually expanding
- new data sources appearing
- increased notification volume
- higher failure rate
- more user overrides
- actions no longer aligned with the linked goal

Drift should trigger review.

## Stale Automation Detection

An automation may be stale when:
- it has not run in a long time
- its trigger source no longer exists
- its linked goal is completed
- permissions remain unused
- its output is repeatedly dismissed

Stale automations should be proposed for pause or retirement.

## User Feedback

Nishad should be able to rate a run as:
- Useful
- Correct but Unnecessary
- Too Early
- Too Late
- Too Strong
- Too Weak
- Incorrect
- Confusing

Feedback should update automation review data.

## Monitoring Dashboard

The dashboard should show:
- active automations
- current health
- last run
- next run
- success rate
- pending approvals
- recent failures
- paused automations
- suggested reviews

## Run Detail View

Each run detail should show:
- trigger
- conditions
- data freshness
- approvals
- actions
- result
- verification
- errors
- retries
- rollback
- final summary

Technical details should remain expandable.

## Alert Rules

Notify Nishad when:
- a high-impact automation fails
- a result is uncertain
- rollback fails
- permission expires
- repeated failures occur
- duplicate actions are detected
- an automation drifts outside expected behavior

Routine successful runs may remain silent.

## Escalation Rules

Suggested escalation:

One low-risk failure:
Log and monitor.

Repeated low-risk failures:
Mark Degraded.

One high-impact failure:
Notify and require review.

Any critical or unauthorized behavior:
Pause automation immediately.

## Automatic Pause Rules

An automation should pause automatically when:
- permission scope is violated
- repeated uncertain outcomes occur
- destructive action verification fails
- rollback fails after a high-impact action
- duplicate external actions are detected
- security anomaly appears

## Review Cadence

Suggested defaults:
- new automation: review after first three runs
- degraded automation: review within one week
- high-risk automation: monthly
- stable low-risk automation: quarterly
- stale automation: review for retirement

## Audit Log Retention

Retention should depend on:
- sensitivity
- action type
- legal or financial relevance
- debugging value
- user preference

High-level summaries may be retained longer than raw technical details.

## Privacy

Audit logs may contain sensitive context.

The system should:
- minimize payload storage
- mask secrets and private values
- restrict sensitive run details
- avoid logging full email bodies, health records, or financial data unless necessary
- support deletion where appropriate

## Security

The audit system should be append-oriented.

Logs should not be silently rewritten.

Corrections should create a new audit event rather than altering history invisibly.

## Export

Nishad should be able to export:
- automation definitions
- run summaries
- failure history
- permission history
- audit events

Exports should respect sensitivity and redaction rules.

## Error Handling

If monitoring itself fails:
`Automation monitoring is temporarily unavailable. Active automations remain paused if their safety checks cannot be verified.`

The system should fail safely rather than continue blindly.

## Example Run Summary

Automation:
`Mentor Follow-Up Assistant`

Trigger:
Commitment due within 24 hours.

Result:
- relationship context loaded
- email draft created
- approval requested
- no email sent

Status:
Waiting for Approval.

## Failure Modes

### Opaque Logs

Technical records exist but are unusable to Nishad.

### False Success

The system records completion without verification.

### Silent Failure

Important automation fails without notice.

### Log Overcollection

Sensitive payloads are stored unnecessarily.

### Audit Mutation

History is rewritten without trace.

### Alert Flood

Every minor failure becomes a notification.

### No Retirement Signal

Unused automations remain active indefinitely.

## Phase 1 Implementation

Phase 1 should support:
- run records
- human-readable summaries
- audit events
- health states
- failure classification
- verification status
- retry and rollback history
- monitoring dashboard
- automatic pause rules
- user feedback
- exportable logs

Advanced anomaly detection can come later.

## Success Criteria

The Automation Monitoring and Audit system succeeds if Nishad can always understand:
- what ran
- why it ran
- what it changed
- whether it succeeded
- what failed
- what remains uncertain
- whether the automation should continue

## Final Principle

Automation earns trust through visible history, verified outcomes, and the ability to stop when something goes wrong.