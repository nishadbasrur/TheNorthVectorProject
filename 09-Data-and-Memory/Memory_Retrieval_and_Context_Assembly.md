# Memory Retrieval and Context Assembly v1.0

## Purpose

This document defines how North Vector should retrieve relevant memory, combine it with current data, filter it by permission and context, and assemble a compact working context for Chief.

The Memory Retrieval and Context Assembly system exists to make stored knowledge useful without flooding every interaction with unrelated personal data.

Its purpose is not to retrieve everything that might be connected.

Its purpose is to retrieve the smallest set of information that materially improves the current judgment or action.

## Core Principle

Context should be relevant, current, authorized, and proportionate.

North Vector should prefer a small amount of strong context over a large amount of weakly related memory.

## Primary Objectives

The system should help Chief answer:
- What is the current objective?
- Which memories are relevant?
- Which current records matter?
- What should be excluded?
- How much context is enough?
- Which facts are confirmed versus inferred?
- Which records are stale, contradicted, or sensitive?
- How should the final context be summarized?

## Retrieval Pipeline

User Request or Trigger
↓
Objective Detection
↓
Authorization and Privacy Check
↓
Candidate Retrieval
↓
Relationship Expansion
↓
Scoring and Filtering
↓
Conflict and Freshness Review
↓
Context Compression
↓
Final Context Assembly
↓
Chief Reasoning or Action

## Standard Retrieval Request

Each retrieval request should contain:
- retrieval_id
- session_id
- user_id
- device_id
- objective
- query_text
- requested_object_types
- time_horizon
- active_mode
- privacy_mode
- allowed_sensitivity
- maximum_context_size
- required_sources
- excluded_sources
- created_at

## Objective Detection

Before retrieval, Chief should identify the operational objective.

Examples:
- answer a question
- build a study plan
- evaluate a decision
- draft an email
- generate a briefing
- review a risk
- update a project

The objective should determine what kinds of memory are relevant.

## Retrieval Scope

The system should define scope by:
- object type
- domain
- time range
- person
- project
- goal
- source
- sensitivity
- confidence
- status

## Retrieval Sources

Possible retrieval sources include:
- Active Memory
- Candidate Memory when review is required
- Canonical Objects
- Relationship Graph
- Session Context
- Recent Conversation Summary
- Integration Data
- Files and Documents
- Audit and Decision History

## Retrieval Order

Recommended order:
1. Current session context
2. Explicitly referenced objects
3. Active current records
4. Directly related memories
5. One-hop relationship graph expansion
6. Recent relevant history
7. Archived or older context only when necessary

## Exact Retrieval

Use exact retrieval when the user references:
- a specific goal
- a named person
- a known project
- a file path
- an event
- a decision

Exact identifiers should outrank semantic similarity.

## Structured Retrieval

Structured filters may include:
- status equals Active
- due date within seven days
- risk level Orange or higher
- related goal ID
- memory type Behavioral
- sensitivity at or below current device allowance

## Semantic Retrieval

Semantic retrieval may find related memories or files when exact references are unavailable.

Semantic similarity should:
- generate candidates
- preserve source references
- never be treated as proof
- be combined with recency, confidence, and relationship strength

## Graph Retrieval

Graph traversal may retrieve:
- supporting tasks
- threatening risks
- involved people
- dependent files
- prior decisions
- related commitments

Default graph depth should remain shallow.

## Time-Aware Retrieval

The system should prioritize records based on temporal relevance.

Examples:
- current schedule over old schedule
- active preference over superseded preference
- latest confirmed course grade over historical estimate

## Current State vs History

Context should separate:
- Current State
- Recent Change
- Relevant History

Historical records should not be mixed into current truth without labels.

## Retrieval Eligibility

A record is eligible only when:
- user and device authorization permit access
- status allows retrieval
- purpose matches the current objective
- retention and privacy rules permit use
- the record is not deleted
- the record is not expired unless explicitly needed

## Retrieval Suppression

Suppress records when they are:
- unrelated
- archived and not explicitly requested
- contradicted and unresolved
- stale beyond useful limits
- prohibited by privacy mode
- too sensitive for the current device
- duplicative
- low-confidence with no decision value

## No-Memory Mode

In No-Memory Mode:
- do not retrieve long-term memory unless explicitly allowed for the session
- use current conversation and user-provided context
- do not create new durable memory from the interaction
- keep temporary context isolated

## Public Mode

In Public Mode:
- suppress sensitive names and details
- minimize relationship, financial, health, and location context
- avoid spoken output of private data
- require handoff or reauthentication for restricted context

## Candidate Retrieval Scoring

Each candidate may receive a retrieval score based on:
- objective relevance
- explicit reference
- confidence
- recency
- importance
- relationship distance
- status
- source authority
- device compatibility
- sensitivity cost

