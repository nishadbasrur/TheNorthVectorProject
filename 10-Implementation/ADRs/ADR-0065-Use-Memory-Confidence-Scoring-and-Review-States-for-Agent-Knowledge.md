# ADR-0065: Use Memory Confidence Scoring and Review States for Agent Knowledge

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use confidence scoring and review states for memory and agent knowledge.

Not all remembered information should be treated as equally certain, current, or actionable.

## Context

North Vector may store memories from:
- direct user statements
- inferred preferences
- repeated behavior patterns
- imported sources
- summaries
- agent-generated observations

Some memories will be explicit and reliable. Others will be inferred, outdated, incomplete, or uncertain.

A Chief of Staff system must avoid overconfidently acting on weak memory.

## Confidence Principles

Memories should distinguish:
- high-confidence explicit facts
- medium-confidence repeated patterns
- low-confidence inferences
- stale or outdated claims
- disputed or corrected information

## Review States

Useful states may include:

```text
Candidate
Confirmed
Inferred
Needs Review
Deprecated
Rejected
```

## Actionability

High-risk workflows should rely only on sufficiently reliable information.

Low-confidence memory may support suggestions but should not drive autonomous action without confirmation.

## User Correction

Users must be able to correct or reject memory.

Corrections should affect future retrieval and reasoning.

## Freshness

Confidence may decline over time when information is time-sensitive.

Example:

```text
Current class schedule
```

requires more freshness than:

```text
Long-term career interest
```

## Relationship to Provenance

Provenance explains where memory came from.

Confidence describes how much the system should rely on it.

## Consequences

### Positive

- safer personalization
- fewer stale assumptions
- better user trust
- more nuanced memory retrieval

### Negative

- more metadata complexity
- requires review flows
- requires confidence calibration

## Testing Requirements

Tests should verify:
- low-confidence memory is not treated as confirmed
- corrections update memory state
- stale memories are detectable
- high-risk actions require adequate confidence
- review-state transitions work correctly

## Outcome

North Vector gains a more trustworthy memory system by separating confirmed knowledge from uncertain inference and stale assumptions.