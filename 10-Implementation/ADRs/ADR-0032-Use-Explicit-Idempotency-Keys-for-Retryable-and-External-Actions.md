# ADR-0032: Use Explicit Idempotency Keys for Retryable and External Actions

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will require explicit idempotency keys for retryable operations and actions that may affect external systems.

Operations executed more than once must produce the same outcome rather than duplicate side effects.

## Context

The platform performs actions that may be retried because of:
- network failures
- provider timeouts
- worker restarts
- browser refreshes
- duplicate submissions
- synchronization retries
- uncertain execution outcomes

Examples include:
- Calendar event creation
- export generation
- approval execution
- synchronization writes
- notification delivery
- future external integrations

Without idempotency protection, retries can create duplicate actions and inconsistent state.

## Decision Drivers

- execution safety
- external-system integrity
- retry support
- reliability
- user trust
- distributed-system correctness

## Idempotency Principles

A repeated request with the same idempotency key should:
- not create duplicate side effects
- return the original result when appropriate
- preserve auditability
- remain safe under retries

The system should treat repeated execution as the same operation.

## Required Use Cases

Idempotency keys should be required for:
- Calendar event creation
- external write operations
- approval execution
- export generation
- synchronization writes
- future payment-like workflows
- future autonomous actions

## Key Generation

Keys should be:
- unique
- stable for the intended operation
- difficult to collide accidentally

Examples may include:
- execution IDs
- approval IDs
- operation UUIDs
- deterministic workflow identifiers

## Storage Requirements

The system must persist enough information to:
- detect duplicate execution attempts
- identify prior outcomes
- return existing results when appropriate

## Approval Workflows

Approval execution should be idempotent.

A granted approval should not create multiple external actions because of:
- browser refresh
- double click
- retry logic
- worker restart

## External Providers

When providers support native idempotency keys, North Vector should use them.

When providers do not support idempotency, North Vector must enforce protection internally.

## Uncertain Outcomes

Some failures may occur after a request is sent but before confirmation is received.

In these cases:
- execution state should be tracked
- verification should occur before retry
- duplicate creation should be avoided

## Audit Requirements

Idempotent operations should still generate audit history.

Audit records should indicate:
- original execution
- duplicate detection
- verification steps
- final outcome

## Consequences

### Positive

- safer retries
- fewer duplicate actions
- stronger external consistency
- improved operational reliability
- safer automation

### Negative

- additional storage requirements
- lifecycle management for keys
- more execution-state complexity
- verification logic required for uncertain outcomes

## Implementation Notes

Typical flow:

```text
Receive Request
  -> Validate Idempotency Key
  -> Check Prior Execution
  -> Execute If New
  -> Persist Result
  -> Return Stored Result For Duplicates
```

## Relationship to Concurrency

Optimistic concurrency prevents conflicting updates.

Idempotency prevents duplicate execution.

Both protections are required and solve different problems.

## Testing Requirements

Tests should verify:
- duplicate submission does not create duplicate actions
- worker retry returns existing outcome
- Calendar event creation remains single-instance
- approval execution is safe under retries
- uncertain outcomes trigger verification workflows
- audit history records duplicate detection

## Outcome

North Vector gains reliable retry behavior and protection against duplicate side effects when interacting with internal workflows and external systems.