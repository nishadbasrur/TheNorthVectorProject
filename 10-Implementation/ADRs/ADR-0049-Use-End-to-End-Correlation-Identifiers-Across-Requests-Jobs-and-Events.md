# ADR-0049: Use End-to-End Correlation Identifiers Across Requests, Jobs, and Events

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will assign and propagate end-to-end correlation identifiers across all critical workflows.

Correlation identifiers must follow requests, jobs, events, audit records, logs, traces, and external interactions whenever possible.

The goal is to make complex workflow execution traceable from initiation through completion.

## Context

North Vector workflows may span:
- API requests
- background jobs
- outbox processing
- domain events
- audit events
- synchronization operations
- provider integrations
- execution workflows

A single user action may trigger many downstream operations.

Without correlation identifiers:
- debugging becomes difficult
- workflow reconstruction becomes slow
- incident response becomes expensive
- operational visibility suffers

## Decision Drivers

- observability
- debugging efficiency
- auditability
- workflow transparency
- operational support
- distributed-system traceability

## Correlation Principles

Every consequential workflow should have a:

```text
correlation_id
```

that remains associated with all related operations.

The identifier should represent:

```text
One logical workflow execution
```

rather than one technical request.

## Propagation Requirements

Correlation identifiers should propagate through:
- API requests
- service calls
- workflow state transitions
- jobs
- outbox records
- domain events
- audit events
- provider interactions
- monitoring systems

## Example Workflow

```text
User Request
  -> Approval Created
  -> Approval Granted
  -> Execution Started
  -> Calendar Event Created
  -> Execution Verified
```

All stages should share the same correlation identifier.

## Identifier Characteristics

Correlation identifiers should be:
- unique
- immutable
- machine-readable
- safe to expose in logs

Correlation IDs should not contain:
- personal data
- secrets
- provider credentials

## Relationship to Trace IDs

Tracing systems may generate trace identifiers.

Correlation identifiers represent workflow identity.

The two may be linked but should not be treated as identical concepts.

## Relationship to Audit Events

Audit records should include correlation identifiers where applicable.

This allows reconstruction of:
- approvals
- executions
- retries
- verification steps

as a unified workflow.

## Relationship to Domain Events

Domain events should carry correlation identifiers.

Consumers should preserve them when generating downstream actions.

## Relationship to Logging

Structured logs should include:

```text
correlation_id
```

for all critical workflow operations.

Logs without workflow context become significantly less useful.

## Relationship to Monitoring

Metrics and traces should support correlation-based investigation.

Operators should be able to follow a workflow across system boundaries.

## External Integrations

When practical, correlation identifiers should be propagated to:
- provider requests
- synchronization operations
- notification workflows

for improved debugging.

## Privacy Considerations

Correlation identifiers should be opaque.

They should never encode:
- names
- emails
- memory content
- approval content

## Operational Benefits

Correlation identifiers enable:
- faster debugging
- easier incident response
- workflow reconstruction
- stronger observability
- improved support workflows

## Consequences

### Positive

- improved traceability
- better observability
- easier workflow analysis
- stronger operational visibility
- reduced debugging time

### Negative

- propagation discipline required
- additional metadata storage
- implementation effort across workflow boundaries

## Implementation Notes

Typical flow:

```text
Workflow Created
  -> Correlation ID Assigned
  -> Propagated Everywhere
```

New downstream workflow steps should preserve existing correlation identifiers whenever they remain part of the same logical workflow.

## Testing Requirements

Tests should verify:
- correlation IDs propagate correctly
- jobs preserve identifiers
- events preserve identifiers
- audit records include identifiers
- logs contain identifiers
- workflow reconstruction is possible across boundaries

## Outcome

North Vector gains end-to-end workflow traceability by assigning and preserving correlation identifiers throughout requests, jobs, events, audits, and integrations.