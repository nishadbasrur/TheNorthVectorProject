# Goal View Design v1.0

## Purpose

This document defines how North Vector should present goals, progress, dependencies, risks, milestones, and alignment across different time horizons.

The Goal View exists to make long-term direction visible without overwhelming Nishad with a wall of objectives.

## Core Principle

Goals should feel connected, not isolated.

The interface should show how daily actions support tactical goals, how tactical goals support strategic goals, and how strategic goals support the life Nishad is trying to build.

## Primary Objectives

The Goal View should help Nishad answer:
- What am I trying to achieve?
- Why does it matter?
- What is on track?
- What is at risk?
- What depends on what?
- What should happen next?
- Is this goal still worth pursuing?

## Goal Hierarchy

The interface should support:
- Life Goals
- Strategic Goals
- Operational Goals
- Tactical Goals
- Linked Tasks

Example hierarchy:

Become a Physician
↓
Gain Admission to Medical School
↓
Maintain Competitive GPA
↓
Perform Strongly in CHEM 1127Q
↓
Complete Limiting Reagents Review

## Default View

The default Goal View should show:
- active goals
- current priority
- progress
- risk status
- next milestone
- target date
- parent goal
- next action

Completed and archived goals should remain available through filters.

## Goal Card

Each goal card should include:
- title
- goal level
- current status
- priority
- progress indicator
- target date
- next milestone
- risk level
- parent goal
- quick actions

Possible quick actions:
- View Details
- Add Milestone
- Update Progress
- Review Risk
- Defer Goal
- Complete Goal

## Goal Detail View

The detail page should contain:

### Goal Summary

- title
- description
- why it matters
- current status
- priority

### Success Criteria

Clearly show what completion means.

### Progress

Possible formats:
- percentage
- milestones
- count toward target
- qualitative status

### Milestones

Display:
- completed
- active
- upcoming
- blocked

### Dependencies

Show:
- goals this depends on
- tasks this depends on
- people involved
- external prerequisites

### Risks

Show:
- active risks
- escalation level
- mitigation plan

### Opportunities

Show:
- current opportunities
- strategic value
- expiration

### Linked Tasks

Show current actions connected to the goal.

### Related Events

Examples:
- exams
- interviews
- application deadlines
- meetings

### Decision History

Show major changes, pivots, or deferrals.

### Reflection and Lessons

Show relevant reviews and lessons.

## Progress Visualization

Progress visuals should be honest.

Avoid false precision when progress is qualitative.

Use:
- milestone completion
- confidence indicators
- trend arrows
- status labels

Do not force every goal into a percentage.

## Status Language

Suggested statuses:
- Proposed
- Planned
- Active
- At Risk
- Blocked
- Deferred
- Completed
- Abandoned
- Superseded

## Risk Display

Risk should be shown in context.

Example:
`Orange Risk: Two required milestones are behind schedule.`

The interface should show the mitigation action nearby.

## Goal Map

A visual map may show relationships between goals.

Example:

Life Goal
↓
Strategic Goals
↓
Operational Goals
↓
Milestones
↓
Tasks

The map should remain optional and navigable, not decorative.

## Goal Portfolio View

The portfolio view should help identify:
- too many active goals
- neglected goals
- conflicting goals
- resource imbalance
- projects masquerading as priorities

Suggested columns:
- Goal
- Domain
- Priority
- Status
- Progress
- Risk
- Next Review

## Domain Filters

Allow filtering by:
- academics
- career
- health
- finances
- relationships
- projects
- personal development

## Time Horizon Filters

Allow filtering by:
- today
- this week
- this month
- semester
- year
- multi-year

## Goal Conflict View

The interface should surface conflicts involving:
- time
- money
- energy
- attention

Example:
`North Vector development is competing with chemistry preparation this week.`

The interface should provide:
- affected goals
- relative priority
- recommended tradeoff

## Goal Review Mode

Each goal should support structured review.

Questions:
- Is the goal still aligned?
- Is progress on track?
- Are deadlines realistic?
- Are dependencies healthy?
- Should priority change?
- Should the goal continue, pause, or end?

## Goal Creation Flow

The creation flow should ask for:
- title
- why it matters
- goal level
- domain
- target date
- success criteria
- parent goal
- initial priority
- review cadence

The system should help convert vague goals into measurable ones.

## Goal Editing

When editing a goal, North Vector should preserve:
- version history
- previous target dates
- previous success criteria
- reason for change

## Completion Flow

When a goal is completed:
- record evidence
- update parent goals
- capture lessons
- generate follow-up actions
- archive when appropriate

Completion should feel meaningful but not gamified.

## Abandonment and Deferral

The interface should distinguish between:
- failure
- intentional deferral
- changed priorities
- misalignment
- supersession

Ending a goal should not be treated as moral failure.

## Daily Action Connection

Each goal detail page should show:
`What can I do today?`

This section should present one or two concrete next actions.

## Strategic Alignment

The interface should show how each major goal connects to:
- Constitution
- Mission Brief
- long-term objectives

Misaligned goals should be flagged for review.

## Empty States

No active goals:
`No active goals are defined. Start by identifying the outcome that matters most in your current season.`

No blocked goals:
`No active goals are blocked.`

## Mobile Goal View

On phone, prioritize:
- active goals
- status
- next milestone
- next action
- risk

Detailed maps and histories may collapse.

## Accessibility

The Goal View should support:
- keyboard navigation
- screen readers
- non-color risk indicators
- scalable text
- clear relationship labels

## Failure Modes

### Goal Hoarding

Too many active goals remain visible.

### False Precision

Qualitative goals are forced into percentages.

### Disconnected Tasks

Daily actions do not link to larger goals.

### Status Stagnation

Goals remain active indefinitely without review.

### Shame Design

Deferred or abandoned goals feel like failures.

### Strategy Blindness

Progress is tracked without questioning whether the goal is still right.

## Phase 1 Implementation

Phase 1 should include:
- active goal list
- goal hierarchy
- status and priority
- milestones
- progress tracking
- risk indicators
- dependencies
- linked tasks
- review actions
- responsive detail view

Advanced graph visualization can come later.

## Success Criteria

The Goal View succeeds if Nishad can quickly understand:
- what he is pursuing
- why it matters
- whether it is progressing
- what threatens it
- what action should happen next
- whether the goal still belongs in the plan

## Final Principle

The Goal View should make ambition legible.

It should turn distant direction into visible structure and immediate action.