# Technical Stack and Environment v1.0

## Purpose

This document defines the recommended technical stack, environment structure, development workflow, deployment model, and infrastructure boundaries for North Vector.

The Technical Stack and Environment exists to turn the architecture into a practical engineering system that can be built, tested, secured, and evolved without unnecessary complexity.

Its purpose is not to select trendy tools.

Its purpose is to choose boring, understandable, and replaceable components that support the actual product requirements.

## Core Principle

The stack should optimize for clarity, control, and maintainability before scale.

North Vector should begin with the fewest technologies necessary to build a secure single-user product, then add infrastructure only when real constraints justify it.

## Primary Objectives

The stack should help answer:
- Which language and frameworks should be used?
- How should the application be structured?
- Where should data live?
- How should environments be separated?
- How should secrets be managed?
- How should the system be tested and deployed?
- Which components should remain local versus cloud-hosted?
- How can the stack evolve without locking the project into one provider?

## Technical Priorities

The implementation should prioritize:
- type safety
- rapid iteration
- strong ecosystem support
- secure defaults
- clear deployment paths
- excellent local development
- reliable database migrations
- provider abstraction
- observability
- low operational overhead

## Recommended Phase 1 Stack

### Primary Language

TypeScript.

Reasons:
- one language across frontend and backend
- strong typing
- mature web ecosystem
- good support for API integrations
- broad developer tooling
- straightforward deployment

Python may be added later for specialized data science, local models, or machine-learning workloads, but it should not be required for the first product slice.

## Frontend

### Framework

Next.js with React and TypeScript.

Recommended use:
- App Router
- Server Components where useful
- Client Components for interactive views
- Route Handlers or a separated backend API layer

### UI Approach

Use:
- accessible component primitives
- CSS variables and design tokens
- responsive layouts
- keyboard-first interaction
- minimal animation

Possible supporting libraries:
- Radix UI or equivalent accessible primitives
- Tailwind CSS or modular CSS
- React Hook Form
- Zod for input validation

The UI library should remain replaceable and should not define the product architecture.

## Backend

### Application Layer

Recommended Phase 1 approach:
- Next.js server runtime for simple APIs and server actions
- separate service modules for domain logic
- background worker process for synchronization and automation

As complexity grows, the backend may become a dedicated Node.js service using a framework such as Fastify or NestJS.

The initial system should not be split into microservices.

## Backend Structure

Suggested logical modules:
- identity
- sessions
- canonical objects
- relationships
- memory
- retrieval
- planning
- reviews
- integrations
- approvals
- execution
- automation
- notifications
- audit
- export and deletion

Each module should own business logic while sharing common data and authorization utilities.

## Database

### Primary Database

Firestore (Cloud Firestore, native mode). See `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`.

Reasons:
- already part of the Firebase project backing Auth and Cloud Functions — one platform instead of a separate database provider
- schemaless documents fit the shallow, evolving object shapes in use so far
- Firestore Security Rules provide a declarative, server-enforced authorization boundary
- Admin SDK available for trusted server code that must bypass client-facing rules
- zero infrastructure to provision or patch

Tradeoffs accepted: no relational joins or multi-document transactions by default, no server-enforced schema, weaker query flexibility than SQL. See the ADR for the full accounting.

### Semantic Retrieval Extensions

pgvector and pg_trgm assumed a PostgreSQL primary database and are no longer applicable. Firestore has no built-in equivalent. Semantic/vector retrieval on Firestore is undecided — see `10-Implementation/ADRs/ADR-0010-Use-pgvector-for-Initial-Semantic-Retrieval.md` (status: Deprecated, no replacement chosen yet).

## Database Access

Firestore is accessed directly via its own SDKs — no ORM or query-builder layer.

- client-reachable code (Next.js pages, simple API routes) uses the Firebase client SDK through typed store modules, one per collection (see `lib/task-store.ts` and siblings for the pattern)
- trusted server-only code (API routes handling secrets, Cloud Functions) uses the Firebase Admin SDK, which bypasses Firestore Security Rules

Prisma, Drizzle, and typed-SQL query layers assumed a relational database and do not apply. See `10-Implementation/ADRs/ADR-0018-Use-Drizzle-ORM-for-Phase-1-Database-Access.md` (status: Superseded).

The project should not treat the Firestore SDK's inferred document shapes as the domain model itself — runtime validation still belongs at application boundaries.

## Canonical Data Storage

Firestore collections in actual use, one per domain object type rather than a normalized relational schema:
- tasks
- goals
- projects
- decisions
- plaid_items (encrypted bank-connection metadata)
- daily-runs (scheduled risk-scan output)

