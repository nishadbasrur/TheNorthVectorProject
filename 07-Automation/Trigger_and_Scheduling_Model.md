# Trigger and Scheduling Model v1.0

## Purpose

This document defines how North Vector schedules work, detects events, evaluates conditions, and decides when an automation should run.

The Trigger and Scheduling Model exists to make automation timing reliable, explainable, and safe.

Its purpose is not merely to run tasks on a clock.

Its purpose is to determine when action is appropriate, whether the required context is current, and how to avoid duplicate or mistimed execution.

## Core Principle

A trigger should not cause action by itself.

North Vector should verify that the trigger is valid, the conditions are satisfied, the data is current, and the action remains authorized.

## Primary Objectives

The model should help Chief answer:
- What should cause this automation to run?
- When should it run?
- What conditions must be true first?
- What happens if a trigger arrives twice?
- What happens if the system was offline?
- Which timezone applies?
- When should execution be delayed, skipped, or canceled?

## Trigger Types

### Time-Based Trigger

Runs at a specified time or cadence.

Examples:
- every day at 7:00 AM
- every Sunday at 6:00 PM
- first day of each month
- 30 minutes before an event

### Event-Based Trigger

Runs when an external event occurs.

Examples:
- calendar event created
- email received
- file updated
- task completed
- grade posted
- permission revoked

### Condition-Based Trigger

Runs when a monitored state crosses a threshold.

Examples:
- risk level becomes Orange
- assignment remains incomplete within three days of deadline
- account balance falls below threshold
- sleep remains below target for several nights

### Manual Trigger

Runs only when Nishad explicitly invokes it.

Examples:
- generate briefing now
- replan today
- run weekly review

### Composite Trigger

Requires multiple events or conditions.

Example:
`Run the exam-risk workflow when the exam is within seven days and preparation is below target.`

### Dependency Trigger

Runs when another automation or workflow step completes.

Example:
`After academic synchronization finishes, update the daily briefing.`

## Standard Trigger Record

Each trigger should contain:
- trigger_id
- automation_id
- trigger_type
- source
- event_name
- schedule_expression
- timezone
- conditions
- debounce_window
- deduplication_key
- active_from
- active_until
- last_fired_at
- next_expected_at
- status
- created_at
- updated_at

## Scheduling Models

### One-Time Schedule

Runs once at a defined date and time.

### Recurring Schedule

Runs on a repeating cadence.

Examples:
- daily
- weekly
- monthly
- custom recurrence

### Relative Schedule

Runs relative to another event.

Examples:
- two days before exam
- 30 minutes before departure
- one hour after work ends

### Windowed Schedule

Runs within a permitted time range.

Example:
`Generate the briefing between 6:30 and 7:00 AM when calendar data is current.`

### Flexible Schedule

Runs at the most suitable time within a broader window.

Example:
`Schedule the weekly review sometime Sunday afternoon when no fixed event is active.`

## Schedule Expression

The model should support:
- explicit date and time
- recurring rules
- relative offsets
- preferred windows
- blackout windows
- timezone
- grace period
- missed-run policy

## Timezone Rules

Every schedule should specify a timezone or inherit one explicitly.

North Vector should:
- use Nishad's active local timezone when appropriate
- preserve source-event timezone
- handle travel
- handle daylight-saving changes
- avoid silently shifting fixed local-time routines

## Daylight-Saving Behavior

For schedules such as `7:00 AM local time`, the automation should remain at 7:00 AM after daylight-saving changes.

For fixed UTC schedules, the local display time may change.

The distinction should be visible.

## Event Trigger Sources

Possible sources include:
- Google Calendar
- Gmail
- Google Drive
- GitHub
- academic systems
- task systems
- financial data
- health data
- location
- weather
- North Vector internal state

## Event Normalization

Incoming events should be normalized with:
- event_id
- source
- event_type
- occurred_at
- received_at
- object_id
- payload_reference
- deduplication_key
- confidence
- synchronization_status

## Condition Evaluation

Conditions may evaluate:
- object state
- risk level
- priority
- deadline proximity
- user availability
- device status
- location
- privacy mode
- data freshness
- permission status
- previous execution result

## Condition Operators

The model should support:
- equals
- not equals
- greater than
- less than
- contains
- changed from
- changed to
- within time window
- exists
- does not exist
- all conditions true
- any condition true

## Pre-Trigger Validation

Before firing, the model should verify:
- trigger is enabled
- automation is active
- current time is within active range
- required permissions exist
- source data is current enough
- duplicate execution is not already in progress
- blackout rules do not apply

## Debouncing

Debouncing prevents rapid repeated events from causing repeated runs.

Example:
Several edits to one calendar event within one minute should produce one evaluation rather than several separate workflows.

Each trigger should define a debounce window where useful.

## Deduplication

Each execution should use a deduplication key.

Examples:
- automation ID plus date
- message ID plus workflow type
- event ID plus version
- assignment ID plus deadline window

The same trigger should not produce duplicate actions.

## Trigger Priority

Triggers may be classified as:
- Critical
- High
- Standard
- Background

Critical triggers may interrupt normal scheduling.

Background triggers should wait for available resources.

