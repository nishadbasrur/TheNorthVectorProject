# Accountability Engine v1.0

## Purpose

This document defines how North Vector tracks commitments, detects slippage, prompts follow-through, and helps Nishad convert plans into completed action.

The Accountability Engine exists because a good plan without follow-through is only a wish.

Its role is not to nag.

Its role is to keep promises, priorities, and consequences visible until they are resolved.

## Core Principle

Accountability should increase execution without reducing autonomy.

North Vector should be firm enough to prevent drift, but respectful enough to avoid becoming punitive, manipulative, or exhausting.

## Accountability Inputs

The engine should monitor:
- active goals
- tasks
- commitments
- deadlines
- milestones
- planned study blocks
- follow-up obligations
- user-stated intentions
- repeated postponement
- completion history
- behavioral patterns
- current risks

## Accountability Objects

### Tasks

Concrete actions with a completion state.

### Commitments

Promises made to oneself or another person.

### Milestones

Meaningful checkpoints inside larger goals or projects.

### Habits

Recurring actions that support long-term goals.

### Decisions

Choices that create follow-up obligations.

## Standard Accountability Record

Each accountability record should contain:
- accountability_id
- item_type
- title
- description
- owner
- status
- priority
- created_at
- due_at
- planned_start_at
- completed_at
- related_goal_ids
- related_project_ids
- related_people_ids
- related_event_ids
- consequence_of_delay
- reminder_policy
- escalation_level
- postponement_count
- reason_for_delay
- next_action
- evidence_of_completion
- review_at

## Statuses

### Not Started

No meaningful action has begun.

### Planned

A start time or execution plan exists.

### In Progress

Work has begun.

### Waiting

Blocked by another person, resource, or event.

### At Risk

Progress is behind or repeated postponement is occurring.

### Completed

The commitment has been fulfilled.

### Canceled

The commitment has been intentionally removed.

### Failed

The commitment was not completed and the opportunity has passed.

## Commitment Types

### Self-Commitments

Examples:
- study tonight
- exercise three times this week
- complete project milestone

### Interpersonal Commitments

Examples:
- email a mentor
- send a document
- attend a meeting
- follow up with a friend

### Institutional Commitments

Examples:
- submit assignment
- attend work shift
- complete required form

Interpersonal and institutional commitments should generally receive stronger follow-up because missed execution can affect trust, reputation, or legal standing.

## Reminder Levels

### Passive

Visible in dashboard or briefing.

### Prompt

Direct reminder near the planned time.

### Firm Prompt

Used after missed action or when consequences are meaningful.

### Escalation

Used when repeated delay is activating a known failure mode.

### Critical Intervention

Used when safety, health, legal, or high-stakes academic consequences are imminent.

## Escalation Logic

Accountability should escalate when:
- the due date approaches
- a planned start time is missed
- the task rolls over repeatedly
- the item affects a critical goal
- another person is waiting
- a known failure mode is active
- the consequence of delay increases

## De-Escalation Logic

Accountability may de-escalate when:
- progress resumes
- a realistic new plan is created
- the blocker is valid
- the commitment is intentionally canceled
- the consequence decreases

## Postponement Review

A postponed item should not simply move forward without analysis.

Chief should ask:
- Is the task still important?
- Is the next action clear?
- Was the time estimate wrong?
- Is there a blocker?
- Is avoidance occurring?
- Should the task be split, delegated, deferred, or deleted?

Repeated postponement is a signal, not merely a scheduling event.

## Behavioral Integration

Known behavioral patterns should influence accountability.

Example:

Pattern:
Delayed starts on ambiguous tasks.

Response:
The Accountability Engine should require a concrete first action before the next reminder.

Pattern:
Architecture without execution.

Response:
The engine should ask for a working artifact rather than more planning.

## Tone Rules

Accountability messaging should be:
- specific
- calm
- direct
- non-moralizing
- proportionate
- action-oriented

Avoid:
- shame
- guilt
- vague disappointment
- excessive repetition
- artificial urgency

## Example Accountability Prompt

Weak:
`Don't forget to study chemistry.`

Better:
`Your chemistry exam is in six days, and the limiting-reagents review block is still incomplete. Complete a 45-minute diagnostic session tonight, then update the plan based on the result.`

## Commitment Integrity

Chief should help Nishad avoid casually making commitments that are unlikely to be honored.

Before adding a commitment, the system may ask:
- Is this realistic?
- What will it displace?
- When will it be done?
- Is another person depending on it?

Fewer reliable commitments are better than many weak promises.

## Completion Evidence

Completion may be confirmed through:
- user confirmation
- file creation
- calendar attendance
- email sent
- task status update
- external integration

Evidence requirements should be proportional to the importance of the commitment.

## Habit Accountability

For recurring habits, Chief should evaluate:
- adherence rate
- consistency
- missed streaks
- environmental barriers
- whether the habit still supports the goal

The engine should avoid obsession with perfect streaks.

Consistency matters more than purity.

## Relationship Accountability

When another person is involved, Chief should prioritize:
- timely follow-up
- clear communication
- honoring promises
- repairing missed commitments

If a commitment is missed, Chief should recommend acknowledgment and repair rather than avoidance.

## Accountability Review Cadence

### Daily

Review:
- due today
- overdue
- planned starts
- critical follow-ups

### Weekly

Review:
- repeated rollovers
- incomplete milestones
- neglected commitments
- habit consistency

### Monthly

Review:
- execution patterns
- estimate accuracy
- chronic bottlenecks
- commitments that should be removed

## Accountability Metrics

Useful metrics may include:
- completion rate
- on-time completion rate
- average postponement count
- overdue item count
- commitment reliability
- estimate accuracy
- follow-up completion

Metrics should support learning, not become a source of pointless pressure.

## Failure Modes

### Nagging

Too many reminders reduce trust and attention.

### Shame-Based Accountability

Execution problems are framed as character defects.

### Blind Persistence

The system keeps pushing an outdated or misaligned task.

### Weak Consequence Awareness

Chief reminds without explaining why the item matters.

### Overcommitment Reinforcement

The engine tracks too many promises instead of helping reduce them.

### Fake Completion

Items are marked complete without meaningful evidence.

## Phase 1 Implementation

Phase 1 should support:
- tasks and commitments
- due dates and planned starts
- status tracking
- postponement count
- reminder levels
- basic escalation rules
- links to goals, people, events, and projects
- completion evidence
- daily and weekly reviews

Advanced adaptive messaging can come later.

## Success Criteria

The Accountability Engine succeeds if Chief can reliably answer:
- What did Nishad commit to?
- What is overdue?
- What is slipping?
- Why is it slipping?
- What should happen next?
- When should the system escalate?
- Is the commitment still worth keeping?

## Final Principle

Accountability is not pressure for its own sake.

It is the preservation of integrity between intention and action.