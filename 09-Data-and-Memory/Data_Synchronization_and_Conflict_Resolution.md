# Data Synchronization and Conflict Resolution v1.0

## Purpose

This document defines how North Vector should synchronize canonical objects with external systems, detect divergent state, preserve provenance, reconcile updates, and prevent silent overwrites.

The Data Synchronization and Conflict Resolution system exists because North Vector will operate across calendars, email, files, repositories, academic portals, task systems, financial sources, health platforms, and local memory.

Its purpose is not to force every system into perfect real-time consistency.

Its purpose is to keep data trustworthy, current enough, and recoverable when systems disagree.

## Core Principle

Synchronization should preserve truth before convenience.

North Vector should never overwrite newer or more authoritative data merely to make systems appear consistent.

## Primary Objectives

The model should help Chief answer:
- Which system currently owns this field or object?
- Is the local record current?
- What changed externally?
- What changed locally?
- Is the difference a conflict or an expected delay?
- Which version should win?
- What should be merged, deferred, or escalated?
- How can the result be audited and reversed?

## Synchronization Scope

The model should support:
- One-Way Import
- One-Way Export
- Bidirectional Synchronization
- Event-Driven Synchronization
- Scheduled Synchronization
- Manual Refresh
- Offline Queue Synchronization
- Incremental Synchronization
- Full Reconciliation

## Synchronization Lifecycle

Detect Change
↓
Authenticate Source
↓
Validate Scope
↓
Fetch Current Versions
↓
Normalize Records
↓
Compare State
↓
Classify Difference
↓
Resolve Automatically or Escalate
↓
Apply Changes
↓
Verify Result
↓
Record Audit Event

## Source of Truth Model

Every synchronized object or field should define a source-of-truth policy.

Suggested values:
- External Provider
- North Vector
- User
- Shared
- Derived

### External Provider

The provider owns the authoritative value.

Examples:
- official bank balance
- posted academic grade
- Google Calendar event time

### North Vector

North Vector owns the authoritative value.

Examples:
- internal risk status
- memory confidence
- goal relationship graph

### User

Nishad's explicit statement is authoritative.

Examples:
- personal preference
- interpretation of intent
- current priority

### Shared

Both systems may update the field and require reconciliation.

Examples:
- task due date
- project notes
- flexible study event

### Derived

The value is calculated from other records and should be regenerated rather than synchronized as primary truth.

Examples:
- risk score
- availability estimate
- progress trend

## Standard Synchronization Record

Each synchronized object should contain:
- sync_record_id
- canonical_object_id
- provider
- account_id
- external_object_id
- external_version
- local_version
- source_of_truth
- last_synced_at
- last_external_change_at
- last_local_change_at
- sync_direction
- sync_status
- conflict_status
- pending_operation_ids
- retry_count
- next_retry_at
- last_error
- audit_reference

## Synchronization Statuses

Suggested statuses:
- Current
- Syncing
- Pending Upload
- Pending Download
- Delayed
- Stale
- Conflict
- Authentication Expired
- Permission Limited
- Provider Error
- Local Error
- Disconnected
- Archived

## Change Detection

Changes may be detected through:
- provider webhook
- polling
- version token
- modified timestamp
- content hash
- event stream
- manual refresh
- local transaction log

## Change Record

Each detected change should contain:
- change_id
- object_id
- source
- source_version
- detected_at
- changed_at
- changed_fields
- old_values
- new_values
- actor
- confidence
- processing_status

## Versioning

North Vector should preserve:
- local object version
- provider version or revision
- last verified timestamp
- content hash when useful

Updates should use optimistic concurrency where supported.

## Optimistic Concurrency

Before modifying an external object, Chief should verify that the provider version still matches the version used to prepare the action.

Examples:
- GitHub blob SHA
- calendar event revision
- document modified time
- task revision

If the version changed, the update should stop and enter conflict handling.

## Pessimistic Locking

Pessimistic locking may be used only for short, high-impact local transactions.

The system should avoid long-lived locks across external providers.

## Difference Classification

Detected differences should be classified as:
- No Change
- Expected Change
- Local-Only Change
- External-Only Change
- Compatible Concurrent Change
- Direct Conflict
- Deletion Conflict
- Reappearance Conflict
- Schema Conflict
- Permission Conflict
- Unknown

## Compatible Concurrent Change

Two changes may be compatible when they affect different fields.

Example:
- Nishad changes a task note locally.
- External system changes the task due date.

The system may merge both changes if ownership and schema permit.

## Direct Conflict

A direct conflict occurs when both sides changed the same field or meaning incompatibly.

Example:
- North Vector moves a study block to 7:00 PM.
- Google Calendar moves the same event to 8:00 PM.

## Deletion Conflict

A deletion conflict occurs when:
- one system deletes an object
- another modifies or recreates it

