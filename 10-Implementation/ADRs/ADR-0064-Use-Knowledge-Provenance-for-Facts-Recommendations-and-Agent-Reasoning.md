# ADR-0064: Use Knowledge Provenance for Facts, Recommendations, and Agent Reasoning

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will track knowledge provenance for important facts, recommendations, generated plans, and agent reasoning outputs.

The system should preserve where information came from, how reliable it is, and when it was last validated.

## Context

North Vector may use information from:
- user-provided memories
- calendar events
- emails
- documents
- external providers
- model outputs
- inferred patterns
- manual corrections

A recommendation is only as trustworthy as the information behind it.

Without provenance, the system cannot reliably answer:
- Where did this fact come from?
- Is it still current?
- Was it inferred or explicitly stated?
- Can this recommendation be trusted?

## Provenance Principles

Important knowledge should include:
- source type
- source identifier
- creation time
- last validation time
- confidence level
- whether it was inferred or explicit

## Source Types

Examples include:
- user statement
- imported calendar event
- uploaded document
- provider record
- model inference
- system-generated summary

## Inference Distinction

The system must distinguish:

```text
User explicitly said this
```

from:

```text
The system inferred this
```

Inferred knowledge requires more caution.

## Recommendation Provenance

Recommendations should reference the inputs that shaped them when practical.

This helps users understand and challenge the system.

## Staleness

Knowledge may expire or become uncertain.

The system should be able to mark information as stale when it has not been validated recently.

## Privacy Considerations

Provenance should avoid duplicating sensitive content unnecessarily.

Use references where possible.

## Audit Relationship

Provenance explains knowledge origin.

Audit explains consequential actions.

Both are required for trust.

## Consequences

### Positive

- improves trust
- supports explainability
- reduces stale reasoning
- makes corrections easier

### Negative

- additional metadata storage
- more complex retrieval
- provenance maintenance overhead

## Testing Requirements

Tests should verify:
- sources are tracked correctly
- inferred and explicit facts remain distinct
- stale knowledge is detectable
- recommendations can reference supporting inputs
- sensitive content is not duplicated unnecessarily

## Outcome

North Vector gains a trustworthy knowledge foundation by preserving the origin, confidence, and freshness of important information used by agents and workflows.