# Health Data Integration v1.0

## Purpose

This document defines how North Vector should connect to health-related data sources, normalize approved records, detect meaningful trends, support planning, and preserve strict privacy and medical boundaries.

The Health Data Integration exists to help Chief protect sleep, recovery, exercise, appointments, and sustainable performance.

Its purpose is not to diagnose, prescribe, or replace qualified medical care.

## Core Principle

Health data should improve awareness without creating false medical authority.

North Vector may organize, summarize, monitor, and surface concerns, but it must distinguish wellness support from medical judgment.

## Primary Objectives

The integration should help Chief answer:
- How is sleep trending?
- Is workload affecting recovery?
- Are appointments or medications being missed?
- Is exercise consistent?
- Are there meaningful changes worth noticing?
- What health information is current?
- When should a qualified professional be consulted?

## Supported Data Sources

Possible sources include:
- Apple Health
- Google Health Connect
- fitness trackers
- sleep trackers
- workout apps
- medication reminder systems
- appointment calendars
- manually entered health logs
- approved medical records or patient portals

## Phase 1 Scope

Phase 1 should focus on wellness and planning data.

Supported capabilities may include:
- read sleep duration and schedule
- read step count
- read workout records
- read resting heart rate where available
- read appointment dates
- read medication reminder status
- read manually entered symptoms or energy ratings

Phase 1 should not include autonomous diagnosis or treatment decisions.

## Prohibited Actions

North Vector should not:
- diagnose conditions
- prescribe treatment
- alter medication instructions
- interpret emergency symptoms as reassurance
- submit medical forms without approval
- share health data without explicit authorization
- make insurance or clinical decisions on Nishad's behalf

## Permission Model

Recommended permissions:
- read-only access by data category
- device-level authentication
- temporary access during early testing
- no broad medical-record ingestion by default
- explicit approval for each sensitive source
- separate controls for sleep, activity, medications, and clinical records

## Health Data Categories

The integration may support:
- Sleep
- Activity
- Exercise
- Recovery
- Heart Rate
- Nutrition
- Hydration
- Medication Reminders
- Symptoms
- Appointments
- Clinical Records
- Mental Well-Being Check-Ins

Each category should be independently enabled or disabled.

## Health Record Normalization

Each health record should contain:
- health_record_id
- external_record_id
- provider
- device_or_source
- category
- metric_name
- value
- unit
- recorded_at
- time_range
- confidence
- source_quality
- sensitivity
- related_goal_ids
- related_event_ids
- synchronization_status

## Sleep Data

Sleep records may include:
- bedtime
- wake time
- total duration
- consistency
- interruptions
- source

North Vector may use sleep data to support:
- workload planning
- recovery protection
- morning briefing context
- burnout risk detection

Consumer sleep stages should not be treated as clinical truth.

## Activity and Exercise Data

Activity records may include:
- steps
- walking distance
- workouts
- duration
- intensity
- active energy

The system should focus on useful trends rather than daily perfection.

## Recovery and Capacity

North Vector may estimate current capacity using approved signals such as:
- recent sleep
- workload
- exercise
- self-reported energy
- schedule density

Capacity estimates should be labeled as planning estimates, not medical assessments.

## Heart Rate and Physiological Data

Possible metrics include:
- resting heart rate
- workout heart rate
- heart-rate variability where available

The system should:
- preserve source and device context
- avoid diagnosing from isolated readings
- surface unusual changes cautiously
- recommend professional evaluation when appropriate

## Medication Support

North Vector may support:
- reminder schedules
- refill reminders
- adherence logging
- appointment preparation

It should not:
- change dosage
- recommend starting or stopping medication
- infer safety from incomplete data

## Symptom Logging

The user may record:
- symptom
- severity
- onset
- duration
- context
- action taken

Symptom logs should be treated as sensitive and primarily used for:
- personal tracking
- appointment preparation
- detecting persistence or worsening

They should not automatically become diagnoses.

## Appointment Integration

Health appointments should connect to:
- calendar
- travel time
- preparation tasks
- forms
- questions to ask
- follow-up actions

## Clinical Record Handling

Clinical records may include:
- visit summaries
- test results
- diagnoses
- care instructions
- provider messages

These records should use the highest sensitivity classification and strictest retention controls.

