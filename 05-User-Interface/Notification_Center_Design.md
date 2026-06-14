# Notification Center Design v1.0

## Purpose

This document defines how North Vector should present alerts, reminders, confirmations, risks, opportunities, system updates, and informational notices.

The Notification Center exists to protect attention while ensuring that important information is not missed.

Its purpose is not to maximize engagement.

Its purpose is to deliver the right signal at the right time with the right level of urgency.

## Core Principle

A notification should earn the interruption it creates.

North Vector should prefer relevance, timing, and restraint over volume.

## Primary Objectives

The Notification Center should help Nishad answer:
- What needs my attention?
- How urgent is it?
- Why am I seeing this?
- What action should I take?
- Can this wait?
- Has this already been handled?

## Notification Categories

The interface should support:
- Safety Alert
- Health Alert
- Risk Warning
- Deadline Reminder
- Commitment Reminder
- Opportunity Alert
- Calendar Update
- Task Update
- Relationship Follow-Up
- Confirmation Request
- System Status
- Informational Notice

## Priority Levels

Suggested levels:
- Critical
- High
- Medium
- Low
- Passive

Priority should be based on consequence, timing, and relevance.

## Delivery Levels

### Level 0: Silent Log

Stored in Notification Center only.

Use for:
- low-value updates
- background system events
- completed synchronization

### Level 1: Passive Badge

Visible as an unread count or subtle indicator.

Use for:
- non-urgent reminders
- low-priority opportunities

### Level 2: Standard Notification

Appears in app and device notification system.

Use for:
- due-soon tasks
- upcoming events
- meaningful updates

### Level 3: Prominent Alert

Appears visually and may use sound or haptic feedback.

Use for:
- high-impact deadline risk
- important missed commitment
- expiring high-value opportunity

### Level 4: Interruptive Alert

Reserved for:
- safety
- health
- legal
- severe academic or professional harm

Interruptive alerts should remain rare.

## Default Notification View

The default view should group notifications by:
- Urgent
- Today
- Upcoming
- Informational
- Resolved

The user should not face an undifferentiated feed.

## Notification Card

Each card should include:
- title
- category
- priority
- timestamp
- short explanation
- why it matters
- primary action
- secondary action
- source
- related object

Possible actions:
- Open
- Complete
- Snooze
- Dismiss
- Resolve
- Confirm
- Cancel
- Mute Similar

## Notification Detail View

The detail page should contain:
- full context
- trigger condition
- evidence
- affected goal
- related risk or opportunity
- recommended action
- history
- delivery history
- current status

## Notification Statuses

Suggested statuses:
- New
- Seen
- Snoozed
- Acted On
- Resolved
- Dismissed
- Expired

## Grouping and Bundling

Related notifications should be grouped.

Example:

Instead of three separate messages:
- chemistry study block missed
- preparation risk increased
- exam deadline approaching

Show one grouped alert:
`Chemistry preparation needs attention.`

Bundling should preserve the most important action.

## Duplicate Suppression

The system should suppress repeated notifications when:
- the underlying state has not changed
- the same warning was recently delivered
- no new action is available

A repeated issue should evolve rather than repeat verbatim.

## Escalation Behavior

Notifications may escalate when:
- time remaining decreases
- risk increases
- repeated postponement occurs
- a commitment becomes overdue
- an opportunity nears expiration

Escalation should change:
- priority
- wording
- delivery channel
- requested action

## De-Escalation Behavior

Notifications should reduce or disappear when:
- action is completed
- risk decreases
- deadline changes
- opportunity expires or is declined
- the user acknowledges and schedules action

## Snooze Design

Snooze options should be contextual.

Examples:
- 15 minutes
- 1 hour
- Tonight
- Tomorrow Morning
- Before Deadline
- Custom

Snooze should not be offered when delay would create immediate serious harm.

## Dismissal Design

Dismissing a notification should ask only when necessary:
- Is the issue resolved?
- Is it no longer relevant?
- Should similar alerts be muted?

Dismissal should not silently delete the underlying risk, task, or commitment.

## Confirmation Requests

