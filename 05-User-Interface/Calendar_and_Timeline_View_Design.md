# Calendar and Timeline View Design v1.0

## Purpose

This document defines how North Vector should present scheduled events, deadlines, preparation work, travel time, flexible blocks, and the flow of a day, week, or month.

The Calendar and Timeline View exists to show not only when events happen, but what they require before, during, and after.

## Core Principle

A calendar should represent the real cost of an event.

A one-hour meeting may require travel, preparation, transition time, and follow-up.

North Vector should make that full cost visible.

## Primary Objectives

The view should help Nishad answer:
- What is happening?
- When is it happening?
- What preparation is required?
- What conflicts exist?
- Where are the time bottlenecks?
- What can move?
- What should happen before the next event?

## Supported Views

The interface should support:
- Day View
- Week View
- Month View
- Agenda View
- Timeline View
- Preparation View

## Day View

The Day View should emphasize:
- current time
- fixed commitments
- flexible work blocks
- transition windows
- next event
- next action
- risk points

The current time indicator should be visually obvious.

## Week View

The Week View should emphasize:
- major deadlines
- workload density
- preparation blocks
- recurring classes or work
- schedule conflicts
- recovery windows
- open capacity

## Month View

The Month View should emphasize:
- major exams
- application deadlines
- project milestones
- travel
- recurring commitments

Detailed time blocks should remain secondary.

## Agenda View

The Agenda View should show a clean chronological list of:
- events
- deadlines
- preparation tasks
- travel
- follow-ups

This view should be useful on phone and for screen readers.

## Timeline View

The Timeline View should show the full operational sequence of the day.

Example:

8:30 AM — Leave dorm
9:00 AM — Biology lecture
9:50 AM — Walk to chemistry
10:00 AM — Chemistry lecture
11:00 AM — Review notes
12:00 PM — Lunch

This reveals transitions that ordinary calendars often hide.

## Event Card

Each event card should include:
- title
- start and end time
- location
- category
- status
- importance
- flexibility
- preparation status
- travel time
- related goal
- risk level

Possible quick actions:
- View Details
- Start Preparation
- Reschedule
- Mark Complete
- Add Follow-Up
- Cancel

## Event Detail View

The detail page should contain:

### Event Summary

- title
- description
- category
- status
- date and time
- location

### Preparation

Show:
- required tasks
- completion status
- latest safe start
- materials needed

### Travel and Transition

Show:
- departure time
- route
- estimated travel
- setup time
- post-event transition

### Related Goals

Show which goals the event supports or threatens.

### Participants

Show relevant people and relationship context.

### Risks

Show:
- preparation risk
- schedule conflict
- travel risk
- health or energy cost

### Follow-Up

Show any action required after the event.

## Event Types

The interface should support:
- Class
- Exam
- Assignment Deadline
- Work Shift
- Meeting
- Appointment
- Study Block
- Travel
- Social Event
- Family Event
- Health Event
- Project Milestone

## Fixed vs Flexible Time

Events should be labeled as:
- Fixed
- Semi-Flexible
- Flexible

Flexible blocks should be visually distinct and easy to reschedule.

## Preparation Layer

The interface should display preparation work before the event.

Example:

Exam on Friday
↓
Diagnostic review on Monday
↓
Office hours on Tuesday
↓
Practice set on Wednesday
↓
Final review on Thursday

Preparation should appear as a linked sequence, not isolated tasks.

## Deadline Design

Deadlines should display:
- due time
- latest safe start
- current progress
- related task or goal
- risk level

A deadline with incomplete preparation should become more prominent as the safe-start window closes.

## Travel Time

Travel should be visible as real scheduled time.

The interface should account for:
- walking
- driving
- public transit
- parking
- security or check-in
- buffer

## Transition Time

Transition buffers should be included between demanding activities.

Examples:
- class to work
- work to studying
- meeting to travel
- high-focus task to social event

## Energy Layer

Optional energy indicators may show:
- high-focus period
- low-energy period
- demanding event
- recovery block

