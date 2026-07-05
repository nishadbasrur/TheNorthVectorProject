# ADR-0001: Use PostgreSQL as the Primary Database

## Status

Superseded — see [ADR-0101: Use Firestore as the Primary Database](./ADR-0101-Use-Firestore-as-the-Primary-Database.md). PostgreSQL and Drizzle were deleted from the codebase entirely (2026-07-03); Firestore is now the canonical data store. Preserved here unmodified for historical context per the ADR process — see `10-Implementation/Architecture_Decision_Record_Template.md`.

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Data Architecture Owner
- Security Owner

## Related Documents

- `09-Data-and-Memory/Data_Architecture.md`
- `09-Data-and-Memory/Canonical_Object_Model.md`
- `09-Data-and-Memory/Relationship_Graph_Model.md`
- `09-Data-and-Memory/Data_Migration_and_Backup_Model.md`
- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Implementation_Decision_Log.md`
- `10-Implementation/Phase_1_Backlog.md`

## Context

North Vector requires a primary data store for a single-user Phase 1 product that must support:
- canonical objects
- typed relationships
- memory lifecycle state
- source references and provenance
- audit records
- action and approval state
- synchronization metadata
- transactions
- versioning
- deletion propagation
- full-text retrieval
- semantic retrieval
- backup and restore

The Phase 1 implementation should remain operationally simple enough for one developer to understand, deploy, test, and recover.

The database must support strong consistency for consequential workflows such as:
- creating an object and its audit event atomically
- binding approval to an action payload
- preserving provider versions during synchronization
- deleting memory across active retrieval paths
- restoring canonical state without resurrecting revoked or deleted records

North Vector may eventually need specialized graph, vector, analytics, or event systems, but Phase 1 has not yet produced evidence that separate databases are necessary.

## Decision Drivers

- transactional integrity
- relational constraints
- mature migration tooling
- reliable backup and restore
- strong TypeScript ecosystem
- full-text search
- semantic retrieval support
- typed relationship storage
- low operational overhead
- data portability
- broad managed-hosting support
- security and access controls
- ability to remain a modular monolith

## Options Considered

### Option A: PostgreSQL as the Primary Store

Description:
Use PostgreSQL for canonical objects, relationships, source references, memory, audit records, permissions, actions, and synchronization metadata. Use extensions such as pgvector and pg_trgm where useful.

Advantages:
- strong transactions and constraints
- mature SQL and migration ecosystem
- reliable managed hosting and backups
- supports relational, JSON, full-text, and vector workloads
- reduces the number of independent stores
- portable across many providers
- suitable for a modular monolith
- supports point-in-time recovery on many managed platforms

Disadvantages:
- graph traversal is less natural than in a dedicated graph database
- vector search may eventually require specialized infrastructure
- a highly generic schema can become difficult to manage if poorly designed
- scaling unrelated workloads in one database may later require separation

Risks:
- overloading PostgreSQL with every future workload
- allowing JSON fields to weaken schema discipline
- assuming pgvector will remain sufficient without measurement

### Option B: PostgreSQL Plus Dedicated Graph and Vector Databases

Description:
Use PostgreSQL for canonical data, a graph database for relationships, and a vector database for semantic retrieval.

Advantages:
- specialized query capabilities
- potentially stronger deep-graph traversal
- potentially stronger high-scale vector retrieval
- independent scaling of workloads

Disadvantages:
- multiple consistency boundaries
- more credentials, backups, and operational systems
- harder deletion propagation
- more complex incident recovery
- more expensive and slower for one developer
- requires synchronization between stores before product value is proven

Risks:
- data drift across systems
- incomplete deletion
- increased security surface
- infrastructure work replacing product implementation

### Option C: Document Database as the Primary Store

Description:
Use a document-oriented database for flexible canonical object storage.

Advantages:
- rapid initial schema iteration
- natural storage for heterogeneous objects
- fewer migrations for additive fields

Disadvantages:
- weaker relational integrity
- relationship and transaction behavior may be less straightforward
- audit, versioning, and conflict queries become more complex
- schema flexibility may conceal inconsistent object meaning

Risks:
- canonical model degradation into unvalidated documents
- difficult relationship and deletion guarantees

### Option D: Local Embedded Database Only

Description:
Use SQLite or another embedded database as the sole Phase 1 database.

Advantages:
- minimal infrastructure
- strong local development experience
- inexpensive
- easy local backups

Disadvantages:
- weaker fit for hosted multi-process web and worker architecture
- fewer managed operational features
- more complexity when moving to cloud-hosted synchronization and remote access
- potential migration work before the MVP matures

Risks:
- local-first architecture may diverge from the intended connected product
- worker concurrency and remote availability may become awkward

## Decision

North Vector will use PostgreSQL as the primary database for Phase 1.

PostgreSQL will store:
- canonical objects
- object versions
- typed relationships
- source references
- evidence
- memory lifecycle records
- permissions
- sessions and devices where appropriate
- proposed actions and approvals
- synchronization state
- automation definitions and runs
- notifications
- audit records
- incidents
- migration and deletion metadata

Phase 1 will use relational tables for the relationship graph and pgvector for initial semantic retrieval.

A dedicated graph database, vector database, or separate event store will not be introduced unless measured product requirements justify the additional complexity.

## Rationale

PostgreSQL provides the strongest balance of integrity, capability, portability, and operational simplicity for North Vector's current stage.

The product's most important early risks are not massive scale or deep graph analytics. They are:
- false or corrupted memory
- weak approval enforcement
- silent synchronization overwrite
- incomplete deletion
- poor auditability
- failure to move from architecture into implementation

Using one capable transactional database makes those risks easier to control.

PostgreSQL allows North Vector to enforce relationships, versions, ownership, status, sensitivity, and audit linkage within a single consistency boundary. It also supports the initial search and vector needs without requiring synchronization across several storage systems.

The choice accepts that specialized databases may become useful later. That future possibility does not justify paying their complexity cost before the MVP demonstrates a real limitation.

## Consequences

### Positive Consequences

- one primary transactional source of truth
- simpler architecture and deployment
- easier backup and restore
- easier deletion propagation
- lower security and credential surface
- strong schema and relationship validation
- mature migration tooling
- provider portability
- semantic retrieval available through pgvector
- reduced risk of cross-store inconsistency

### Negative Consequences

- deep graph queries may become cumbersome
- advanced vector workloads may eventually outgrow pgvector
- database design must avoid a single unstructured generic table
- background jobs and application queries may compete for shared resources
- future extraction of specialized workloads may require migration

### Operational Consequences

- production requires managed PostgreSQL or equivalent secure hosting
- database migrations become part of every relevant release process
- backup, point-in-time recovery, and restore testing become mandatory
- query and connection monitoring are required
- the worker and web application share one database dependency

### Security and Privacy Consequences

- fewer independent stores reduce the attack and credential surface
- authorization must still be enforced in application logic and queries
- sensitive fields may require application-layer or managed encryption
- database access should remain private and least-privileged
- semantic indexes must include sensitivity and deletion controls

### Data and Migration Consequences

- canonical IDs should remain stable across schema changes
- all schema changes require versioned migrations
- relationship integrity should use foreign keys or validated references
- object-family tables may be introduced as generic storage becomes insufficient
- migration plans must preserve provenance, retention, and deletion semantics

## Implementation Notes

Phase 1 should implement:
- PostgreSQL in local, test, staging, and production environments
- a versioned migration framework
- a canonical base object table or equivalent shared schema
- specialized object-family tables where validation requires them
- relationship tables with typed edge registry
- source-reference and evidence tables
- append-oriented audit tables
- pgvector extension for semantic retrieval
- pg_trgm or built-in full-text search where useful
- stable UUID-based identifiers
- optimistic concurrency through object versions
- soft deletion and deletion tombstones where appropriate
- transactional writes for object mutation and audit events

The selected ORM or query layer should preserve SQL visibility and migration reliability. The ORM decision should be recorded separately.

## Validation Plan

The decision will be validated through:
- local development setup
- migration tests
- canonical object CRUD tests
- transactional audit tests
- relationship traversal tests
- semantic retrieval tests
- deletion propagation tests
- backup creation and isolated restore
- chemistry-exam end-to-end workflow
- performance measurement with realistic Phase 1 seed data

The architecture should be reconsidered only after measured evidence shows PostgreSQL is insufficient.

## Rollback or Exit Strategy

PostgreSQL is portable across many managed and self-hosted providers.

Exit options include:
- export canonical data to JSON, CSV, or database-native formats
- move to another PostgreSQL provider using backup and restore
- replicate or migrate selected workloads to a dedicated vector or graph system
- retain PostgreSQL as the canonical source while adding specialized read models

If pgvector becomes insufficient, semantic retrieval may move to a dedicated vector store while canonical data remains in PostgreSQL.

If graph queries become a proven bottleneck, graph edges may be replicated into a dedicated graph system while PostgreSQL remains authoritative.

No specialized store should become authoritative without a new ADR.

## Residual Risks

- generic schema design may become overly flexible
- vector index performance may degrade as data grows
- database coupling may make future service separation harder
- a single database remains a central operational dependency
- migration quality becomes critical to preserving semantic meaning

## Assumptions

- Phase 1 remains single-user
- object count remains within ordinary PostgreSQL capability
- relationship traversal remains shallow
- semantic retrieval volume remains moderate
- one developer or small team operates the system
- managed PostgreSQL backup and monitoring are available
- high availability beyond ordinary personal-system needs is not yet required

## Review Triggers

Revisit this ADR when:
- graph traversal performance becomes a measured bottleneck
- pgvector cannot meet retrieval quality or latency requirements
- the database exceeds operational cost or capacity targets
- independent workload scaling becomes necessary
- multi-user tenancy changes the isolation model
- a security incident exposes unacceptable concentration risk
- provider portability becomes constrained
- canonical object count reaches 100,000 and performance review shows material degradation

## Review Date

After one month of MVP production use or when the first review trigger occurs.

## Outcome

### Expected Outcome

PostgreSQL should allow North Vector to implement the MVP with one understandable, transactional, portable data platform while avoiding early distributed-system complexity.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep unless measured evidence supports a superseding ADR.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |