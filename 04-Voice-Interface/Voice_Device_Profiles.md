# Voice Device Profiles v1.0

## Purpose

This document defines how North Vector adapts voice behavior across different devices and environments.

A MacBook, phone, earbud, and pair of smart glasses should not behave identically.

The Voice Device Profiles system exists to adjust input method, response length, privacy, confirmation flow, display behavior, and battery use based on the active device.

## Core Principle

The device is not merely a microphone and speaker.

It changes what interaction is practical, private, safe, and useful.

## Device Profile Goals

Each profile should define:
- activation method
- microphone behavior
- audio output behavior
- visual output behavior
- privacy level
- confirmation method
- latency expectations
- battery constraints
- offline capability
- supported interaction modes

## Standard Device Profile Record

Each device profile should contain:
- device_profile_id
- device_type
- trust_level
- input_methods
- output_methods
- activation_methods
- privacy_mode_default
- supported_session_types
- confirmation_channel
- display_capability
- audio_capability
- battery_constraint
- network_dependency
- local_processing_capability
- public_environment_behavior
- accessibility_options
- failure_fallback

## MacBook Profile

### Role

Primary Phase 1 development and interaction device.

### Input

- built-in microphone
- external microphone
- keyboard
- push-to-talk button

### Output

- on-screen text
- speakers
- headphones

### Default Modes

- planning
- reflection
- decision support
- daily briefing
- development workflows

### Privacy

- trusted personal device
- sensitive details may be displayed after device authentication
- spoken output should adapt when headphones are not connected

### Confirmation

- on-screen confirmation
- keyboard or spoken confirmation

### Strengths

- large display
- strong compute
- easy transcript review
- best device for complex sessions

### Constraints

- not always available while walking
- lid state and sleep may interrupt sessions

## Phone Profile

### Role

Primary mobile companion.

### Input

- built-in microphone
- push-to-talk
- optional wake phrase
- touch controls

### Output

- screen
- speaker
- earbuds
- vibration

### Default Modes

- quick commands
- briefings
- reminders
- navigation support
- short decisions

### Privacy

- trusted personal device
- lock-screen content should be privacy-safe
- sensitive actions require biometric or passcode confirmation

### Confirmation

- biometric confirmation
- on-screen button
- explicit spoken confirmation for low-risk actions

### Strengths

- always nearby
- strong mobile connectivity
- useful for travel and transition moments

### Constraints

- smaller screen
- more public use
- stronger battery sensitivity than MacBook

## Earbud Profile

### Role

Private audio interface for mobile use.

### Input

- earbud microphone
- voice activation
- physical tap or gesture

### Output

- private spoken response
- tones

### Default Modes

- walking session
- quick command
- briefing
- reminder response

### Privacy

- private output by default
- no visual confirmation unless paired with phone or glasses

### Confirmation

- short spoken confirmation
- tap gesture
- handoff to phone for sensitive actions

### Strengths

- low-friction
- private audio
- natural while walking

### Constraints

- limited visual context
- poor fit for long structured information
- may require repetition in noisy environments

## Smart Glasses Profile

### Role

Future primary wearable interface.

### Input

- built-in microphone
- wake phrase
- touch or temple gesture
- possible camera context

### Output

- audio
- small visual overlays
- glanceable confirmations

### Default Modes

- walking session
- navigation
- briefings
- contextual reminders
- quick decisions
- situational awareness

### Privacy

- limited-trust wearable
- sensitive information should be minimized
- public environment mode should be default
- no covert recording
- camera use requires explicit visible indication

### Confirmation

- glanceable confirm or cancel overlay
- temple gesture
- voice confirmation
- handoff to phone for sensitive actions

### Strengths

- always accessible
- hands-free
- context-aware
- ideal vessel for Chief

### Constraints

- limited display area
- battery
- heat
- social acceptability
- privacy concerns
- weaker local compute

## Desktop Profile

### Role

Optional home development server or backup device.

### Input

- microphone
- keyboard
- external peripherals

### Output

- monitor
- speakers
- headphones

### Default Modes

- development
- local model hosting
- batch processing
- backup

### Privacy

- trusted only when local account and room access are secure

### Constraints

- stationary
- unavailable when Nishad is at UConn

## Watch Profile

### Role

Minimal notification and control surface.

### Input

- microphone
- tap
- crown or button

### Output

- short text
- vibration
- brief audio

### Default Modes

- quick reminders
- yes or no confirmation
- timer
- urgent alerts

### Privacy

- sensitive content should remain generic

### Constraints

- tiny display
- limited battery
- poor fit for complex reasoning

## Car Profile

### Role

Hands-free driving interface.

### Input

- vehicle microphone
- steering-wheel control

### Output

- vehicle speakers

### Default Modes

- navigation
- short briefing
- task capture
- safe communication drafting

### Safety Rule

The interface must minimize cognitive load and avoid complex planning while driving.

Sensitive or visually demanding actions should be deferred.

## Public vs Private Environment

Every device profile should adapt to environment.

### Private Environment

Allowed:
- longer spoken responses
- more detailed content
- sensitive context on trusted devices

### Public Environment

Preferred:
- shorter responses
- earbuds
- generic wording
- hidden notification previews
- handoff to private display

## Device Handoff

Sessions may move between devices.

Example:

Glasses:
`I found a private financial issue.`

Phone:
Displays the full details after authentication.

Handoff should preserve:
- session objective
- pending action
- context summary
- confirmation state

## Trust Levels

### Trusted

Examples:
- personal MacBook
- personal phone

May access approved sensitive context.

### Limited Trust

Examples:
- smart glasses
- watch
- earbuds

Should receive only necessary context.

### Untrusted

Examples:
- shared computer
- borrowed device
- unknown speaker system

Should not receive sensitive data or execute sensitive actions.

## Capability Negotiation

At session start, North Vector should determine:
- available microphone
- speaker or private audio
- display size
- authentication state
- network state
- local processing availability
- battery level

The system should adapt before responding.

## Low-Battery Behavior

When battery is low:
- reduce wake-word monitoring
- prefer text over speech synthesis where practical
- shorten sessions
- disable nonessential visual overlays
- defer heavy local processing

## Offline Behavior

When offline, device profiles may support:
- local transcription
- local task capture
- note queue
- simple reminders
- deferred synchronization

Unavailable features should be stated plainly.

## Accessibility Options

Profiles should support:
- adjustable speech rate
- captions
- larger text
- haptic confirmation
- alternate activation methods
- hearing-device routing

## Failure Handling

If a device lacks a required capability:
- explain the limitation
- offer handoff
- preserve the request
- avoid partial execution when unsafe

Example:
`I can't securely confirm that purchase on the glasses. Open the phone to continue.`

## Phase 1 Implementation

Phase 1 should define and support:
- MacBook profile
- basic phone profile
- headphone detection
- trusted-device rules
- public environment output option
- confirmation handoff

Wearable-specific behavior can be simulated before hardware exists.

## Success Criteria

The Voice Device Profiles system succeeds if:
- Chief behaves appropriately on each device
- private information stays on suitable surfaces
- confirmations remain easy and secure
- sessions hand off cleanly
- battery and network constraints are respected
- the user does not need to manually reconfigure the interface constantly

## Final Principle

Chief should remain one coherent system across devices.

But it should never forget what device it is speaking through.