# Memory Lifecycle v1.0

## Purpose

This document defines how memories are created, evaluated, strengthened, revised, archived, and deleted within North Vector.

The objective is to ensure that memory remains useful, accurate, and manageable over time.

## Core Principle

Memory should evolve.

North Vector should not treat every stored fact as permanent truth.

Memories must be able to gain confidence, lose confidence, change status, and eventually leave active memory when they are no longer useful.

## Lifecycle Overview

Capture
↓
Interpret
↓
Classify
↓
Validate
↓
Store
↓
Retrieve
↓
Reinforce or Revise
↓
Consolidate
↓
Archive or Delete

## Stage 1: Capture

A possible memory enters the system from a source.

Possible sources:
- direct user statement
- observed behavior
- calendar event
- email
- uploaded file
- reflection
- external integration
- system inference

At this stage, the information is raw and should not automatically become permanent memory.

## Stage 2: Interpretation

North Vector determines what the information means.

Questions:
- Is this a fact, preference, goal, event, pattern, risk, or opportunity?
- Is it temporary or durable?
- Does it affect future decisions?
- Is the meaning clear?

## Stage 3: Classification

The information is assigned a memory type and time horizon.

Examples:
- identity
- strategic
- operational
- behavioral
- goal
- relationship
- event
- risk
- opportunity

## Stage 4: Validation

The memory is checked before activation.

Validation factors:
- source reliability
- user confirmation
- internal consistency
- supporting evidence
- contradiction risk

Possible outcomes:
- confirmed
- candidate
- rejected
- requires clarification

## Stage 5: Storage

The memory is saved using the standard Memory Schema.

Required actions:
- assign memory ID
- set confidence
- set importance
- set status
- link related memories
- assign review or expiration policy

## Stage 6: Retrieval

The memory becomes available for future reasoning.

Retrieval should depend on:
- relevance
- importance
- confidence
- recency
- goal impact
- current context

Retrieval does not automatically mean the memory is still correct.

## Stage 7: Reinforcement

A memory gains strength when new evidence supports it.

Examples:
- repeated user confirmation
- repeated behavior
- successful prediction
- multiple independent sources

Reinforcement may increase:
- confidence
- retrieval weight
- importance

## Stage 8: Revision

A memory should be revised when new evidence changes its meaning.

Possible revisions:
- update summary
- change confidence
- change status
- change time horizon
- change recommended response

Previous versions should remain available in history.

## Stage 9: Contradiction Handling

When new information conflicts with an existing memory:

1. Preserve both records temporarily.
2. Link the contradiction.
3. Lower confidence where appropriate.
4. Seek clarification if needed.
5. Resolve through evidence or user confirmation.

The system should not silently overwrite important contradictions.

## Stage 10: Promotion

Some memories begin as candidates and later become established.

Example:

Observation:
Nishad delayed one vague assignment.

Candidate Pattern:
Nishad may delay ambiguous tasks.

Established Behavioral Memory:
Repeated evidence confirms that unclear first steps increase avoidance risk.

Promotion should require sufficient evidence.

## Stage 11: Consolidation

Multiple related memories may be combined into a higher-value summary.

Example:

Several missed study blocks
↓
Weekly pattern
↓
Behavioral lesson

Consolidation reduces clutter while preserving meaning.

## Stage 12: Decay

Memories may lose active relevance over time.

Decay factors:
- age
- lack of reinforcement
- completion
- expiration
- reduced relevance
- contradiction

Decay should affect retrieval weight before it affects deletion.

## Stage 13: Archive

Archived memories remain searchable but are excluded from normal active reasoning.

Examples:
- completed courses
- old projects
- expired opportunities
- past jobs

Archive is preferred over deletion for historically meaningful information.

## Stage 14: Deletion

Deletion should be rare.

Valid reasons:
- user request
- duplicate record
- incorrect memory with no historical value
- privacy requirement
- meaningless temporary data

Deletion should be logged when appropriate.

## Memory Statuses

### Candidate

Not yet sufficiently validated.

### Active

Currently valid and available for normal retrieval.

### Dormant

Still valid but rarely relevant.

### Contradicted

Conflicting evidence exists.

### Superseded

Replaced by a newer version.

### Expired

No longer operationally relevant.

### Archived

Preserved for history but removed from active reasoning.

### Deleted

Removed from the system.

## Review Cadence

Suggested review frequency:

- Identity memories: every 6–12 months
- Strategic memories: monthly or quarterly
- Behavioral memories: every 3 months
- Relationship memories: every 6 months
- Operational memories: daily or weekly
- Risk memories: continuously
- Opportunity memories: until expiration

## User Control

Nishad should be able to:
- inspect memories
- correct memories
- confirm memories
- archive memories
- delete memories
- prevent categories from being stored

User control is essential to trust.

## Success Criteria

The lifecycle system succeeds if:
- important memories remain accurate
- stale memories do not dominate retrieval
- behavioral patterns strengthen through evidence
- contradictions are handled transparently
- memory volume remains manageable
- the user retains control

## Final Principle

North Vector should not merely remember the past.

It should continuously refine what the past means.