# ADR-0048: Use Observability-First Design for All Critical Workflows

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will adopt an observability-first approach for all critical workflows.

Every consequential workflow must be designed with built-in visibility so that operators can understand what happened, why it happened, and what the system is doing at any given time.

Observability is a core architectural requirement rather than a later operational enhancement.

## Context

North Vector contains workflows involving:
- approvals
- executions
- synchronization
- exports
- notifications
- memory processing
- planning systems
- background jobs
- future automation systems

These workflows may span:
- multiple services
- asynchronous processing
- external providers
- retries
- state transitions

Without observability:
- failures become difficult to diagnose
- workflow status becomes unclear
- support becomes expensive
- recovery becomes difficult
- user trust decreases

## Decision Drivers

- operational visibility
- reliability
- supportability
- debugging efficiency
- auditability
- system transparency

## Observability Principles

Every critical workflow should provide:

```text
Logs
Metrics
Traces
Audit Records
```

No consequential workflow should operate as a black box.

## Logging Requirements

Structured logs should include:
- correlation ID
- workflow ID
- object identifiers
- workflow state
- error classifications
- timestamps

Logs should be machine-readable.

## Metrics Requirements

Metrics should capture:
- throughput
- latency
- success rates
- failure rates
- retry rates
- queue depth
- provider utilization

Metrics should support operational monitoring.

## Tracing Requirements

Critical workflows should support traceability across:
- services
- workers
- providers
- asynchronous boundaries

Operators should be able to reconstruct execution paths.

## Correlation IDs

Every consequential workflow should propagate:

```text
correlation_id
```

across:
- requests
- jobs
- events
- audits
- logs

This enables end-to-end investigation.

## Relationship to Audit Events

Audit events answer:

```text
What happened?
```

Observability answers:

```text
How did it happen?
```

Both are required.

## Relationship to Domain Events

Domain events communicate business facts.

Observability systems provide operational visibility into workflow execution.

The two concerns remain distinct.

## Operational Dashboards

Critical workflows should expose operational visibility such as:
- queue status
- failure trends
- synchronization health
- execution outcomes
- provider health

## Failure Investigation

Operators should be able to answer:
- What failed?
- When did it fail?
- Why did it fail?
- What was affected?
- Can it be replayed?

without requiring database forensics.

## Privacy Considerations

Observability data should avoid unnecessary storage of:
- personal content
- prompts
- exported documents
- sensitive payloads

Prefer:
- identifiers
- references
- classifications

where practical.

## Monitoring Integration

Monitoring systems should consume:
- metrics
- structured logs
- traces
- health signals

for alerting and operational review.

## Operational Benefits

Observability-first design enables:
- faster debugging
- reduced downtime
- easier support
- better reliability
- improved trust in automation

## Consequences

### Positive

- improved operational visibility
- faster incident response
- easier workflow analysis
- stronger reliability
- better system understanding

### Negative

- increased implementation effort
- storage costs for telemetry
- monitoring infrastructure requirements
- observability maintenance overhead

## Implementation Notes

Every critical workflow should be designed with observability requirements before implementation begins.

Visibility should be treated as part of the workflow definition itself.

## Testing Requirements

Tests should verify:
- correlation IDs propagate correctly
- logs contain required metadata
- metrics are emitted consistently
- traces span workflow boundaries
- failures remain diagnosable
- sensitive content is handled appropriately

## Outcome

North Vector gains comprehensive operational visibility across critical workflows, enabling faster debugging, stronger reliability, and greater confidence in complex automated systems.