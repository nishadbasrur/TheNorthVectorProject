# ADR-0012: Use a Managed PostgreSQL Provider for Production

## Status

Superseded — see [ADR-0101: Use Firestore as the Primary Database](./ADR-0101-Use-Firestore-as-the-Primary-Database.md). Firestore is a fully managed service by definition, so the separate "which managed Postgres provider" decision this ADR addresses no longer applies. Preserved here unmodified for historical context per the ADR process — see `10-Implementation/Architecture_Decision_Record_Template.md`.

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Data Architecture Owner
- Operations Owner
- Security Owner
- Privacy Owner

## Related Documents

- `09-Data-and-Memory/Data_Migration_and_Backup_Model.md`
- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Deployment_and_Operations_Plan.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Release_Checklist.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0001-Use-PostgreSQL-as-Primary-Database.md`
- `10-Implementation/ADRs/ADR-0002-Use-a-Modular-Monolith-for-Phase-1.md`
- `10-Implementation/ADRs/ADR-0010-Use-pgvector-for-Initial-Semantic-Retrieval.md`

## Context

North Vector Phase 1 will use PostgreSQL as the primary canonical data store for:
- canonical objects
- relationships
- memories
- source references and evidence
- approvals and actions
- synchronization state
- jobs
- audit history
- deletion and migration metadata
- initial semantic retrieval through pgvector

The production database will contain sensitive personal data and will become one of the system's most important operational dependencies.

Operating PostgreSQL directly would require the project to own:
- installation and upgrades
- patching
- replication
- storage management
- encryption configuration
- backups
- point-in-time recovery
- monitoring
- high-availability decisions
- incident recovery
- network security

North Vector is initially built and operated by one developer. The product needs reliable database operations without turning database administration into a parallel project.

At the same time, a managed provider introduces dependency, cost, provider-specific configuration, and potential data-residency or portability concerns. The selected provider should therefore preserve standard PostgreSQL behavior and make export and migration practical.

## Decision Drivers

- reliability
- automated encrypted backups
- point-in-time recovery where practical
- pgvector support
- secure networking
- low operational burden
- monitoring
- managed upgrades and patching
- data portability
- staging and production separation
- acceptable cost for one user
- compatibility with TypeScript and common migration tools
- clear data location and privacy terms

## Options Considered

### Option A: Managed PostgreSQL Provider

Description:
Use a reputable managed PostgreSQL service for production and staging, with backups, monitoring, encryption, and secure connection management.

Advantages:
- reduced operational burden
- automated backups and recovery features
- managed patching and upgrades
- monitoring and alerting
- easier staging and production provisioning
- strong compatibility with standard PostgreSQL tooling
- many providers support pgvector
- simpler disaster recovery than self-hosting

Disadvantages:
- recurring cost
- provider dependency
- platform-specific limits and controls
- data is hosted by a third party
- migration between providers still requires planning

Risks:
- provider outage
- misconfigured public access
- insufficient backup retention
- proprietary extensions or features create lock-in
- sudden pricing or plan changes

### Option B: Self-Hosted PostgreSQL on a Virtual Machine

Description:
Run and maintain PostgreSQL directly on a cloud virtual machine.

Advantages:
- maximum configuration control
- broad provider choice
- potentially lower raw infrastructure cost
- fewer managed-service restrictions

Disadvantages:
- manual patching and upgrades
- backup and restore ownership
- replication and failover complexity
- greater security burden
- more monitoring and incident work
- increased risk for one operator

Risks:
- missed backups
- insecure network exposure
- storage exhaustion
- failed upgrade
- longer outage recovery

### Option C: Local Machine or Home Server as Production Database

Description:
Host the production database on a personal computer, Mac, NAS, or home server.

Advantages:
- direct control
- low cloud cost
- potentially strong local privacy
- easy physical access

Disadvantages:
- unreliable availability
- residential network dependency
- device loss or hardware failure
- difficult secure remote access
- backup and power concerns
- poor fit for mobile and remote use

Risks:
- permanent data loss
- internet or power outage
- accidental exposure
- inability to access North Vector when away

### Option D: Serverless or Proprietary Database That Is Not Fully PostgreSQL-Compatible

Description:
Use a database offering PostgreSQL-like APIs but with significant proprietary behavior or constraints.

Advantages:
- simple scaling
- low idle cost
- integrated platform experience
- potentially strong developer tooling

Disadvantages:
- compatibility gaps
- migration and extension limitations
- provider-specific behavior
- uncertain pgvector or transaction support

Risks:
- canonical architecture depends on nonstandard semantics
- migration becomes expensive
- backup and restore controls are limited

### Option E: Embedded Database for Production

Description:
Use SQLite or another embedded database in the production application environment.

Advantages:
- simple deployment
- low cost
- easy local backup
- no separate database service

Disadvantages:
- weaker fit for concurrent web and worker processes
- limited managed recovery and remote access
- more difficult scaling and availability
- migration to hosted PostgreSQL likely later

Risks:
- contention and reliability issues
- environment-specific data loss
- early replatforming

## Decision

North Vector will use a managed PostgreSQL provider for staging and production.

The provider must support:
- standard PostgreSQL connectivity
- encrypted connections
- encryption at rest
- automated backups
- restore or point-in-time recovery appropriate to the selected plan
- pgvector
- private or tightly controlled network access
- separate staging and production databases
- metrics and operational visibility
- database export using standard PostgreSQL tools

The selected provider should avoid proprietary database semantics that materially reduce portability.

Local development and automated tests may continue to use local or containerized PostgreSQL.

## Provider Selection Criteria

The selected provider should be evaluated on:
- PostgreSQL version support
- pgvector availability
- automated backup frequency
- backup retention
- point-in-time recovery
- restoration workflow
- encryption
- network security
- connection pooling
- monitoring
- region and data location
- privacy and security documentation
- cost
- storage and connection limits
- support quality
- export and migration process
- incident history and status transparency

Possible providers may include:
- Supabase
- Neon
- Amazon RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- Render
- Railway
- Fly.io managed PostgreSQL or another reputable service

The specific provider should be selected through a separate implementation decision after prototype and pricing review.

## Rationale

A managed PostgreSQL provider offers the best balance of reliability, security, recoverability, and operational simplicity for Phase 1.

North Vector's database is too important to run casually, but the project is too small to justify building a full database-operations capability from scratch.

Managed hosting allows the project to focus on application-specific controls such as:
- deletion propagation
- audit integrity
- memory lifecycle
- approval enforcement
- synchronization conflict handling

while relying on a specialized provider for routine infrastructure work such as patching, storage, backups, and platform monitoring.

The decision still requires North Vector to own its data model, migration scripts, backup validation, restoration testing, and provider-exit plan. Managed does not mean responsibility disappears.

## Consequences

### Positive Consequences

- lower database-administration burden
- managed backups and monitoring
- easier staging and production separation
- improved recovery capabilities
- managed security patching
- simpler production deployment
- standard PostgreSQL tooling remains available
- one developer can operate the system more realistically

### Negative Consequences

- recurring provider cost
- dependence on provider availability
- plan limits may constrain connections, storage, or recovery
- provider configuration requires careful review
- data is entrusted to an external processor
- migrations between providers still require deliberate work

### Operational Consequences

- provider health and database metrics must be monitored
- backup status must be checked independently
- restore tests remain North Vector's responsibility
- provider credentials and connection strings require secure storage
- maintenance and version upgrades must be tracked
- staging and production should use separate projects or instances
- connection pooling may be required for web and worker workloads

### Security and Privacy Consequences

- database access should not be publicly open without strict controls
- TLS must be required
- least-privilege database roles should be used
- provider staff and subprocessors may have infrastructure access under provider policy
- data location and processing terms should be reviewed
- Restricted fields may still require application-level encryption
- logs and support bundles should avoid unnecessary personal data

### Data and Migration Consequences

- standard PostgreSQL migrations remain authoritative
- provider-specific extensions should be minimized
- data exports should use portable formats and native PostgreSQL tools
- backup and restore processes must preserve pgvector and required extensions
- provider migration should preserve canonical IDs, audit history, deletion state, and source references

## Environment Model

Use separate database instances or isolated projects for:
- staging
- production

Local and test environments should not connect to production by default.

Production credentials should not be reused in staging or development.

## Access Model

Database access should use separate roles where practical:
- migration role
- application web role
- worker role
- read-only operational role
- backup or export role

Roles should receive only required permissions.

Direct human production access should be rare, time-bounded, and audited where possible.

## Network Security

Preferred controls include:
- private networking when supported
- IP restrictions where practical
- TLS verification
- connection pooling through an approved service
- no credentials in client code
- no default public superuser access

## Backup Requirements

The managed provider's backups should be supplemented by North Vector's operational policy.

Requirements include:
- automated daily or more frequent backups
- pre-migration checkpoint for high-risk changes
- documented retention
- encryption
- checksum or provider verification
- monthly selective restore
- quarterly isolated full restore
- deletion and revocation replay after restore

Provider-native backups should not be the only portable copy of critical data.

## Portable Exports

North Vector should periodically create a portable encrypted export containing:
- canonical objects
- relationships
- source references
- memories
- audit metadata
- permissions and action state
- schema version
- migration metadata

The export should not depend on one provider's proprietary snapshot format.

## Point-in-Time Recovery

Point-in-time recovery is preferred when financially and technically practical.

It is especially valuable for:
- accidental deletion
- failed migration
- malicious modification
- database corruption

If the selected plan lacks point-in-time recovery, the residual risk should be documented and backup frequency increased.

## Connection Management

The application should:
- use connection pooling appropriate to the hosting environment
- set bounded timeouts
- retry only safe connection failures
- expose database health
- avoid unbounded connection creation
- distinguish transient provider failure from application errors

## Migration Operations

Production migrations should:
- be tested in staging
- use a verified backup checkpoint for high-risk changes
- avoid destructive changes in one step where possible
- expose progress
- preserve rollback or roll-forward options
- run with the appropriate restricted role

## Provider Outage Behavior

If the database provider is unavailable:
- North Vector should enter a clearly unavailable or limited mode
- external writes should stop
- queued actions should not execute later without revalidation
- status should explain that canonical data is temporarily inaccessible
- no insecure local fallback should silently diverge from production state

## Testing Requirements

Required tests and exercises include:
- staging and production isolation
- TLS connection enforcement
- application role cannot perform prohibited administrative actions
- backup creation verification
- selective restore
- full isolated restore
- pgvector extension restoration
- connection-pool exhaustion behavior
- provider outage handling
- migration against a staging copy
- portable export and reimport
- deleted and revoked data remains inactive after restore

## Validation Plan

The decision will be validated through:
- provisioning a staging database
- enabling required extensions
- running all migrations
- deploying web and worker processes
- backup verification
- isolated restore exercise
- provider-outage simulation
- cost review after one month
- one week of production MVP usage

The selected provider should be considered successful if it reduces operational burden without weakening portability, restore confidence, security, or privacy.

## Rollback or Exit Strategy

North Vector should remain able to migrate to another PostgreSQL provider.

Exit procedure:
1. create a verified portable backup or logical dump
2. provision target PostgreSQL with required extensions
3. apply schema and configuration
4. restore data into isolation
5. validate counts, relationships, permissions, embeddings, and audit history
6. pause writes or use a controlled cutover window
7. replay final changes where necessary
8. switch application configuration
9. verify web, worker, jobs, and integrations
10. revoke old credentials after rollback window

A provider migration should use the Data Migration and Backup Model and may require a new ADR if the target changes database semantics.

## Residual Risks

- provider outage
- provider account compromise
- insufficient backup retention on a low-cost plan
- accidental public exposure through configuration
- pricing changes
- provider-specific connection limits
- restore process differs from expectations
- data residency or subprocessor changes
- one database remains a central failure domain

## Assumptions

- a reputable provider supports pgvector and standard PostgreSQL
- Phase 1 load fits ordinary managed plans
- one developer benefits from managed operations
- monthly cost remains acceptable
- provider exports and logical dumps are available
- staging and production can be isolated
- North Vector will test restores rather than trusting backup indicators alone

## Review Triggers

Revisit this ADR when:
- provider cost becomes disproportionate
- backups or restore controls are insufficient
- pgvector or required extensions are unsupported
- uptime materially affects product trust
- regulatory or privacy requirements change
- multi-user scale requires stronger availability
- provider lock-in becomes significant
- self-hosting or another provider materially lowers total operational risk
- a provider security incident affects North Vector

## Review Date

Before production MVP launch and again after one month of production use.

## Outcome

### Expected Outcome

A managed PostgreSQL provider should give North Vector reliable production storage, backups, monitoring, and recovery without requiring one developer to operate the entire database infrastructure directly.

### Actual Outcome

Pending provider selection and implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Select the specific managed PostgreSQL provider through prototype, security, recovery, and pricing evaluation.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |