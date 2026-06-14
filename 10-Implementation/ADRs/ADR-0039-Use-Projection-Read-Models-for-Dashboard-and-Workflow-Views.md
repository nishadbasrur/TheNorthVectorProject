# ADR-0039: Use Projection Read Models for Dashboard and Workflow Views

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use projection read models for dashboard views, workflow summaries, operational reporting, and complex user-facing queries.

Read models may be derived from canonical domain data and optimized for retrieval, presentation, filtering, and workflow visibility.

## Context

The canonical data model is designed for:
- correctness
- lifecycle management
- auditability
- transactional integrity

User interfaces often require:
- aggregated information
- workflow summaries
- dashboard metrics
- status rollups
- relationship views
- operational reporting

Building every view directly from normalized transactional data can become:
- slow
- complex
- difficult to maintain
- expensive to compute repeatedly

Projection models provide optimized representations for reading while preserving canonical sources of truth.

## Decision Drivers

- performance
- maintainability
- user experience
- query simplicity
- workflow visibility
- separation of concerns

## Projection Principles

Canonical records remain the source of truth.

Projection models are derived representations.

Projections may be rebuilt from canonical state when necessary.

## Examples

### Daily Briefing View

Combines:
- tasks
- calendar events
- goals
- reminders
- approvals

into a single retrieval model.

### Dashboard View

Combines:
- active projects
- pending approvals
- memory counts
- execution status

into a single dashboard structure.

### Approval Queue View

Combines:
- approval metadata
- action summaries
- execution state

into an optimized review experience.

## Projection Sources

Projections may consume:
- domain events
- canonical objects
- synchronization results
- workflow state transitions

Projection generation should be deterministic.

## Relationship to Domain Events

Domain events are a natural mechanism for updating projections.

Example:

```text
TaskCompleted
  -> Update Dashboard Projection
```

The domain model remains independent of projection consumers.

## Rebuildability

Projection data should be considered disposable.

The system should be capable of rebuilding projections from authoritative sources when necessary.

## Consistency Model

Projections may be:

```text
Eventually Consistent
```

where appropriate.

The canonical transactional model remains authoritative.

Users should not be able to corrupt canonical data through projection updates.

## Write Restrictions

Projection models should generally not be edited directly.

Writes should occur through:
- services
- domain workflows
- canonical records

Projection state should be regenerated from those changes.

## Privacy Rules

Projections should avoid unnecessary duplication of sensitive content.

When possible:
- reference canonical objects
- store identifiers
- store derived summaries

rather than duplicating complete records.

## Operational Benefits

Projection models enable:
- faster dashboards
- simpler UI queries
- cleaner workflow views
- reduced query complexity
- improved scalability

## Consequences

### Positive

- improved performance
- simpler front-end retrieval
- cleaner architecture
- easier reporting
- more maintainable queries

### Negative

- additional storage
- projection-maintenance logic
- eventual-consistency considerations
- rebuild tooling required

## Implementation Notes

Typical flow:

```text
Canonical State Change
  -> Domain Event
  -> Projection Update
  -> Optimized Read Model
```

Projection schemas should be purpose-built for retrieval use cases.

## Relationship to Audit Events

Audit records remain historical.

Projection models remain operational and user-facing.

They serve different purposes.

## Testing Requirements

Tests should verify:
- projections update correctly
- projections rebuild correctly
- canonical data remains authoritative
- projection corruption does not affect source records
- workflow summaries remain accurate
- eventual consistency behavior is understood and documented

## Outcome

North Vector gains optimized read paths for dashboards, workflows, and reporting while preserving a clean separation between authoritative domain state and user-facing retrieval models.