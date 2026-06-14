# Chief Conversation View Design v1.0

## Purpose

This document defines how North Vector should present conversations with Chief across text, voice, planning, decision support, actions, and memory updates.

The Chief Conversation View is the primary interactive surface for direct communication with the system.

Its purpose is to make complex reasoning feel clear, coherent, and actionable without exposing unnecessary internal machinery.

## Core Principle

Nishad should experience one Chief.

The interface should feel like a focused operational conversation, not a generic chatbot window and not a stream of disconnected subsystem outputs.

## Primary Objectives

The Chief Conversation View should help Nishad:
- ask questions naturally
- make decisions
- build plans
- capture information
- review recommendations
- approve actions
- correct memory
- continue prior sessions
- understand why Chief is recommending something

## Conversation Modes

The interface should support:
- General Conversation
- Decision Mode
- Planning Mode
- Briefing Mode
- Reflection Mode
- Command Mode
- Review Mode
- No-Memory Mode

The active mode should be visible but unobtrusive.

## Default Layout

Suggested regions:

1. Conversation Header
2. Message Stream
3. Context Strip
4. Input Composer
5. Voice Controls
6. Action and Confirmation Tray
7. Session Summary
8. Related Objects Panel

## Conversation Header

The header should show:
- session title
- active mode
- privacy state
- memory state
- connected tools
- session controls

Possible controls:
- Rename Session
- Pause
- End Session
- No-Memory Mode
- View Context

## Message Stream

The message stream should support:
- user messages
- Chief responses
- structured recommendations
- plans
- risk warnings
- opportunity cards
- action proposals
- confirmations
- memory notices
- error states

The stream should remain readable even when a response contains structured content.

## Chief Response Structure

For significant requests, Chief responses should generally present:

1. Conclusion
2. Key reasoning
3. Tradeoff or uncertainty
4. Recommended next action

The interface should make the conclusion visually easy to find.

## Recommendation Card

A recommendation card may include:
- recommendation
- confidence
- main reason
- affected goals
- main risk
- main opportunity
- conditions that would change the answer
- next action

Possible actions:
- Accept
- Modify
- Reject
- Explain More
- Save Decision

## Decision Mode

Decision Mode should show:
- decision statement
- options
- relevant goals
- risks
- opportunities
- reversibility
- recommendation
- confidence

The user should be able to revise assumptions and rerun the analysis.

## Planning Mode

Planning Mode should support:
- goal or outcome
- tasks
- dependencies
- estimated duration
- schedule
- buffers
- constraints
- fallback plan

Possible actions:
- Add to Calendar
- Create Tasks
- Replan
- Simplify
- Save Plan

## Briefing Mode

Briefing Mode should present:
- executive summary
- priorities
- schedule
- risks
- opportunities
- commitments
- next action

The user should be able to expand any section conversationally.

## Reflection Mode

Reflection Mode should support:
- one question at a time
- voice input
- observation capture
- lesson capture
- candidate pattern review
- next-action creation

The interface should avoid making reflection feel like filling out a form.

## Command Mode

Command Mode should show:
- interpreted command
- target object
- proposed action
- confirmation status
- result

Example:

Interpreted command:
`Move chemistry study block to 7:00 PM.`

Status:
`Awaiting confirmation`

## Input Composer

The composer should support:
- text
- voice
- file attachment
- quick capture
- slash commands or shortcuts
- mode switching

Suggested placeholder:
`Ask Chief, make a plan, capture something, or take an action...`

## Voice Controls

Voice controls should show:
- microphone state
- listening state
- processing state
- speaking state
- mute
- stop
- transcript preview

The user should always know when the microphone is active.

## Context Strip

A compact context strip may show what Chief is currently using.

Examples:
- CHEM 1127Q exam in 6 days
- Study plan behind by one block
- GPA goal active

The strip should be expandable and editable.

This builds trust without exposing overwhelming internal detail.

## Related Objects Panel

The panel may show linked:
- goals
- tasks
- events
- risks
- opportunities
- people
- projects
- memories

Selecting an item should open its detail view without losing the conversation.

## Action and Confirmation Tray

