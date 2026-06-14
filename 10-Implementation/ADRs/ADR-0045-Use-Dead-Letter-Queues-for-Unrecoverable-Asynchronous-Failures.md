# ADR-0045: Use Dead-Letter Queues for Unrecoverable Asynchronous Failures

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use dead-letter queues (DLQs) or equivalent dead-letter mechanisms for asynchronous work that cannot be completed successfully after defined retry policies are exhausted.

Failed work must not disappear silently.

Unrecoverable failures must be preserved for inspection, diagnosis, remediation, and auditability.

## Context

North Vector uses asynchronous processing for:
- outbox events
- synchronization jobs
- projection updates
- notifications
- export generation
- workflow execution
- future automation systems

Failures may occur because of:
- invalid payloads
- schema mismatches
- provider incompatibilities
- authorization failures
- deleted resources
- software defects
- permanent external-provider errors

Infinite retries waste resources and can create operational instability.

Discarding failed work creates silent data loss.

## Decision Drivers

- reliability
- operational visibility
- recovery capability
- auditability
- failure containment
- debugging efficiency

## Dead-Letter Principles

Failed work should eventually reach one of three outcomes:

```text
Succeeded
Cancelled
Dead-Lettered
```

No consequential job should vanish without explanation.

## Dead-Letter Record

A dead-letter entry should include:
- dead-letter ID
- original job ID
- workflow type
- payload reference
- failure category
- failure reason
- retry count
- timestamps
- correlation ID

## Retry Policy

Retryable failures should be retried before dead-lettering.

Examples:

### Retryable

```text
Temporary network failure
Provider timeout
Database failover event
```

### Potentially Non-Retryable

```text
Invalid payload
Missing object
Authorization denial
Unsupported schema version
```

Retry classification should align with the system error taxonomy.

## Relationship to Error Taxonomy

Dead-letter decisions should use normalized error categories.

Examples:

```text
VALIDATION_ERROR
AUTHORIZATION_ERROR
PROVIDER_ERROR
INFRASTRUCTURE_ERROR
```

This improves operational consistency.

## Relationship to Outbox Pattern

Outbox processing should support dead-letter outcomes.

Example:

```text
Outbox Event
  -> Retry
  -> Retry
  -> Retry
  -> Dead Letter
```

The durable record remains available for investigation.

## Monitoring Requirements

Dead-letter creation should generate:
- structured logs
- metrics
- alerts when thresholds are exceeded

Dead-letter growth may indicate architectural or operational problems.

## Operational Review

Dead-letter queues should be reviewed regularly.

The purpose is not merely storage.

The purpose is:
- diagnosis
- remediation
- workflow correction

## Replay Support

Where safe and appropriate, operators should be able to:

```text
Inspect
Correct
Replay
```

failed work.

Replay must remain idempotent.

## Privacy Considerations

Dead-letter records should minimize duplication of sensitive content.

Prefer:
- identifiers
- references
- classifications

rather than complete payload copies where practical.

## Operational Benefits

Dead-letter mechanisms enable:
- visibility into failed work
- safer retry behavior
- easier debugging
- reduced silent data loss
- stronger operational reliability

## Consequences

### Positive

- failures become visible
- easier incident investigation
- safer asynchronous processing
- improved operational control
- reduced silent workflow loss

### Negative

- additional storage requirements
- operational review burden
- replay tooling complexity
- retention management requirements

## Implementation Notes

Typical flow:

```text
Job Created
  -> Retry Attempts
  -> Success

or

Job Created
  -> Retry Attempts Exhausted
  -> Dead Letter Queue
```

Dead-letter handling should be deterministic and auditable.

## Relationship to Audit Events

Dead-letter creation may generate audit events when the failed workflow affects consequential user-facing behavior.

Operational failures should remain explainable.

## Testing Requirements

Tests should verify:
- retry exhaustion results in dead-lettering
- dead-letter records preserve diagnostic context
- replay operations remain safe and idempotent
- monitoring captures dead-letter creation
- permanent failures do not loop indefinitely
- sensitive information is handled appropriately

## Outcome

North Vector gains a reliable mechanism for preserving and investigating unrecoverable asynchronous failures while preventing silent data loss and uncontrolled retry loops.