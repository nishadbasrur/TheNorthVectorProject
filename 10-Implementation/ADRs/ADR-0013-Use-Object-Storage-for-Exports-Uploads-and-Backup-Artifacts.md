# ADR-0013: Use Object Storage for Exports, Uploads, and Backup Artifacts

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Technical Lead
- Operations Owner
- Security Owner
- Privacy Owner
- Data Architecture Owner

## Related Documents

- `09-Data-and-Memory/Data_Migration_and_Backup_Model.md`
- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Deployment_and_Operations_Plan.md`
- `10-Implementation/MVP_Scope_and_Acceptance_Criteria.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0001-Use-PostgreSQL-as-Primary-Database.md` (superseded — see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`)
- `10-Implementation/ADRs/ADR-0012-Use-a-Managed-PostgreSQL-Provider-for-Production.md` (superseded — see ADR-0101)

**Note (2026-07-03):** every "PostgreSQL" reference in this document (there are many, since this ADR's core decision — object storage — was written assuming Postgres held the canonical metadata) should be read as "Firestore." This ADR's own decision (use managed object storage for large binary artifacts) hasn't itself been implemented — no object storage exists in the deployed app — so this note is documenting a database-name substitution in an otherwise still-hypothetical design, not correcting a live discrepancy. See ADR-0101 for what's actually deployed.

## Context

North Vector needs to store binary or file-like artifacts that do not belong directly inside PostgreSQL rows.

Phase 1 and future releases may create or receive:
- user data exports
- imported documents
- temporary file uploads
- generated Markdown or JSON archives
- backup artifacts
- migration snapshots
- provider export files
- test fixtures or operational evidence

PostgreSQL should remain the authoritative store for canonical objects, metadata, permissions, source references, and lifecycle state.

Storing large files directly in the database would increase backup size, query overhead, and operational complexity. Storing files only on the local application filesystem would be fragile in managed deployment environments because application instances may be ephemeral, horizontally replaced, or separated from the worker.

The project therefore needs a durable file-storage layer with private access, encryption, lifecycle rules, and portable provider semantics.

## Decision Drivers

- durable binary storage
- private-by-default access
- encryption
- short-lived download links
- lifecycle and expiration policies
- compatibility with web and worker processes
- low operational overhead
- provider portability
- separation of canonical metadata from file bytes
- support for exports and backups
- manageable cost for one user

## Options Considered

### Option A: S3-Compatible Object Storage

Description:
Use a managed object-storage provider with S3-compatible semantics for exports, uploads, and backup artifacts. Store only metadata and object references in PostgreSQL.

Advantages:
- durable file storage
- private buckets and scoped access
- lifecycle policies
- encryption at rest and in transit
- short-lived signed URLs
- broad provider choice
- good support from TypeScript SDKs
- works across web and worker deployments
- separates large files from transactional database workloads

Disadvantages:
- another provider and credential
- object and database lifecycle must remain synchronized
- provider-specific limits and pricing exist
- signed URL and access-policy mistakes can expose data

Risks:
- orphaned objects after database deletion
- stale signed links
- public bucket misconfiguration
- backup artifacts retained too long

### Option B: Store File Bytes in PostgreSQL

Description:
Store uploaded or generated file content in binary database columns.

Advantages:
- one data system
- transactional metadata and file writes
- unified backup and restore
- simpler referential integrity

Disadvantages:
- database growth and backup bloat
- poor fit for large objects
- greater query and replication overhead
- more expensive managed database storage
- file delivery becomes less efficient

Risks:
- database performance and recovery degrade
- operational cost rises
- one large file can affect transactional workloads

### Option C: Local Application Filesystem

Description:
Store files on the local disk of the web or worker host.

Advantages:
- simple local implementation
- low initial cost
- no additional provider

Disadvantages:
- ephemeral in many hosting environments
- inaccessible across multiple processes or deployments
- difficult backup and restore
- weak durability
- poor portability between hosts

Risks:
- files disappear on redeploy
- web and worker disagree about file location
- exports become unavailable

### Option D: Provider-Specific File Platform

Description:
Use a tightly integrated file-storage feature from the selected application platform, even if it is not S3-compatible.

Advantages:
- easy setup
- integrated authentication or deployment
- low operational effort

Disadvantages:
- stronger provider lock-in
- unclear portability
- migration may require custom tooling
- platform limitations may affect retention and signed access

Risks:
- difficult provider exit
- storage behavior changes with platform plan

### Option E: Do Not Retain Files

Description:
Generate exports in memory and require imported documents to remain only with their original provider.

Advantages:
- lowest storage and privacy footprint
- no file-provider dependency
- fewer lifecycle concerns

Disadvantages:
- large exports may be unreliable
- backup artifacts cannot be retained
- local file processing becomes limited
- future document workflows become harder

Risks:
- inability to recover or inspect important artifacts
- repeated provider fetch requirements

## Decision

North Vector will use managed S3-compatible object storage for file-like artifacts.

Object storage will be used for:
- generated user exports
- temporary user uploads
- backup artifacts created by North Vector
- migration and restore artifacts
- imported files that require a North Vector-controlled copy
- other large binary objects that do not belong in PostgreSQL

PostgreSQL will store the authoritative metadata for each object, including:
- storage object ID or key
- bucket or logical container
- owner
- purpose
- source reference
- sensitivity
- encryption status
- checksum
- content type
- size
- lifecycle status
- retention and expiration
- created timestamp
- deletion status
- audit reference

Buckets and objects must remain private by default.

## Rationale

Object storage is the standard and appropriate system for durable binary artifacts.

It keeps PostgreSQL focused on transactional canonical state while providing the durability, lifecycle policies, and delivery controls needed for exports, uploads, and backups.

Using an S3-compatible interface preserves provider choice and reduces migration difficulty. The application can use one storage adapter while retaining the ability to move between providers such as Amazon S3, Cloudflare R2, Supabase Storage, or another compatible service.

This decision adds one external dependency, but the dependency is bounded and appropriate to the data type. The project should not force file bytes into PostgreSQL or rely on ephemeral application disks merely to avoid another service.

## Consequences

### Positive Consequences

- durable file storage
- efficient upload and download behavior
- private access controls
- lifecycle and expiration rules
- lower PostgreSQL growth
- clear separation between metadata and bytes
- portability through S3-compatible APIs
- web and worker can access the same artifacts
- easier support for large exports and backup files

### Negative Consequences

- another provider and secret
- object deletion and metadata deletion must be coordinated
- signed access requires careful implementation
- storage cost and lifecycle require monitoring
- restore operations must include both PostgreSQL and object storage

### Operational Consequences

- object-storage health and usage should be monitored
- buckets must be separated by environment
- lifecycle rules should expire temporary exports and uploads
- backup artifacts require retention schedules
- orphan cleanup jobs are required
- provider configuration and credentials must be included in operational runbooks

### Security and Privacy Consequences

- all buckets should be private by default
- public object access should be disabled unless a specific future feature requires it
- signed URLs should be short-lived and scoped to one object
- sensitive exports require reauthentication before generation and access
- Restricted artifacts may require client-side or application-layer encryption in addition to provider encryption
- object keys should not expose sensitive titles or personal content
- provider logs and support tools should not receive unnecessary file contents

### Data and Migration Consequences

- database metadata must remain authoritative for lifecycle and ownership
- object storage must not become an untracked second data model
- migration between providers should preserve checksums and object IDs where practical
- deletion receipts should include object-storage cleanup status
- backup and restore processes must reconcile database references with stored objects

## Storage Object Model

Each stored artifact should have a metadata record containing:
- storage_object_id
- owner_id
- object_key
- logical_bucket
- purpose
- related_object_ids
- source_reference_id
- filename
- content_type
- size_bytes
- checksum
- sensitivity
- encryption_mode
- created_at
- expires_at
- deleted_at
- retention_policy
- storage_provider
- provider_version_or_etag
- audit_reference

## Bucket Strategy

Use separate buckets or strong logical separation for:
- staging
- production
- temporary uploads
- generated exports
- backups

Production and staging should never share writable storage paths.

## Object Key Strategy

Object keys should:
- use non-sensitive generated identifiers
- avoid user names, diagnoses, account names, or document titles
- include environment and purpose prefixes where useful
- remain stable enough for references
- avoid predictable public paths

Example:

```text
production/exports/{user_id}/{export_id}.zip
```

The real key design should minimize personal information.

## Upload Rules

Uploads should:
- enforce maximum size
- validate content type
- avoid trusting file extension alone
- scan or inspect risky file types where appropriate
- use temporary quarantine state before processing
- avoid direct execution
- create source and audit records
- expire when not promoted into a durable object

## Export Rules

Exports should:
- require current authorization
- require reauthentication for broad or sensitive scope
- be encrypted when they include sensitive data
- receive a short expiration
- use a short-lived signed download URL
- be deleted automatically after expiration
- create an audit event

## Signed URL Rules

Signed URLs should:
- expire quickly
- allow only the required operation
- reference one object
- be generated server-side
- not be stored in durable logs
- be invalidated by object deletion

## Backup Artifact Rules

Backup artifacts should:
- use separate retention from temporary exports
- be encrypted
- preserve checksum and schema metadata
- be inaccessible through ordinary user download paths
- use separate credentials or roles where practical
- be tested through restore exercises

## Database and Object Consistency

The system should treat object metadata and file bytes as one logical resource.

Creation flow:
1. create pending metadata record
2. upload bytes
3. verify checksum and provider state
4. mark metadata Available
5. audit completion

Deletion flow:
1. mark object blocked from access
2. delete provider object
3. verify absence where possible
4. mark metadata Deleted
5. issue deletion receipt

If one step fails, the system should preserve a recoverable state rather than claiming success falsely.

## Orphan Handling

The system should periodically detect:
- metadata records without provider objects
- provider objects without active metadata records
- expired temporary objects
- failed deletion attempts

Orphan cleanup should be conservative and audited.

## Failure Behavior

If object storage is unavailable:
- canonical application data should remain available
- new uploads and exports should fail clearly
- existing metadata should remain intact
- downloads should report temporary unavailability
- database transactions should not falsely mark files Available

If upload succeeds but metadata finalization fails:
- the object should remain quarantined
- a cleanup or reconciliation job should run

## Provider Abstraction

Object storage should use an adapter with operations such as:
- put object
- get object metadata
- create signed upload URL
- create signed download URL
- delete object
- verify object
- list objects by controlled prefix for reconciliation

Application code should not depend directly on one provider SDK outside the adapter.

## Testing Requirements

Required tests include:
- uploaded object remains private
- signed URL expires
- unauthorized user cannot obtain access
- server-only credentials do not enter client code
- failed upload does not create an Available metadata record
- failed metadata update leaves a recoverable quarantined object
- expired export is deleted
- database deletion triggers object deletion
- orphan reconciliation identifies mismatches
- checksum mismatch is detected
- staging cannot access production objects
- backup restore can access required artifacts
- object key does not include sensitive user content

## Validation Plan

The decision will be validated through:
- staging object-storage setup
- one temporary upload flow
- one generated JSON or Markdown export
- signed download test
- expiration and cleanup test
- backup artifact creation and restore test
- provider outage simulation
- orphan reconciliation test

The selected storage provider should be considered successful when files remain private, durable, portable, and correctly synchronized with database metadata.

## Rollback or Exit Strategy

North Vector should be able to migrate between S3-compatible providers.

Migration procedure:
1. inventory active objects and metadata
2. verify checksums
3. copy objects to the target provider
4. validate size, checksum, and encryption state
5. update storage-provider metadata or adapter configuration
6. preserve object IDs and lifecycle state
7. switch reads
8. switch writes
9. retain rollback window
10. delete source objects after verification and policy approval

If the provider is not fully compatible, a migration tool should operate through the storage adapter.

## Residual Risks

- public-bucket misconfiguration
- signed URL leakage
- provider outage
- orphaned objects
- incomplete deletion
- storage-cost growth
- malicious upload
- provider account compromise
- backup artifacts retained beyond policy
- provider-specific behavior despite S3 compatibility

## Assumptions

- Phase 1 requires only modest file volume
- a reputable managed provider supports private S3-compatible storage
- PostgreSQL remains authoritative for metadata
- web and worker processes can access the same storage adapter
- temporary exports and uploads can use bounded retention
- local application disk is not reliable production storage

## Review Triggers

Revisit this ADR when:
- file volume or size grows materially
- native provider file features become necessary
- stronger local-only encryption is required
- storage costs become disproportionate
- multi-region delivery becomes important
- a security incident involves file access or signed URLs
- object and database reconciliation becomes too complex
- a different content-addressed or local-first model becomes justified

## Review Date

Before the first production export feature and again after one month of production use.

## Outcome

### Expected Outcome

S3-compatible object storage should provide durable, private, and portable handling of exports, uploads, and backup artifacts without bloating PostgreSQL or relying on ephemeral application disks.

### Actual Outcome

Pending provider selection and implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Select the specific object-storage provider through security, cost, portability, and restore evaluation.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |