# ADR-0018: Use Drizzle ORM for Phase 1 Database Access

## Status

Superseded — see [ADR-0101: Use Firestore as the Primary Database](./ADR-0101-Use-Firestore-as-the-Primary-Database.md). With PostgreSQL removed, Drizzle has no database to access; the codebase now uses direct Firestore SDK calls behind typed store modules, with no ORM layer. Preserved here unmodified for historical context per the ADR process — see `10-Implementation/Architecture_Decision_Record_Template.md`.

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Technical Lead
- Data Architecture Owner
- Security Owner
- Operations Owner

## Related Documents

- `09-Data-and-Memory/Data_Architecture.md`
- `09-Data-and-Memory/Canonical_Object_Model.md`
- `09-Data-and-Memory/Data_Migration_and_Backup_Model.md`
- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Development_Workflow_and_Standards.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0001-Use-PostgreSQL-as-Primary-Database.md`
- `10-Implementation/ADRs/ADR-0006-Use-TypeScript-Across-the-Phase-1-Application.md`
- `10-Implementation/ADRs/ADR-0015-Use-Explicit-Runtime-Schema-Validation-at-All-External-Boundaries.md`
- `10-Implementation/ADRs/ADR-0016-Use-Zod-as-the-Phase-1-Runtime-Schema-Library.md`

## Context

North Vector Phase 1 will use PostgreSQL as the primary database and TypeScript across the application.

The project needs a database access and migration layer for:
- canonical objects
- typed relationships
- memories
- source references and evidence
- approvals and actions
- jobs
- synchronization metadata
- audit records
- deletion and retention state
- pgvector-based semantic retrieval

The selected approach should support:
- strongly typed queries
- explicit SQL visibility
- reliable migrations
- transactions
- PostgreSQL-specific features
- pgvector and custom indexes
- one web application and one worker process
- test database isolation
- maintainability by one developer

The database layer must not become the domain model itself. North Vector still needs runtime validation, domain services, authorization, lifecycle rules, and repository boundaries above the query layer.

The project considered Prisma, Drizzle, and direct typed SQL. The implementation decision should prioritize clarity and control rather than maximum abstraction.

## Decision Drivers

- strong TypeScript inference
- transparent SQL behavior
- PostgreSQL feature access
- migration control
- pgvector compatibility
- transaction support
- low runtime overhead
- compatibility with Next.js and Node.js workers
- testability
- portability
- one-developer maintainability
- minimal hidden behavior

## Options Considered

### Option A: Drizzle ORM

Description:
Use Drizzle ORM and Drizzle Kit as the Phase 1 query and migration layer for PostgreSQL.

Advantages:
- strong TypeScript inference
- schema defined in TypeScript
- SQL-oriented API
- relatively thin abstraction
- good PostgreSQL support
- direct access to transactions, indexes, constraints, and custom SQL
- suitable for web and worker processes
- migrations remain inspectable
- lower runtime overhead than heavier ORM patterns
- easier integration with custom pgvector operations

Disadvantages:
- smaller ecosystem than some older ORMs
- migration and relation APIs may require more SQL knowledge
- some advanced operations still need raw SQL
- schema definitions can become verbose
- generated migration behavior must be reviewed carefully

Risks:
- developers may assume generated migrations are always safe
- direct SQL escape hatches may become scattered
- domain logic may leak into query code
- library changes may affect migration workflows

### Option B: Prisma

Description:
Use Prisma Client and Prisma Migrate for database schema, queries, and migrations.

Advantages:
- polished developer experience
- strong generated client
- broad ecosystem and documentation
- easy CRUD and relation queries
- strong editor support
- familiar migration workflow

Disadvantages:
- additional generated-client layer
- some PostgreSQL-specific features require workarounds or raw SQL
- pgvector and advanced index behavior may be less natural
- query behavior can be less transparent
- schema language differs from TypeScript domain definitions

Risks:
- ORM becomes the de facto domain model
- advanced synchronization and migration logic becomes awkward
- raw SQL and generated abstractions coexist inconsistently

### Option C: Direct SQL with a Typed Query Builder

Description:
Use a lighter library such as Kysely or a custom typed SQL layer and write migrations manually.

Advantages:
- maximum SQL visibility
- strong PostgreSQL control
- minimal abstraction
- easier advanced queries and provider-specific behavior
- clear performance characteristics

Disadvantages:
- more schema and migration plumbing
- more manual type maintenance
- fewer integrated migration conventions
- potentially slower initial development

Risks:
- inconsistent query and migration practices
- duplicated types
- one developer spends too much time building database infrastructure

### Option D: Raw SQL Only

Description:
Use a PostgreSQL driver directly and write all queries, mapping, and migrations by hand.

Advantages:
- complete control
- no ORM dependency
- fully transparent SQL
- easiest access to every PostgreSQL feature

Disadvantages:
- high boilerplate
- manual result typing
- more error-prone refactoring
- slower CRUD development
- more custom migration and mapping infrastructure

Risks:
- repetitive code
- type drift
- unsafe dynamic SQL
- implementation delay

### Option E: ORM Selected Per Module

Description:
Allow modules to choose Prisma, Drizzle, or raw SQL independently.

Advantages:
- local flexibility
- each module can use its preferred approach

Disadvantages:
- multiple schema and migration systems
- inconsistent transactions
- difficult debugging
- duplicated dependencies
- unclear database ownership

Risks:
- migration conflicts
- transaction boundaries become unreliable
- one canonical database develops several incompatible access conventions

## Decision

North Vector will use Drizzle ORM as the Phase 1 database access and migration layer.

Drizzle will be used for:
- PostgreSQL schema definitions
- typed query construction
- transactions
- migrations
- constraints and indexes
- ordinary repository operations

Raw SQL will remain allowed when required for:
- pgvector operations
- advanced PostgreSQL features
- complex reporting or migration queries
- performance-critical operations

Raw SQL must remain localized, parameterized, reviewed, and covered by tests.

Drizzle types will not replace Zod runtime schemas or domain models.

## Rationale

Drizzle provides the strongest balance between TypeScript ergonomics and SQL transparency for North Vector's current requirements.

The project needs more than straightforward CRUD. It requires:
- versioned canonical objects
- typed edge tables
- transactional audit writes
- careful migration control
- PostgreSQL-specific constraints
- pgvector
- deletion and synchronization queries

A thin SQL-oriented layer is preferable to a heavier abstraction that may obscure the exact behavior of these operations.

Drizzle allows the project to work close to PostgreSQL while still receiving useful type inference, schema co-location, and migration tooling.

The decision also aligns with the project's one-developer constraint. Raw SQL everywhere would provide maximum control but would increase implementation time and type-maintenance burden. Drizzle offers enough structure without making the ORM the center of the architecture.

## Consequences

### Positive Consequences

- strongly typed database access
- visible and inspectable SQL-oriented behavior
- good fit with PostgreSQL-specific features
- easier pgvector integration
- lower abstraction overhead
- shared TypeScript toolchain
- explicit transactions
- portable migration files
- straightforward use in web and worker processes

### Negative Consequences

- the team must understand SQL and PostgreSQL well
- some advanced queries require raw SQL
- migration generation still requires human review
- fewer high-level conveniences than heavier ORMs
- schema and domain types must remain intentionally separate

### Operational Consequences

- Drizzle migration tooling becomes part of CI and deployment
- production migrations must be reviewed before execution
- schema drift checks should run in CI or release validation
- web and worker must use compatible schema versions
- connection and transaction behavior must be configured for the hosting environment

### Security and Privacy Consequences

- all dynamic values must remain parameterized
- repository and service layers must enforce authorization
- direct query access should remain server-side
- raw SQL must receive focused review
- Drizzle-generated types do not validate external input
- sensitive columns and projections should be selected deliberately

### Data and Migration Consequences

- the Drizzle schema becomes the authoritative application database schema definition
- migration files remain version controlled
- generated migrations must be inspected for destructive behavior
- custom SQL migrations may be needed for pgvector, backfills, and complex transformations
- domain and export schemas remain separate from database representations

## Schema Ownership

Database schema definitions should live in the database package.

Suggested structure:

```text
packages/database/
  schema/
  migrations/
  repositories/
  client/
  transactions/
  queries/
