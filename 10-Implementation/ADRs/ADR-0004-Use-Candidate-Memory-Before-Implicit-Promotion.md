# ADR-0004: Use Candidate Memory Before Implicit Promotion

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Memory System Owner
- Privacy Owner
- AI Safety Owner
- Data Architecture Owner

## Related Documents

- `09-Data-and-Memory/Memory_Lifecycle_Model.md`
- `09-Data-and-Memory/Memory_Retrieval_and_Context_Assembly.md`
- `09-Data-and-Memory/Data_Quality_and_Provenance_Model.md`
- `08-Security-and-Privacy/Threat_Model.md`
- `10-Implementation/MVP_Scope_and_Acceptance_Criteria.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/Implementation_Decision_Log.md`

## Context

North Vector is intended to become useful over time by learning stable preferences, goals, constraints, behavioral tendencies, relationships, and lessons from prior decisions.

That capability creates one of the system's most important privacy and trust risks.

A model may infer something that sounds plausible but is:
- based on one observation
- dependent on temporary context
- phrased too broadly
- contradicted by other evidence
- derived from a transcription or extraction error
- unfairly identity-defining
- sensitive in a way that the user did not expect

If every useful-looking inference is immediately written into active long-term memory, North Vector may begin shaping future recommendations around weak or incorrect assumptions.

Examples include:
- treating one postponed task as a stable procrastination pattern
- treating one purchase as a permanent preference
- treating temporary stress as a durable personal trait
- turning a model interpretation into an identity statement

At the same time, requiring Nishad to explicitly save every useful memory would weaken the system's ability to learn from repeated interactions and would create unnecessary friction.

The architecture therefore needs an intermediate state between observation and active durable memory.

## Decision Drivers

- user trust
- privacy
- correction before influence
- prevention of identity freezing
- source provenance
- confidence calibration
- memory usefulness
- low-friction personalization
- inspectability
- deletion and revision control
- resistance to model and transcript error

## Options Considered

### Option A: Candidate Memory Before Implicit Promotion

Description:
Implicitly inferred durable memories are stored as candidates. They do not influence ordinary retrieval until validated, confirmed, or promoted under a narrow approved rule.

Advantages:
- weak inferences do not immediately shape behavior
- Nishad can inspect and reject proposed memory
- source and confidence remain visible
- corrections occur before long-term influence
- behavioral memories can use higher evidence thresholds
- memory creation remains possible without requiring explicit save commands every time

Disadvantages:
- creates a review queue
- some useful memories may remain inactive longer
- requires candidate lifecycle and interface work
- user may ignore candidate reviews
- additional state transitions complicate implementation

Risks:
- candidate backlog may grow
- the interface may become noisy
- poorly designed promotion rules may recreate automatic-memory risk

### Option B: Automatically Promote All High-Confidence Inferences

Description:
Allow the model or memory service to activate any inferred memory above a confidence threshold.

Advantages:
- highly automatic personalization
- low user friction
- memory becomes useful immediately

Disadvantages:
- model confidence is not equivalent to factual reliability
- one incorrect inference can influence many later sessions
- sensitive or behavioral claims may become active invisibly
- user may not know what changed

Risks:
- identity freezing
- invasive personalization
- false certainty
- high correction rate and trust loss

### Option C: Explicit Save Only

Description:
Create durable memory only when Nishad directly asks the system to remember something.

Advantages:
- maximal clarity and control
- simple implementation
- no hidden memory creation
- low risk of inferred identity claims

Disadvantages:
- high user burden
- repeated useful patterns are lost
- the system remains less adaptive
- the user must understand in advance what will matter later

Risks:
- memory becomes incomplete
- personalization remains shallow
- repeated questions and mistakes persist

### Option D: Do Not Use Long-Term Personal Memory

Description:
Use session context only and avoid durable personalization.

Advantages:
- strongest privacy boundary
- simpler data lifecycle
- little risk of stale identity claims

Disadvantages:
- undermines the core Chief-of-Staff vision
- repeated context must be re-entered
- long-term goals, lessons, and preferences cannot compound
- weak continuity across sessions

Risks:
- North Vector becomes a generic chat interface rather than a personal operating system

## Decision

North Vector will use a Candidate Memory state for implicitly inferred durable memories.

Implicit memory proposals must not become ordinary active memory immediately.

A candidate memory should contain:
- proposed statement
- memory type
- source references
- evidence
- confidence
- reason for remembering
- expected retrieval contexts
- sensitivity
- review or expiration date

Candidate memories should remain excluded from ordinary retrieval and recommendation behavior unless:
- Nishad explicitly confirms them
- a narrow, separately approved promotion rule applies
- the current interaction is specifically reviewing candidate memory