This should inform planning without turning the calendar into a health dashboard.

## Conflict Detection

The interface should detect:
- direct overlap
- insufficient travel time
- insufficient preparation time
- back-to-back high-demand events
- competing deadlines
- unrealistic workload density

Conflict cards should explain the actual problem.

Example:
`Your work shift begins 20 minutes after lab ends, but expected travel requires 35 minutes.`

## Rescheduling Flow

When moving an event or block, North Vector should consider:
- flexibility
- dependencies
- related commitments
- travel
- priority
- energy
- risk

The system should suggest a realistic alternative rather than merely finding any open slot.

## Drag-and-Drop Behavior

Drag-and-drop may be supported for flexible blocks.

After a move, the system should re-evaluate:
- conflicts
- preparation sequence
- related deadlines
- daily workload

High-impact fixed commitments should not move casually.

## Current-Time Awareness

The view should update throughout the day.

Examples:
- highlight current event
- show time remaining
- surface next transition
- mark missed or completed events
- recommend replanning if the day slips

## Replanning Interaction

A `Replan` action should:
- inspect remaining time
- preserve fixed events
- protect critical deadlines
- account for current energy
- move or remove lower-priority blocks
- produce an updated timeline

## Calendar Integration

The interface may synchronize with:
- Google Calendar
- Apple Calendar
- Outlook
- academic calendars

The system should show:
- source calendar
- last sync time
- conflicts between sources

## Academic Calendar Layer

The system should support:
- class schedule
- exam calendar
- assignment deadlines
- office hours
- academic breaks

## Today View Integration

The Today View should show a simplified version of the current day's timeline.

The full calendar view should provide deeper planning and history.

## Notification Integration

Notifications should be based on:
- event start
- departure time
- preparation status
- deadline risk
- schedule changes

The system should not notify only at the start time when preparation or travel is required earlier.

## Visual Design

The view should feel:
- clear
- calm
- spatially legible
- practical

Use:
- distinct fixed and flexible blocks
- readable time labels
- restrained category markers
- visible travel and preparation layers

Avoid:
- excessive color coding
- dense tiny blocks
- decorative animation
- hidden conflicts

## Mobile View

On phone, prioritize:
- current event
- next event
- departure time
- preparation status
- agenda
- replan action

## Wearable View

For glasses or watch, show only:
- current event
- next event
- time remaining
- departure cue
- critical conflict

## Accessibility

The view should support:
- keyboard navigation
- screen readers
- agenda alternative
- scalable text
- non-color event labels
- clear focus states

## Empty States

No events today:
`No fixed events are scheduled today.`

No preparation required:
`No upcoming events currently require preparation.`

No conflicts:
`No schedule conflicts detected.`

## Error States

If calendar synchronization fails:
`Calendar data may be incomplete. Last successful sync: 8:14 AM.`

If travel estimates are unavailable:
`Travel time could not be estimated. Add a manual buffer before this event.`

## Failure Modes

### Calendar Illusion

The schedule appears workable because preparation and travel are hidden.

### Over-Scheduling

Every minute is filled.

### Conflict Blindness

Overlaps or impossible transitions remain unnoticed.

### Static Calendar

The timeline fails to adapt as the day changes.

### Tiny-Block Overload

The interface becomes visually unreadable.

### Source Confusion

The user cannot tell which calendar created an event.

### Health Blindness

Demanding events are stacked without recovery.

## Phase 1 Implementation

Phase 1 should include:
- day and week views
- agenda view
- fixed and flexible events
- current-time indicator
- travel and transition fields
- preparation tasks
- conflict detection
- basic rescheduling
- Google Calendar integration
- responsive mobile layout

Energy modeling and advanced travel intelligence can come later.

## Success Criteria

The Calendar and Timeline View succeeds if Nishad can quickly understand:
- where he needs to be
- when he needs to leave
- what preparation remains
- what conflicts exist
- what can move
- how much usable time is actually available

## Final Principle

A normal calendar shows occupied time.

North Vector should show operational reality.