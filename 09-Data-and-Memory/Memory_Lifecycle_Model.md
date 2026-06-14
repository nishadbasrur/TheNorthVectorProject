# Memory Lifecycle Model v1.0

## Purpose

This document defines how North Vector should create, classify, validate, use, review, revise, archive, expire, and delete memory.

The Memory Lifecycle Model exists to make memory useful without allowing temporary impressions, weak inferences, stale preferences, or incorrect assumptions to become permanent truth.

Its purpose is not to remember everything.

Its purpose is to remember the right things for the right amount of time, with the right level of confidence and control.

## Core Principle

Memory should be earned, inspected, and allowed to change.

North Vector should distinguish between something recently observed, something inferred, something confirmed, and something durably true.

## Primary Objectives

The lifecycle should help Chief answer:
- Should this be remembered?
- What type of memory is it?
- How certain is it?
- Where did it come from?
- How long should it remain active?
- When should it be reviewed?
- What happens if new evidence conflicts with it?
- How can Nishad correct or delete it?

## Memory Lifecycle

Observation
↓
Candidate Memory
↓
Validation
↓
Active Memory
↓
Use and Reinforcement
↓
Review
↓
Confirm, Revise, Weaken, Archive, Expire, or Delete

## Memory States

Suggested states:
- Observed
- Candidate
- Confirmed
- Active
- Tentative
- Contradicted
- Stale
- Archived
- Expired
- Deleted
- Superseded

## Standard Memory Record

Each memory should contain:
- memory_id
- memory_type
- statement
- structured_value
- status
- source_refs
- evidence_ids
- contradiction_ids
- confidence
- importance
- sensitivity
- retention_class
- user_confirmed
- created_at
- updated_at
- effective_from
- effective_until
- last_used_at
- last_verified_at
- review_at
- expires_at
- decay_policy
- retrieval_contexts
- prohibited_contexts
- related_object_ids
- version
- superseded_by
- deleted_at
- audit_reference

## Memory Types

The system should support:
- Identity Memory
- Preference Memory
- Strategic Memory
- Goal Memory
- Behavioral Memory
- Relationship Memory
- Academic Memory
- Project Memory
- Financial Memory
- Health Memory
- Decision Memory
- Event Memory
- Risk Memory
- Opportunity Memory
- Reflection Memory
- Wisdom Memory
- Temporary State Memory

## Observation Stage

An observation is a raw or lightly interpreted fact encountered during:
- conversation
- voice session
- integration retrieval
- review
- task execution
- document reading
- system behavior

Examples:
- Nishad said mornings feel easier for studying.
- Two chemistry sessions were postponed.
- A mentor asked for an update Friday.

Observations should not automatically become durable memory.

## Candidate Memory Stage

A candidate memory is a proposed durable record awaiting enough confidence, value, or confirmation.

Candidate memories should include:
- proposed statement
- reason for remembering
- source
- confidence
- expected future use
- review deadline

Examples:
- `Morning study blocks may work better for difficult science courses.`
- `Nishad prefers free shipping even when the cost is baked into the price.`

## Candidate Creation Rules

Create a candidate memory only when:
- the information is likely to matter later
- the statement is sufficiently clear
- the source is known
- retention is privacy-compatible
- the information is not already represented

Do not create a candidate merely because a detail is interesting.

## Explicit Memory Creation

When Nishad says:
- remember this
- save this
- make this a rule
- this is important about me

North Vector should create or update memory directly, subject to privacy and contradiction checks.

Explicit user instruction should increase confidence but should not bypass versioning or source tracking.

## Implicit Memory Creation

Implicit memory may be considered when:
- information clearly affects future planning
- the statement appears stable
- repeated behavior supports it
- the memory would prevent repeated questions or mistakes

Implicit memory should remain conservative.

Behavioral and sensitive memories should usually begin as candidates.

## Validation Stage

A candidate memory may be validated through:
- direct user confirmation
- repeated independent evidence
- authoritative external source
- consistency across time
- successful predictive usefulness

Validation should also check for:
- contradiction
- ambiguity
- privacy sensitivity
- duplication
- identity-freezing risk

## Confirmation Levels

Suggested confirmation levels:

### User Confirmed

Nishad explicitly confirmed the statement.

### Source Confirmed

A reliable external source confirms it.

### Evidence Supported

Multiple observations support it.

### Tentative

Useful but not sufficiently established.

## Confidence Model

Suggested confidence values:
- Confirmed
- High
- Moderate
- Low
- Tentative
- Unknown

Confidence should consider:
- source quality
- recency
- consistency
- confirmation
- number of observations
- contradiction
- inference depth

## Memory Promotion

A candidate memory becomes Active when:
- future usefulness is clear
- confidence meets the threshold for its type
- privacy requirements are satisfied
- no unresolved high-impact contradiction exists
- retention and review rules are defined

## Promotion Thresholds

Different memory types should require different thresholds.

### Identity Memory

High threshold and usually direct confirmation or authoritative source.

### Preference Memory

Moderate threshold; may be confirmed through repeated choices.

