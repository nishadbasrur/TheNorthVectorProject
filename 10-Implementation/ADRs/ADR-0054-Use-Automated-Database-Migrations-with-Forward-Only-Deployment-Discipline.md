# ADR-0054: Use Automated Database Migrations with Forward-Only Deployment Discipline

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will manage database schema evolution through automated, version-controlled migrations.

Schema changes must be deployed through repeatable migration processes rather than manual database modification.

Migration strategy should favor forward-only deployment discipline whenever practical.

## Context

North Vector's data model will evolve over time as new:
- workflows
- entities
- integrations
- projections
- audit capabilities
- automation systems

are introduced.

Manual database changes create risks including:
- inconsistent environments
- undocumented schema drift
- deployment failures
- rollback complexity
- operational uncertainty

Database evolution should be predictable, auditable, and reproducible.

## Decision Drivers

- reliability
- repeatability
- auditability
- deployment safety
- operational consistency
- schema governance

## Migration Principles

Database schema changes should be:
- version controlled
- automated
- reviewable
- testable
- reproducible

No production schema change should depend on undocumented manual execution.

## Migration Lifecycle

Typical flow:

```text
Migration Authored
  -> Reviewed
  -> Tested
  -> Applied
  -> Recorded
```

Migration history should remain visible and auditable.

## Forward-Only Philosophy

Preferred approach:

```text
Fix Forward
```

rather than relying on complex rollback scripts.

Schema changes should be designed so that future migrations can safely correct issues when necessary.

## Compatibility Strategy

Deployments should support temporary compatibility windows where appropriate.

Example:

```text
Add Column
Deploy Code
Migrate Usage
Remove Legacy Column Later
```

Avoid destructive schema changes that require immediate synchronized deployments.

## Migration Ownership

Every migration should have:
- a purpose
- review history
- version tracking
- deployment traceability

Schema evolution should never be anonymous.

## Environment Consistency

The same migration artifacts should be applied across:
- development
- testing
- staging
- production

This supports environment parity.

## Relationship to Schema Versioning

Application-level schema versioning and database migrations solve different problems.

Database migrations evolve storage structures.

Schema versioning governs long-lived structured payloads.

Both are required.

## Operational Safety

Migration design should consider:
- locking behavior
- execution time
- data volume
- availability requirements
- rollback risk

Large migrations may require staged rollout strategies.

## Audit Requirements

Migration execution should be traceable.

Operators should be able to determine:
- which migrations ran
- when they ran
- in which environment they ran

## Anti-Patterns

Avoid:

```text
Manual Production SQL
Undocumented Schema Changes
Environment-Specific Schema Drift
```

These practices reduce confidence and increase operational risk.

## Operational Benefits

Automated migrations enable:
- repeatable deployments
- consistent environments
- safer schema evolution
- easier auditing
- reduced operational mistakes

## Consequences

### Positive

- improved deployment reliability
- stronger auditability
- reduced schema drift
- easier environment management
- safer long-term evolution

### Negative

- migration-maintenance effort
- additional deployment planning
- compatibility windows may require temporary complexity

## Implementation Notes

Migration tooling may evolve over time.

The architectural requirement is:

```text
Automated
Version Controlled
Repeatable
```

schema evolution.

## Testing Requirements

Tests should verify:
- migrations apply successfully on clean environments
- migrations apply successfully on existing environments
- migration ordering remains deterministic
- compatibility windows function correctly
- schema state matches expectations after migration
- migration history remains auditable

## Outcome

North Vector gains reliable and repeatable database evolution through automated migrations, reducing deployment risk and preventing environment drift while supporting long-term platform growth.