The system should not automatically resurrect or permanently remove the object without applying the source-of-truth and deletion policy.

## Reappearance Conflict

A previously deleted object may reappear through:
- provider restore
- backup restoration
- recurring template
- duplicated external ID

The system should identify whether the object is genuinely new or an unintended resurrection.

## Conflict Record

Each conflict should contain:
- conflict_id
- canonical_object_id
- provider
- detected_at
- conflict_type
- local_version
- external_version
- conflicting_fields
- local_values
- external_values
- source_authority
- recommended_resolution
- resolution_status
- resolved_by
- resolved_at
- audit_reference

## Conflict Statuses

Suggested statuses:
- Detected
- Auto-Resolved
- Awaiting Review
- Resolved
- Deferred
- Superseded
- Accepted Divergence

## Resolution Strategies

### Provider Wins

Use when the external provider is authoritative.

### Local Wins

Use when North Vector owns the field or object.

### User Wins

Use when Nishad explicitly clarifies the intended state.

### Newest Valid Change Wins

Use only when timestamps are reliable and authority is equal.

### Field-Level Merge

Merge non-overlapping changes.

### Manual Review

Use when intent, consequence, or authority is unclear.

### Keep Both

Use when the records represent legitimate parallel states.

### Supersede

Preserve both historically while marking one current.

### Accept Divergence

Use when systems intentionally represent different states.

## Automatic Resolution Rules

Automatic resolution should occur only when:
- authority is explicit
- impact is low
- merge is reversible
- no high-sensitivity field is involved
- confidence is high
- no external commitment is affected

## Manual Resolution Rules

Manual review should be required when:
- an attendee or external recipient is affected
- a deadline changes materially
- a shared file changed
- a Restricted field conflicts
- deletion and modification collide
- a financial or health record differs
- intent cannot be inferred safely

## Conflict Presentation

The interface should show:
- object
- provider
- local version
- external version
- changed fields
- source timestamps
- source authority
- recommended resolution
- consequences of each choice

## Example Conflict

Local:
`Chemistry study block at 7:00 PM.`

Google Calendar:
`Chemistry study block at 8:00 PM.`

Reason:
Both changed after the last sync.

Possible actions:
- Keep 7:00 PM
- Keep 8:00 PM
- Choose New Time
- Keep Both as Separate Events

## Synchronization Direction

### Import Only

External changes update North Vector.

### Export Only

North Vector pushes changes outward.

### Bidirectional

Changes may flow both ways.

### Manual

No automatic changes occur.

## Field-Level Ownership

An object may have different ownership by field.

Example:

Calendar Event:
- start time: Google Calendar
- strategic relevance: North Vector
- flexibility: North Vector
- attendee status: Google Calendar
- related goal: North Vector

## Sync Adapter Contract

Each provider adapter should define:
- authentication method
- supported operations
- versioning mechanism
- pagination
- rate limits
- change detection
- deletion semantics
- recurrence semantics
- retry policy
- idempotency support
- error taxonomy

## Incremental Synchronization

Incremental sync should use:
- cursor
- change token
- updated-since timestamp
- event sequence

The system should store the last successful cursor and recover safely when it expires.

## Full Reconciliation

A full reconciliation should:
1. Fetch all approved objects in scope.
2. Compare provider and canonical inventories.
3. Identify missing, changed, duplicated, and resurrected records.
4. Rebuild links where necessary.
5. Preserve audit history.
6. Avoid destructive bulk actions without review.

## Reconciliation Triggers

Full reconciliation may be required when:
- sync cursor expires
- schema changes
- many conflicts appear
- provider migration occurs
- token scope changes
- backup restoration happens
- deletion propagation is uncertain

## Offline Synchronization

When offline, North Vector may queue local changes.

Each queued change should contain:
- operation ID
- target object
- intended version
- payload
- created_at
- expiration
- idempotency key
- approval reference

## Offline Queue Rules

Before replaying queued operations:
- refresh provider state
- revalidate permission
- confirm approval remains valid
- detect conflicts
- reject stale destructive actions

## Operation Ordering

Queued operations should preserve dependency order.

Example:
1. Create task.
2. Create event.
3. Link task and event.

## Idempotency

All replayable writes should use idempotency or duplicate detection.

The system should avoid:
- duplicate tasks
- duplicate events
- duplicate messages
- duplicate files
- repeated labels

## Retry Policy

Retry only when:
- error is temporary
- operation is idempotent
- approval remains valid
- target state is known

Do not retry automatically after uncertain irreversible actions.

## Stale Data Rules

Each provider and object type should define a freshness threshold.

Examples:
- calendar: minutes to hours
- financial balance: hours to one day
- academic assignment list: hours
- contact details: days or weeks
- stable file metadata: longer

## Stale Read Behavior

When data is stale, Chief should:
- refresh if possible
- label the data as stale
- avoid high-impact action
- state the last successful sync

## Deletion Synchronization

Deletion should distinguish:
- provider deletion
- local archive
- local hard delete
- unlinking
- derived-data removal

Provider deletion should not automatically delete unrelated North Vector history.

## Tombstones

Tombstone records may preserve:
- object ID
- external ID
- deletion timestamp
- source
- deletion type
- retention policy

Tombstones help prevent deleted records from being recreated accidentally.

## Recurring Object Synchronization

Recurring objects require special handling.

The system should distinguish:
- series master
- occurrence
- exception
- canceled occurrence
- future split series

## Attachment Synchronization

Attachments should track:
- parent object
- file ID
- provider version
- checksum
- local cache state
- permission

The system should not duplicate large attachments unless necessary.

## Relationship Synchronization

Provider-native relationships may map into the Relationship Graph.

Examples:
- email thread contains message
- calendar event involves attendee
- task belongs to project

Provider changes should update edges without deleting unrelated North Vector relationships.

## Schema Evolution

When provider or canonical schemas change:
- version the adapter
- migrate normalized data
- preserve raw source reference
- validate fields
- create conflict records for lost meaning

## Permission Changes

If scope narrows:
- stop syncing excluded objects
- mark inaccessible records
- remove cached data according to policy
- preserve audit history

If scope broadens:
- require explicit approval
- perform initial import carefully

## Source Disconnection

When an integration disconnects:
- stop synchronization
- revoke tokens
- mark records disconnected
- identify cached and derived data
- offer cleanup
- preserve approved historical summaries

## Verification

After synchronization, verify:
- provider accepted writes
- canonical state matches intended result
- version tokens updated
- no duplicate object created
- conflict status cleared where appropriate

## Audit Logging

Each sync cycle should record:
- provider
- scope
- start and end time
- objects inspected
- objects created
- objects updated
- objects deleted or archived
- conflicts detected
- conflicts resolved
- failures
- cursor or version update

## Monitoring Metrics

Useful metrics include:
- synchronization success rate
- average lag
- stale object count
- conflict rate
- auto-resolution rate
- manual-resolution rate
- duplicate prevention count
- provider error rate
- retry count
- deletion mismatch count

## User Controls

Nishad should be able to:
- refresh now
- pause synchronization
- change direction
- review conflicts
- accept divergence
- reset provider link
- perform full reconciliation
- disconnect source

## Sync Dashboard

The dashboard should show:
- integration
- current status
- last sync
- freshness
- pending changes
- conflicts
- errors
- next scheduled sync
- source-of-truth policy

## Security

Synchronization should:
- validate authentication
- enforce scope
- minimize payloads
- encrypt transport
- avoid logging secrets
- stop after revocation
- use provider-approved APIs

## Privacy

The system should synchronize only approved data.

It should avoid:
- full-account ingestion when folder or label scope is enough
- retaining deleted provider data without purpose
- moving Restricted data to less secure systems

## Error Handling

If synchronization fails:
`Google Calendar could not be refreshed. Existing calendar data may be outdated.`

If a write conflict occurs:
`The event changed after I prepared the update. I did not overwrite the newer version.`

If only part succeeds:
`Two tasks synchronized successfully. One task remains in conflict and was not changed.`

If the result is uncertain:
`The provider did not confirm whether the update completed. I will not retry until the current state is verified.`

## Failure Modes

### Silent Overwrite

Newer or authoritative data is replaced without review.

### False Consistency

Systems appear synchronized while important fields diverge.

### Retry Duplication

A repeated operation creates duplicates.

### Timestamp Blindness

The system assumes all clocks and timestamps are reliable.

### Authority Confusion

The wrong system wins a conflict.

### Resurrection

Deleted records reappear through sync or backup restore.

### Conflict Graveyard

Conflicts remain unresolved indefinitely.

### Scope Drift

Synchronization expands beyond approved data.

### Partial-Success Obscurity

The user cannot tell what synchronized and what did not.

## Phase 1 Implementation

Phase 1 should support:
- source-of-truth policies
- external and local version tracking
- scheduled and manual synchronization
- incremental sync where available
- stale-data indicators
- field-level merge for compatible changes
- explicit conflict records
- optimistic concurrency
- idempotent writes
- offline queue
- tombstones
- audit logging
- conflict-review interface

Advanced collaborative editing and real-time multi-master synchronization can come later.

## Success Criteria

The Data Synchronization and Conflict Resolution system succeeds if North Vector can always explain:
- which version is current
- which system owns the value
- what changed
- whether a conflict exists
- why a resolution was chosen
- what remains pending or uncertain
- whether any data was overwritten, duplicated, or resurrected

## Final Principle

North Vector should not force systems to agree by hiding disagreement.

It should preserve evidence, respect authority, and reconcile differences without losing truth.