### Behavioral Memory

High threshold; requires repeated evidence and careful wording.

### Temporary State Memory

Low threshold but short retention.

### Health and Financial Memory

High source and privacy requirements.

## Active Memory

An Active memory may influence:
- context retrieval
- planning
- risk analysis
- recommendations
- personalization
- automation

Active use should still respect:
- relevance
- sensitivity
- device trust
- current confidence
- retrieval context

## Retrieval Contexts

Each memory may define contexts where it is useful.

Examples:
- academic planning
- clothing recommendations
- financial budgeting
- relationship follow-up

The system should not retrieve the memory outside useful contexts merely because it exists.

## Prohibited Contexts

Some memories should not be used in certain contexts.

Examples:
- private health memory in public briefing
- relationship inference in unrelated academic planning
- financial balance on wearable display

## Memory Usage Record

Meaningful uses may record:
- memory_id
- used_at
- session_id
- purpose
- affected recommendation or action
- result

Usage history should support inspection without becoming excessive surveillance of the system itself.

## Reinforcement

A memory may be reinforced when:
- Nishad repeats it
- new evidence supports it
- it produces accurate useful guidance
- an authoritative source confirms it

Reinforcement may:
- increase confidence
- extend review date
- refine retrieval contexts

Reinforcement should not make a memory permanent by default.

## Decay

Memories should weaken when:
- they are not used
- evidence becomes old
- context changes
- the source disconnects
- contradictory evidence accumulates
- the statement is inherently temporary

Decay may affect:
- confidence
- retrieval priority
- review date
- active status

## Decay Policies

### No Automatic Decay

Appropriate for stable identity facts and ratified principles.

### Slow Decay

Appropriate for durable preferences and long-term strategy.

### Moderate Decay

Appropriate for operational patterns and relationship context.

### Fast Decay

Appropriate for temporary state, travel context, and short-term plans.

## Review Stage

A memory should be reviewed when:
- review_at arrives
- contradiction appears
- Nishad disputes it
- the memory affects a high-stakes recommendation
- the source becomes stale
- the context changes
- confidence falls below threshold

## Review Questions

- Is this still accurate?
- Is the wording fair and specific?
- Is the confidence justified?
- Is the memory still useful?
- Should sensitivity change?
- Should retention be extended?
- Does new evidence require revision?

## Review Outcomes

Possible outcomes:
- Confirm
- Revise
- Narrow Context
- Broaden Context
- Lower Confidence
- Increase Confidence
- Archive
- Expire
- Delete
- Supersede
- Keep Watching

## Revision

Revising a memory should:
- preserve memory_id when the underlying identity remains the same
- increment version
- preserve prior statement
- record reason
- update evidence and confidence
- preserve audit history

## Supersession

Create a superseding memory when the old and new statements represent materially different states.

Example:
Old:
`Nishad plans to attend one university.`

New:
`Nishad committed to UConn.`

The old memory remains historical but no longer influences current planning.

## Contradiction Handling

When evidence conflicts with a memory:
1. Preserve the existing memory.
2. Add contradiction evidence.
3. Lower confidence if warranted.
4. Mark Contradicted or Tentative when consequential.
5. Ask for clarification when useful.
6. Avoid relying on the memory in high-stakes contexts until resolved.

## Contextual Contradictions

Two statements may both be true under different conditions.

Example:
- morning study works better for difficult new material
- evening review works better for memorized content

The correct response may be to split one broad memory into multiple contextual memories.

## Behavioral Memory Rules

Behavioral memories should:
- describe tendencies, not fixed identity
- include trigger conditions
- include evidence and counterevidence
- remain revisable
- avoid moral judgment
- define an intervention when useful

Good:
`When a task feels ambiguous, Nishad may delay starting until the first action is clarified.`

Weak:
`Nishad is lazy.`

## Preference Memory Rules

Preferences should distinguish:
- stable preference
- situational preference
- current choice
- hard constraint

Example:
`Prefers navy clothing` differs from `needs navy for this event.`

## Relationship Memory Rules

Relationship memories should:
- contain operationally useful context
- minimize speculation
- preserve privacy
- expire when roles change
- distinguish direct facts from interpretation

## Temporary State Memory

Temporary state may include:
- energy today
- current stress
- illness
- temporary schedule constraint
- travel status

Temporary state should use fast decay and explicit expiration.

## Event Memory

Events may move from:
- Upcoming
- Active
- Completed
- Historical Summary

Detailed event records should not remain in active memory indefinitely unless they contain durable lessons or commitments.

## Decision Memory

Decision memory should preserve:
- decision context
- options
- assumptions
- recommendation
- choice
- outcome
- lessons

Decision records should usually remain long-term because they support judgment calibration.

## Wisdom Memory

Wisdom memory represents distilled lessons or rules.

Examples:
- front-load high-risk science work
- do not confuse planning with implementation

Wisdom memories should require clear evidence or explicit ratification.

## Memory Merging

Merge memories when:
- they represent the same underlying fact
- one is a more precise version
- evidence overlaps strongly

