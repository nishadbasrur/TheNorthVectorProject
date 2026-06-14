# ADR-0030: Use Soft Deletion with Explicit Lifecycle States Before Permanent Removal

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use soft deletion and explicit lifecycle states before permanent removal of user-controlled records.

Deletion will generally occur as a multi-stage process rather than immediate physical removal.

## Context

The platform stores:
- memories
- plans
- goals
- tasks
- relationships
- audit references
- synchronization records
- execution history

Immediate deletion can create problems involving:
- accidental loss
- recovery requests
- synchronization consistency
- audit reconstruction
- verification workflows

A lifecycle-based approach provides safer and more explainable behavior.

## Lifecycle States

Typical states may include:

```text
Active
Pending Deletion
Deleted
Purged
```

Additional domain-specific states may exist where required.

## Soft Deletion Rules

Soft deletion should:
- hide records from normal user workflows
- prevent ordinary retrieval
- preserve identifiers and references temporarily
- support verification and recovery workflows

Soft deletion is not equivalent to permanent removal.

## Permanent Removal

Permanent removal should occur only after:
- retention requirements are satisfied
- dependencies are resolved
- deletion verification is complete
- purge rules allow removal

## Audit Requirements

Deletion actions should generate immutable audit events.

Audit records should remain explainable even when the deleted content is eventually purged.

## Privacy Considerations

The system must balance:
- recoverability
- accountability
- privacy
- user expectations

Retention periods should be documented and enforced.

## Operational Benefits

Soft deletion enables:
- recovery from mistakes
- safer synchronization
- deletion verification
- audit reconstruction
- controlled purge operations

## Consequences

### Positive

- safer deletion workflows
- reduced accidental data loss
- improved operational transparency
- easier recovery scenarios

### Negative

- additional lifecycle complexity
- more storage usage
- filtering requirements throughout the application

## Implementation Notes

Queries should default to excluding deleted records unless explicitly requested.

Lifecycle transitions should be auditable and testable.

Purge operations should run through controlled workflows rather than direct database deletion.

## Testing Requirements

Tests should verify:
- deleted records disappear from normal views
- retrieval excludes deleted records
- audit history remains intact
- purge transitions work correctly
- lifecycle filters are consistently enforced

## Outcome

North Vector gains safer deletion behavior, improved recovery capabilities, and clearer lifecycle management while preserving accountability and privacy objectives.