# Settings and Permissions Design v1.0

## Purpose

This document defines how North Vector should present and manage user preferences, privacy controls, connected services, device access, action permissions, memory controls, notification settings, and system behavior.

The Settings and Permissions interface exists to give Nishad clear control over what Chief can access, remember, display, and do.

## Core Principle

Powerful assistance requires explicit boundaries.

North Vector should make permissions understandable, specific, revocable, and proportional to the function being requested.

## Primary Objectives

The interface should help Nishad answer:
- What can Chief access?
- What can Chief change?
- Which actions require approval?
- What is being remembered?
- Which devices are trusted?
- How are notifications delivered?
- How do I revoke access?
- What happens if a connection fails?

## Settings Structure

Suggested primary sections:
- General
- Appearance
- Voice
- Memory
- Privacy
- Permissions
- Integrations
- Devices
- Notifications
- Automation
- Security
- Data Management
- System Status

## General Settings

General settings may include:
- preferred name
- timezone
- date format
- language
- default start page
- default briefing time
- default review day
- response detail preference

## Appearance Settings

Appearance settings may include:
- light or dark mode
- navy accent options
- text size
- density
- reduced motion
- contrast
- card layout

The interface should remain calm and restrained across themes.

## Voice Settings

Voice settings should include:
- push-to-talk
- wake phrase toggle
- speaking rate
- voice selection
- interruption behavior
- transcript preview
- raw audio retention
- custom vocabulary
- public-environment mode
- default device profile

## Memory Settings

Memory settings should include:
- implicit memory capture
- explicit memory capture
- no-memory mode default
- candidate memory review
- behavioral memory confirmation
- memory review cadence
- retention rules
- archive behavior
- deletion controls

The user should be able to disable entire memory categories.

Examples:
- health memory
- financial memory
- relationship memory
- behavioral inference

## Privacy Settings

Privacy settings should include:
- sensitive mode
- public mode
- lock-screen preview behavior
- restricted-memory authentication
- transcript retention
- microphone and camera indicators
- bystander-capture protections
- wearable privacy defaults

## Permission Categories

Permissions should be grouped by capability.

### Read Permissions

Examples:
- calendar read
- email read
- file read
- task read
- contact read

### Write Permissions

Examples:
- create calendar event
- create task
- save memory
- update project file

### External Action Permissions

Examples:
- send email
- send message
- submit form
- create external commitment

### Destructive Permissions

Examples:
- delete file
- delete memory
- cancel calendar event
- remove data

### Financial Permissions

Examples:
- view balances
- initiate payment
- place transaction

Financial permissions should use the strictest controls.

## Permission Levels

Suggested permission levels:

### Never

Chief cannot perform the action.

### Ask Every Time

Explicit approval is required for each action.

### Ask for High-Impact Actions

Routine low-risk actions may proceed; high-impact actions require approval.

### Allowed Within Defined Scope

Chief may act inside specific boundaries.

Example:
`May create calendar events labeled Study, but may not modify work or medical events.`

## Scope Design

Permissions should support narrow scope.

Examples:
- one calendar
- one folder
- one email label
- one project repository
- one device
- one category of task

Broad access should never be required when narrow access is sufficient.

## Approval Policies

The interface should let Nishad define approval rules.

Examples:
- always ask before sending email
- allow task creation without confirmation
- ask before deleting any memory
- allow calendar changes only for flexible study blocks
- never initiate financial transactions

## Integration Settings

Each connected integration should show:
- service name
- account
- permission scope
- last sync
- current status
- recent errors
- disconnect control

Possible integrations:
- Google Calendar
- Gmail
- Google Drive
- GitHub
- task system
- academic portal
- finance provider

## Integration Health

The interface should clearly show:
- Connected
- Limited Access
- Permission Expired
- Sync Delayed
- Error
- Disconnected

The system should never imply that data is current when synchronization has failed.

## Device Management

Each device should show:
- device name
- device type
- trust level
- last active
- authentication status
- permissions
- privacy mode
- remove-device control

Suggested trust levels:
- Trusted
- Limited Trust
- Untrusted