The originally planned relational structure (canonical_objects, object_versions, object_relationships, source_references, evidence_records, etc.) assumed PostgreSQL and was never implemented against real data. Collections are added per domain object as needed rather than pre-modeled as a generic canonical base table.

## Semantic Retrieval

Undecided. pgvector required PostgreSQL, which no longer exists. No replacement approach has been chosen — see `10-Implementation/ADRs/ADR-0010-Use-pgvector-for-Initial-Semantic-Retrieval.md` (status: Deprecated). Revisit when a concrete semantic-retrieval requirement emerges.

## Relationship Graph

Phase 1 should use relational edge tables.

A dedicated graph database may be considered only when:
- traversal depth grows
- path queries become difficult
- performance is insufficient
- graph analytics become central

## File and Object Storage

Use object storage for:
- generated exports
- temporary uploads
- backup artifacts
- imported files when local copies are needed

Possible providers:
- Amazon S3
- Cloudflare R2
- Supabase Storage
- another S3-compatible service

File references should remain in Firestore.

## Cache and Queue

### Phase 1

Avoid Redis unless necessary.

Use:
- database-backed jobs
- in-process caching
- scheduled worker polling

### Add Redis When Needed

Redis may be introduced for:
- distributed locks
- fast ephemeral session state
- job queues
- rate limiting
- pub/sub

The system should not introduce Redis solely because it is common in architecture diagrams.

## Background Jobs

Background work is required for:
- calendar synchronization
- memory review schedules
- daily briefing generation
- automation triggers
- cleanup and retention
- embedding generation
- backup checks

Actual Phase 1 approach: Firebase Cloud Functions v2 (`onSchedule`) for scheduled execution, starting with one recurring job (`dailyRiskScan`). See `10-Implementation/ADRs/ADR-0103-Use-Firebase-Cloud-Functions-for-Scheduled-Execution.md`.

This is narrower than the database-backed job table originally planned (see `10-Implementation/ADRs/ADR-0007-Use-Database-Backed-Jobs-Before-a-Workflow-Platform.md`, status: Superseded) — there is no durable job queue, retry policy, or dead-letter handling shared across job types. Each scheduled function currently hand-builds its own resilience. A general job-queue layer (Firestore-backed, since Postgres is gone) remains undecided and should get its own ADR if a second recurring job type is needed.

Possible future libraries if a real queue becomes necessary:
- BullMQ
- Temporal
- Inngest
- Trigger.dev

A workflow platform should be added only when native job orchestration becomes a real limitation.

## Authentication

Actual: Firebase Auth, email/password provider. See `10-Implementation/ADRs/ADR-0102-Use-Firebase-Auth-for-Identity.md`.

This does not meet the passkey requirement originally specified — see `10-Implementation/ADRs/ADR-0009-Use-Managed-Authentication-with-Passkey-Support.md` (status: Superseded in part; passkeys, MFA, device trust, and reauthentication-for-sensitive-actions remain unimplemented). Firebase Auth was chosen because it was already part of the Firebase project in use for Firestore, and because it plugs directly into Firestore Security Rules (`request.auth.token.email`), which was the immediate need.

Authentication provider choice should not determine authorization policy. In practice, authorization is enforced by Firestore Security Rules (an owner-email check) plus server-side token verification in API routes and Cloud Functions — not by the authentication provider itself.

## Authorization

Authorization should be implemented in North Vector business logic.

Use:
- capability checks
- object ownership
- sensitivity classification
- device trust
- approval state
- integration scope

Do not rely only on frontend visibility or route-level middleware.

## Secrets Management

Development:
- local environment file excluded from Git
- optional operating-system keychain

Production:
- managed secret store
- hosting-provider secret manager
- cloud key management where needed

Secrets should never appear in:
- source code
- committed configuration
- logs
- screenshots
- client bundles

## Model Provider Layer

North Vector should use a provider abstraction.

The abstraction should support:
- chat completion or responses
- structured output
- streaming
- embeddings
- model selection
- token and cost logging
- timeout and retry
- privacy routing

The system should avoid scattering provider-specific calls across the codebase.

## Model Routing

Possible routing strategy:
- deterministic code for permissions and scheduling
- smaller model for classification and extraction
- stronger model for complex reasoning
- local model for simple privacy-sensitive processing

Model output should always pass through validation before affecting stored state or external actions.

## Structured Output

Use schema validation for model-produced:
- object proposals
- memory candidates
- task extraction
- decision structures
- action proposals
- risk and opportunity records

Zod or JSON Schema may be used.

Invalid model output should be rejected or repaired without silent coercion.

## Local Model Support