A merge should:
- preserve all source references
- preserve contradiction history
- select one canonical memory ID
- redirect relationships
- record the merge

## Memory Splitting

Split a memory when:
- one statement contains multiple independent claims
- contexts differ
- part is confirmed and part remains tentative
- sensitivity differs

## Duplicate Detection

Possible duplicates may be detected using:
- normalized statement
- structured value
- memory type
- related objects
- semantic similarity
- source overlap

Similarity should not cause automatic merging without confidence.

## Archiving

Archive memory when:
- historically useful
- no longer operationally current
- superseded
- linked to completed project or life phase

Archived memory should:
- leave ordinary retrieval
- remain searchable by explicit request
- preserve history and provenance
- remain deletable

## Expiration

Expire memory when:
- its time horizon ends
- its source becomes too stale
- temporary state passes
- its purpose no longer exists
- confidence decays below useful threshold

Expired memory should not influence active recommendations.

## Deletion

Delete memory when:
- Nishad requests deletion
- it was created improperly
- it has no legitimate remaining purpose
- source deletion requires removal
- privacy rules require it

Deletion should propagate to:
- retrieval index
- embeddings
- caches
- derived summaries
- unsupported inferences

## Deletion and Audit

The audit log may preserve that a deletion occurred without retaining the deleted statement.

## Memory Sensitivity

Memory sensitivity should use:
- Public
- Internal
- Sensitive
- Restricted

Sensitivity may change over time or through user correction.

## Device Access

Device trust should affect memory retrieval.

Examples:
- trusted MacBook may show full memory
- phone may show approved sensitive memory after authentication
- glasses may receive only a generic reminder

## No-Memory Mode

In No-Memory Mode:
- session context may still exist temporarily
- no new long-term memory should be created unless explicitly requested
- candidate memories should not be generated silently
- existing memory may be used only according to session settings

## Memory Write Authorization

Memory writes should classify whether they are:
- Explicit User Save
- Automatic Operational Save
- Candidate Inference
- System Update
- External Source Refresh

Sensitive or behavioral inferences should be more conservative than ordinary task updates.

## Memory Write Conflicts

Before writing, the system should check for:
- existing memory
- contradiction
- newer source
- sensitivity mismatch
- no-memory mode
- source permission

## Memory Read Ranking

Relevant memories should be ranked by:
- objective relevance
- confidence
- recency
- importance
- relationship proximity
- active status
- device compatibility

## Retrieval Suppression

A memory should be suppressed when:
- expired
- archived and not explicitly requested
- contradicted and unresolved
- not relevant
- prohibited by context
- sensitivity exceeds device authority

## Memory Quality Metrics

Useful measures include:
- confirmed-memory rate
- correction rate
- stale-memory count
- contradiction count
- unused-memory count
- candidate-expiration rate
- retrieval usefulness feedback

Metrics should not incentivize remembering more.

## Memory Review Dashboard

The dashboard should show:
- candidate memories
- memories due for review
- contradicted memories
- stale memories
- recently revised memories
- recent deletions
- high-sensitivity memories

## Notifications

Notify Nishad when:
- a consequential candidate needs confirmation
- a high-impact memory is contradicted
- a sensitive memory is created
- a memory used in a major decision is stale

Routine cleanup may remain silent.

## Audit Events

Memory audit events should include:
- observed
- candidate created
- confirmed
- activated
- retrieved for consequential use
- revised
- contradicted
- archived
- expired
- merged
- split
- deleted
- superseded

## Error Handling

If a memory cannot be saved:
`The memory was not stored. The current session context is unchanged.`

If deletion is incomplete:
`The active memory was removed, but one search index copy is still being cleaned up. It is blocked from retrieval.`

If a conflict exists:
`This new information conflicts with an active memory, so I preserved both and lowered confidence until it is resolved.`

## Failure Modes

### Memory Hoarding

The system remembers every detail.

### Premature Promotion

A single observation becomes durable truth.

### Identity Freezing

Old patterns continue shaping recommendations indefinitely.

### Source Loss

The system cannot explain where memory came from.

### Confidence Inflation

Tentative inference appears confirmed.

### Context Leakage

A memory is used outside the situation where it applies.

### Incomplete Deletion

Memory remains retrievable through indexes or summaries.

### Review Neglect

Stale memories remain active because review never occurs.

## Phase 1 Implementation

Phase 1 should support:
- memory types
- candidate and active states
- explicit and implicit memory creation
- source and evidence
- confidence
- review dates
- decay policies
- contradiction handling
- revision and versioning
- archive, expiration, and deletion
- no-memory mode
- Memory Inspector integration

Advanced automatic reinforcement scoring and predictive memory decay can come later.

## Success Criteria

The Memory Lifecycle Model succeeds if North Vector can always explain:
- why something was remembered
- how certain it is
- how it is being used
- when it will be reviewed
- what changed when new evidence appeared
- how Nishad can correct or remove it

## Final Principle

North Vector should not build trust by never forgetting.

It should build trust by remembering carefully, changing honestly, and forgetting when memory no longer deserves to remain.