## Device-Specific Permissions

Examples:
- glasses may show reminders but not financial details
- watch may confirm tasks but not delete data
- MacBook may access full Memory Inspector
- phone may approve sensitive actions

## Notification Settings

Notification settings should support:
- categories
- priority threshold
- channels
- quiet hours
- public previews
- bundling
- sound
- haptic feedback
- glasses display
- voice prompts

## Automation Settings

Automation settings should show:
- automation name
- trigger
- action
- approval mode
- status
- last run
- next run
- pause or delete controls

Examples:
- morning briefing
- weekly review reminder
- deadline monitoring
- opportunity watch

## Security Settings

Security settings should include:
- biometric requirement
- passcode requirement
- session timeout
- sensitive-action reauthentication
- device trust
- suspicious-access alerts
- recovery options

## Data Management

Data controls should include:
- export data
- delete transcript history
- delete raw audio
- delete memories
- clear short-term memory
- archive completed projects
- account deletion

Destructive actions should explain exactly what will be removed.

## Permission Request Design

When Chief requests a permission, the interface should show:
- requested capability
- reason
- scope
- duration
- risks
- alternatives
- approve and decline controls

Bad request:
`Allow full account access.`

Better request:
`Allow North Vector to read your primary Google Calendar so it can build daily briefings. It will not modify events without separate approval.`

## Temporary Permissions

The interface should support:
- one-time access
- session-only access
- time-limited access
- persistent access

Temporary permission should be preferred for experimental features.

## Revocation

Revoking access should:
- stop future access immediately
- explain what local data remains
- offer deletion of previously stored derived data
- preserve user-approved records when appropriate

## Permission History

The user should be able to review:
- permission granted
- date
- scope
- actions performed
- changes
- revocation

## Audit Log

The settings area should include a readable audit log of:
- external actions
- permission changes
- memory deletions
- device sign-ins
- integration failures
- sensitive confirmations

The log should be understandable without technical expertise.

## Defaults

Recommended defaults:
- read access is narrow
- write actions ask when meaningful
- external communication asks every time
- destructive actions always ask
- financial actions are disabled
- raw audio is deleted after processing
- implicit behavioral inference is conservative
- public previews hide sensitive details

## Presets

Optional presets may include:

### Conservative

- ask frequently
- minimal memory capture
- limited integrations

### Balanced

- routine low-risk actions allowed
- sensitive actions confirmed
- standard memory behavior

### Advanced

- broader automation within defined scopes
- still requires approval for destructive, financial, and externally visible actions

Presets should remain editable.

## Accessibility

Settings should support:
- keyboard navigation
- screen readers
- clear section labels
- plain-language explanations
- searchable settings
- non-color status indicators

## Search

The settings interface should allow natural-language search.

Examples:
- microphone
- delete memory
- email permissions
- quiet hours
- trusted devices

## Error States

If a permission cannot be changed:
`The integration did not accept the new permission. Existing access remains unchanged.`

If revocation fails:
`North Vector stopped using the connection locally, but the provider did not confirm revocation. Open provider settings to finish disconnecting.`

## Failure Modes

### Permission Fog

The user cannot understand what access means.

### Scope Creep

Broad access accumulates over time.

### Dark Patterns

Declining access is made difficult.

### Hidden Persistence

Data remains after a connection is removed without explanation.

### Over-Prompting

Frequent low-value permission requests create fatigue.

### Weak Defaults

The system begins with excessive access.

### Device Confusion

The user cannot tell which device has which capabilities.

## Phase 1 Implementation

Phase 1 should include:
- general settings
- voice settings
- memory settings
- privacy settings
- integration list
- permission levels
- connected-device list
- notification controls
- data deletion
- audit log
- explicit confirmation rules

Advanced policy templates and organization-wide permissions can come later.

## Success Criteria

The Settings and Permissions interface succeeds if Nishad can quickly understand:
- what Chief can access
- what Chief can do
- which actions require approval
- which devices are trusted
- what data is stored
- how to change or revoke any of it

## Final Principle

North Vector should become more capable only when Nishad remains more informed and more in control.