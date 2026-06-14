# Dashboard Architecture v1.0

## Purpose

This document defines the structure, responsibilities, information hierarchy, and interaction model of the North Vector dashboard.

The dashboard is the primary visual interface for reviewing priorities, risks, goals, commitments, opportunities, memory, and system status.

Its purpose is not to display everything North Vector knows.

Its purpose is to show what Nishad needs to understand, decide, or act on.

## Core Principle

The dashboard should reduce cognitive load.

It should make the current state of life legible without becoming another source of clutter, guilt, or constant monitoring.

## Dashboard Goals

The dashboard should help Nishad answer:
- What matters now?
- What is at risk?
- What is coming up?
- What am I committed to?
- What opportunities exist?
- Am I moving toward my goals?
- What should I do next?

## High-Level Layout

Suggested primary regions:

1. Global Header
2. Today View
3. Priority Stack
4. Risk and Opportunity Panel
5. Goal Progress
6. Commitments and Tasks
7. Calendar and Timeline
8. Chief Conversation Panel
9. Review and Reflection Area
10. System Status and Settings

## Global Header

The header should contain:
- North Vector identity
- date and time
- current mode
- quick search
- voice activation
- notification indicator
- privacy state
- user profile

The header should remain compact.

## Today View

The default landing page should answer:
- What is happening today?
- What is the primary priority?
- What should happen next?
- What is at risk?

Suggested components:
- executive summary
- top three priorities
- schedule
- next action
- current risk level
- current opportunity

## Priority Stack

The Priority Stack should display:
- primary priority
- secondary priorities
- why each matters
- affected goals
- deadline
- current status

The interface should avoid presenting too many items as equally urgent.

## Risk Panel

The Risk Panel should display:
- risk title
- escalation level
- affected goals
- evidence
- recommended mitigation
- review time

Risk levels should be visually distinct but not alarmist.

## Opportunity Panel

The Opportunity Panel should display:
- opportunity title
- strategic value
- expiration date
- required action
- related goals
- cost and upside

Opportunities should be ranked to prevent distraction.

## Goal Progress View

The Goal Progress area should support:
- life goals
- strategic goals
- operational goals
- tactical goals

Each goal should display:
- status
- progress
- target date
- parent goal
- next milestone
- risk level
- related tasks

The user should be able to move from a daily task up to the long-term goal it supports.

## Commitments and Tasks

The task area should distinguish between:
- personal tasks
- commitments to other people
- institutional obligations
- recurring habits

Each item should display:
- status
- due date
- priority
- related goal
- postponement count
- next action

## Calendar and Timeline

The calendar should integrate:
- classes
- work
- appointments
- deadlines
- study blocks
- project milestones
- relationship events

The system should show both scheduled time and preparation requirements.

## Chief Conversation Panel

The dashboard should provide a persistent interaction area for:
- questions
- planning
- decision support
- memory corrections
- voice transcripts
- action proposals

The panel should preserve the current working session without overwhelming the main dashboard.

## Memory Inspection

The user should be able to inspect:
- what Chief remembers
- source
- confidence
- last update
- related memories
- sensitivity
- correction and deletion controls

Memory visibility is essential to trust.

## Review Area

The dashboard should support:
- daily reflection
- weekly review
- monthly strategy review
- decision review

Review outputs should connect directly to goals, risks, and future plans.

## System Status

The dashboard should show:
- connected integrations
- last synchronization time
- tool failures
- microphone status
- privacy mode
- pending confirmations
- offline or degraded status

The system should never imply that data is current when synchronization has failed.

## Navigation Structure

Suggested primary navigation:
- Today
- Goals
- Tasks
- Calendar
- Risks
- Opportunities
- Projects
- Relationships
- Memory
- Reviews
- Chief
- Settings

Phase 1 may use a smaller subset.

## Information Hierarchy

When space is limited, prioritize:

1. Safety and health
2. Immediate deadlines
3. Primary priority
4. Active risks
5. Commitments
6. Opportunities
7. Goal progress
8. General information

## Card Design

Cards should be used for:
- priorities
- risks
- opportunities
- commitments
- events
- goals

Each card should contain only the information needed to make the next decision.

## Visual Language

The visual system should feel:
- calm
- precise
- restrained
- modern
- high-trust

Recommended characteristics:
- navy and neutral tones
- strong typography
- limited accent colors
- generous spacing
- minimal animation

The interface should not feel gamified.

## Status Indicators

Suggested status language:
- On Track
- Attention Needed
- At Risk
- Critical
- Waiting
- Completed
- Deferred

Status wording should be plain and consistent.

## Progressive Disclosure

The dashboard should show summaries first.

Detailed information should expand on demand.

Example:

Summary:
`Chemistry preparation risk: Orange`

Expanded view:
- evidence
- missed study blocks
- affected goal
- mitigation plan

## Action Design

Every actionable card should have a clear primary action.

Examples:
- Start Task
- Review Plan
- Resolve Risk
- Apply Now
- Send Follow-Up
- Confirm Action

The dashboard should not leave the user wondering what to do next.

## Confirmation Center

Sensitive proposed actions should appear in one place.

Examples:
- send email
- change calendar event
- delete memory
- create external commitment

Each confirmation should show:
- proposed action
- reason
- affected system
- confirm and cancel controls

## Notification Center

Notifications should be grouped by:
- urgent
- today
- upcoming
- informational

Duplicates should be suppressed.

Resolved alerts should leave the active view quickly.

## Responsive Design

The dashboard should adapt across:
- MacBook
- desktop
- tablet
- phone

Complex views may simplify on smaller screens.

The phone should emphasize:
- today
- next action
- reminders
- briefings
- quick capture

## Accessibility

The dashboard should support:
- keyboard navigation
- screen readers
- scalable text
- high contrast
- reduced motion
- clear focus states
- non-color status indicators

## Privacy Rules

The dashboard should:
- hide sensitive previews when locked
- respect memory sensitivity
- provide private-view mode
- avoid showing restricted details on shared displays
- require authentication for protected sections

## Dashboard Modes

### Standard Mode

Full dashboard access.

### Focus Mode

Shows only:
- current task
- timer
- related context
- critical alerts

### Briefing Mode

Shows a concise daily or weekly overview.

### Review Mode

Supports reflection and strategy review.

### Public Mode

Suppresses sensitive content.

## Empty States

Empty screens should guide rather than confuse.

Example:
`No active risks. Chief will continue monitoring.`

Not:
`Nothing here.`

## Error States

When data is unavailable, show:
- what failed
- what may be outdated
- what still works
- retry action

Example:
`Calendar synchronization failed at 8:14 AM. Today's schedule may be incomplete.`

## Phase 1 Dashboard

Phase 1 should include:
- Today page
- top priorities
- schedule
- tasks and commitments
- active risks
- active opportunities
- goal overview
- Chief conversation panel
- basic memory inspection
- settings and integration status

Phase 1 should not include:
- excessive analytics
- complex animations
- public social features
- multi-user workspaces
- gamification

## Success Criteria

The Dashboard Architecture succeeds if Nishad can open North Vector and understand within seconds:
- what matters
- what is happening
- what is slipping
- what opportunity exists
- what to do next

## Final Principle

The dashboard is not a control room for every detail of life.

It is the surface that makes the right details impossible to miss.