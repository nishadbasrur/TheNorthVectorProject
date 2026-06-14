# Voice System Architecture v1.0

## Purpose

This document defines the architecture of North Vector's voice interface.

The voice system exists to reduce interaction friction and make Chief available through natural speech rather than constant typing.

Its long-term role is to become the primary input and output layer for laptop, mobile, earbud, and smart-glasses use.

## Core Principle

Voice should feel like the fastest path into Chief.

It should not feel like dictating into a form.

## High-Level Flow

Wake or Activation
↓
Audio Capture
↓
Noise Processing
↓
Speech Detection
↓
Transcription
↓
Intent and Context Parsing
↓
Chief Orchestration
↓
Response Generation
↓
Speech Synthesis
↓
Playback
↓
Memory and Feedback Update

## System Goals

The voice system should be:
- fast
- accurate
- private
- interruptible
- context-aware
- low-friction
- reliable in ordinary environments

## Input Modes

### Push-to-Talk

The user manually starts and stops recording.

Advantages:
- simple
- private
- reliable

Recommended for Phase 1.

### Wake Phrase

A local wake phrase activates listening.

Advantages:
- hands-free
- natural

Risks:
- false activations
- privacy concerns
- battery use

Recommended for a later phase.

### Continuous Conversation Mode

The system remains available for a limited session.

Use cases:
- planning
- reflection
- walking briefings

This mode should always have a visible or audible active-state indicator.

## Audio Capture Layer

Responsibilities:
- access microphone
- manage recording state
- detect input device
- buffer audio
- preserve timestamps
- handle device changes

Phase 1 devices:
- MacBook microphone
- headphones or earbuds
- external microphone

Future devices:
- phone
- watch
- smart glasses

## Voice Activity Detection

Voice Activity Detection identifies when speech begins and ends.

Responsibilities:
- remove unnecessary silence
- reduce transcription cost
- detect completion
- support interruption

The system should avoid cutting off pauses during natural speech.

## Noise Processing

Responsibilities:
- reduce background noise
- normalize volume
- remove obvious non-speech audio
- improve transcription quality

The system should remain usable in:
- dorm rooms
- classrooms before or after class
- sidewalks
- public transit
- moderate background noise

## Speech-to-Text Layer

Purpose:
Convert audio into text.

Possible implementation:
- Whisper API
- local Whisper model
- another transcription service

Requirements:
- punctuation
- timestamp support
- confidence score
- language detection
- proper-noun correction
- custom vocabulary support

## Custom Vocabulary

North Vector should maintain a vocabulary list for:
- Nishad
- UConn
- CHEM 1127Q
- HuskyCT
- physician names
- project names
- course codes
- technical terms

This reduces repeated transcription errors.

## Transcript Processing

Raw transcripts should be normalized before reasoning.

Processing may include:
- removing filler words when safe
- restoring punctuation
- resolving obvious course and project names
- preserving quoted language
- separating commands from reflection

The raw transcript should remain available when needed.

## Intent Detection

The voice system should classify utterances such as:
- question
- task capture
- memory update
- decision request
- planning request
- reflection
- command
- correction
- interruption

Example:

`Remind me to email Professor Smith tomorrow morning.`

Intent:
Create reminder.

Example:

`I think I keep avoiding this because I don't know where to start.`

Intent:
Reflection and candidate behavioral observation.

## Context Carryover

Voice conversations should preserve short-term conversational context.

Example:

User:
`What do I have tomorrow?`

Chief:
`Biology at 9, chemistry at 10, and work at 3.`

User:
`Move the study block earlier.`

The system should know which block is being referenced.

## Confirmation Rules

Chief should request confirmation before externally visible or sensitive actions.

Examples:
- sending email
- changing calendar events
- deleting files
- spending money
- creating commitments involving others

Simple memory capture may use lighter confirmation.

## Response Generation

Voice responses should be shorter than text responses by default.