```

Domain modules may define application-facing interfaces, but should not directly own migration files.

## Repository Boundary

Domain and application services should normally use repositories or purpose-built query services.

Example:

```text
MemoryService
  -> MemoryRepository
  -> Drizzle/PostgreSQL
```

UI components, model handlers, and provider adapters should not import Drizzle tables directly.

## Transaction Rules

Transactions should be used when writes must remain consistent.

Examples:
- create object, relationships, and audit event
- approve action and update action state
- mark memory deleted and create deletion work
- claim and update a background job

Transaction boundaries should be owned by application services, not hidden unpredictably inside low-level helpers.

## Migration Rules

Every migration should be:
- version controlled
- reviewed
- tested in an isolated database
- applied in staging before production
- paired with validation
- accompanied by rollback or roll-forward guidance

Generated migration output should never be executed in production without review.

## Schema Change Strategy

Prefer backward-compatible sequences:
1. add new schema
2. deploy compatible code
3. backfill
4. validate
5. switch reads and writes
6. remove old schema later

Avoid destructive one-step changes when a staged migration is possible.

## Runtime Validation Boundary

Drizzle's inferred types apply after the application has selected or written known database shapes.

External input must still pass through Zod or another approved runtime schema before reaching repositories.

Database JSON fields should be validated when read if they contain versioned or flexible content.

## Raw SQL Policy

Raw SQL is acceptable when:
- Drizzle lacks the required PostgreSQL feature
- the query is significantly clearer in SQL
- a migration or backfill requires precise control
- performance requires a specialized query

Raw SQL should:
- use parameter binding
- be located in the database package
- include tests
- include comments when behavior is non-obvious
- avoid leaking provider-specific SQL into domain modules

## pgvector Support

The database package should provide explicit helpers for:
- vector columns
- embedding inserts and updates
- similarity queries
- current-version filtering
- sensitivity and deletion filters
- index creation and maintenance

The retrieval layer should not depend on generic ORM relation features alone for semantic queries.

## Connection Management

The implementation should support:
- local PostgreSQL
- isolated test database
- staging managed PostgreSQL
- production managed PostgreSQL
- connection pooling
- bounded timeouts
- web and worker usage

The database client should be created in a deployment-safe way that avoids uncontrolled connection growth.

## Query Standards

Queries should:
- select only needed fields
- use explicit ordering
- define pagination
- enforce ownership and lifecycle filters
- avoid N+1 patterns
- use indexes based on measured needs
- expose version conflicts explicitly

## Error Mapping

Database errors should map into controlled application errors such as:
- Not Found
- Conflict
- Constraint Violation
- Duplicate
- Retryable Database Failure
- Migration Required
- Internal Database Error

Raw database details should not be exposed to users.

## Testing Requirements

Required tests include:
- schema migrations apply from an empty database
- migrations apply over representative prior data
- rollback or roll-forward procedures work where defined
- transactions roll back partial writes
- ownership and deletion filters are enforced
- optimistic version conflicts are detected
- raw SQL remains parameterized
- pgvector queries exclude deleted and sensitive records
- web and worker share compatible schema behavior
- repository tests use an isolated PostgreSQL instance
- generated migration is reviewed for destructive changes

## Validation Plan

The decision will be validated through:
- repository initialization
- canonical object schema
- relationship table
- audit store
- job queue
- pgvector setup
- transactional service tests
- migration dry runs
- chemistry-exam end-to-end workflow
- staging deployment

The choice should be considered successful if database code remains explicit, typed, and understandable without blocking access to PostgreSQL features.

## Rollback or Exit Strategy

If Drizzle becomes inadequate, North Vector may migrate to direct typed SQL, Kysely, Prisma, or another maintained query layer.

Migration should:
1. freeze schema changes
2. preserve PostgreSQL migrations as the source of database history
3. introduce the new query layer behind repository interfaces
4. migrate repositories incrementally
5. run contract and integration tests
6. remove Drizzle only after all production paths are migrated
7. use a superseding ADR

The canonical database should not need to change merely because the query library changes.

## Residual Risks

- Drizzle API or migration behavior changes
- schema definitions become tightly coupled to database representations
- raw SQL fragments proliferate
- developers bypass repositories
- generated migrations contain unsafe operations
- PostgreSQL-specific design reduces future database portability
- library ecosystem is smaller than Prisma's

## Assumptions

- PostgreSQL remains the primary database
- TypeScript remains the primary application language
- the team is willing to understand SQL
- pgvector is required in Phase 1
- one developer benefits from typed queries without a large abstraction layer
- repository boundaries are enforced through review and tests

## Review Triggers

Revisit this ADR when:
- Drizzle migration behavior becomes unreliable
- pgvector support requires excessive workarounds
- query complexity becomes difficult to maintain
- another query layer materially improves safety or delivery speed
- a major security or data incident involves database access
- the system adds a second primary database
- multiple languages require a language-neutral data-access strategy

## Review Date

After the first four implementation sprints or when the first review trigger occurs.

## Outcome

### Expected Outcome

Drizzle should provide typed, transparent, PostgreSQL-friendly access for the Phase 1 application without hiding the database behavior North Vector needs to secure, migrate, and operate reliably.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Use Drizzle during repository initialization and reevaluate query ergonomics, migration safety, and pgvector support after the first four sprints.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |