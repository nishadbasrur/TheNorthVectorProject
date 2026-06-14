# Task and Commitment View Design v1.0

## Purpose

This document defines how North Vector should present tasks, promises, obligations, habits, milestones, and follow-up responsibilities.

The Task and Commitment View exists to make execution visible without turning the interface into an endless checklist.

Its job is to distinguish ordinary tasks from commitments that affect trust, reputation, deadlines, and larger goals.

## Core Principle

Not every task carries the same weight.

A personal reminder, a promise to a mentor, and a legal deadline should not look or behave identically.

The interface should make consequence and context visible.

## Primary Objectives

The view should help Nishad answer:
- What do I need to do?
- What have I promised?
- What is overdue?
- What is blocked?
- What keeps getting postponed?
- Which task matters most?
- What should happen next?

## Item Types

The interface should support:
- Task
- Commitment
- Milestone
- Habit
- Follow-Up
- Administrative Obligation
- Waiting Item

## Default View

The default view should show:
- due today
- overdue
- upcoming
- waiting
- repeated rollovers
- high-consequence commitments

Completed and canceled items should remain available through filters.

## Task Card

Each task card should include:
- title
- item type
- status
- priority
- due date
- planned start
- related goal
- related project
- estimated duration
- next action

Possible quick actions:
- Start
- Complete
- Reschedule
- Split Task
- Add Note
- Cancel

## Commitment Card

Each commitment card should include:
- title
- person or institution involved
- due date
- consequence of delay
- status
- follow-up channel
- related goal
- postponement count

Commitment cards should appear more prominently than ordinary low-impact tasks when trust or reputation is involved.

## Item Statuses

Suggested statuses:
- Not Started
- Planned
- In Progress
- Waiting
- At Risk
- Completed
- Canceled
- Failed

## Task Detail View

The detail page should contain:

### Summary

- title
- description
- item type
- status
- priority

### Why It Matters

Show:
- linked goal
- consequence of delay
- relationship or institutional impact

### Timing

Show:
- created date
- planned start
- due date
- latest safe start
- estimated duration

### Dependencies

Show:
- blockers
- required files
- people involved
- prerequisite tasks

### History

Show:
- status changes
- postponements
- notes
- completion evidence

### Next Action

Always show one concrete next step.

## Priority Views

Allow viewing items by:
- Today
- This Week
- Overdue
- High Priority
- Commitments to Others
- Waiting
- Repeatedly Postponed
- Completed

## Commitment Types

### Self-Commitment

Examples:
- study tonight
- exercise
- finish project milestone

### Interpersonal Commitment

Examples:
- send mentor update
- return message
- share document

### Institutional Commitment

Examples:
- submit assignment
- attend work shift
- complete required form

Interpersonal and institutional commitments should receive stronger escalation because external trust or consequences are involved.

## Overdue Design

Overdue items should show:
- how late they are
- why they remain open
- current consequence
- recommended recovery action

The interface should not use shame-based language.

Good:
`Overdue by 2 days. Send the mentor update today or revise the commitment.`

Bad:
`You failed again.`

## Postponement Tracking

Repeated postponement should be visible.

Possible labels:
- Moved Once
- Repeatedly Deferred
- Chronic Rollover

After several postponements, the interface should prompt:
- split the task
- clarify the first action
- change the deadline
- remove the task
- identify the blocker

## Waiting Items

Waiting items should show:
- who or what is blocking progress
- last follow-up date
- next follow-up date
- fallback option

The system should distinguish valid waiting from passive avoidance.

## Habit View

Habits should show:
- target frequency
- current consistency
- recent misses
- related goal
- whether the habit still matters

Avoid streak obsession.

Consistency should be interpreted over time rather than as all-or-nothing success.

## Milestone View

Milestones should show:
- parent goal or project
- completion criteria
- target date
- dependencies
- current risk

Milestones should connect strategy to execution.

## Creation Flow

The creation flow should ask only what is necessary:
- title
- item type
- due date
- related goal or project
- person involved if relevant
- estimated duration
- next action

North Vector may infer fields, but inferred values should remain editable.

## Natural Language Capture

Examples:
- `Remind me to email Dr. Aaron Friday.`
- `Add chemistry diagnostic for tonight.`
- `I promised to send the draft tomorrow.`

The interface should display the normalized result for confirmation when needed.

## Completion Flow

When completing an item:
- record completion time
- preserve evidence when useful
- update linked goals and projects
- clear related risk where appropriate
- generate follow-up actions if needed

## Cancellation Flow

Cancellation should ask:
- Is the item no longer needed?
- Was the commitment renegotiated?
- Should related people be notified?
- Does cancellation affect a goal?

## Rescheduling Flow

Rescheduling should consider:
- remaining time
- priority
- deadline
- conflicts
- rollover history

The system should not blindly move every task later.

## Bulk Views

Possible table columns:
- Item
- Type
- Status
- Priority
- Due
- Goal
- Person
- Postponements
- Next Action

Bulk editing should be available for low-risk task management, but high-impact commitments should require deliberate review.

## Today View Integration

The Today View should show:
- one primary task
- up to two secondary tasks
- urgent commitments
- overdue external follow-ups

The full task view holds the larger inventory.

## Notification Integration

Notifications should emphasize:
- approaching deadlines
- overdue commitments
- external dependency updates
- repeated postponement
- high-consequence items

Low-value reminders should remain quiet.

## Visual Design

The view should feel:
- practical
- calm
- structured
- nonjudgmental

Avoid:
- oversized completion animations
- guilt-inducing red badges everywhere
- dense kanban boards by default
- unnecessary gamification

## Mobile View

On phone, prioritize:
- next action
- due today
- overdue commitments
- quick complete
- quick reschedule
- voice capture

## Wearable View

For glasses or watch, show only:
- current task
- next deadline
- urgent commitment
- simple confirm or complete action

## Accessibility

The view should support:
- keyboard navigation
- screen readers
- scalable text
- non-color status labels
- large tap targets

## Empty States

No tasks due today:
`No tasks are due today. Your next scheduled commitment is tomorrow.`

No overdue items:
`Nothing is overdue.`

No waiting items:
`No tasks are currently blocked by others.`

## Error States

If synchronization fails:
`Some task data may be outdated. Last successful sync: 9:12 AM.`

The interface should distinguish local items from unsynchronized external items.

## Failure Modes

### Task Graveyard

Old items accumulate indefinitely.

### Commitment Blindness

Promises to others look like ordinary tasks.

### Shame Design

Overdue items feel punitive.

### Endless Rollover

Tasks move forward without diagnosis.

### Over-Detail

Simple tasks require too many fields.

### No Goal Connection

Execution becomes disconnected from purpose.

### Completion Theater

Checking boxes replaces meaningful progress.

## Phase 1 Implementation

Phase 1 should include:
- task and commitment list
- item types
- status and priority
- due dates
- related goals and projects
- people links
- postponement count
- next action
- overdue and waiting views
- complete, reschedule, split, and cancel actions

Habit and milestone views may begin in simplified form.

## Success Criteria

The Task and Commitment View succeeds if Nishad can quickly understand:
- what must be done
- what he has promised
- what is slipping
- why it matters
- what is blocked
- what action should happen next

## Final Principle

A task list records activity.

A Chief of Staff protects commitments.

This view should do both.