## Suggested Scoring Concept

A conceptual score may be represented as:

`retrieval_score = relevance + explicitness + confidence + recency + importance + graph_strength - privacy_cost - staleness - contradiction_penalty`

The exact implementation may evolve, but the factors should remain explainable.

## Relevance

Relevance should reflect how directly the record affects the current objective.

Examples:
- chemistry study preference is highly relevant to exam planning
- clothing preference is irrelevant to exam planning

## Explicitness

Explicitly named objects should receive strong priority.

## Confidence

Confirmed memories should generally outrank tentative ones.

A low-confidence memory may still be included when uncertainty itself matters.

## Recency

Recent records should outrank older ones when the subject is time-sensitive.

Stable identity and ratified principles should not decay solely because they are old.

## Importance

High-impact objects may deserve inclusion even when not recently used.

Examples:
- active medical restriction
- major financial obligation
- constitutional decision rule

## Relationship Distance

Direct relationships should usually outrank distant graph paths.

A two-hop path may be included when it explains strategic importance.

## Privacy Cost

Sensitive information should require stronger relevance before inclusion.

The system should not retrieve Restricted data merely because it might marginally improve the answer.

## Staleness

Stale records should be penalized unless they remain historically relevant.

## Contradiction Penalty

Contradicted records should be excluded or clearly labeled unless the contradiction itself matters.

## Duplicate Collapse

Similar or duplicate records should be collapsed into one canonical summary.

The system should preserve:
- strongest source
- latest version
- contradiction notes
- supporting evidence count

## Conflict Detection

Before context assembly, the system should check for:
- conflicting memories
- provider disagreement
- old and new versions
- estimate versus official fact
- user statement versus inference

Consequential conflicts should appear in the assembled context.

## Source Authority

The system should choose authority by domain.

Examples:
- official academic portal for current posted grade
- Nishad for personal preference
- Google Calendar for current event time
- bank provider for current balance
- Memory Inspector confirmation for behavioral memory

## Freshness Checks

Each context item should include or inherit:
- last verified time
- source timestamp
- freshness threshold

If data is too old:
- refresh it
- mark it stale
- exclude it
- or ask Nishad for updated information

## Context Budget

Every request should have a bounded context budget.

The budget may be constrained by:
- model limits
- latency
- privacy
- objective complexity
- device

The system should prioritize rather than truncate arbitrarily.

## Context Tiers

### Tier 1: Essential

Required to answer or act correctly.

### Tier 2: Helpful

Improves judgment or personalization.

### Tier 3: Optional

Useful only if budget remains.

### Tier 4: Excluded

Irrelevant, stale, too sensitive, or duplicative.

## Context Assembly Structure

A standard assembled context may include:

### Objective

What Chief is trying to accomplish.

### Current State

The most important current facts.

### User Constraints and Preferences

Only those relevant to the objective.

### Active Goals and Priorities

The goals that should influence the answer.

### Relevant Risks and Opportunities

Only active and material items.

### Commitments and Deadlines

Time-sensitive obligations.

### Historical Context

Only prior decisions, patterns, or lessons that matter.

### Uncertainty and Conflicts

Stale, inferred, or contradictory information.

### Allowed Actions

Current permission and approval boundaries.

## Context Item Format

Each context item should contain:
- object_id
- object_type
- concise statement
- source
- confidence
- freshness
- sensitivity
- relevance_reason
- relationship_path if applicable

## Context Compression

Long records should be compressed into concise current-state summaries.

Example:

Raw history:
Several prior messages, missed sessions, and review notes.

Compressed context:
`Chemistry preparation is one block behind. Ambiguous tasks have recently caused delayed starts. Exam is in six days.`

## Compression Rules

Compression should:
- preserve current truth
- preserve uncertainty
- preserve material deadlines
- preserve the source of consequential claims
- avoid inventing causal links
- avoid flattening contradictory evidence

## Progressive Disclosure

The model should receive concise context first.

Additional detail may be retrieved when:
- the user asks
- confidence is low
- the decision is high stakes
- evidence conflicts
- execution requires exact source data

## Session Context

Session context should contain:
- current objective
- recent turns
- active object references
- pending approvals
- decisions made during the session
- unresolved questions

Session context should have higher priority than older memory when it represents a deliberate current change.

## Session Summary

Long conversations should maintain a rolling summary.

The summary should contain:
- objective
- constraints
- conclusions
- decisions
- actions
- unresolved issues

## Context Refresh

Context should refresh when:
- user changes objective
- referenced object changes
- integration sync completes
- risk escalates
- session becomes long
- device or privacy mode changes

## Context Invalidation