Local models may be useful later for:
- wake-word detection
- voice activity detection
- simple transcription
- secret scanning
- basic classification
- private summarization

Local inference should not be required for the initial MVP.

## Calendar Integration

Phase 1 provider:
- Google Calendar API

Requirements:
- OAuth
- narrow scopes
- token encryption
- incremental synchronization where available
- provider revision tracking
- explicit event-write approval

## API Design

Use JSON APIs with consistent response shapes.

Each API should provide:
- request ID
- authenticated user
- validation
- authorization
- clear error taxonomy
- audit behavior
- idempotency where appropriate

## API Error Shape

Suggested fields:
- error_code
- message
- user_message
- retryable
- request_id
- details when safe

## Internal Service Boundaries

Even in a monolith, domain boundaries should remain explicit.

Recommended flow:

Interface
↓
Application Service
↓
Authorization
↓
Domain Logic
↓
Repository or Integration Adapter
↓
Audit and Verification

## Repository Pattern

Provider and database access should sit behind adapters.

Examples:
- CalendarRepository
- MemoryRepository
- ActionRepository
- GoogleCalendarAdapter
- ModelProvider

This makes testing and provider replacement easier.

## Environment Structure

North Vector should maintain:
- Local Development
- Test
- Staging
- Production

## Local Development

Local development should provide:
- one-command startup
- local database
- seed data
- synthetic test account
- mocked integrations
- optional real OAuth for manual testing
- hot reload

Recommended tooling:
- Firebase Emulator Suite for local Firestore when useful (not yet adopted in practice)
- package scripts for setup, test, and lint

## Test Environment

The test environment should use:
- isolated database
- deterministic fixtures
- mocked external providers
- synthetic personal data
- fast reset

Tests should never depend on Nishad's production data.

## Staging Environment

Staging should resemble production but use:
- separate database
- separate secrets
- separate OAuth credentials
- test calendars and accounts
- restricted access

Staging should be the primary environment for integration and migration testing.

## Production Environment

Production should use:
- separate database and secrets
- secure domain
- TLS
- backups
- monitoring
- restricted administrative access
- audit logging

## Environment Naming

Recommended names:
- local
- test
- staging
- production

Avoid ambiguous names such as dev2 or final-prod.

## Environment Configuration

Configuration should be validated at startup.

Required variables may include:
- database URL
- authentication secrets
- model-provider credentials
- Calendar OAuth credentials
- encryption keys
- application URL
- storage configuration

Missing or invalid configuration should stop startup safely.

## Configuration Schema

Use a typed environment schema.

The application should distinguish:
- public client configuration
- server-only configuration
- secret configuration

## Encryption

Use established libraries and platform services.

Encrypt:
- integration tokens
- Restricted fields where required
- backups
- exports containing sensitive data

Do not implement custom cryptography.

## Logging

Use structured logs.

Suggested fields:
- timestamp
- environment
- service
- request_id
- user_id when appropriate
- action
- status
- duration
- error_code

Logs should exclude:
- access tokens
- full email content
- health data
- financial values
- private prompts unless explicitly necessary and protected

## Observability

Phase 1 should support:
- application errors
- request latency
- job failures
- integration failures
- database health
- model cost and latency
- security events

Possible tooling:
- Sentry
- OpenTelemetry
- managed platform logs

Observability should not create a second uncontrolled copy of personal data.

## Error Monitoring

Error reports should include:
- stack trace
- request ID
- component
- sanitized context
- affected operation

Sensitive payloads should be redacted before transmission.

## Metrics

Initial metrics may include:
- API latency
- retrieval latency
- model latency
- Calendar sync success
- automation run success
- duplicate prevention
- memory correction rate
- deletion failure rate

## Continuous Integration

GitHub Actions should run:
- formatting check
- lint
- type check
- unit tests
- integration tests
- secret scan
- dependency scan
- build

Protected branches may require these checks before merge.

## Continuous Deployment

Actual Phase 1 deployment:
- Firebase App Hosting for the Next.js application
- Firebase Cloud Functions (separate deploy target, `firebase deploy --only functions`) for scheduled execution
- Firestore as the database — no separate database provider or deployment step