Explicit user instructions such as `remember this`, `save this`, or `make this a rule` may create or update active memory directly, subject to validation, source tracking, privacy rules, and contradiction checks.

## Memory Promotion Rules

A candidate may become Active when:
- future usefulness is clear
- source and evidence are known
- confidence meets the threshold for its memory type
- privacy classification is appropriate
- no unresolved high-impact contradiction exists
- the memory has a review and retention policy
- user confirmation exists when required

## Memory-Type Thresholds

### Identity Memory

Requires direct user confirmation or an authoritative source.

### Behavioral Memory

Requires repeated evidence, careful wording, context conditions, and usually explicit confirmation.

### Preference Memory

May be promoted after direct confirmation or repeated consistent choices, depending on sensitivity and impact.

### Goal and Commitment Memory

May become active when the user explicitly states the goal or obligation and the statement is clear.

### Temporary State Memory

May be stored immediately with short retention and explicit expiration, but should not be treated as durable identity.

### Health, Financial, and Relationship Memory

Requires stricter source, sensitivity, and confirmation rules.

## Candidate Memory Lifecycle

Suggested lifecycle:

Observed
↓
Candidate
↓
Confirmed, Rejected, Expired, Merged, or Superseded
↓
Active when confirmed
↓
Reviewed, Revised, Archived, Expired, or Deleted

## Candidate Memory Statuses

Suggested statuses:
- Candidate
- Awaiting Confirmation
- Confirmed
- Rejected
- Expired
- Merged
- Superseded

## Candidate Memory Record

Each candidate should contain:
- candidate_id
- proposed_statement
- memory_type
- structured_value
- source_refs
- evidence_ids
- confidence
- sensitivity
- reason_for_memory
- expected_use
- retrieval_contexts
- created_at
- review_at
- expires_at
- status
- confirmed_by
- confirmed_at
- rejection_reason
- promoted_memory_id
- audit_reference

## Rationale

The Candidate Memory state provides the best balance between adaptive personalization and user control.

North Vector should learn, but learning should not mean silently converting one model interpretation into a durable fact about Nishad.

The candidate layer makes uncertainty operational. It gives the system somewhere to place potentially useful information without allowing that information to influence ordinary reasoning prematurely.

This is especially important for behavioral memory. A Chief of Staff may need to recognize patterns such as underestimating task duration or delaying ambiguous work. Those patterns can be useful, but they must remain specific, evidence-based, contextual, and revisable.

The candidate model also makes memory creation visible. Nishad can understand:
- what the system noticed
- why it may matter
- where the inference came from
- how confident the system is
- whether to confirm, revise, or reject it

## Consequences

### Positive Consequences

- reduces false durable memory
- prevents premature identity claims
- improves user inspection and correction
- preserves source and confidence
- supports learning without fully manual memory management
- creates a clear place for tentative behavioral patterns
- strengthens No-Memory Mode and memory transparency
- allows different promotion thresholds by memory type

### Negative Consequences

- adds candidate-management complexity
- requires a Memory Inspector queue
- delays some personalization
- may create review fatigue
- requires cleanup and expiration
- promotion rules must remain understandable

### Operational Consequences

- candidate count and age should be monitored
- stale candidates need expiration or review
- high-sensitivity candidates may require notifications
- candidate backlog should not become a hidden data archive
- candidate memory creation failures should not affect active memory

### Security and Privacy Consequences

- inferred sensitive information remains less authoritative
- candidates still contain personal data and require normal protection
- rejected candidates should be deleted or retained only according to explicit policy
- No-Memory Mode must prevent candidate creation
- public and limited-trust devices should not expose sensitive candidate details

### Data and Migration Consequences

- candidate memory requires distinct status or storage
- candidate and active memory must remain distinguishable in retrieval
- promotion should preserve source and evidence
- rejected and expired candidates need retention and deletion rules
- migration should not accidentally activate candidates

## Explicit Memory Behavior

When Nishad explicitly asks to remember something, North Vector should:
1. validate the statement
2. check for existing or conflicting memory
3. classify sensitivity
4. preserve the user statement as source
5. create or update active memory
6. show what was stored
7. record an audit event

Explicit memory should still remain editable, reviewable, and deletable.

## Implicit Candidate Creation Rules

Create a candidate only when:
- the information is likely to matter in future sessions
- the statement can be phrased specifically
- the source is known
- the information is not already represented
- the privacy cost is proportionate to the benefit
- the candidate is not merely an interesting detail

Do not create candidates for:
- every named object
- trivial one-time preferences
- bystander information without need
- sensitive speculation
- ordinary transient emotions without expiration
- content from untrusted sources without corroboration

## Behavioral Memory Wording

Behavioral candidates should describe tendencies and conditions rather than fixed identity.

