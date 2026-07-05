# Data Migration and Backup Model v1.0

## Purpose

This document defines how North Vector should migrate data between schema versions, storage systems, environments, and providers while preserving integrity, provenance, privacy, and recoverability.

It also defines how backups should be created, encrypted, verified, restored, retained, and deleted.

The Data Migration and Backup Model exists to ensure that architectural change, software failure, provider transition, or accidental deletion does not silently corrupt or permanently destroy important data.

Its purpose is not to preserve every byte forever.

Its purpose is to preserve trustworthy state and make recovery deliberate.

## Core Principle

A migration should not change meaning accidentally.

A backup should not be considered useful until restoration has been tested.

## Primary Objectives

The model should help Chief answer:
- What data is being migrated?
- Why is the migration necessary?
- Which schema or system versions are involved?
- How will meaning, provenance, and relationships be preserved?
- What validation proves success?
- How can the migration be rolled back?
- What is included in backups?
- How long are backups retained?
- Can a trusted state be restored without reviving deleted or compromised data?

## Scope

The model should support:
- Schema Migration
- Storage Migration
- Provider Migration
- Integration Reconnection
- Environment Migration
- Data Import
- Data Export
- Backup Creation
- Backup Verification
- Point-in-Time Recovery
- Disaster Recovery
- Deletion Replay
- Credential and Key Recovery

## Migration Lifecycle

Proposal
↓
Inventory and Dependency Review
↓
Risk Classification
↓
Backup and Restore Checkpoint
↓
Transformation Design
↓
Dry Run
↓
Validation
↓
Execution
↓
Post-Migration Verification
↓
Cutover
↓
Monitoring
↓
Rollback or Closure

## Migration Types

### Schema Migration

Changes object structure, fields, constraints, indexes, or relationships.

Examples:
- add memory review date
- split one status field into lifecycle and risk status
- change confidence representation

### Storage Migration

Moves data between storage technologies or instances.

