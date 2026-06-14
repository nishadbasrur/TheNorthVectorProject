# ADR-0059: Use Data Retention and Data Lifecycle Policies for Long-Term Governance

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use explicit data retention and data lifecycle policies for all major categories of stored information.

Data must have defined ownership, purpose, lifecycle state, retention period, deletion behavior, and purge rules.

The system should not retain information indefinitely by accident.

## Context

North Vector stores and processes many categories of data, including:
- user profile data
- memories
- goals
- plans
- tasks
- approvals
- executions
- audit events
- logs
- telemetry
- exports
- provider metadata
- synchronization records

Some data should persist for a long time because it supports product value, accountability, or auditability.

Other data should expire quickly because it is temporary, sensitive, operational, or no longer useful.

Without lifecycle policies, data accumulation creates:
- privacy risk
- security risk
- operational cost
- compliance uncertainty
- user trust problems

## Decision Drivers

- privacy
- security
- governance
- operational clarity
- storage control
- auditability
- user trust

## Data Lifecycle Principles

Every major data category should define:
- purpose
- owner
- lifecycle states
- retention period
- deletion behavior
- purge behavior
- audit requirements

Data lifecycle decisions should be documented and reviewable.

## Example Lifecycle States

Possible lifecycle states include:

```text
Active
Archived
Pending Deletion
Deleted
Purged
Expired
```

Specific domains may define additional states.

## Retention Policy Requirements

Each retention policy should answer:

```text
Why is this data stored?
How long is it stored?
Who owns it?
When is it deleted?
When is it purged?
What audit record remains?
```

## Data Categories

### Core User Data

Examples:
- memories
- goals
- plans
- tasks

Retention should align with user expectations and product purpose.

### Audit Data

Audit data may require longer retention because it supports:
- accountability
- incident investigation
- execution traceability

Audit records should avoid preserving unnecessary sensitive content.

### Operational Logs

Operational logs should usually have shorter retention than audit records.

Logs should support debugging without becoming permanent archives.

### Telemetry Data

Telemetry should be retained only as long as it provides operational value.

Monitoring data should not become an uncontrolled secondary copy of sensitive data.

### Exports

Generated exports should expire automatically and be removable through defined cleanup workflows.

### Provider Metadata

Provider metadata should be retained only as long as required for synchronization, debugging, or auditability.

## Deletion Behavior

Deletion should be:
- intentional
- auditable
- verifiable
- consistent with lifecycle policy

Deletion does not always mean immediate purge.

## Purge Behavior

Purge means permanent removal where recovery is no longer expected.

Purge workflows should be controlled, logged, and tested.

## Relationship to Soft Deletion

Soft deletion is a lifecycle state.

Retention policy determines how long soft-deleted data remains before purge.

These concepts should remain distinct.

## Relationship to Audit Events

Audit events may outlive deleted content.

The audit trail should preserve accountability without unnecessarily preserving the deleted content itself.

## Privacy Considerations

Data minimization should guide retention.

Data that no longer has a valid purpose should become eligible for deletion or purge.

## Operational Benefits

Lifecycle policies enable:
- predictable storage growth
- cleaner data governance
- better privacy posture
- easier compliance review
- safer deletion workflows

## Consequences

### Positive

- stronger privacy governance
- clearer data ownership
- reduced indefinite retention
- improved deletion consistency
- better long-term maintainability

### Negative

- policy maintenance required
- purge workflow complexity
- additional testing burden
- retention decisions require governance

## Implementation Notes

Retention rules should be documented in version-controlled policy files or equivalent managed artifacts.

Automated jobs should enforce expiration and purge behavior where practical.

## Testing Requirements

Tests should verify:
- lifecycle transitions are enforced
- expired data becomes eligible for deletion or purge
- purge workflows remove appropriate records
- audit records remain meaningful after purge
- operational logs and telemetry observe retention limits
- exports expire and are cleaned up correctly

## Outcome

North Vector gains explicit long-term governance over stored data by defining lifecycle states, retention periods, deletion behavior, and purge rules for all major categories of information.