A single platform (Firebase) was chosen over the originally planned split across Vercel/Render/managed-Postgres, once Firestore, Auth, and Functions were all already on Firebase — see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`.

## Deployment Strategy

Recommended:
- automatic staging deployment on main or selected branches
- production deployment after passing release gate
- migration step before application cutover
- rollback to prior application version

## Database Migrations

Firestore has no formal migration framework; there is no schema to migrate in the SQL sense. Schema evolution happens by changing TypeScript types and, where field shapes change, handling missing/legacy fields defensively in application code. Documents do not currently carry a schema version field.

Firestore Security Rules changes are the closest equivalent to a migration in terms of required care — a rules change can silently open or close access, and should be reviewed and verified (ideally against the live database, not just rules syntax) before and after deploy.

## Feature Flags

Feature flags may be used for:
- new integrations
- automation modes
- retrieval strategies
- experimental UI

Flags should not become permanent hidden complexity.

## Testing Stack

Recommended tools:
- Vitest or Jest for unit tests
- Playwright for end-to-end tests
- Testing Library for components
- provider mocks for integrations
- Firestore Emulator Suite for integration tests (not yet adopted in practice; current verification has relied on direct Admin SDK scripts against the real project)

## Test Categories

The project should maintain:
- unit tests
- database integration tests
- API tests
- end-to-end workflows
- authorization tests
- migration tests
- security tests
- prompt-injection tests

## Code Quality

Use:
- strict TypeScript
- ESLint
- Prettier or equivalent formatter
- pre-commit checks where useful
- no ignored type errors in production code

## Monorepo Structure

A monorepo may be useful.

Suggested structure:

```text
/apps
  /web
  /worker
/packages
  /domain
  /database
  /integrations
  /ai
  /security
  /ui
  /config
/docs
```

A simpler single application may be used initially if the separation remains logical.

## Suggested Application Structure

```text
src/
  app/
  components/
  domain/
  services/
  repositories/
  integrations/
  ai/
  security/
  jobs/
  database/
  audit/
  config/
```

## Dependency Policy

Dependencies should be added only when they:
- solve a real problem
- are actively maintained
- have acceptable security posture
- reduce complexity more than they add

## Version Policy

Use:
- lockfiles
- controlled upgrades
- dependency scanning
- changelog review for major upgrades

Avoid uncontrolled automatic major-version updates.

## Package Manager

Recommended:
- pnpm

Reasons:
- efficient workspace support
- deterministic lockfile
- good monorepo behavior

npm is also acceptable for a simpler setup.

## Git Workflow

Recommended:
- main as protected production branch
- short-lived feature branches
- pull requests for code changes
- direct commits only for low-risk documentation when appropriate

## Commit Standards

Use concise descriptive messages.

Examples:
- `Add canonical object schema`
- `Implement memory candidate review`
- `Fix Calendar sync conflict handling`

## Branch Protection

Production branches should require:
- passing checks
- no unresolved critical findings
- current branch head at merge
- secret scan

## Code Review

Review should consider:
- correctness
- security
- privacy
- schema impact
- test coverage
- failure handling
- architectural alignment

## Documentation

Documentation should live with the codebase.

Required implementation docs may include:
- setup
- environment variables
- architecture decisions
- migrations
- integration setup
- incident procedures
- deployment and rollback

## Architecture Decision Records

Use ADRs for consequential technical decisions.

Each ADR should contain:
- context
- options
- decision
- tradeoffs
- consequences
- review date when relevant

## Data Residency

Phase 1 may use cloud infrastructure in the United States.

The system should preserve the ability to identify:
- where data is stored
- which providers process it
- which data remains local

## Provider Lock-In

Reduce lock-in through:
- canonical internal schemas
- provider adapters
- Firestore export via Admin SDK or Google Cloud's managed export/import tooling
- S3-compatible storage
- export formats
- model abstraction

Note: choosing Firestore over PostgreSQL was itself a lock-in tradeoff — Firestore's document model and Security Rules are more Firebase-specific than a portable PostgreSQL instance would have been. Accepted deliberately in exchange for platform consolidation; see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`.

Do not overengineer portability before the product works.

## Cost Model

Initial cost categories:
- database
- application hosting
- background worker
- model inference
- embeddings
- object storage
- monitoring
- backups

## Cost Controls

Use:
- request budgets
- model routing
- embedding deduplication
- bounded background jobs
- log retention
- storage lifecycle policies
- usage dashboards

## Performance Targets

Initial targets:
- local object queries under one second
- common UI navigation under two seconds
- streamed model response starts within a few seconds
- Calendar sync within an interactive window
- background jobs complete within defined service targets

## Scalability

Phase 1 should support one user reliably.

Design choices should avoid obvious dead ends, but should not optimize for millions of users.

Future scale concerns may include:
- multi-tenancy
- database partitioning
- distributed workers
- regional deployment
- dedicated vector and graph systems

## Availability

The MVP does not require enterprise uptime.

It should still support:
- graceful degraded mode
- clear stale-data status
- recoverable jobs
- backups
- local visibility into current tasks and events where possible

