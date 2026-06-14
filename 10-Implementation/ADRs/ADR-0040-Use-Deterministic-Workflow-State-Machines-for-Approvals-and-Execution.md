# ADR-0040: Use Deterministic Workflow State Machines for Approvals and Execution

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will model approvals, executions, synchronization processes, and other consequential workflows as deterministic state machines with explicitly defined states and transitions.

Workflow behavior must be governed by declared state transitions rather than implicit application logic scattered across the codebase.

## Context

North Vector contains workflows involving:
- approvals
- action execution
- verification
- synchronization
- deletion
- exports
- background jobs
- future autonomous actions

These workflows frequently involve:
- retries
- failures
- expiration
- cancellation
- verification
- human review

Without explicit workflow states:
- behavior becomes ambiguous
- invalid transitions occur
- debugging becomes difficult
- auditability suffers
- safety guarantees weaken

## Decision Drivers

- predictability
- safety
- auditability
- testability
- operational clarity
- workflow correctness
- future automation readiness

## State Machine Principles

Every consequential workflow should define:
- valid states
- valid transitions
- transition conditions
- terminal states
- timeout behavior

The system should reject undefined transitions.

## Approval Workflow Example

```text
Draft
  -> Pending Approval
  -> Approved
  -> Denied
  -> Expired
```

Invalid transitions should fail.

Example:

```text
Denied
  -> Approved
```

may be prohibited unless explicitly modeled.

## Execution Workflow Example

```text
Pending
  -> Ready
  -> Executing
  -> Verification Pending
  -> Verified
```

Failure paths:

```text
Executing
  -> Failed
```

## Deletion Workflow Example

```text
Active
  -> Pending Deletion
  -> Deleted
  -> Purged
```

## Synchronization Workflow Example

```text
Pending
  -> Running
  -> Succeeded
```

or:

```text
Running
  -> Failed
```

## Determinism Requirements

Given:
- current state
- triggering event
- required conditions

The resulting state transition should be predictable.

The same inputs should produce the same outcome.

## Authorization

State transitions should enforce authorization.

An allowed state transition still requires:
- valid actor
- valid permissions
- valid workflow conditions

State machines do not replace authorization.

## Audit Integration

Every consequential transition should be auditable.

Examples:
- approval granted
- approval denied
- execution started
- execution verified
- deletion completed

## Event Integration

State transitions may emit domain events.

Example:

```text
Approval Granted
  -> ApprovalGranted Event
```

This enables workflow coordination while preserving deterministic state management.

## Timeout Handling

State machines should define expiration behavior.

Example:

```text
Pending Approval
  -> Expired
```

after a defined period.

Timeouts should be explicit.

## Error Handling

Workflow failures should:
- preserve current state when appropriate
- transition to failure states when necessary
- remain auditable
- support recovery where defined

## Operational Benefits

State machines enable:
- clearer workflow behavior
- easier debugging
- stronger safety guarantees
- more reliable automation
- simpler testing

## Consequences

### Positive

- predictable workflows
- improved auditability
- easier reasoning about system behavior
- safer automation
- stronger validation of state transitions

### Negative

- additional modeling effort
- more explicit workflow definitions
- state diagrams require maintenance

## Implementation Notes

Workflow logic should be centralized rather than distributed across:
- route handlers
- UI components
- worker jobs
- provider adapters

Transition validation should occur before mutation.

## Relationship to Audit Events

Audit events record what happened.

State machines define what is allowed to happen.

The two systems complement each other.

## Relationship to Domain Events

State transitions may emit domain events.

The workflow engine remains authoritative for state.

Events communicate completed facts.

## Testing Requirements

Tests should verify:
- valid transitions succeed
- invalid transitions fail
- terminal states behave correctly
- timeout transitions work correctly
- authorization is enforced
- audit events are generated
- domain events are emitted appropriately

## Outcome

North Vector gains predictable, auditable, and testable workflow behavior by modeling consequential processes as deterministic state machines with explicit lifecycle transitions.