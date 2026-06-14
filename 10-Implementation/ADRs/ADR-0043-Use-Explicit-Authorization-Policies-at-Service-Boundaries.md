# ADR-0043: Use Explicit Authorization Policies at Service Boundaries

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will enforce authorization through explicit policy evaluation at service boundaries.

Authorization decisions must be centralized, testable, auditable, and independent of user-interface controls.

Service-layer operations must validate permissions before performing consequential actions.

## Context

North Vector manages:
- memories
- plans
- goals
- tasks
- approvals
- executions
- exports
- deletion workflows
- integrations
- future delegated access scenarios

User interfaces can hide actions, but hidden controls do not provide security.

Authorization must be enforced where actions actually occur.

Without explicit authorization policies:
- permissions become inconsistent
- security logic becomes duplicated
- testing becomes difficult
- privilege escalation risks increase

## Decision Drivers

- security
- consistency
- auditability
- maintainability
- testability
- future extensibility

## Authorization Principles

Authorization should answer:

```text
May this actor perform this action on this resource?
```

The answer should be determined by explicit policy evaluation.

## Service Boundary Enforcement

Authorization checks should occur before:
- state changes
- external actions
- exports
- deletions
- approval decisions
- synchronization mutations

Authorization should not depend solely on:
- UI visibility
- route naming
- client-side logic

## Policy Structure

Policies should evaluate:
- actor
- action
- resource
- context

Example:

```text
User
  -> Approve Action
  -> Approval Resource
```

## Policy Examples

Examples include:

```text
CanViewMemory
CanEditMemory
CanDeleteMemory
CanGenerateExport
CanApproveExecution
CanModifySettings
```

Policies should be named explicitly.

## Relationship to Authentication

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
What may you do?
```

These concerns must remain separate.

## Relationship to State Machines

Workflow state validation does not replace authorization.

Both must succeed:

```text
Valid State Transition
AND
Authorized Actor
```

before execution proceeds.

## Relationship to Feature Flags

Feature flags control availability.

Authorization controls permission.

Feature flags must not be treated as authorization mechanisms.

## Audit Requirements

Consequential authorization decisions should be auditable.

Examples:
- approval granted
- approval denied
- export initiated
- deletion executed

Audit records should preserve accountability.

## Policy Location

Authorization rules should be centralized.

Avoid scattering permission checks throughout:
- UI components
- route handlers
- provider adapters
- worker implementations

Policies should remain discoverable and testable.

## Default Security Model

When authorization cannot be determined reliably:

```text
Deny by Default
```

The system should fail closed rather than fail open.

## Privacy Considerations

Authorization policies should protect:
- personal data
- execution permissions
- export functionality
- deletion operations
- integration access

Policy enforcement supports privacy objectives.

## Operational Benefits

Explicit authorization policies enable:
- consistent security behavior
- easier audits
- simpler testing
- reduced privilege mistakes
- future multi-user support

## Consequences

### Positive

- stronger security
- centralized permissions
- improved auditability
- easier testing
- reduced duplication

### Negative

- additional policy definitions
- authorization maintenance effort
- more explicit service-layer checks

## Implementation Notes

Preferred flow:

```text
Request
  -> Authenticate
  -> Authorize
  -> Validate Workflow State
  -> Execute Service Logic
```

Authorization should occur before mutation.

## Testing Requirements

Tests should verify:
- authorized actions succeed
- unauthorized actions fail
- deny-by-default behavior works correctly
- policy evaluation remains consistent
- workflow transitions still require authorization
- audit records capture consequential actions

## Outcome

North Vector gains a centralized and testable authorization model that consistently enforces permissions at service boundaries while supporting security, privacy, and future system growth.