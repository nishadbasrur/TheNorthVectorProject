# ADR-0029: Use Immutable Audit Events for Consequential State Changes

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will record immutable audit events for consequential state changes.

Audit events are append-only records that describe what happened, when it happened, who or what initiated it, and the resulting outcome.

Existing audit events must not be modified or deleted through ordinary application workflows.

## Context

North Vector manages:
- memories
- plans
- goals
- tasks
- approvals
- executions
- Calendar actions
- deletions
- exports
- synchronization operations

Many of these operations affect trust, accountability, safety, and user understanding.

The platform must be able to answer questions such as:
- What happened?
- Who initiated it?
- What was approved?
- What changed?
- When did it occur?
- Was execution verified?

Operational logs are not sufficient because logs may rotate, be filtered, or focus on infrastructure rather than user-impacting actions.

## Decision Drivers

- accountability
- trust
- explainability
- debugging
- incident investigation
- compliance readiness
- deletion transparency
- approval integrity

## Audit Principles

Audit events must be:
- immutable
- append-only
- timestamped
- attributable
- queryable
- durable

Corrections should be represented as new events rather than modifying historical events.

## Consequential Events

Examples include:
- memory creation
- memory modification
- memory deletion
- approval granted
- approval denied
- action execution
- execution verification
- export generation
- export download
- authentication-sensitive changes
- feature-flag changes
- administrative actions

Not every UI interaction requires an audit event.

## Event Structure

Recommended fields:

```text
audit_event_id
timestamp
event_type
actor_type
actor_id
object_type
object_id
result
correlation_id
metadata
```

## Actor Types

Examples:
- user
- system
- worker
- provider
- administrator

The actor should always be identifiable when possible.

## Correlation

Audit events should support correlation with:
- request IDs
- run IDs
- job IDs
- approval IDs
- execution IDs

This allows reconstruction of multi-step workflows.

## Immutability

Audit records should not be edited to:
- change history
- conceal mistakes
- rewrite outcomes

If a correction is required, a new event should reference the original.

## Privacy Rules

Audit events should prioritize identifiers over raw content.

Avoid storing:
- prompts
- memory text
- Calendar descriptions
- export contents
- uploaded file contents

Store references whenever possible.

## Relationship to Logging

Audit events are not operational logs.

Logs answer:
- how software behaved
- what errors occurred
- infrastructure conditions

Audit events answer:
- what actions occurred
- who performed them
- what outcome resulted

Both systems are required.

## Relationship to Sentry

Sentry captures failures.

Audit events capture actions and outcomes.

A successful execution may generate audit events but never appear in Sentry.

## Approval Workflows

Approval-related audit events should capture:
- approval requested
- approval viewed
- approval granted
- approval denied
- approval expired
- execution started
- execution verified

This creates a complete chain of accountability.

## Deletion Workflows

Deletion events should record:
- deletion request
- deletion execution
- deletion verification
- retention actions

Deletion should remain explainable even after the underlying content is removed.

## Export Workflows

Audit records should capture:
- export generated
- export downloaded
- export expired
- export revoked

The audit trail should not contain the exported data itself.

## Security Considerations

Audit storage should:
- restrict write access
- prevent ordinary modification
- preserve timestamps
- support integrity checks

Administrative access should itself be auditable.

## Operational Benefits

Audit events enable:
- incident investigation
- user support
- workflow reconstruction
- trust verification
- execution transparency
- operational accountability

## Consequences

### Positive

- trustworthy history
- stronger accountability
- easier debugging of workflows
- improved transparency
- future compliance readiness

### Negative

- additional storage
- schema maintenance
- implementation complexity
- need for retention strategy

## Implementation Notes

Suggested model:

```text
Action Requested
  -> Approval Granted
  -> Execution Started
  -> Execution Verified
```

Each step becomes a separate immutable audit event.

## Retention

Audit retention should be longer than ordinary operational logs.

Retention policy must balance:
- accountability
- privacy
- storage costs
- legal requirements

## Testing Requirements

Tests should verify:
- events are append-only
- historical events cannot be modified through normal workflows
- approval chains are reconstructable
- deletion workflows remain explainable
- correlation IDs propagate correctly
- audit events avoid storing restricted content

## Outcome

North Vector gains a durable and trustworthy history of consequential actions, approvals, and outcomes that remains separate from operational logs and monitoring systems.