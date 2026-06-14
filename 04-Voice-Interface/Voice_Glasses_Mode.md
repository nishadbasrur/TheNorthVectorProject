# Voice Glasses Mode v1.0

## Purpose

This document defines how North Vector should operate when accessed through smart glasses.

Voice Glasses Mode is not a separate intelligence system.

It is a specialized interaction mode for a wearable interface with limited display area, limited battery, public visibility, and hands-free use.

Its purpose is to make Chief available throughout daily life without becoming distracting, invasive, or socially awkward.

## Core Principle

The glasses are a vessel for Chief, not the product itself.

The intelligence, memory, judgment, and planning systems remain primary.

The glasses should deliver only the right information at the right moment.

## Primary Use Cases

Voice Glasses Mode should support:
- morning and transition briefings
- reminders
- navigation
- contextual alerts
- quick decisions
- voice capture
- glanceable confirmations
- situational awareness
- walking sessions
- public-environment interaction

## Interaction Model

Input:
- voice
- wake phrase
- temple tap
- touch gesture
- possible gaze or head gesture

Output:
- private audio
- small visual overlays
- icons
- short text
- haptic or tone confirmation

## Display Philosophy

The display should show less, not more.

Visual output should be:
- glanceable
- brief
- context-specific
- readable in motion
- dismissible

The glasses should not attempt to recreate a laptop screen.

## Display Zones

Possible display zones:
- top-left status area
- top-right contextual card
- center confirmation prompt
- navigation indicator

The exact layout should minimize obstruction of normal vision.

## Visual Content Types

### Reminder Card

Example:
`CHEM lecture in 8 min`

### Priority Card

Example:
`Next: 45 min chemistry review`

### Risk Alert

Example:
`Exam prep behind schedule`

### Opportunity Alert

Example:
`Research application closes Friday`

### Confirmation Prompt

Example:
`Send email?  Confirm / Cancel`

### Navigation Cue

Example:
Directional arrow and distance.

## Audio Behavior

Spoken responses should be shorter than on phone or laptop.

Default target:
- one to three sentences

Long explanations should be deferred to another device unless explicitly requested.

Example:
`Your chemistry exam is six days away and preparation is behind. Finish the review block before going out tonight.`

## Public Environment Default

Voice Glasses Mode should assume the user may be in public.

Default behavior:
- minimize sensitive spoken details
- prefer private audio
- use generic visual wording
- hide names, amounts, and private content
- hand off detailed information to phone or MacBook

## Activation Methods

### Push-to-Talk Gesture

Recommended default.

Advantages:
- deliberate
- private
- low battery

### Wake Phrase

Optional later feature.

Requirements:
- local detection where possible
- clear active indicator
- easy mute control

### Contextual Prompt

Chief may surface a prompt when a high-value condition is met.

Examples:
- class begins soon
- deadline risk rises
- opportunity is expiring

Prompts should remain rare and dismissible.

## Session Types

### Walking Session

For:
- briefings
- reflections
- planning aloud
- navigation

### Transition Session

For moments between classes, work, meetings, or travel.

Chief may say:
`You have 20 minutes before chemistry. The best use is reviewing the reaction worksheet.`

### Quick Capture Session

For recording:
- ideas
- commitments
- observations
- reminders

### Decision Session

For short situational decisions.

Complex decisions should hand off to a larger device when necessary.

## Contextual Awareness

Future glasses may use:
- time
- location
- calendar
- motion state
- route
- approved camera context

Context should be used conservatively.

The system should not assume that all visible or audible information should be analyzed or stored.

## Camera Policy

Camera use must be explicit and visible.

Allowed future uses may include:
- navigation
- object or text assistance
- rear-view awareness mode
- approved situational context

The camera should not:
- record continuously by default
- identify bystanders
- profile people
- create memories from strangers
- operate covertly

## Rear-View Awareness Integration

Voice Glasses Mode may eventually integrate with the digital rear-view concept.

Possible functions:
- small rear-view picture-in-picture
- approaching vehicle warning
- blind-spot awareness
- temporary safety mode

