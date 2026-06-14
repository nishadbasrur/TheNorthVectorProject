# Voice Session Manager v1.0

## Purpose

This document defines how North Vector creates, maintains, updates, and closes voice sessions.

The Voice Command Model determines what Nishad said.

The Voice Session Manager determines what conversation is currently happening.

Its purpose is to preserve continuity across multiple turns without allowing stale context to leak into unrelated interactions.

## Core Principle

A voice interaction should behave like a coherent meeting, not a sequence of isolated commands.

Chief should remember the current topic, objective, unresolved questions, and recent references until the session ends or the subject changes.

## Session Lifecycle

Activation
↓
Session Creation
↓
Objective Detection
↓
Context Assembly
↓
Multi-Turn Interaction
↓
State Updates
↓
Outcome Capture
↓
Session Closure
↓
Memory Promotion or Disposal

## Session Types

### Quick Command Session

Purpose:
Complete one small action.

Examples:
- create reminder
- answer schedule question
- capture note

Typical duration:
A few seconds to one minute.

### Briefing Session

Purpose:
Deliver a morning, midday, or evening briefing.

Typical duration:
30 seconds to several minutes.

### Planning Session

Purpose:
Build or revise a plan collaboratively.

Examples:
- study schedule
- project roadmap
- weekly plan

Typical duration:
Several minutes to an extended conversation.

### Decision Session

Purpose:
Evaluate a choice.

Examples:
- whether to attend an event
- whether to accept an opportunity
- whether to make a purchase

### Reflection Session

Purpose:
Review an outcome or think through a pattern.

Examples:
- post-exam reflection
- project failure review
- behavioral observation

### Walking Session

Purpose:
Provide low-friction interaction while moving.

Characteristics:
- shorter responses
- reduced visual dependence
- stronger interruption support
- higher background-noise tolerance

### Deep Work Session

Purpose:
Support an extended focused task.

Examples:
- study assistance
- writing support
- coding support

The session should avoid unnecessary interruptions.

## Session States

Possible states:
- idle
- listening
- processing
- speaking
- awaiting_user
- awaiting_confirmation
- paused
- backgrounded
- completed
- failed

The active state should always be clear to Nishad.

## Standard Session Record

Each session should contain:
- session_id
- session_type
- status
- started_at
- updated_at
- ended_at
- activation_method
- primary_objective
- current_topic
- active_domain
- recent_turns
- relevant_memory_ids
- unresolved_questions
- pending_actions
- confirmation_requests
- assumptions
- session_summary
- expiration_policy
- device_profile
- privacy_mode

## Session Creation

A session begins when:
- push-to-talk is activated
- a wake phrase is detected
- a scheduled briefing begins
- the user resumes a recent session
- an approved proactive prompt is answered

The system should acknowledge activation visually or audibly.

## Objective Detection

At session start, Chief should identify the likely objective.

Examples:
- answer a question
- create a plan
- evaluate a decision
- capture information
- execute an action
- reflect

The objective may change during the session.

## Context Assembly

The session should load only context relevant to:
- the current objective
- the current domain
- recent turns
- unresolved references
- relevant goals, events, risks, and commitments

The session should not automatically load every known personal detail.

## Multi-Turn Context

Chief should preserve references such as:
- it
- that
- the earlier one
- move it later
- do the same for biology

Example:

User:
`Move my chemistry study block to seven.`

Chief:
`Done.`

User:
`Actually, make it eight.`

The system should know the second command refers to the same event.

## Topic Tracking

Each session should maintain:
- primary topic
- secondary topics
- current focus
- topic history

When the topic changes significantly, Chief should either:
- update the current session frame
- create a new sub-session
- ask whether Nishad wants to switch topics

## Context Switching

Chief should detect when a conversation moves into a new domain.

Example:

Academic planning
↓
Financial question

If the topics are unrelated, irrelevant academic context should be dropped.

If the topics are connected, relevant context may be preserved.

## Session Continuation

A recent session may be resumed when:
- the objective remains unfinished
- the user references the prior conversation
- a pending action remains unresolved
- the interruption was brief

