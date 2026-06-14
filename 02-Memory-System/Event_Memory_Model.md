# Event Memory Model v1.0

## Purpose

This document defines how North Vector stores, tracks, updates, retrieves, and reasons about events.

Events represent occurrences anchored to time.

They provide the operational reality within which goals, commitments, risks, and opportunities must be managed.

## Core Principle

Goals define direction.

Events define what is actually happening.

A competent Chief should never be surprised by a known event.

## Event Categories

### Academic Events

Examples:
- classes
- exams
- quizzes
- labs
- office hours
- assignment deadlines

### Career Events

Examples:
- interviews
- shadowing
- research meetings
- networking events
- application deadlines

### Work Events

Examples:
- shifts
- training
- meetings
- presentations

### Personal Events

Examples:
- social events
- hobbies
- birthdays
- appointments

### Family Events

Examples:
- family gatherings
- holidays
- obligations
- important milestones

### Health Events

Examples:
- doctor appointments
- therapy
- workouts
- screenings
- recovery periods

### Travel Events

Examples:
- flights
- trains
- hotel check-ins
- departures
- arrivals

### Project Events

Examples:
- milestone reviews
- planning meetings
- launch dates
- deadlines

## Standard Event Record

Each event should contain:
- event_id
- title
- description
- event_category
- status
- start_time
- end_time
- timezone
- duration
- location
- participants
- source
- source_reference
- importance
- urgency
- risk_level
- preparation_required
- preparation_task_ids
- related_goal_ids
- related_project_ids
- related_people_ids
- related_commitment_ids
- recurrence_rule
- reminders
- flexibility
- travel_time
- energy_cost
- notes
- created_at
- updated_at

## Event Statuses

### Proposed

Possible event not yet confirmed.

### Scheduled

Confirmed future event.

### Active

Currently occurring.

### Completed

Finished successfully.

### Canceled

Will not occur.

### Missed

Should have occurred but did not.

### Rescheduled

Moved to a different time.

## Importance Levels

### Critical

Examples:
- major exam
- medical appointment
- legal obligation
- important interview

### High

Examples:
- work shift
- mentor meeting
- project deadline

### Medium

Examples:
- study block
- club meeting
- routine appointment

### Low

Examples:
- optional event
- casual activity

Importance and urgency should remain separate.

## Urgency

Urgency depends primarily on time proximity and preparation state.

An event may be:
- not urgent
- approaching
- urgent
- immediate

Urgency should increase as the event nears or preparation falls behind.

## Risk Levels

Suggested levels:
- Green
- Yellow
- Orange
- Red

Risk should consider:
- preparation status
- consequences of failure
- schedule conflicts
- travel or logistics
- known behavioral patterns
- uncertainty

## Preparation Requirements

Many events require preparation.

Examples:

Exam:
- study plan
- review blocks
- sleep protection

Interview:
- research
- clothing
- travel
- practice

Travel:
- packing
- transportation
- documents
- timing buffer

Preparation tasks should be linked directly to the event.

## Event Dependencies

Some events depend on other events or tasks.

Example:

Research Presentation
Depends On:
- analysis completed
- slides drafted
- rehearsal finished

Dependencies should remain visible and affect risk status.

## Event Conflicts

North Vector should detect:
- time conflicts
- travel conflicts
- preparation conflicts
- energy conflicts
- priority conflicts

Example:

Party Tonight
vs
Chemistry Exam Preparation

Conflict analysis should consider:
- event importance
- academic risk
- sleep impact
- relationship value
- possible compromise

## Recurring Events

Recurring events should use recurrence rules.

Examples:
- weekly class
- work shift
- exercise session
- recurring meeting

Each occurrence may inherit from the parent series while maintaining its own status and notes.

## Event Flexibility

Events should be classified as:
- fixed
- semi_flexible
- flexible

This helps the Planning Engine determine what can move.

## Travel and Transition Time

Event records should account for:
- travel time
- setup time
- cleanup time
- transition buffer

A calendar slot alone does not represent the full cost of an event.

## Energy Cost

Events may have estimated energy demand:
- low
- moderate
- high
- very_high

Energy cost should influence scheduling and recovery planning.

## Event Retrieval Rules

Event memory should be retrieved when:
- preparing daily or weekly briefings
- creating plans
- evaluating decisions
- detecting conflicts
- assessing risk
- discussing a person linked to the event
- reviewing outcomes

Today’s and tomorrow’s events should receive high retrieval priority.

## Daily Awareness

Chief should always be able to answer:
- What is happening today?
- What requires preparation?
- Where must Nishad be?
- What could conflict?
- What could be forgotten?

## Weekly Awareness

Chief should always be able to answer:
- What major events are coming this week?
- Which events require advance work?
- Where are schedule bottlenecks?
- Which opportunities may expire?

## Event Outcome Recording

After important events, North Vector should record:
- outcome
- attendance
- performance
- lessons
- follow-up actions
- unresolved issues

Major outcomes should feed the Reflection Engine.

## Event Opportunity Detection

Events may create opportunities.

Examples:
- conference may create networking opportunities
- office hours may create mentorship opportunities
- project meeting may create leadership opportunities

Chief should recognize upside as well as obligation.

## Event Lifecycle

Proposed
↓
Scheduled
↓
Preparation
↓
Active
↓
Completed
↓
Reflection
↓
Archive

Canceled, missed, and rescheduled events should preserve their history.

## Example Event Record

```json
{
  "event_id": "event_academic_001",
  "title": "CHEM 1127Q Midterm 1",
  "event_category": "academic",
  "status": "scheduled",
  "start_time": "2026-09-28T10:00:00-04:00",
  "end_time": "2026-09-28T11:00:00-04:00",
  "timezone": "America/New_York",
  "importance": "critical",
  "urgency": "approaching",
  "risk_level": "yellow",
  "preparation_required": true,
  "related_goal_ids": ["goal_academic_001"],
  "flexibility": "fixed",
  "energy_cost": "high"
}
```

## Phase 1 Implementation

Phase 1 should support:
- event creation
- calendar synchronization
- categories and status
- start and end times
- reminders
- related goals and tasks
- preparation requirements
- conflict detection
- basic risk levels
- completion and outcome logging

Advanced energy prediction and travel estimation can come later.

## Success Criteria

The Event Memory Model succeeds if Chief can consistently answer:
- What is happening?
- When is it happening?
- What preparation is required?
- What conflicts exist?
- What is at risk?
- What follow-up is needed?

## Final Principle

Goals define where Nishad is going.

Events define the terrain he is moving through.

North Vector must understand both.