Sensitive proposed actions should appear in a dedicated tray.

Examples:
- send email
- change calendar event
- delete memory
- create external commitment

Each action should show:
- exact action
- target
- reason
- permission requirement
- confirm and cancel controls

## Memory Notices

When Chief stores or proposes a memory, the interface should show a subtle notice.

Examples:
- `Preference saved`
- `Candidate behavioral pattern created`
- `Commitment added`

The user should be able to inspect or undo the memory action.

## Source and Evidence Display

When a recommendation relies on records or integrations, Chief should be able to show:
- source
- date
- confidence
- supporting evidence

Evidence should remain collapsed by default unless the decision is high stakes or the user asks.

## Session Summary

Long sessions should maintain a live summary containing:
- objective
- decisions
- actions created
- unresolved questions
- next step

The summary should help Nishad resume later without rereading the full conversation.

## Session History

Conversation history should support:
- search
- titles
- dates
- domains
- linked goals or projects
- continuation
- archive
- delete

History should not imply that every conversation became long-term memory.

## Correction Interaction

Nishad should be able to correct Chief naturally.

Examples:
- `That's wrong.`
- `I meant biology.`
- `Don't remember that.`
- `Use a different assumption.`

The interface should show what changed.

## Regeneration and Revision

Possible actions:
- Shorter
- More Detail
- More Direct
- Reconsider
- Use Different Assumption
- Compare Options

Revisions should preserve the original decision context where useful.

## Tool Activity

When Chief uses an integration, the interface should show concise status.

Examples:
- `Checking calendar...`
- `Drafting email...`
- `Reading project file...`

Do not expose raw technical logs by default.

## Error Handling

Errors should state:
- what failed
- what did not happen
- what remains available
- what to try next

Example:
`I created the plan, but the calendar update failed. No events were changed.`

## Streaming and Latency

The interface may stream text for longer responses.

For complex reasoning, show a truthful processing state rather than fake progress.

Simple answers should appear quickly.

## Tone and Visual Design

The interface should feel:
- calm
- intelligent
- direct
- warm
- high-trust

Avoid:
- cartoon assistant styling
- excessive bubbles
- animated avatars
- fake typing theatrics
- cluttered tool logs

## Mobile View

On phone, prioritize:
- conversation stream
- voice button
- next action
- confirmation tray
- compact context

Related objects may open as sheets.

## Wearable View

On glasses or watch, support:
- short exchanges
- quick capture
- brief recommendations
- confirmation
- handoff to phone or MacBook

Long-form reasoning should not be forced onto a wearable display.

## Accessibility

The view should support:
- keyboard navigation
- screen readers
- text scaling
- captions
- voice input
- reduced motion
- clear focus states

## Privacy

The conversation view should:
- show memory mode clearly
- hide sensitive previews when locked
- support private and no-memory sessions
- require authentication for restricted context
- provide conversation deletion controls

## Empty State

Suggested empty state:

`What are we working on?`

Quick starts:
- Give me the day
- Help me decide
- Build a plan
- Capture something
- Review my week

## Failure Modes

### Generic Chat Window

The interface ignores goals, actions, and context.

### Internal System Leakage

Too many agent and engine details appear.

### Hidden Actions

The user cannot tell what Chief changed.

### Lost Context

The conversation forgets the current objective.

### Confirmation Confusion

Approvals connect to the wrong action.

### Excessive Structure

Every simple answer becomes a complex card.

### Uninspectable Memory

The user cannot see what the conversation caused Chief to remember.

## Phase 1 Implementation

Phase 1 should include:
- text conversation
- voice input
- session titles
- mode indicator
- recommendation cards
- planning output
- action confirmation tray
- context strip
- memory notices
- session summary
- history and continuation
- responsive design

Advanced multi-panel workflows can come later.

## Success Criteria

The Chief Conversation View succeeds if Nishad can:
- communicate naturally
- understand recommendations quickly
- see what context matters
- approve actions safely
- correct mistakes easily
- resume unfinished work
- trust what Chief remembers and changes

## Final Principle

The conversation is not the product.

It is the place where memory, judgment, planning, and action become one coherent experience.