North Vector should preserve the original source and avoid rewriting clinical conclusions as its own.

## Health Risk Detection

Possible signals include:
- sustained sleep reduction
- repeated missed medication reminders
- prolonged inactivity after a stated recovery goal
- repeated high workload with low recovery
- missed appointment
- worsening self-reported symptom

Risk alerts should be specific, cautious, and proportionate.

## Urgent Health Rule

When symptoms may indicate immediate danger, North Vector should not rely on routine planning logic.

It should recommend prompt professional or emergency help appropriate to the situation.

The system should never use historical wellness data to dismiss an urgent concern.

## Mental Well-Being Data

Optional check-ins may include:
- stress
- mood
- anxiety
- energy
- sense of overload

These records should:
- remain optional
- use strict privacy controls
- avoid overinterpretation
- support reflection and workload planning

## Goal Integration

Health data may support goals such as:
- maintain consistent sleep
- exercise regularly
- recover from injury
- protect mental health
- attend preventive appointments

## Planning Engine Integration

The Planning Engine may use health data to:
- avoid placing high-focus work during low-capacity periods
- protect sleep
- add recovery after demanding events
- adjust workload after illness or poor sleep

Health should influence planning without controlling every decision.

## Risk Engine Integration

Health signals may increase risk when:
- sleep loss compounds academic load
- recovery remains inadequate
- appointments are neglected
- medication reminders are repeatedly missed

## Daily Briefing Integration

Health information should appear only when actionable.

Examples:
- sleep was significantly below target
- appointment preparation is due
- workload should be reduced
- recovery block should be protected

Detailed medical information should not appear by default.

## Weekly Review Integration

The weekly review may include:
- sleep consistency
- exercise consistency
- recovery
- stress trend
- health commitments
- upcoming appointments

The review should avoid turning health into a performance score.

## Privacy Classification

Health data should be classified as restricted by default.

The integration should:
- require strong authentication
- encrypt stored data
- restrict wearable display
- hide lock-screen previews
- avoid public spoken output
- support immediate revocation
- separate wellness data from clinical records

## Data Minimization

North Vector should collect only the health fields needed for approved functions.

Examples:
- planning may need sleep duration, not full raw sensor streams
- appointment preparation may need date and provider, not the entire medical chart

## Retention

Default policy:
- retain summarized trends when useful
- minimize raw sensor history
- preserve clinical source references
- expire temporary symptom context when appropriate
- allow deletion by category, source, or date range

## Synchronization

The integration should support:
- on-demand refresh
- scheduled wellness-data refresh
- appointment synchronization
- last-sync timestamp
- stale-data indicator

## Synchronization States

Suggested states:
- Current
- Syncing
- Delayed
- Authentication Expired
- Permission Limited
- Source Error
- Data Conflict
- Disconnected

## Error Handling

If health data cannot be refreshed:
`Health data could not be updated. Existing records may be outdated.`

If one category fails:
`Sleep data could not be refreshed, but appointment records are current.`

If a metric is uncertain:
`This reading may be unreliable and has not been used for a medical conclusion.`

## Audit Log

The integration should record:
- health source accessed
- category read
- appointment imported
- health alert created
- permission changed
- access revoked
- synchronization failed

The audit log should avoid exposing sensitive values unnecessarily.

## Manual Data Support

North Vector should support manually entered:
- sleep
- energy
- symptoms
- medications
- appointments
- recovery notes

Manual records should show:
- source: manual
- date entered
- confidence limitations
- review date when relevant

## Phase 1 Implementation

Phase 1 should support:
- category-specific read-only permissions
- sleep and activity summaries
- workout records
- appointment integration
- medication reminders
- manual symptom and energy logging
- health-aware planning
- strict privacy controls
- synchronization and error states

Clinical-record ingestion and advanced physiological trend analysis should come later.

## Success Criteria

The Health Data Integration succeeds if Chief can reliably answer:
- what health information is current
- whether sleep and recovery are affecting capacity
- what appointment or reminder requires action
- what trend is worth noticing
- what conclusion is only an estimate
- when the issue exceeds Chief's role and requires professional care

## Final Principle

North Vector should use health data to protect Nishad's ability to live and perform well.

It should never confuse access to health data with medical expertise.