# ADR-0033: Use Outbox Pattern for Reliable External Side Effects

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use the outbox pattern for reliable external side effects that are triggered by committed application state changes.

When a workflow needs to persist internal state and later perform an external or asynchronous side effect, the system will commit the internal state and an outbox record in the same database transaction.

A worker will process the outbox record separately.

## Context

North Vector performs workflows where internal state and follow-up work must stay consistent.

Examples include:
- create memory, then generate embedding
- approve action, then execute externally
- create export request, then generate artifact
- change Calendar connection, then sync provider state
- mark object deleted, then clean derived indexes
- create notification intent, then deliver notification

If the application writes internal state but fails before scheduling follow-up work, the system becomes incomplete.

If it performs the external side effect before committing internal state, the system may change the outside world without a reliable internal record.

The outbox pattern avoids this split-brain behavior by making the side-effect intent durable before execution.

## Decision Drivers

- reliability
- transactional consistency
- retry safety
- observability
- external action accountability
- worker restart safety
- auditability
- recovery from partial failure

## Outbox Record

Each outbox record should include:
- outbox ID
- event type
- payload
- payload version
- related object IDs
- idempotency key
- status
- scheduled time
- attempt count
- last error
- created timestamp
- processed timestamp

## Processing Model

Outbox records should be processed by a worker.

The worker should:
- claim records safely
- validate payloads
- recheck permissions and lifecycle state
- use idempotency keys
- execute side effects
- record outcomes
- retry or dead-letter failures

## External Actions

Consequential external actions still require the approval and execution safeguards defined elsewhere.

The outbox pattern does not bypass approval. It only makes the intent to execute durable and recoverable.

## Idempotency

Outbox processing must be idempotent.

A retried outbox record must not create duplicate external side effects.

## Failure Handling

If processing fails:
- the outbox record should remain inspectable
- retryable failures should be retried
- permanent failures should be dead-lettered
- uncertain outcomes should trigger verification before retry

## Consequences

### Positive

- fewer lost follow-up tasks
- safer worker restarts
- stronger consistency between database state and side effects
- better operational recovery
- easier debugging

### Negative

- additional table and worker logic
- delayed side effects
- more status states to manage
- requires idempotency discipline

## Implementation Notes

Typical flow:

```text
Begin transaction
  -> Persist domain state
  -> Write audit event
  -> Write outbox record
Commit transaction
Worker claims outbox record
  -> Validate and execute
  -> Record result
```

## Relationship to Jobs

The outbox is the durable bridge between committed state and background work.

The job system may process outbox records directly or convert them into jobs, but the state change and side-effect intent must be committed together.

## Testing Requirements

Tests should verify:
- domain state and outbox record commit together
- rollback removes both state and outbox intent
- worker restart does not lose side effects
- duplicate processing is safe
- failed processing is retryable or dead-lettered
- external execution still requires valid approval

## Outcome

North Vector gains a reliable bridge between internal state changes and asynchronous or external side effects, reducing lost work and unsafe partial execution.