Examples:
- local database to Firestore (the actual primary database as of 2026-07-03 — see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`; originally planned as PostgreSQL)
- one cloud region to another
- file storage provider change

### Provider Migration

Moves an integration or source of truth from one provider to another.

Examples:
- one task system to another
- one document provider to another

### Environment Migration

Moves data between:
- development
- staging
- production
- local and cloud environments

Production data should not be copied into weaker environments without strong justification and minimization.

### Canonical Model Migration

Changes how North Vector represents an object while preserving its real-world identity.

### Import Migration

Brings external or legacy data into North Vector.

### Export Migration

Produces portable records for another system or long-term archive.

## Standard Migration Record

Each migration should contain:
- migration_id
- title
- migration_type
- status
- reason
- source_system
- target_system
- source_schema_version
- target_schema_version
- scope
- affected_object_types
- affected_record_count
- dependency_ids
- risk_level
- backup_reference
- transformation_version
- validation_plan
- rollback_plan
- started_at
- completed_at
- executed_by
- result_summary
- error_summary
- audit_reference

## Migration Statuses

Suggested statuses:
- Draft
- Approved
- Dry Run
- Scheduled
- Running
- Validating
- Completed
- Partially Completed
- Failed
- Rolled Back
- Canceled
- Archived

## Migration Risk Levels

### Low

Additive, reversible, limited-scope change.

### Moderate

Meaningful schema or storage change with tested rollback.

### High

Large-scale transformation, provider cutover, or sensitive data movement.

### Critical

Migration involving encryption keys, identity data, audit integrity, or broad destructive transformation.

## Migration Inventory

Before migration, identify:
- canonical objects
- source references
- relationships
- indexes
- embeddings
- files
- caches
- audit records
- automation dependencies
- integration mappings
- retention and deletion records
- encryption metadata

## Dependency Review

The migration should identify systems that depend on affected data.

Examples:
- retrieval queries
- dashboard views
- automation triggers
- permission checks
- synchronization adapters
- export formats
- deletion workflows

## Transformation Plan

Each transformation should define:
- source field or structure
- target field or structure
- transformation logic
- default behavior
- null and unknown handling
- validation rule
- reversibility
- expected information loss

## Semantic Preservation

A migration should preserve meaning, not just field values.

Example:
A combined `status` value may need to split into:
- lifecycle_status
- risk_status

Copying the old value into only one field may corrupt meaning even if the migration technically succeeds.

## Source and Provenance Preservation

Migrations should preserve:
- canonical object IDs where possible
- external IDs
- source references
- timestamps
- confidence
- sensitivity
- retention rules
- version history
- audit links

## Stable Identity Rule

A migration should not assign new canonical IDs unless technically necessary.

If IDs must change:
- create an old-to-new ID map
- redirect relationships
- preserve export references
- retain migration audit history

## Null and Unknown Handling

The transformation should distinguish:
- missing
- unknown
- not applicable
- deliberately withheld
- deleted
- invalid

Migration logic should not convert all of these into a generic null silently.

## Default Values

Default values should be used only when:
- semantically valid
- documented
- distinguishable from observed values

Generated defaults should preserve a transformation provenance record.

## Lossy Migration

If information will be lost:
- identify exact fields
- explain why
- preserve an archival source copy when appropriate
- require stronger approval
- verify that the loss is acceptable

## Dry Run

A dry run should:
- operate on a representative snapshot
- avoid production writes
- report record counts
- identify invalid records
- detect relationship breaks
- test performance
- verify rollback logic

## Migration Preview

Before execution, show:
- records affected
- fields changed
- estimated duration
- expected downtime
- irreversible effects
- backup checkpoint
- rollback conditions

## Validation Plan

Validation should cover:
- record counts
- field-level accuracy
- relationship integrity
- source references
- sensitivity and retention
- deleted-record handling
- search index consistency
- automation compatibility
- permission enforcement
- query performance

## Validation Sampling

For large migrations, use:
- full automated validation for structural checks
- targeted samples for semantic checks
- high-risk object review
- random sampling

## Pre-Migration Backup

High-impact migrations should require a verified pre-migration backup or snapshot.

The backup should include enough state to restore:
- canonical records
- relationships
- audit records
- source mappings
- deletion tombstones
- configuration needed for interpretation

## Migration Execution

Recommended steps:
1. Pause affected high-risk writes.
2. Record source version and checkpoint.
3. Create or verify backup.
4. Execute transformation in bounded batches.
5. Validate each batch.
6. Record failures without discarding the entire history.
7. Rebuild or update indexes.
8. Verify dependent systems.
9. Resume writes only after validation.

## Batch Migration

Large migrations should process data in batches.

Each batch should record:
- range or object IDs
- record count
- successful count
- failed count
- retry status
- validation result

## Online Migration

Online migrations may use:
- backward-compatible schema changes
- dual reads
- dual writes
- shadow tables
- feature flags
- gradual cutover

The system should avoid prolonged dual-write periods without reconciliation monitoring.

## Offline Migration

Offline migrations may pause writes temporarily.

They should define:
- maintenance window
- user impact
- queued operations
- recovery behavior

## Dual-Write Risks

During dual write, monitor:
- inconsistent records
- missed writes
- ordering problems
- duplicate writes
- source-of-truth confusion

## Cutover

Cutover should occur only after:
- validation passes
- critical queries work
- permissions remain correct
- automation tests pass
- rollback remains available

## Post-Migration Monitoring

Monitor:
- error rate
- conflict rate
- missing records
- orphaned relationships
- retrieval failures
- performance regression
- permission anomalies
- deletion failures

## Rollback

Rollback should define:
- trigger conditions
- time limit
- restoration steps
- handling of writes made after migration
- credential and token implications
- verification steps

## Roll-Forward

Sometimes fixing the new system is safer than restoring the old one.

The plan should define when to:
- roll back
- roll forward
- pause and investigate

## Partial Migration Failure

If some records fail:
- preserve successful records
- isolate failed records
- create quality issues
- avoid duplicate retries
- explain whether production use may continue

## Migration Audit

Each migration should record:
- approval
- code or transformation version
- operator or service identity
- source checkpoint
- target checkpoint
- validation results
- failed records
- rollback activity
- final disposition

## Backup Objectives

Backups should protect against:
- accidental deletion
- database corruption
- failed migration
- provider outage
- device loss
- ransomware or malicious modification
- audit-log loss
- infrastructure failure

## Backup Types

### Full Backup

Captures the complete protected dataset.

### Incremental Backup

Captures changes since the last backup.

### Differential Backup

Captures changes since the last full backup.

### Snapshot

Captures storage state at a specific point in time.

### Export Archive

Creates a portable application-level representation.

### Provider-Native Backup

Uses version history or export features from an external provider.

## Standard Backup Record

Each backup should contain:
- backup_id
- backup_type
- created_at
- source_system
- scope
- schema_version
- data_classifications
- encrypted
- key_reference
- storage_location
- size
- checksum
- retention_policy
- expires_at
- verification_status
- last_restore_test_at
- deletion_replay_position
- status
- audit_reference

## Backup Statuses

Suggested statuses:
- Creating
- Complete
- Verified
- Verification Failed
- Expired
- Deleting
- Deleted
- Corrupted
- Restored

## Backup Scope

Backups may include:
- canonical database
- relationship data
- audit logs
- configuration
- automation definitions
- permission records
- migration maps
- deletion tombstones
- encrypted files
- search metadata

Caches generally should not require backup.

## Backup Exclusions

Default exclusions may include:
- raw ephemeral audio
- temporary location
- short-lived caches
- provider data easily re-fetched
- expired temporary context

## Backup Encryption

Backups should be encrypted:
- in transit
- at rest
- with keys separated from backup storage

Restricted data may require stronger key handling.

## Key Management

Backup keys should:
- be stored in approved key management
- support rotation
- have restricted access
- be recoverable through a controlled process
- not be committed to source code

## Backup Integrity

Verify backups using:
- checksum
- manifest
- record counts
- schema metadata
- test restore

A checksum alone does not prove that the backup is semantically restorable.

## Backup Frequency

Frequency should depend on:
- data change rate
- recovery objectives
- sensitivity
- operational cost

Suggested Phase 1 approach:
- daily encrypted database backup
- more frequent transaction or point-in-time logs when practical
- pre-migration snapshots
- periodic export archives

## Recovery Point Objective

Recovery Point Objective defines how much recent data loss is acceptable.

Example:
- operational tasks and commitments: low tolerance
- archived historical summaries: higher tolerance

## Recovery Time Objective

Recovery Time Objective defines how quickly service should be restored.

Critical functions may include:
- identity
- calendar and task continuity
- current commitments
- security controls

## Retention Schedule

A possible backup schedule:
- daily backups retained for 30 days
- weekly backups retained for 12 weeks
- monthly backups retained for 12 months

Exact schedules should be adjusted to cost, sensitivity, and project maturity.

## Backup Deletion

Expired backups should be deleted according to policy.

Deletion should:
- remove data
- remove manifests
- revoke access
- record completion
- account for provider retention delays

## Deletion Replay

Backups may contain data deleted after the backup was created.

The system should preserve a deletion and revocation log so restoration can replay:
- hard deletions
- source disconnections
- token revocations
- device revocations
- memory corrections
- supersessions

## Backup Resurrection Protection

After restore, North Vector should not reactivate:
- deleted memories
- revoked credentials
- lost devices
- expired permissions
- compromised automation

## Restore Lifecycle

Restore Request
↓
Authorization
↓
Backup Selection
↓
Integrity Verification
↓
Isolated Restoration
↓
Deletion and Revocation Replay
↓
Data Validation
↓
Security Validation
↓
Cutover
↓
Monitoring

## Restore Authorization

Restoration should require high-assurance authentication and appropriate authority.

## Restore Selection

Select backup based on:
- incident time
- last known trusted state
- schema compatibility
- deletion log availability
- credential exposure

The newest backup is not always the safest backup.

## Isolated Restore

Restore first into an isolated environment when possible.

This allows validation before affecting production.

## Restore Validation

Verify:
- record integrity
- relationships
- permissions
- revoked devices
- deleted data
- audit continuity
- source mappings
- automation status
- encryption keys

## Point-in-Time Recovery

Where supported, the system may restore to a specific timestamp.

This is useful for:
- accidental deletion
- corruption
- failed migration
- malicious modification

## Selective Restore

The system may support restoring:
- one object
- one project
- one file
- one table
- one integration configuration

Selective restore should not bypass current deletion or privacy rules.

## Restore Conflict Handling

Restored data may conflict with newer valid data.

The system should:
- preserve both temporarily
- compare timestamps and authority
- use migration maps
- request manual review when consequential

## Disaster Recovery

The disaster recovery plan should define:
- backup locations
- alternate infrastructure
- key recovery
- restoration order
- minimum viable service
- communication process

## Minimum Viable Recovery Order

Suggested order:
1. Identity and access controls
2. Security and audit state
3. Canonical data
4. Relationships
5. Current goals, tasks, commitments, and events
6. Memory retrieval
7. Integrations
8. Automations
9. Search and analytics

## Provider-Native Recovery

External providers may offer:
- file version history
- Git commit history
- calendar recovery
- email Trash
- task archive

North Vector should use provider-native recovery when it is more reliable than local reconstruction.

## Audit Log Recovery

Audit logs should be restored with strong integrity checks.

If audit history is incomplete:
- mark the period uncertain
- compare independent provider records
- pause high-risk automation

## Migration and Backup Testing

Test scenarios should include:
- schema migration with rollback
- partial batch failure
- corrupted backup
- missing encryption key
- provider cutover
- deleted-memory restoration
- revoked-device restoration
- index rebuild
- relationship orphan detection
- point-in-time recovery

## Restore Test Cadence

Suggested cadence:
- backup integrity check: each backup
- small selective restore: monthly
- full isolated restore: quarterly
- disaster recovery exercise: twice yearly

## Migration Test Cadence

Every migration should include:
- automated tests
- dry run
- sample semantic review
- rollback test when practical

## Migration Tooling

Migration tooling should support:
- versioned scripts
- dry run
- batch size control
- resume from checkpoint
- idempotency
- validation reports
- rollback or compensating scripts

## Migration Script Security

Migration scripts should:
- use least privilege
- avoid logging sensitive values
- be reviewed
- be version controlled
- be tested outside production
- have explicit target environment checks

## Import Rules

Imported data should:
- preserve source
- validate schema
- detect duplicates
- assign sensitivity
- map IDs
- create quality issues for uncertain records

## Export Rules

Exports should:
- preserve canonical IDs
- preserve schema version
- preserve timestamps
- preserve provenance and relationships
- redact fields according to user choice
- use encrypted packaging for sensitive data

## Portability

Preferred portable formats:
- JSON for structured objects
- Markdown for readable documents
- CSV for simple tables
- encrypted archive for full export

## Backup and Privacy

Backups should not become a loophole that defeats deletion.

They should:
- use bounded retention
- restrict access
- support deletion replay
- avoid backing up unnecessary ephemeral data

## Backup and Security

Backups are high-value targets.

Controls should include:
- separate credentials
- encryption
- access logging
- immutable or protected storage where useful
- geographic or provider separation where appropriate

## Monitoring Metrics

Useful metrics include:
- backup success rate
- verification failure rate
- restore test success rate
- migration failure rate
- orphan rate after migration
- rollback rate
- recovery time
- recovery point gap
- deletion replay failures

## Dashboard

The migration and backup dashboard should show:
- scheduled migrations
- current migration status
- latest verified backup
- backup age
- last restore test
- retention status
- failed backups
- deletion replay status
- open migration issues

## Notifications

Notify Nishad when:
- a high-risk migration is ready for approval
- backup verification fails
- no recent valid backup exists
- restore test fails
- migration partially succeeds
- rollback occurs
- deletion replay fails

Routine successful backups may remain silent.

## Error Handling

If migration validation fails:
`The migration did not pass validation. The old system remains authoritative, and cutover has not occurred.`

If backup creation fails:
`The backup was not completed. The last verified backup is from yesterday.`

If restoration is incomplete:
`The database was restored, but deletion and revocation replay has not finished. Restricted access remains disabled.`

If a backup is corrupted:
`This backup failed integrity checks and will not be used for recovery.`

## Failure Modes

### Untested Backup

A backup exists but cannot be restored.

### Semantic Corruption

Fields migrate successfully while meaning changes.

### Identity Breakage

Canonical IDs change without relationship repair.

### Backup Resurrection

Deleted or revoked data returns after restore.

### Key Loss

Encrypted backups exist but cannot be decrypted.

### Dual-Write Drift

Old and new systems diverge during cutover.

### Rollback Illusion

A rollback plan exists but has never been tested.

### Production Data Leakage

Sensitive production data enters development or testing.

### Retention Sprawl

Backups accumulate indefinitely.

### Audit Discontinuity

Migration or restore breaks the action history.

## Phase 1 Implementation

Phase 1 should support:
- versioned schema migrations
- dry runs
- migration records
- stable ID preservation
- batch execution
- validation reports
- rollback plans
- encrypted daily backups
- checksum and manifest verification
- quarterly isolated restore tests
- deletion and revocation replay
- portable exports
- backup retention and deletion

Advanced cross-region failover and continuous replication can come later.

## Success Criteria

The Data Migration and Backup Model succeeds if North Vector can always explain:
- what changed
- which records were affected
- whether meaning and provenance were preserved
- how success was validated
- whether rollback remains possible
- which backup represents a trusted state
- whether deleted and revoked data stayed deleted and revoked after restoration

## Final Principle

North Vector should be able to evolve without losing its history, and recover without resurrecting what was deliberately removed.