## Offline Strategy

Phase 1 may provide limited offline capability through browser caching or local application state.

Offline-supported actions may include:
- viewing recent low-sensitivity data
- creating local notes
- queuing tasks

External writes should wait for reconnection and revalidation.

## Security Baseline

The stack should enforce:
- TLS
- secure cookies
- CSRF protection where relevant
- server-side authorization
- secret management
- input validation
- rate limits
- audit logs
- dependency scanning
- backup encryption

## Privacy Baseline

The stack should support:
- No-Memory Mode
- category sensitivity
- restricted display
- retention schedules
- deletion propagation
- export
- source provenance

## Development Data Policy

Development should use:
- synthetic people
- synthetic calendars
- fake emails
- fake financial and health values

Production data should be accessed in development only when absolutely necessary and under deliberate controls.

## Seed Data

Create a synthetic seed scenario covering:
- one goal
- one project
- several tasks
- one commitment
- one exam event
- one risk
- one memory candidate
- one Calendar proposal

This scenario should power demos and end-to-end tests.

## Local Setup Target

A new contributor should be able to:
1. clone the repository
2. install dependencies
3. start the database
4. run migrations
5. seed data
6. start web and worker processes
7. run tests

The process should be documented and reproducible.

## Initial Environment Files

Suggested files:
- `.env.example`
- `.env.local` ignored by Git
- typed environment schema
- deployment-specific secret configuration

The example file should contain placeholders only.

## Release Process

A release should include:
1. passing CI
2. reviewed migration plan
3. secret scan
4. dependency scan
5. staging validation
6. backup checkpoint
7. production deployment
8. smoke tests
9. rollback readiness

## Smoke Tests

After deployment, verify:
- sign in
- object retrieval
- Chief session creation
- memory write and read
- Calendar sync
- audit event creation
- deletion or test cleanup

## Rollback

Rollback should support:
- prior application version
- database migration rollback or forward fix
- feature-flag disable
- integration pause
- worker pause

## Operational Runbooks

Initial runbooks should cover:
- deployment failure
- database migration failure
- Calendar token expiration
- model-provider outage
- worker backlog
- backup failure
- secret exposure
- session revocation

## Open Technical Decisions

Resolved since this document was first written:
- database and access layer: Firestore, no ORM (ADR-0101)
- authentication provider: Firebase Auth, email/password (ADR-0102; passkey requirement still unmet)
- deployment platform: Firebase App Hosting + Cloud Functions (ADR-0101, ADR-0103)
- background job implementation: Firebase Cloud Functions `onSchedule` for the one recurring job built so far (ADR-0103); a general job-queue layer remains undecided

Still requiring prototype validation:
- model providers
- local embedding strategy
- object storage provider
- semantic/vector retrieval approach on Firestore (ADR-0010 deprecated, no replacement chosen)

## Decision Criteria for Open Choices

Evaluate based on:
- security
- developer experience
- cost
- portability
- observability
- migration reliability
- support quality
- complexity

## Failure Modes

### Stack Fashion

Tools are selected because they are popular rather than necessary.

### Premature Microservices

The system is fragmented before product boundaries are stable.

### ORM Lock-In

The application loses understanding of its own SQL and schema.

### Provider Coupling

Model, hosting, or integration code is scattered throughout the application.

### Environment Drift

Staging and production behave differently because configuration is inconsistent.

### Secret Leakage

Credentials appear in source, logs, or client bundles.

### Test Theater

Tests exist but do not cover authorization, deletion, conflict, and failure paths.

### Observability Overcollection

Monitoring systems become a second privacy risk.

### Infrastructure Distraction

Engineering effort shifts from product workflows to unnecessary platform complexity.

## Phase 1 Technical Definition of Done

The technical foundation is complete when:
- application runs locally and in staging
- Firestore Security Rules are reviewed and verified against the live database, not just rules syntax
- authentication works
- environment configuration is validated
- secrets remain outside Git
- structured logs exist
- CI runs lint, type checks, tests, build, and secret scan
- one worker processes background jobs
- backups exist and can be restored
- provider interfaces are abstracted
- the chemistry-exam seed workflow passes

## Success Criteria

The Technical Stack and Environment succeeds if:
- a small team or one developer can understand the whole system
- local setup is reproducible
- production and staging are isolated
- data is portable
- providers can be replaced without rewriting the product
- security and privacy controls are enforced in code
- infrastructure supports the roadmap without becoming the project itself

## Final Principle

North Vector should use sophisticated reasoning on top of deliberately unsophisticated infrastructure.

The stack should be dependable enough to disappear behind the product.