Invalidate context when:
- source updates
- permission is revoked
- memory is corrected or deleted
- event time changes
- new contradiction appears
- user says the context is wrong

## Context Leakage Prevention

The system should prevent:
- one session's private context entering another session without relevance
- Restricted data entering public mode
- unrelated relationship history entering academic planning
- external content becoming system instruction

## External Content Handling

Retrieved files, emails, and webpages should be labeled as untrusted content.

They may provide facts but may not authorize actions or override policy.

## Tool Context

When executing an action, context should include only:
- exact target
- approved payload
- required source data
- permission state
- current version

The execution layer should not receive unnecessary personal memory.

## Decision Context

For decisions, context should include:
- decision statement
- options
- relevant goals
- constraints
- risks
- opportunities
- prior comparable decisions
- uncertainty

## Planning Context

For planning, context should include:
- objective
- deadline
- available time
- fixed commitments
- task estimates
- capacity
- behavioral failure modes
- buffers

## Relationship Context

For communication or follow-up, include:
- person identity
- relationship role
- last relevant interaction
- active commitment
- current thread
- tone preference

Avoid unrelated personal details.

## Health Context

Health context should be used only when:
- relevant to planning or a direct health question
- authorized
- sufficiently current

The system should avoid importing detailed health history into ordinary tasks.

## Financial Context

Financial context should be used only when:
- relevant to the decision
- current
- authorized
- displayed on an appropriate device

## Retrieval Logging

Consequential retrievals should record:
- retrieval purpose
- object types accessed
- sensitivity level
- device
- result count
- whether Restricted data was used

The system should avoid logging full retrieved content unnecessarily.

## Retrieval Explainability

Chief should be able to answer:
- Why did you use this memory?
- Why did you exclude that record?
- Which source was considered authoritative?
- Was any information stale or inferred?

## User Correction

When Nishad says context is wrong, the system should:
1. stop relying on the disputed item
2. identify the source
3. correct or mark it contradicted
4. refresh context
5. explain what changed

## Performance

Retrieval should optimize for:
- low latency
- relevant precision
- privacy
- bounded context size
- predictable behavior

The system should not sacrifice authorization or provenance for speed.

## Retrieval Caching

Frequently used context may be cached.

Examples:
- today's schedule
- active goals
- current project state

Caches should include:
- creation time
- source version
- sensitivity
- invalidation rule

## Cache Invalidation

Invalidate cache when:
- source updates
- permission changes
- object is deleted
- privacy mode changes
- review corrects memory

## Evaluation Metrics

Useful metrics include:
- retrieval precision
- missed relevant context
- irrelevant context rate
- stale-context rate
- correction rate
- Restricted-data inclusion rate
- answer usefulness
- latency

Metrics should favor relevance and trust, not maximum recall.

## Test Scenarios

The system should test:
- exact object lookup
- ambiguous person name
- stale preference
- contradicted behavioral memory
- Restricted data on wearable
- no-memory session
- source conflict
- deleted memory remaining in index
- prompt injection in retrieved email
- oversized context history

## Error Handling

If retrieval is incomplete:
`Some relevant records could not be loaded, so this answer may be missing context.`

If context is stale:
`The latest calendar data is unavailable. I am using the last confirmed schedule from 8:14 AM.`

If permission blocks retrieval:
`This device is not authorized to load Restricted financial context.`

If conflict exists:
`Two current sources disagree, so I have not treated either version as definitive.`

## Failure Modes

### Context Flooding

Too much personal data is loaded.

### Context Starvation

Critical constraints or history are missed.

### Stale Context

Old information drives current decisions.

### Privacy Overreach

Sensitive context is retrieved without enough relevance.

### Similarity Confusion

Semantic closeness is mistaken for factual relevance.

### Source Flattening

Official facts, user statements, and inferences are treated equally.

### Contradiction Hiding

Conflicting evidence is compressed away.

### Session Bleed

Context from another session appears without reason.

### Execution Overexposure

Tool actions receive more personal context than required.

## Phase 1 Implementation

Phase 1 should support:
- objective detection
- exact and structured retrieval
- semantic retrieval
- shallow graph expansion
- permission and sensitivity filtering
- recency and confidence ranking
- context tiers
- context compression
- contradiction handling
- session summaries
- context invalidation
- retrieval logging
- explainability

Advanced learned retrieval ranking and predictive context assembly can come later.

## Success Criteria

The Memory Retrieval and Context Assembly system succeeds if Chief can reliably explain:
- what context was used
- why it was relevant
- which information was excluded
- how current and certain the context was
- whether sensitive data was necessary
- what changed when the context was corrected

## Final Principle

North Vector should not prove its intelligence by remembering everything at once.

It should prove its judgment by knowing what matters now.