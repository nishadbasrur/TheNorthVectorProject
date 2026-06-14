# Voice Memory Capture v1.0

## Purpose

This document defines how North Vector converts spoken input into candidate memories, validates those memories, and decides what should be stored, ignored, corrected, or promoted.

Voice is one of the fastest ways for Nishad to express thoughts, commitments, preferences, observations, and reflections.

The Voice Memory Capture system exists to preserve useful meaning without turning every spoken sentence into permanent memory.

## Core Principle

Spoken language is easy to produce and easy to misinterpret.

North Vector should capture meaning carefully, store selectively, and preserve user control.

## Voice-to-Memory Pipeline

Speech
↓
Transcription
↓
Normalization
↓
Intent Detection
↓
Memory Candidate Extraction
↓
Validation
↓
Classification
↓
Confirmation if Needed
↓
Storage
↓
Review and Promotion

## Memory Capture Intents

### Explicit Memory Command

Examples:
- Remember that Dr. Aaron prefers email.
- Save this as a project idea.
- Keep track of the fact that chemistry takes me longer than biology.

Default behavior:
Create a candidate memory and confirm briefly.

### Implicit Fact Statement

Example:
`My chemistry exam is next Thursday.`

Default behavior:
Store only if the fact is relevant, verifiable, and likely to matter later.

### Preference Statement

Example:
`I prefer morning study blocks.`

Default behavior:
Create a preference memory candidate.

### Commitment Statement

Example:
`I told Professor Smith I'd send the draft Friday.`

Default behavior:
Create a commitment record and link it to the relevant person and date.

### Goal Statement

Example:
`I want to finish the first North Vector prototype this semester.`

Default behavior:
Create or update a goal candidate.

### Behavioral Observation

Example:
`I keep avoiding this because the first step is unclear.`

Default behavior:
Create a candidate behavioral memory, not an established pattern.

### Reflection Statement

Example:
`Today's active recall session worked much better than rereading.`

Default behavior:
Create a reflection record and possibly a success-pattern candidate.

### Temporary Context

Example:
`I'm tired today.`

Default behavior:
Keep in short-term or working memory unless repeated evidence suggests a durable pattern.

## Candidate Memory Types

Voice capture may produce:
- fact memory
- preference memory
- goal memory
- commitment memory
- relationship memory
- project memory
- event memory
- behavioral memory candidate
- decision memory
- reflection memory
- risk memory
- opportunity memory

## Explicit vs Implicit Storage

### Explicit Storage

When Nishad says:
- remember this
- save this
- note this
- keep track of this

Chief should assume storage is intended.

### Implicit Storage

When Nishad simply speaks naturally, Chief should be conservative.

Store implicitly only when the information is:
- clearly useful later
- sufficiently specific
- reasonably reliable
- not overly sensitive
- relevant to goals, commitments, relationships, or behavior

## Memory Candidate Record

Each candidate should contain:
- candidate_id
- raw_transcript
- normalized_statement
- candidate_memory_type
- source_session_id
- source_timestamp
- confidence
- importance
- sensitivity
- explicit_storage_request
- related_goal_ids
- related_people_ids
- related_project_ids
- confirmation_status
- promotion_status

## Validation Rules

Before storage, Chief should evaluate:
- Was the transcript accurate?
- Is the meaning clear?
- Is the statement factual, interpretive, or emotional?
- Is the information temporary or durable?
- Does it conflict with existing memory?
- Is confirmation required?

## Confirmation Policy

### No Confirmation Required

Examples:
- low-risk task capture
- explicit note command
- clearly stated preference

Response:
`Got it.`

### Light Confirmation

Use when:
- meaning is clear but storage value is moderate
- the system wants to confirm the normalized interpretation

Example:
`I'll remember that morning study blocks work better for you.`

### Explicit Confirmation

Use when:
- the transcript is ambiguous
- the memory is highly sensitive
- the statement could materially alter planning or judgment
- the system is inferring a behavioral pattern

Example:
`Do you want me to store that as a recurring pattern, or just as today's observation?`

## Behavioral Memory Rule