Example:
`Continue the chemistry plan.`

Chief should restore the relevant session summary rather than replay the entire transcript.

## Session Expiration

Sessions should expire based on type and activity.

Suggested defaults:
- quick command: immediately after completion
- briefing: after the briefing and follow-up questions end
- planning: after 30 to 60 minutes of inactivity
- decision: after the decision is completed or deferred
- reflection: after summary and lesson capture
- walking: after a short inactivity window

Expiration should clear working memory while preserving meaningful outcomes.

## Session Closure

At closure, Chief should determine:
- what was decided
- what actions were created
- what remains unresolved
- whether memory should be updated
- whether a summary should be stored

A brief closing response may be used when useful.

Example:
`You're set. Chemistry review is scheduled for seven, and the professor email is queued for tomorrow morning.`

## Memory Promotion

Session content may be promoted when it represents:
- a confirmed fact
- a durable preference
- a meaningful decision
- a commitment
- a behavioral observation
- a lesson
- a goal update

Casual speech and temporary speculation should not be stored automatically.

## Session Summaries

Long sessions should produce a compact summary containing:
- objective
- decisions
- actions
- unresolved items
- important context

The summary supports future continuation without preserving excessive raw transcript.

## Confirmation State

The session manager should track pending confirmations.

Example:

Chief:
`Do you want me to send the email?`

User:
`Yes.`

The system should connect the confirmation to the correct action.

If the session expires before confirmation, the action must remain unexecuted.

## Interruption Handling

The user may interrupt by:
- speaking over Chief
- saying stop
- pausing the session
- changing the subject
- correcting a detail

Chief should stop playback immediately and update the session state.

## Pause and Resume

The user should be able to say:
- pause this
- hold that thought
- resume the planning session

Paused sessions should preserve a compact working state for a limited time.

## Parallel Sessions

North Vector may maintain more than one pending session, but only one should be active in voice at a time.

Examples:
- active chemistry planning session
- pending email confirmation
- paused project reflection

Chief should identify which session is being resumed.

## Device Handoff

A session may move between:
- MacBook
- phone
- earbuds
- future smart glasses

The handoff should preserve:
- current objective
- session summary
- pending actions
- confirmation state

Sensitive context should only move to approved devices.

## Privacy Modes

### Standard Session

Normal transcript and context rules.

### Sensitive Session

Reduced retention and stricter display rules.

### Public Environment Session

Shorter spoken output and reduced exposure of private details.

### No-Memory Session

The interaction is not promoted into long-term memory unless explicitly requested.

## Proactive Sessions

Chief may initiate a session only under approved conditions.

Examples:
- morning briefing
- critical deadline warning
- expiring opportunity
- safety or health alert

Proactive sessions should be easy to dismiss.

## Error Recovery

If the session loses context:
`I lost the reference. Are you talking about the chemistry study block or the biology one?`

If a session crashes:
- preserve approved actions already completed
- preserve a compact recovery summary when possible
- clearly state what did and did not happen

## Session Failure Modes

### Context Leakage

Old information enters an unrelated conversation.

### Premature Expiration

The system forgets the topic too quickly.

### Endless Session

Stale context remains active for too long.

### Wrong Reference Resolution

Pronouns or corrections modify the wrong object.

### Lost Confirmation

A yes or no is connected to the wrong action.

### Excessive Transcript Retention

The system stores more raw speech than necessary.

## Phase 1 Implementation

Phase 1 should support:
- one active voice session
- session type and status
- recent-turn context
- objective and topic tracking
- pending confirmation state
- interruption
- pause and resume
- inactivity expiration
- session summary
- selective memory promotion

Parallel sessions and device handoff can come later.

## Success Criteria

The Voice Session Manager succeeds if Nishad can:
- have natural multi-turn conversations
- use pronouns and corrections
- pause and resume discussions
- switch topics cleanly
- trust that sensitive context does not leak
- complete actions without losing confirmation state
- return to unfinished conversations without starting over

## Final Principle

A voice assistant hears individual commands.

A Chief of Staff understands the meeting.

The Voice Session Manager is what turns one into the other.