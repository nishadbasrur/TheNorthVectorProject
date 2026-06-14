# Voice Privacy Policy v1.0

## Purpose

This document defines how North Vector protects privacy across microphone access, audio capture, transcription, storage, playback, device use, and voice-triggered actions.

The Voice Privacy Policy exists because voice interaction can become invasive faster than text interaction.

The system must make listening visible, retention limited, and user control absolute.

## Core Principle

North Vector should never behave like a surveillance system.

It should listen only when authorized, retain only what is useful, and make every sensitive action understandable and reversible where possible.

## Privacy Goals

The voice system should:
- make microphone state obvious
- minimize raw audio retention
- separate temporary speech from durable memory
- protect sensitive content in public environments
- require approval for sensitive actions
- allow inspection, correction, and deletion
- default to the lowest necessary permission level

## Microphone Access

Microphone access must be:
- explicitly authorized by the user
- visible while active
- easy to disable
- limited to the active interaction mode

The system should not silently reactivate the microphone after it has been disabled.

## Listening Modes

### Push-to-Talk

The microphone is active only while Nishad deliberately holds or activates a control.

Privacy level:
Highest practical default.

Recommended for Phase 1.

### Wake Phrase

A local detector listens for an approved activation phrase.

Requirements:
- wake detection should occur locally when possible
- no full audio stream should be transmitted before activation
- false activations should be logged and reviewable

### Active Session Mode

The microphone remains available during a clearly marked conversation session.

Requirements:
- visible or audible active indicator
- inactivity timeout
- immediate stop control

### Muted Mode

No microphone access.

Muted state should override all non-emergency features.

## Active-State Indicators

When the microphone is active, North Vector should provide at least one clear indicator:
- on-screen microphone icon
- status light
- audible activation tone
- glasses display indicator

The indicator should distinguish:
- listening
- processing
- speaking
- muted

## Raw Audio Retention

Default policy:
- raw audio should be deleted after transcription and validation
- raw audio should not enter long-term memory
- audio retention should require explicit user opt-in
- temporary diagnostic retention should have a fixed expiration

The system should store meaning rather than a permanent audio archive.

## Transcript Retention

Transcripts should be separated into:
- raw transcript
- normalized transcript
- extracted memory or action

Default policy:
- retain raw transcript only as long as necessary for correction or troubleshooting
- store extracted meaning when durable value exists
- allow transcript deletion

## No-Memory Mode

Nishad should be able to start a no-memory session.

Examples:
- `Don't save this conversation.`
- `Temporary session.`
- `No memory mode.`

In this mode:
- no long-term memory should be created
- raw audio should be deleted after processing
- transcripts should expire after the session
- only explicitly approved actions may persist

## Sensitive Mode

Sensitive Mode should apply stricter controls.

Use cases:
- health discussions
- financial information
- private relationship matters
- legal or identity documents

Controls may include:
- local processing where available
- reduced transcript retention
- blocked wearable display previews
- stronger authentication
- limited tool access

## Public Environment Mode

When Nishad is in a public environment, Chief should reduce accidental disclosure.

Possible behaviors:
- shorter spoken responses
- use earbuds instead of speakers
- avoid reading sensitive names or amounts aloud
- move details to a private screen
- ask before speaking sensitive information

Example:
`I found something private in your financial notes. Open the secure view when you're ready.`

## Device Trust Levels

Devices should be classified as:

### Trusted Personal Device

Examples:
- Nishad's MacBook
- Nishad's phone

May access approved sensitive context after authentication.

### Limited-Trust Wearable

Examples:
- smart glasses
- earbuds

Should receive only context appropriate for public or glanceable output.

### Shared or Unknown Device

Should not receive sensitive memories or execute sensitive actions.

## Authentication

Sensitive voice actions may require:
- device unlock
- biometric authentication
- passcode
- explicit confirmation on a trusted screen

Voice recognition alone should not be treated as sufficient authentication for high-risk actions.

## Speaker Verification

Future speaker verification may help detect whether Nishad is speaking.

It should be treated as a convenience signal, not absolute proof of identity.

High-risk actions still require stronger authentication.

## Third-Party Speech

The system should avoid capturing or storing speech from people who did not intentionally address Chief.

Rules:
- do not create memories from bystander speech by default
- do not identify or profile nearby people
- do not record conversations covertly
- require explicit consent for meeting transcription

## Meeting and Conversation Recording

North Vector should never assume that recording a conversation is acceptable.

Before recording:
- obtain explicit user authorization
- require compliance with applicable consent rules
- provide a clear active recording indicator
- minimize retention

## Voice-Triggered Actions

Sensitive actions require explicit confirmation.

Examples:
- send email
- change important calendar event
- delete file
- transfer money
- expose private data
- create an external commitment

The confirmation should identify the exact action.

Example:
`Send this email to Professor Smith now?`

## Privacy Classification

Voice-derived records should use sensitivity levels:
- low
- moderate
- high
- restricted

Sensitivity should influence:
- storage location
- retention duration
- device access
- notification content
- authentication requirements

## Notifications

Voice-related notifications should not reveal sensitive information on locked screens or public displays.

Use generic wording when necessary.

Example:
`You have a private follow-up due today.`

Rather than exposing the underlying detail.

## Data Minimization

North Vector should collect the minimum data needed to provide the requested function.

Examples:
- task creation does not require retaining audio
- a spoken preference may require only a short structured memory
- a calendar query should not create a transcript archive

## User Inspection and Control

Nishad should be able to:
- see when the microphone was active
- inspect retained transcripts
- inspect voice-derived memories
- correct transcription errors
- delete audio, transcript, or memory
- disable implicit memory capture
- revoke device permissions

## Deletion Rules

Deletion requests should be executed clearly and logged when appropriate.

Examples:
- delete the last voice memory
- clear today's transcripts
- forget this conversation
- remove microphone access from glasses

## Incident Handling

Potential privacy incidents include:
- unexpected microphone activation
- sensitive speech shown publicly
- transcript stored incorrectly
- unauthorized device access
- wrong-person command execution

The system should:
1. stop the affected function
2. notify Nishad clearly
3. identify what was captured or exposed
4. provide deletion and permission controls
5. record the incident for review

## Privacy Failure Modes

### Hidden Listening

The microphone is active without clear indication.

### Excessive Retention

Audio or transcripts persist without value.

### Bystander Capture

Other people's speech becomes data.

### Public Disclosure

Private information is spoken or displayed in public.

### Weak Authentication

A sensitive action relies only on voice recognition.

### Memory Overreach

Casual speech becomes permanent memory without justification.

### Permission Creep

The system gradually receives more access than necessary.

## Phase 1 Implementation

Phase 1 should support:
- push-to-talk only
- visible microphone state
- raw audio deletion after transcription
- explicit transcript and memory controls
- no-memory mode
- confirmation for sensitive actions
- trusted-device access
- privacy-safe notifications

Always-on listening should not be included in Phase 1.

## Success Criteria

The Voice Privacy Policy succeeds if Nishad can always answer:
- Is Chief listening?
- What was captured?
- What was stored?
- Where is it stored?
- Who or what can access it?
- How do I delete it?
- Did any external action occur?

## Final Principle

Voice interaction should increase convenience without quietly reducing privacy.

North Vector must earn the right to listen every time it does.