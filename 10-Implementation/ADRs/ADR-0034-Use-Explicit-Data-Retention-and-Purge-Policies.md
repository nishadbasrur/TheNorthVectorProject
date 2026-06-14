# ADR-0034: Use Explicit Data Retention and Purge Policies

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will define explicit retention and purge policies for every major category of stored data.

Data must not be retained indefinitely by accident.

Each data category must have a documented lifecycle describing:
- purpose
- retention period
- deletion conditions
- purge process
- ownership

## Context

North Vector stores and processes:
- memories
- plans
- goals
- tasks
- audit events
- synchronization metadata
- notifications
- logs
- monitoring data
- exports
- provider state
- authentication artifacts

Without explicit retention policies, systems tend to accumulate data indefinitely.

This creates:
- privacy risk
- security risk
- operational cost
- regulatory uncertainty
- unnecessary storage growth

Retention should be intentional rather than accidental.

## Decision Drivers

- privacy
- security
- transparency
- operational simplicity
- storage management
- user trust
- lifecycle clarity

## Retention Principles

Every data category should have:
- an owner
- a purpose
- a retention rule
- a purge mechanism
- verification procedures

No category should exist without a documented retention decision.

## Data Categories

Examples include:

### User Data

Examples:
- memories
- plans
- goals
- tasks

Retention should align with user expectations and product purpose.

### Audit Events

Audit records typically require longer retention because they support:
- accountability
- investigations
- workflow reconstruction

### Operational Logs

Operational logs generally require shorter retention than audit records.

### Monitoring Data

Monitoring systems should use bounded retention and avoid becoming permanent archives.

### Exports

Generated exports should expire automatically.

### Authentication Artifacts

Authentication-related records should follow security-driven retention requirements.

## Purge Principles

Purge operations should:
- be intentional
- be auditable
- be verifiable
- avoid partial deletion states

Where appropriate, purge should occur through controlled workflows rather than manual database actions.

## Privacy Rules

Retention should follow data-minimization principles.

Data that no longer serves a valid purpose should not be retained indefinitely.

## Relationship to Soft Deletion

Soft deletion and retention are separate concepts.

Soft deletion:
- hides records
- supports recovery

Retention:
- determines how long records remain available before purge

## Relationship to Audit Events

Audit events may outlive the underlying records they reference.

Audit records should preserve accountability without preserving unnecessary content.

## Operational Benefits

Explicit retention policies enable:
- predictable storage growth
- reduced privacy risk
- easier compliance review
- clearer operational ownership

## Consequences

### Positive

- stronger privacy posture
- reduced storage growth
- clearer lifecycle management
- improved transparency

### Negative

- additional policy maintenance
- purge-job implementation effort
- retention decisions require review and governance

## Implementation Notes

Every retention policy should document:

```text
Data Category
Purpose
Owner
Retention Period
Purge Method
Verification Method
```

Retention rules should be version-controlled and reviewed.

## Testing Requirements

Tests should verify:
- expired records become eligible for purge
- purge workflows execute correctly
- audit history remains consistent
- exports expire as expected
- retention rules are enforced automatically
- purge actions are auditable

## Outcome

North Vector gains predictable data lifecycle management, stronger privacy protections, and clear ownership of how long information is retained and when it is permanently removed.