This mode should be:
- user-activated
- time-limited
- privacy-conscious
- optimized for low power

## Notification Hierarchy

### Silent Glance

For low-priority information.

### Soft Tone and Card

For moderate reminders.

### Spoken Prompt

For high-value or time-sensitive information.

### Strong Alert

Reserved for safety, health, or severe deadline risk.

## Attention Protection

The glasses should not interrupt during:
- active conversation
- lecture
- exam
- driving
- important meeting
- focused deep work

unless the issue meets a high escalation threshold.

## Confirmation Design

Low-risk actions:
- temple tap
- short voice response

High-risk actions:
- explicit confirmation
- phone or trusted-device handoff
- biometric authentication where needed

Example:
`I can draft that email here, but sending requires confirmation on your phone.`

## Device Handoff

The glasses should hand off when:
- detailed reading is required
- authentication is needed
- the decision is complex
- sensitive information is involved
- long-form editing is required

The handoff should preserve context and pending actions.

## Battery Strategy

To protect battery life:
- prefer event-driven activation
- use local wake detection only when enabled
- minimize continuous camera use
- shorten display duration
- reduce speech synthesis when unnecessary
- offload heavy reasoning to phone, MacBook, or server

## Thermal Strategy

The glasses should avoid sustained high-load local processing.

Heavy tasks should be offloaded.

Thermal limits should never be ignored for the sake of responsiveness.

## Connectivity Modes

### Connected Mode

Uses phone or network for full Chief access.

### Limited Mode

Supports cached schedule, reminders, task capture, and basic commands.

### Offline Mode

Supports local recording, simple notes, and deferred synchronization.

## Safety Rules

The interface should avoid obstructing vision.

Visual overlays should:
- remain outside central vision where possible
- disappear quickly
- reduce while moving fast
- avoid dense text
- never encourage unsafe attention shifts

## Social Acceptability

Chief should avoid behavior that makes the glasses feel intrusive or awkward.

Examples:
- no loud public responses
- no unexplained camera activation
- no constant visible overlays
- no repeated robotic prompts

The best wearable interaction should remain subtle.

## Privacy Rules

Voice Glasses Mode should:
- default to public-environment privacy
- minimize displayed sensitive details
- use private audio where possible
- show clear microphone and camera indicators
- support instant mute
- avoid bystander capture

## Example Interaction

Chief:
`You have chemistry in eight minutes.`

Nishad:
`What should I focus on?`

Chief:
`Stoichiometry. Limiting reagents remain the weakest area from your last review.`

Visual overlay:
`CHEM 1127Q — Limiting Reagents`

## Failure Modes

### Visual Overload

Too much information appears in view.

### Notification Fatigue

The glasses interrupt too often.

### Public Disclosure

Sensitive information is visible or audible nearby.

### Battery Drain

Continuous sensing makes the device impractical.

### Social Friction

Camera or voice behavior makes others uncomfortable.

### Device Dependence

North Vector becomes unusable without the glasses.

### Interface Confusion

The user cannot tell what the system is doing.

## Phase 1 Simulation

Before real glasses hardware exists, simulate Voice Glasses Mode using:
- MacBook overlay window
- phone lock-screen cards
- earbud audio
- small notification cards
- strict response-length limits

This allows interaction design to be tested before hardware development.

## Phase 2 Prototype

A prototype may include:
- commercial smart glasses
- microphone
- private audio
- simple display
- phone-tethered reasoning
- push-to-talk
- glanceable confirmations

## Phase 3 Custom Hardware

Potential custom capabilities:
- rear-facing camera
- binocular display zones
- low-power wake detection
- rear-view awareness
- deeper North Vector integration

Custom hardware should only begin after the software interaction model proves useful.

## Success Criteria

Voice Glasses Mode succeeds if Nishad can:
- access Chief without taking out a phone
- receive useful reminders without distraction
- capture thoughts naturally
- protect privacy in public
- hand off complex tasks smoothly
- use the system throughout the day without excessive battery drain
- forget about the interface and focus on life

## Final Principle

The glasses should not make North Vector impressive.

They should make North Vector present.