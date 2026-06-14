# Google Calendar Integration v1.0

## Purpose

This document defines how North Vector should connect to Google Calendar, interpret events, detect conflicts, create plans, propose changes, and maintain synchronization.

The Google Calendar Integration exists to provide Chief with a reliable view of Nishad's scheduled reality.

Its job is not merely to read dates and times.

Its job is to understand commitments, preparation needs, travel, flexibility, and the operational cost of the calendar.

## Core Principle

Calendar data should inform judgment without becoming unquestioned truth.

Events may be incomplete, outdated, duplicated, or missing preparation context.

North Vector should use the calendar as a source of reality while preserving uncertainty and user control.

## Primary Objectives

The integration should help Chief answer:
- What is scheduled?
- What is fixed?
- What can move?
- What conflicts exist?
- What preparation is required?
- When should Nishad leave?
- What time remains available?
- What changes require approval?

## Supported Capabilities

### Read Capabilities

North Vector may read:
- event title
- start and end time
- timezone
- location
- description
- attendees
- recurrence
- reminders
- visibility
- status
- calendar source

### Create Capabilities

North Vector may create:
- study blocks
- planning sessions
- reminders
- personal appointments
- review sessions

Creation should follow the Integration Permission Model.

### Update Capabilities

North Vector may propose or perform approved updates such as:
- move a flexible study block
- extend or shorten a planning session
- add travel buffer
- update event notes

### Delete Capabilities

Deleting or canceling events requires explicit confirmation by default.

## Permission Model

Recommended Phase 1 permissions:
- read primary calendar
- read selected academic or personal calendars
- create events only on an approved North Vector or Personal calendar
- ask before modifying existing events
- always ask before deleting or canceling events

## Calendar Sources

The integration should support multiple calendars.

Examples:
- Primary
- UConn Academic
- Work
- Personal
- Family
- North Vector

Each event should preserve its source calendar.

## Event Normalization

Google Calendar events should be converted into the North Vector Event Memory Model.

Normalized fields should include:
- event_id
- external_event_id
- source_calendar_id
- title
- description
- event_category
- status
- start_time
- end_time
- timezone
- location
- participants
- recurrence_rule
- reminders
- flexibility
- preparation_required
- travel_time
- related_goal_ids
- synchronization_status

## Event Classification

North Vector should classify events into categories such as:
- Class
- Exam
- Work Shift
- Meeting
- Appointment
- Study Block
- Travel
- Social Event
- Family Event
- Health Event
- Project Event

Classification may use:
- title
- description
- calendar source
- recurrence
- location
- user-defined rules

Inferred classifications should remain editable.

## Fixed and Flexible Events

Events should be classified as:
- Fixed
- Semi-Flexible
- Flexible

Examples:

Fixed:
- class
- work shift
- exam
- medical appointment

Semi-Flexible:
- office hours
- club meeting
- social plan

Flexible:
- study block
- project work
- weekly review

The system should not move fixed events automatically.

## Read Flow

When reading the calendar, Chief should:
1. fetch the relevant time range
2. normalize events
3. detect updates and deletions
4. identify conflicts
5. link events to goals, tasks, and people
6. update short-term memory
7. record synchronization time

## Create Flow

Before creating an event, Chief should determine:
- objective
- duration
- preferred time
- deadline
- flexibility
- related goal
- preparation or travel needs
- target calendar

Low-risk event creation may proceed within approved scope.

Externally meaningful commitments should require explicit approval.

## Update Flow

Before updating an event, Chief should:
- verify current event state
- check recurrence
- determine whether the event is fixed or flexible
- identify attendee impact
- detect conflicts created by the change
- request confirmation when required

## Recurring Events

Recurring events require special care.

The integration should distinguish:
- this instance
- this and following
- entire series

Chief should never assume the update scope.

Example:
`Move only today's chemistry study block, or every weekly occurrence?`

## Attendee Rules

Events with attendees should be treated as externally visible commitments.

Changing these events may:
- notify attendees
- affect trust
- alter another person's schedule

Updates should require stronger confirmation.

## Conflict Detection

The integration should detect:
- direct event overlap
- insufficient travel time
- insufficient transition time
- preparation collisions
- repeated high-demand blocks
- event and deadline conflicts

Conflict detection should consider more than event timestamps.

## Travel Time

North Vector may estimate travel based on:
- event locations
- current or previous location
- transportation mode
- route data
- user-defined buffer

Travel estimates should include confidence and remain editable.

## Preparation Time

Events may require preparation before the scheduled time.

Examples:
- exam review
- interview preparation
- packing
- meeting notes
- document completion

Preparation tasks should link to the event and appear in planning.

## Free-Time Calculation

Free time should exclude:
- fixed events
- travel
- transitions
- protected meals
- sleep
- preparation blocks
- necessary recovery

The system should not treat every empty calendar gap as usable high-focus time.

## Daily Briefing Integration

Calendar data should support:
- schedule overview
- next event
- departure time
- preparation alerts
- conflict warnings
- available work windows

## Planning Engine Integration

The Planning Engine should use calendar data to:
- place tasks
- protect fixed commitments
- allocate buffers
- match work to available windows
- replan when events change

## Risk Engine Integration

Calendar signals may create risks such as:
- exam approaching without study blocks
- impossible travel transition
- overloaded day
- repeated sleep displacement
- preparation window closing

## Opportunity Engine Integration

Calendar gaps may create opportunities such as:
- office hours attendance
- relationship follow-up
- exercise
- focused project work

The system should not fill every gap automatically.

## Synchronization

The integration should support:
- scheduled synchronization
- event-triggered refresh where available
- manual refresh
- last-sync timestamp
- stale-data indicator

## Synchronization States

Suggested states:
- Current
- Syncing
- Delayed
- Authentication Expired
- Permission Limited
- Error
- Disconnected

## Conflict Resolution

When local and Google Calendar data disagree:
- preserve both versions temporarily
- identify source and timestamp
- avoid silent overwrite
- ask for clarification when consequential

## Timezone Handling

The integration should:
- preserve source timezone
- display events in local timezone
- handle travel and daylight-saving changes
- avoid converting all-day events incorrectly

## All-Day Events

All-day events should not automatically block the entire day.

Chief should interpret their meaning.

Examples:
- birthday
- holiday
- travel day
- assignment deadline

## Privacy

Calendar data may reveal sensitive information.

The integration should:
- respect event visibility
- hide sensitive details on public surfaces
- restrict medical or private calendar data
- avoid reading event descriptions aloud in public
- allow per-calendar exclusion

## Error Handling

If reading fails:
`Google Calendar could not be refreshed. The last successful sync was at 8:14 AM.`

If creation fails:
`The event was not created. Your existing calendar remains unchanged.`

If modification fails:
`The update failed. The original event is still scheduled.`

## Audit Log

The integration should record:
- calendar accessed
- event read
- event created
- event modified
- event deleted
- permission changed
- sync failed
- authentication expired

The audit log should remain concise and user-readable.

## Phase 1 Implementation

Phase 1 should support:
- read access to approved calendars
- event normalization
- day and week retrieval
- event classification
- fixed and flexible labels
- conflict detection
- create events on one approved calendar
- explicit confirmation before modifying or deleting
- sync status and error handling

Travel intelligence, attendee-aware automation, and event-driven webhooks can come later.

## Success Criteria

The Google Calendar Integration succeeds if Chief can reliably answer:
- what is scheduled
- what is fixed
- what preparation remains
- what conflicts exist
- what time is truly available
- what changes require approval

## Final Principle

The calendar is not just a list of events.

It is the operating map of Nishad's time.