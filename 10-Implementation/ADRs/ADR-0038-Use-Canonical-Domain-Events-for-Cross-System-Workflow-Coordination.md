# ADR-0038: Use Canonical Domain Events for Cross-System Workflow Coordination

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use canonical domain events to communicate meaningful business-state changes between system components.

Domain events will represent facts that have already occurred and may be consumed by other services, workflows, jobs, projections, and automation systems.

## Context

North Vector contains multiple interacting domains:
- memory
- planning
- goals
- tasks
- approvals
- executions
- Calendar synchronization
- audit
- notifications
- future automation systems

As the platform grows, tightly coupling workflows through direct calls creates:
- brittle dependencies
- difficult testing
- hidden side effects
- reduced extensibility

A domain-event model allows systems to react to meaningful state changes without requiring direct knowledge of every consumer.

## Decision Drivers

- loose coupling
- scalability
- maintainability
- workflow extensibility
- auditability
- observability
- event-driven architecture readiness

## Domain Event Principles

Domain events represent:

```text
Something important happened.
```

Examples:
- MemoryCreated
- GoalCompleted
- ApprovalGranted
- ActionExecuted
- EventVerified
- MemoryDeleted

Events describe facts.

They do not describe commands or intentions.

## Event Characteristics

Events should be:
- immutable
- timestamped
- versioned
- attributable
- durable
- machine-readable

## Event Structure

Recommended fields:

```text
event_id
event_type
event_version
timestamp
object_type
object_id
correlation_id
actor_id
payload
```

## Commands vs Events

Commands:

```text
Create Memory
Execute Action
Generate Briefing
```

Events:

```text
Memory Created
Action Executed
Briefing Generated
```

Commands request work.

Events record completed facts.

## Example Events

### Memory Lifecycle

```text
MemoryCandidateCreated
MemoryApproved
MemoryCreated
MemoryDeleted
```

### Planning

```text
GoalCreated
TaskCompleted
ProjectArchived
```

### Approval System

```text
ApprovalRequested
ApprovalGranted
ApprovalDenied
ApprovalExpired
```

### Execution System

```text
ExecutionStarted
ExecutionCompleted
ExecutionVerified
ExecutionFailed
```

## Workflow Coordination

Consumers may react to events.

Examples:

```text
MemoryCreated
  -> Retrieval Projection Update
  -> Audit Projection Update
  -> Analytics Update
```

The producer should not need awareness of every consumer.

## Versioning

Events must support schema evolution.

Long-lived events should include:

```text
event_version
```

Consumers should explicitly handle supported versions.

## Relationship to Audit Events

Domain events and audit events are related but distinct.

Domain events:
- coordinate workflows
- describe business facts

Audit events:
- provide accountability
- preserve history

A single operation may generate both.

## Relationship to Outbox Pattern

Domain events may be published through the outbox mechanism.

The outbox provides reliable delivery.

Domain events provide meaning.

## Privacy Rules

Domain events should favor identifiers over raw content.

Avoid embedding:
- prompts
- memory text
- Calendar descriptions
- exported data
- uploaded file contents

Events should reference objects rather than duplicate sensitive content.

## Operational Benefits

Domain events enable:
- workflow decoupling
- easier extensions
- cleaner integrations
- better observability
- safer evolution of the platform

## Consequences

### Positive

- reduced coupling
- improved extensibility
- cleaner architecture
- easier automation
- better system visibility

### Negative

- additional architectural concepts
- event-schema maintenance
- versioning requirements
- debugging distributed flows can be more complex

## Implementation Notes

Typical flow:

```text
State Change
  -> Domain Event Created
  -> Stored via Outbox
  -> Consumers React
```

Events should describe completed facts rather than anticipated future outcomes.

## Testing Requirements

Tests should verify:
- events are emitted for important state changes
- event versions are respected
- consumers handle events correctly
- duplicate event processing remains safe
- sensitive content is not embedded unnecessarily
- correlation IDs propagate correctly

## Outcome

North Vector gains a durable and extensible coordination mechanism that allows independent parts of the system to react to meaningful business events without creating tight coupling between workflows.