Sensitive actions should appear in a dedicated confirmation section.

Each request should show:
- exact action
- target
- reason
- consequence
- expiration
- confirm and cancel controls

Example:
`Send the email draft to Professor Smith now?`

## Opportunity Notifications

Opportunity alerts should show:
- why it matters
- expiration
- required effort
- related goal
- next action

Low-value opportunities should remain in the center without interrupting.

## Risk Notifications

Risk notifications should show:
- escalation level
- evidence
- consequence
- mitigation action
- review time

Avoid vague warnings such as:
`Something may be wrong.`

## Relationship Notifications

Relationship reminders should be tactful.

Example:
`You promised Dr. Aaron an update by Friday.`

Avoid language that reduces relationships to networking tasks.

## System Notifications

System alerts should cover:
- integration failure
- synchronization delay
- permission issue
- microphone status problem
- storage error
- action failure

Each system notification should state what may be outdated or incomplete.

## Channel Selection

Possible channels:
- in-app center
- desktop banner
- mobile push
- email
- watch haptic
- glasses card
- voice prompt

The system should choose the least disruptive channel that still fits the urgency.

## Device Rules

### MacBook

Best for:
- full detail
- confirmation
- non-urgent review

### Phone

Best for:
- time-sensitive reminders
- mobile actions
- secure confirmation

### Watch

Best for:
- haptic reminders
- simple confirm or dismiss

### Glasses

Best for:
- glanceable prompts
- navigation
- immediate contextual cues

Sensitive details should hand off to a trusted private device.

## Quiet Hours

The user should be able to define quiet hours.

During quiet hours:
- passive and low-priority notifications are held
- high-priority alerts are delayed when safe
- critical alerts may still appear

## Focus Mode Integration

During deep work or class:
- suppress low and medium alerts
- allow only critical or explicitly whitelisted notifications
- queue the rest for later review

## Public Mode

In public mode:
- hide sensitive preview text
- use generic wording
- prefer private audio
- require authentication for details

## Notification Preferences

The user should be able to control:
- category
- priority threshold
- channel
- quiet hours
- sound
- haptic feedback
- public preview
- bundling
- frequency

## Notification History

History should show:
- what was sent
- when
- through which channel
- whether it was seen
- whether action occurred
- whether escalation changed

## Feedback and Calibration

The user should be able to mark a notification as:
- Useful
- Too Early
- Too Late
- Too Strong
- Too Weak
- Irrelevant

Feedback should improve future timing and strength.

## Empty States

No active notifications:
`You're caught up. No notifications currently need attention.`

No confirmation requests:
`No actions are awaiting approval.`

## Error States

If notifications fail:
`Notification delivery is temporarily unavailable. Critical items remain visible in the app.`

## Visual Design

The Notification Center should feel:
- calm
- ordered
- restrained
- easy to scan

Avoid:
- endless red badges
- flashing indicators
- promotional styling
- engagement-driven feeds

## Accessibility

The interface should support:
- screen readers
- keyboard navigation
- scalable text
- non-color priority labels
- clear timestamps
- large action targets

## Failure Modes

### Alert Fatigue

Too many notifications reduce attention.

### False Urgency

Low-impact items interrupt unnecessarily.

### Repetition

The same alert appears without new information.

### Hidden Consequence

The user cannot tell why the notification matters.

### Missing Action

The notification provides no clear next step.

### Public Disclosure

Sensitive details appear on the wrong surface.

### Engagement Optimization

The system prioritizes interaction rather than usefulness.

## Phase 1 Implementation

Phase 1 should include:
- in-app Notification Center
- priority levels
- categories
- grouping
- duplicate suppression
- snooze and dismiss
- confirmation requests
- mobile and desktop delivery
- quiet hours
- privacy-safe previews
- feedback controls

Wearable delivery and adaptive timing can come later.

## Success Criteria

The Notification Center succeeds if Nishad can quickly understand:
- what needs attention
- why it matters
- how urgent it is
- what action to take
- whether the system is interrupting appropriately

## Final Principle

North Vector should not compete for Nishad's attention.

It should protect it.