One spoken observation should not become an established behavioral memory.

Voice input may create:
- observation
- candidate pattern
- supporting evidence

Promotion to an established pattern requires:
- repeated evidence
- user confirmation
- or strong corroborating data

## Contradiction Handling

When new spoken input conflicts with existing memory:

1. Preserve the new statement as a candidate.
2. Surface the conflict when relevant.
3. Ask for clarification if the difference matters.
4. Update or supersede the old memory only with sufficient evidence.

Example:

Existing memory:
`Nishad prefers morning study blocks.`

New statement:
`Actually, evening study works better now.`

Chief:
`Got it. Should I replace the old preference or treat this as temporary?`

## Correction Rules

The user should be able to say:
- That's wrong.
- Don't remember that.
- Change that to biology.
- Forget what I just said.
- That was only true today.

Corrections should update both the session state and memory candidate.

## Privacy and Sensitivity

Voice memory may include sensitive information.

Chief should:
- classify sensitivity
- minimize retention
- avoid storing intimate details without clear value
- avoid exposing sensitive memories in spoken briefings
- allow deletion
- support no-memory sessions

## Raw Audio Policy

Default:
- do not retain raw audio after transcription and validation
- preserve transcript only when useful
- store meaning rather than audio
- allow user-configurable exceptions

## Transcript Policy

The system should distinguish:
- raw transcript
- normalized transcript
- extracted memory

Long-term memory should usually store the extracted meaning, not the entire transcript.

## Short-Term vs Long-Term Storage

### Working Memory

Use for:
- current conversation
- immediate references
- temporary emotional state

### Short-Term Memory

Use for:
- current-week context
- temporary plans
- emerging patterns
- unresolved commitments

### Long-Term Memory

Use for:
- durable preferences
- confirmed goals
- important relationships
- major decisions
- validated behavioral patterns

## Memory Promotion

A voice-captured candidate may be promoted when:
- Nishad confirms it
- it remains relevant over time
- repeated evidence supports it
- it affects important decisions
- losing it would reduce future usefulness

## Memory Rejection

A candidate should be rejected when:
- transcription is unreliable
- meaning is unclear
- information is trivial
- it duplicates existing memory
- it is temporary and already expired
- the user declines storage

## Voice Capture Examples

### Example 1: Explicit Preference

User:
`Remember that I study better in the morning.`

Chief:
`Got it. I'll remember that morning study blocks usually work better for you.`

Storage:
Preference memory.

### Example 2: Temporary State

User:
`I'm exhausted today.`

Chief:
Uses this in current planning.

Storage:
Working or short-term memory only.

### Example 3: Behavioral Observation

User:
`I keep planning this project instead of building it.`

Chief:
`I'll log that as today's observation. I won't treat it as a permanent pattern unless it keeps happening.`

Storage:
Reflection and candidate behavioral memory.

### Example 4: Commitment

User:
`I told Dr. Aaron I'd email him Friday.`

Chief:
`Added. I'll track the Friday follow-up.`

Storage:
Commitment record linked to relationship memory.

## Failure Modes

### Over-Capture

Too much casual speech becomes permanent memory.

### Under-Capture

Important commitments or preferences are lost.

### Transcript Error

Incorrect speech recognition creates false memory.

### Premature Pattern Formation

One observation becomes a durable behavioral label.

### Hidden Storage

The user does not know what was remembered.

### Sensitive Exposure

Private memory is surfaced in the wrong environment.

## Phase 1 Implementation

Phase 1 should support:
- explicit remember commands
- note and task capture
- preference capture
- goal and commitment capture
- candidate behavioral observations
- confirmation levels
- transcript correction
- selective storage
- no-memory mode
- deletion and correction

Automatic implicit storage should remain conservative.

## Success Criteria

Voice Memory Capture succeeds if Nishad can:
- speak naturally
- save important information quickly
- know what was remembered
- correct mistakes easily
- prevent over-storage
- trust that temporary speech remains temporary
- build a useful memory system without constant manual entry

## Final Principle

The goal is not to remember everything Nishad says.

The goal is to remember what Future Nishad will be glad Chief understood.