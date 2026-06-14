# Memory Inspector Design v1.0

## Purpose

This document defines how North Vector should let Nishad inspect, understand, correct, confirm, archive, and delete memories.

The Memory Inspector exists because a system that remembers personal information must make that memory visible and controllable.

Its purpose is to build trust through transparency.

## Core Principle

North Vector should never remember Nishad in a way he cannot inspect.

Every meaningful memory should be understandable, traceable, and correctable.

## Primary Objectives

The Memory Inspector should help Nishad answer:
- What does Chief remember about me?
- Why was this remembered?
- Where did it come from?
- How confident is the system?
- Is it still accurate?
- Where is it being used?
- How do I correct or delete it?

## Default View

The default Memory Inspector should show:
- active memories
- memory type
- title
- summary
- confidence
- importance
- last updated
- sensitivity
- status

Candidate, contradicted, archived, expired, and deleted memories should be available through filters where appropriate.

## Memory Categories

The interface should support:
- Identity
- Strategic
- Operational
- Behavioral
- Goal
- Relationship
- Academic
- Project
- Financial
- Health
- Decision
- Event
- Opportunity
- Risk
- Reflection
- Wisdom

## Memory Card

Each memory card should include:
- title
- memory type
- concise summary
- confidence
- importance
- status
- last updated
- sensitivity
- source label

Possible quick actions:
- View Details
- Confirm
- Correct
- Archive
- Delete
- Mark Inaccurate

## Memory Detail View

The detail page should contain:

### Memory Summary

- title
- summary
- full details
- memory type
- status

### Source

Show:
- source type
- source reference
- date created
- original context when available

Examples:
- direct user statement
- conversation
- calendar
- email
- reflection
- system inference

### Confidence

Show:
- confidence value or label
- why confidence is high or low
- whether Nishad confirmed it

Suggested labels:
- Confirmed
- Strong Evidence
- Moderate Evidence
- Weak Evidence
- Tentative

### Importance

Show why the memory matters.

Examples:
- affects active goals
- influences risk detection
- changes planning
- supports relationship context

### Relationships

Show links to:
- goals
- people
- projects
- events
- risks
- opportunities
- other memories

### Evidence

Display supporting and contradictory evidence separately.

Each evidence item should show:
- date
- source
- summary
- strength

### Usage History

Show where the memory influenced:
- recommendations
- plans
- risk assessments
- briefings
- decisions

This helps Nishad understand the practical effect of a memory.

### Version History

Show:
- prior versions
- what changed
- why it changed
- who or what initiated the update

### Review and Expiration

Show:
- next review date
- time horizon
- decay policy
- expiration date if applicable

## Candidate Memory Queue

The Inspector should provide a queue for memories awaiting confirmation.

Examples:
- emerging behavioral pattern
- inferred preference
- possible relationship update
- uncertain goal change

Possible actions:
- Confirm
- Reject
- Edit
- Keep Temporary
- Ask Me Later

## Behavioral Memory Review

Behavioral memories deserve stronger scrutiny.

The interface should show:
- pattern description
- trigger conditions
- evidence count
- contradictory evidence
- typical outcomes
- recommended intervention
- whether Nishad confirmed it

The interface should make clear that tendencies are not permanent identity labels.

## Relationship Memory Review

Relationship memories should show only relevant context.

The interface should avoid overexposing private or interpretive details.

Suggested sections:
- relationship category
- current status
- commitments
- follow-up needs
- interaction history
- privacy level

## Correction Flow

When correcting a memory, the interface should ask:
- What is wrong?
- What should replace it?
- Is the old memory historically useful?
- Should related memories update too?

The system should preserve prior versions when useful.

## Contradiction Flow

When two memories conflict, show both side by side.

Example:

Memory A:
`Morning study blocks work better.`

Memory B:
`Evening study has recently worked better.`

Possible actions:
- Keep Both as Contextual
- Replace Older Memory
- Mark New Statement Temporary
- Ask for Clarification

## Confirmation Flow

A confirmed memory should record:
- confirmation date
- confirmer
- confirmation source
- version

User confirmation should increase confidence but not prevent later revision.

## Archive Flow

Archiving should mean:
- preserved historically
- removed from normal active retrieval
- still searchable
- restorable

Examples:
- completed course
- former job
- expired project

## Deletion Flow

Deletion should clearly distinguish:
- delete this memory
- delete associated raw transcript
- delete source link only
- delete entire memory history

Destructive actions should require explicit confirmation.

## Bulk Review

The interface may support bulk review for:
- expired operational memories
- duplicate memories
- old candidate memories
- completed event memories

Bulk deletion should remain conservative.

## Search and Filters

Allow search by:
- keyword
- person
- goal
- project
- source
- date
- memory type
- confidence
- sensitivity
- status

## Memory Map

An optional graph view may show relationships among memories.

Example:

Behavioral Pattern
↓
Risk
↓
Goal
↓
Decision

The graph should remain optional and understandable.

## Sensitivity Controls

Each memory should show a sensitivity level:
- Low
- Moderate
- High
- Restricted

Nishad should be able to raise or lower sensitivity where appropriate.

Sensitivity affects:
- retrieval
- device access
- notification display
- authentication

## Privacy Modes

### Standard View

Shows approved memory details.

### Private View

Requires authentication and reveals high-sensitivity fields.

### Public View

Suppresses sensitive names, details, and previews.

## Memory Health Summary

The Inspector may provide a summary of:
- active memory count
- candidate memory count
- contradicted memories
- stale memories
- memories due for review
- recent deletions

The summary should support maintenance without encouraging obsession.

## Error States

If a source cannot be loaded:
`The memory remains available, but the original source could not be retrieved.`

If synchronization fails:
`Some memory updates may be delayed. Last successful sync: 10:04 AM.`

## Mobile View

On phone, prioritize:
- memory summary
- confidence
- source
- correction
- delete
- confirm

Complex graphs and version histories may collapse.

## Wearable View

The full Memory Inspector should not live on glasses or watch.

Wearables may show only:
- a brief memory reference
- confirm or dismiss
- handoff to trusted device

## Accessibility

The Memory Inspector should support:
- keyboard navigation
- screen readers
- scalable text
- clear source labels
- non-color confidence indicators
- accessible version history

## Failure Modes

### Hidden Memory

The user cannot see what is stored.

### False Authority

Low-confidence memory looks definitive.

### Identity Freezing

Old behavioral patterns remain active forever.

### Source Obscurity

The user cannot understand where a memory came from.

### Deletion Confusion

The user does not know what was actually removed.

### Inspector Overload

The interface exposes raw system complexity without useful structure.

### Privacy Leakage

Sensitive memories appear on the wrong surface.

## Phase 1 Implementation

Phase 1 should include:
- active memory list
- memory cards
- detail view
- source and confidence
- confirm, correct, archive, and delete actions
- candidate memory queue
- contradiction display
- sensitivity labels
- search and filters
- version history

Advanced graph visualization and usage analytics can come later.

## Success Criteria

The Memory Inspector succeeds if Nishad can quickly understand:
- what Chief remembers
- why it remembers it
- how certain it is
- where the memory came from
- how it affects recommendations
- how to correct or remove it

## Final Principle

Memory creates usefulness.

Inspectability creates trust.

North Vector needs both.