A spoken answer should:
- lead with the conclusion
- use short sentences
- avoid dense lists
- offer detail only when useful

Example:

Text response may contain a full analysis.

Voice response:
`Your chemistry exam is six days away and preparation is behind. Finish the 45-minute review block before going out tonight.`

## Text-to-Speech Layer

Requirements:
- clear pronunciation
- natural pacing
- low latency
- controllable speed
- interruption support
- custom pronunciation dictionary

Future options may include local or cloud voices.

## Barge-In and Interruption

The user should be able to interrupt Chief while it is speaking.

Examples:
- `Stop.`
- `Skip that.`
- `Give me the shorter version.`
- begin speaking naturally

The system should immediately stop playback and process the new input.

## Latency Targets

Phase 1 aspirational targets:
- recording start: near immediate
- transcription start: under 1 second after completion
- simple response: within 2 to 4 seconds
- complex reasoning: progressive status or short acknowledgement

The system should never fake completion when processing is still underway.

## Conversation States

Possible states:
- idle
- listening
- processing
- speaking
- awaiting confirmation
- error
- muted

The active state should always be visible or audible.

## Privacy Modes

### Standard Mode

Audio is sent to approved cloud services when necessary.

### Local Mode

Transcription and wake detection occur locally where supported.

### Sensitive Mode

Audio and transcript retention are minimized.

### Muted Mode

No microphone access.

## Audio Retention

Default policy:
- do not retain raw audio longer than necessary
- preserve transcript only when useful
- require explicit justification for long-term audio storage
- allow deletion

Voice memory should store meaning, not a permanent surveillance archive.

## Error Handling

Common errors:
- transcription failure
- microphone unavailable
- background noise
- ambiguous command
- network loss
- tool failure

Chief should respond plainly.

Example:
`I caught most of that, but not the course name. Which class did you mean?`

## Offline and Degraded Mode

When cloud services are unavailable, North Vector should degrade gracefully.

Possible offline functions:
- local recording
- local transcription
- task capture queue
- simple notes
- later synchronization

## Phase 1 Architecture

Phase 1 should include:
- browser or desktop push-to-talk
- MacBook microphone support
- cloud transcription
- transcript review
- short spoken responses
- interruption button
- custom vocabulary
- permission confirmation
- audio deletion after processing

Phase 1 should not include:
- always-on listening
- covert recording
- continuous environmental capture
- autonomous background speech analysis

## Phase 2 Architecture

Add:
- wake phrase
- local voice activity detection
- improved conversational sessions
- mobile access
- earbud interaction
- limited offline transcription

## Phase 3 and Wearable Architecture

Add:
- smart-glasses microphone
- bone-conduction or earbud audio
- hands-free briefings
- glanceable confirmation interface
- low-power wake detection
- context-aware activation

## Voice Command Examples

### Capture

`Chief, remember that Professor Smith prefers email before office hours.`

### Plan

`Chief, map out my chemistry study plan for the next six days.`

### Decide

`Chief, should I go out tonight?`

### Brief

`Chief, give me the day.`

### Reflect

`Chief, I think I wasted too much time planning this project.`

### Correct

`No, I said biology, not chemistry.`

## Voice Failure Modes

### Over-Listening

The system captures more than intended.

### False Activation

The wake system activates accidentally.

### Verbose Speech

Responses are too long to follow aloud.

### Confirmation Fatigue

The system asks for approval too often.

### Silent Failure

The user does not know whether the system heard them.

### Transcript Distortion

Incorrect transcription becomes false memory.

## Success Criteria

The Voice System succeeds if Nishad can:
- speak naturally
- capture thoughts quickly
- ask for briefings hands-free
- correct mistakes easily
- interrupt Chief
- trust when the microphone is active
- understand what will be stored

## Final Principle

Voice is not the intelligence of North Vector.

Voice is the doorway into it.

That doorway should be fast, clear, private, and easy to use.