## Quiet Hours

Schedules should respect user-defined quiet hours.

During quiet hours:
- low-priority actions may run silently
- notifications may be deferred
- high-priority actions may run if safe
- critical alerts may still surface

## Blackout Windows

Automations may be blocked during:
- exams
- sleep
- driving
- lectures
- important meetings
- travel transitions
- user-defined focus time

A blocked run should follow the automation's missed-run policy.

## User Availability

Some triggers should account for whether Nishad is available.

Examples:
- do not begin interactive weekly review during class
- delay a nonurgent confirmation until after work
- avoid spoken briefing during a meeting

## Data Freshness Rules

Each trigger should define the maximum acceptable age of required data.

Examples:
- daily briefing calendar data: less than one hour old
- financial balance alert: less than 24 hours old
- current travel alert: less than 10 minutes old

If data is stale, the system should refresh or defer.

## Missed-Run Policies

When a scheduled run is missed, possible policies include:

### Run Immediately

Use when lateness does not reduce value.

### Run at Next Suitable Window

Use for flexible routines.

### Skip

Use when the original window has passed and a late run would be confusing.

### Ask User

Use when execution remains valuable but timing matters.

### Escalate

Use when the missed run creates risk.

## Offline Behavior

When the system is offline:
- local triggers may queue
- cloud triggers may be received later
- missed-run policy should be applied after reconnection
- stale events should not execute blindly

## Trigger Expiration

Event and condition triggers should expire when:
- the deadline passes
- the underlying object is deleted
- the automation is retired
- the trigger condition is no longer relevant

## Trigger Cancellation

A trigger may be canceled by:
- user action
- permission revocation
- automation pause
- object deletion
- goal completion
- dependency failure

## Relative Scheduling

Relative triggers should remain linked to the source object.

Example:
`Two days before exam`

If the exam date changes, the trigger should recalculate.

## Recurrence Rules

Recurring schedules should support:
- interval
- day of week
- day of month
- start date
- optional end date
- exception dates
- skipped occurrences

## Monthly Edge Cases

For schedules on dates such as the 31st:
- define whether to use the last day of shorter months
- preserve the policy visibly
- avoid silent drift

## Scheduling Conflicts

Automations may compete for:
- execution resources
- user attention
- the same target object
- the same notification window

Conflict resolution should consider:
- priority
- urgency
- user availability
- object ownership
- sequence dependencies

## Trigger Ordering

When several triggers occur together, recommended order:
1. Safety and health
2. Legal and financial obligations
3. Critical academic and professional risks
4. User-requested actions
5. High-value opportunities
6. Routine maintenance
7. Background synchronization

## Eventual Consistency

External integrations may deliver updates late or out of order.

North Vector should compare:
- event timestamp
- provider version
- received timestamp
- current object state

Late events should not overwrite newer truth.

## Testing

Triggers should support:
- simulated event
- simulated time
- condition preview
- next-run preview
- missed-run simulation
- duplicate-event simulation
- timezone simulation

## Trigger Preview

Before activation, the interface should show:
- when it will run
- what event will fire it
- conditions required
- quiet-hour behavior
- missed-run behavior
- next expected execution

## Monitoring

The system should monitor:
- trigger fire count
- skipped count
- duplicate suppression count
- average delay
- stale-data blocks
- missed runs
- false triggers

## Audit Log

Each trigger evaluation should record:
- trigger received
- source
- conditions evaluated
- result
- reason for firing or skipping
- deduplication result
- execution created
- timestamp

## Example Scheduled Trigger

Automation:
`Morning Briefing`

Trigger Type:
Time-Based

Schedule:
Every day at 7:00 AM local time.

Conditions:
- calendar sync less than one hour old
- user not in travel override

Missed-Run Policy:
Run within 30 minutes, otherwise skip and show a passive dashboard notice.

## Example Composite Trigger

Automation:
`Exam Risk Monitor`

Trigger:
- exam within seven days
- preparation completion below 50%
- course risk not already Orange or higher

Action:
Create a risk evaluation and propose a recovery plan.

## Failure Modes

### Trigger Storm

Many duplicate events create repeated execution.

### Timezone Drift

Automation runs at the wrong local time.

### Stale Trigger

An obsolete event still launches a workflow.

### Missed-Run Confusion

The system runs late when the action no longer makes sense.

### Over-Scheduling

Too many recurring triggers accumulate.

### Condition Blindness

A time trigger runs despite invalid context.

### Silent Skipping

Important automation does not run and no explanation is preserved.

## Phase 1 Implementation

Phase 1 should support:
- one-time schedules
- recurring schedules
- relative schedules
- manual triggers
- event triggers
- simple condition evaluation
- timezone handling
- deduplication
- missed-run policies
- quiet hours
- audit logging
- trigger preview

Complex event-stream processing and predictive scheduling can come later.

## Success Criteria

The Trigger and Scheduling Model succeeds if Nishad can always understand:
- what will trigger an automation
- when it will run
- what conditions are required
- what happens if the system is offline
- whether duplicate execution is prevented
- why a run fired, waited, or was skipped

## Final Principle

Good automation depends less on what the system can do than on knowing exactly when it should do it.