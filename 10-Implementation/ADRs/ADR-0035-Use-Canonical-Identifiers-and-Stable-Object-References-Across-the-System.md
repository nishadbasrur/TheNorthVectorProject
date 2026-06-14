# ADR-0035: Use Canonical Identifiers and Stable Object References Across the System

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will assign canonical identifiers to all durable objects and use stable object references throughout the system.

Identifiers must remain stable across:
- user interfaces
- APIs
- background jobs
- audit events
- synchronization workflows
- exports
- internal references

Identifiers must not depend on mutable display names or transient runtime state.

## Context

North Vector manages many object types including:
- memories
- goals
- projects
- tasks
- plans
- approvals
- actions
- executions
- jobs
- audit events
- relationships

These objects interact across multiple services and workflows.

Without stable identifiers:
- references break
- synchronization becomes fragile
- audit reconstruction becomes difficult
- merges and migrations become risky
- object history becomes ambiguous

## Decision Drivers

- consistency
- referential integrity
- auditability
- synchronization reliability
- portability
- migration safety
- long-term maintainability

## Identifier Principles

Identifiers should be:
- globally unique within their scope
- immutable
- opaque
- stable over time
- independent of display names

Identifiers should not encode business meaning that may change later.

## Object References

Relationships should reference canonical IDs rather than:
- titles
- names
- labels
- display text
- provider-generated descriptions

Example:

```text
memory_id
project_id
task_id
approval_id
```

rather than:

```text
"Chem Exam Study Plan"
```

## Display Names

Display names may change.

Identifiers should not.

Renaming an object must not require updating every relationship in the system.

## External Providers

Provider identifiers should be stored separately from North Vector identifiers.

Examples:

```text
north_vector_id
provider_id
```

The system should never depend exclusively on external IDs for object identity.

## Audit Requirements

Audit events should reference canonical identifiers.

This allows reconstruction even when:
- names change
- content changes
- providers change

## Synchronization

Synchronization workflows should map:

```text
North Vector ID
<->
Provider ID
```

Mappings should remain explicit and auditable.

## Privacy Considerations

Identifiers should avoid exposing sensitive information.

IDs should not embed:
- names
- emails
- dates of birth
- provider secrets
- personal content

## Operational Benefits

Stable identifiers enable:
- reliable references
- safer migrations
- better debugging
- easier auditing
- cleaner integrations

## Consequences

### Positive

- stronger referential integrity
- easier system evolution
- safer synchronization
- improved auditability
- reduced coupling to names and content

### Negative

- additional mapping layers
- identifiers are less human-readable
- migration effort for legacy references if introduced later

## Implementation Notes

Recommended identifier characteristics:

```text
immutable
opaque
non-sequential when practical
safe for APIs
```

Relationships should use identifiers consistently throughout the data model.

## Testing Requirements

Tests should verify:
- identifiers remain stable after updates
- renaming objects does not affect references
- audit events resolve correctly through IDs
- synchronization mappings remain valid
- provider ID changes do not break internal identity

## Outcome

North Vector gains a durable identity model that supports auditing, synchronization, migration, and long-term system evolution without depending on mutable object names or external-provider identifiers.