Good:
`When a task feels ambiguous, Nishad may delay starting until the first action is clarified.`

Poor:
`Nishad is lazy.`

A behavioral candidate should include:
- observed condition
- behavior
- evidence
- counterevidence when available
- possible intervention
- review date

## Candidate Review Interface

The Memory Inspector should let Nishad:
- view candidate statement
- see source and evidence
- see confidence and sensitivity
- confirm as written
- edit and confirm
- reject
- merge with existing memory
- defer review
- delete immediately

## Candidate Expiration

Candidates should expire when:
- no longer relevant
- source becomes stale
- review window passes
- the underlying event or context ends
- confidence decays below usefulness

Expired candidates should not be retained indefinitely unless a clear archival purpose exists.

## Candidate Retrieval Rules

Candidate memories should be excluded from ordinary context assembly.

They may be retrieved only for:
- Memory Inspector
- explicit memory review
- contradiction resolution
- system-quality evaluation
- a request asking what the system is considering remembering

Chief should not phrase candidate content as established fact.

## Contradiction Handling

When a candidate conflicts with active memory:
- preserve both records
- attach contradiction evidence
- prevent automatic promotion
- request clarification if useful
- allow the new candidate to supersede the old memory only after validation

## Rejection Handling

When Nishad rejects a candidate:
- stop using it immediately
- record rejection without unnecessarily retaining the full sensitive statement
- prevent the same unsupported inference from being recreated repeatedly
- allow later reconsideration only when meaningfully new evidence appears

## No-Memory Mode

In No-Memory Mode:
- no active memory should be created implicitly
- no candidate memory should be created implicitly
- session context should remain temporary
- explicit save should require a clear user action and may warn that No-Memory Mode is active

## Model Responsibilities

The model may propose candidate memory but may not:
- promote its own candidate
- assign Confirmed status
- ignore No-Memory Mode
- create a behavioral identity claim without evidence
- hide candidate creation from the user-facing system

## Service Responsibilities

The memory service should:
- validate candidate schema
- check duplicates and contradictions
- apply sensitivity and retention
- enforce status transitions
- preserve source and evidence
- audit promotion, rejection, expiration, and deletion

## Testing Requirements

Required tests include:
- implicit inference creates Candidate, not Active
- candidate is excluded from ordinary retrieval
- explicit user save creates or updates active memory
- user confirmation promotes candidate
- user edit creates the approved active wording
- rejection prevents future retrieval
- expired candidate does not remain active in review queue
- No-Memory Mode prevents candidate creation
- behavioral candidate requires source and review date
- migration does not convert candidates to active memory
- duplicate candidate is merged or suppressed
- sensitive candidate is hidden on limited-trust devices

## Validation Plan

The decision will be validated through:
- Memory Inspector prototype
- one-week MVP usage trial
- candidate confirmation and rejection rates
- memory correction rate
- retrieval relevance feedback
- audit of automatically proposed behavioral memories
- No-Memory Mode end-to-end test
- deleted and rejected candidate cleanup test

The system should be considered successful when candidate memory improves personalization without making Nishad feel that the system is silently profiling him.

## Rollback or Exit Strategy

This decision is intended to be durable for behavioral and sensitive memory.

Future versions may introduce narrow automatic promotion for low-risk categories, such as:
- stable formatting preferences
- repeated interface settings
- user-owned object aliases

Any automatic-promotion category should define:
- exact memory type
- minimum evidence
- confidence threshold
- sensitivity ceiling
- correction mechanism
- review date
- user setting

Removing the candidate stage broadly would require a superseding ADR and privacy review.

## Residual Risks

- candidates may still feel invasive
- users may confirm incorrect statements quickly
- candidate queues may be ignored
- model wording may remain overly broad
- repeated rejected inferences may reappear
- active memory may become stale after promotion
- sensitive candidate content still requires protection

## Assumptions

- the Memory Inspector is easy to access
- candidate memory volume remains manageable
- the system can distinguish explicit user statements from model inference
- source and evidence are preserved
- active retrieval can reliably exclude candidate state
- users value some implicit personalization

## Review Triggers

Revisit this ADR when:
- candidate backlog becomes unmanageable
- confirmation friction materially reduces usefulness
- a safe automatic-promotion category is demonstrated
- users frequently reject or correct candidates
- a privacy incident involves inferred memory
- multi-user or delegated memory is introduced
- continuous voice or wearable capture increases observation volume

## Review Date

After one month of MVP production use or when the first review trigger occurs.

## Outcome

### Expected Outcome

North Vector should learn useful long-term context without silently turning uncertain observations into durable truth.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep as the default memory-promotion rule unless a narrower, well-tested exception is approved through a future ADR.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |