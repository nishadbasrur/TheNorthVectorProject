# ADR-0021: Use Vitest for Unit and Integration Testing

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Testing Owner
- Technical Lead
- Data Architecture Owner
- Security Owner

## Related Documents

- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Development_Workflow_and_Standards.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0006-Use-TypeScript-Across-the-Phase-1-Application.md`
- `10-Implementation/ADRs/ADR-0017-Use-pnpm-for-Package-and-Workspace-Management.md`
- `10-Implementation/ADRs/ADR-0018-Use-Drizzle-ORM-for-Phase-1-Database-Access.md`
- `10-Implementation/ADRs/ADR-0019-Use-GitHub-Actions-for-Continuous-Integration.md`
- `10-Implementation/ADRs/ADR-0020-Use-Playwright-for-End-to-End-Testing.md`

## Context

North Vector Phase 1 requires a fast, reliable test framework for:
- domain logic
- validation schemas
- repositories
- database transactions
- retrieval ranking
- memory lifecycle
- approval state transitions
- action execution guards
- provider adapters
- background jobs
- migration helpers
- API and service integration

The project uses TypeScript, pnpm workspaces, Next.js, Drizzle ORM, PostgreSQL, and Playwright for end-to-end testing.

The unit and integration framework should:
- support TypeScript directly
- run quickly in watch mode
- work across packages
- provide mocks, spies, and fake timers
- support coverage
- work in GitHub Actions
- allow Node and browser-like environments where needed
- integrate cleanly with an isolated PostgreSQL test database

The project should avoid splitting unit and integration testing across several frameworks unless a real need appears.

## Decision Drivers

- TypeScript-first experience
- speed
- watch mode
- workspace support
- mocking and fake timers
- ESM compatibility
- coverage
- CI integration
- low configuration overhead
- maintainability by one developer
- compatibility with React and Node.js code
- separation from Playwright end-to-end tests

## Options Considered

### Option A: Vitest

Description:
Use Vitest as the primary framework for unit and integration tests across the TypeScript application.

Advantages:
- strong TypeScript and ESM support
- fast execution and watch mode
- familiar Jest-like API
- good mocking, spies, and fake timers
- workspace support
- Vite ecosystem compatibility
- coverage support
- suitable for Node and jsdom-style environments
- low setup overhead

Disadvantages:
- younger than Jest
- some third-party examples and plugins assume Jest
- framework and Vite version compatibility requires maintenance
- browser-mode features may evolve

Risks:
- subtle differences from Jest cause confusion
- overuse of mocks hides real integration problems
- test environments diverge from production Node behavior

### Option B: Jest

Description:
Use Jest as the primary unit and integration testing framework.

Advantages:
- mature and widely adopted
- broad ecosystem
- extensive documentation
- strong mocking and coverage support
- many libraries provide Jest examples

Disadvantages:
- ESM and modern TypeScript configuration can be more cumbersome
- slower startup and watch performance in some projects
- additional transformation configuration may be needed
- less natural fit with modern Vite-oriented tooling

Risks:
- configuration complexity slows one developer
- module behavior differs between tests and production

### Option C: Node.js Built-In Test Runner

Description:
Use the built-in `node:test` framework and add helper libraries only where required.

Advantages:
- no major test-framework dependency
- close alignment with Node.js runtime
- simple core API
- long-term platform support

Disadvantages:
- less mature mocking and watch ergonomics
- more custom setup for coverage and browser-like tests
- smaller ecosystem for application testing
- workspace and fixture conventions require more design

Risks:
- the project builds testing infrastructure instead of product features
- inconsistent helper patterns emerge

### Option D: Separate Frameworks for Unit and Integration Tests

Description:
Use one framework for fast unit tests and another for database or service integration tests.

Advantages:
- each layer can use specialized tooling
- integration tests can run in a more production-like harness

Disadvantages:
- duplicated configuration
- multiple assertion and mocking APIs
- slower onboarding and maintenance
- inconsistent test conventions

Risks:
- one test layer becomes neglected
- shared helpers and fixtures become fragmented

### Option E: Playwright for Most Testing

Description:
Use Playwright's test runner for browser, API, and integration tests, with minimal separate unit testing.

Advantages:
- one testing tool
- strong fixtures and parallelism
- easy browser and API combinations

Disadvantages:
- too heavy for exhaustive domain tests
- slower feedback
- awkward for isolated pure functions
- encourages browser-level testing of logic better covered lower down

Risks:
- slow and fragile suite
- poor localization of failures
- test pyramid collapses

## Decision

North Vector will use Vitest as the primary framework for unit and integration testing during Phase 1.

Vitest will be used for:
- pure unit tests
- domain state-transition tests
- schema-validation tests
- repository tests
- PostgreSQL integration tests
- provider-adapter tests with fakes and contract fixtures
- background-job tests
- service-layer tests
- selected React component tests where browser end-to-end coverage is unnecessary

Playwright will remain the primary end-to-end browser framework.

## Test Layers

### Unit Tests

Unit tests should cover isolated behavior such as:
- lifecycle transitions
- validation rules
- ranking functions
- scheduling calculations
- permission decisions
- idempotency logic
- error mapping

They should avoid network and shared database state.

### Integration Tests

Integration tests should cover boundaries such as:
- Drizzle with PostgreSQL
- transactions
- repositories
- service plus audit writes
- job claiming and retries
- provider normalization
- context assembly across stored objects

They should use an isolated test database and synthetic fixtures.

### Component Tests

Component tests may use Vitest with React Testing Library for:
- approval details
- memory candidate controls
- loading and error states
- focus and keyboard behavior
- privacy-safe rendering

Component tests should not duplicate Playwright workflows unnecessarily.

## Rationale

Vitest is a strong fit for North Vector's TypeScript-first workspace and provides fast feedback with a familiar testing API.

The project needs a framework that can handle both pure domain logic and real PostgreSQL integration tests without creating a separate testing stack for each package.

Vitest's speed and watch mode are especially useful for one developer iterating across many modules. Its Jest-like API reduces learning friction while its ESM and modern TypeScript support fit the selected application stack more naturally.

The decision preserves a clear testing pyramid: Vitest for fast and thorough lower-level coverage, Playwright for the smaller set of critical full-browser workflows.

## Consequences

### Positive Consequences

- fast local feedback
- one unit and integration framework
- strong TypeScript support
- familiar assertion and mocking API
- easy workspace execution
- fake timers for schedule and expiration tests
- coverage support
- compatible with Node and component-test environments
- straightforward GitHub Actions integration

### Negative Consequences

- Vitest becomes another foundational dependency
- some Jest-specific ecosystem tools may require adaptation
- mocks may create false confidence
- multiple environments require careful configuration
- integration tests remain slower and need database lifecycle management

### Operational Consequences

- CI should separate fast unit tests from heavier integration tests when useful
- test reports and coverage artifacts require bounded retention
- PostgreSQL service setup must remain deterministic
- flaky tests require owner and deadline
- framework upgrades should be reviewed with representative suites

### Security and Privacy Consequences

- tests must use synthetic data
- provider secrets should be replaced with fakes in ordinary CI
- sensitive error paths should be tested without logging raw payloads
- authorization and deletion tests should use real service boundaries
- mocks must not bypass security checks present in production paths

### Data and Migration Consequences

- integration tests require repeatable migrations
- representative prior-schema fixtures should support migration testing
- database reset and seed tools become part of the test infrastructure
- test data must preserve canonical relationships and lifecycle states

## Configuration Model

The repository may define:
- one root Vitest workspace configuration
- package-specific configurations only when environment needs differ
- Node environment for domain, database, worker, and integration tests
- jsdom or happy-dom only for selected component tests

Configuration should remain simple and explicit.

## File Naming

Recommended naming:
- `*.test.ts`
- `*.test.tsx`
- `*.integration.test.ts`
- `*.contract.test.ts`

The exact pattern should make test category obvious.

## Workspace Execution

Root scripts should support:
- all tests
- unit tests only
- integration tests only
- watch mode
- coverage
- one package or file

Example commands:

```text
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:coverage
```

## Database Integration Strategy

Integration tests should use real PostgreSQL rather than SQLite substitutes.

The test harness should:
1. provision or connect to an isolated PostgreSQL instance
2. enable required extensions
3. apply migrations
4. seed only required synthetic data
5. run tests with controlled cleanup
6. reset state between tests or suites

The test database must never point to staging or production.

## Transaction Isolation

Tests may use:
- transaction rollback per test
- schema reset
- database recreation
- deterministic cleanup

The strategy should preserve realistic transaction behavior and safe parallelism.

## Time Control

Vitest fake timers or an injected clock should be used for:
- session expiration
- approval expiration
- memory review dates
- scheduled jobs
- retry backoff
- notification quiet hours

Domain code should prefer an injectable clock instead of direct uncontrolled wall-clock access.

## Mocking Policy

Mock only external or unstable boundaries.

Good mock targets:
- model provider
- Google Calendar adapter
- authentication provider event source
- object storage
- notification delivery

Avoid mocking:
- the domain rule under test
- repository behavior in repository integration tests
- authorization in security-sensitive service tests
- database transactions when their behavior matters

## Fake Providers

The test suite should include deterministic fake providers that can simulate:
- success
- timeout
- rate limit
- expired authentication
- partial failure
- uncertain outcome
- provider version change
- malformed response

Fakes should preserve the same application-facing interfaces as real adapters.

## Snapshot Policy

Snapshot tests should be used sparingly.

Appropriate uses may include:
- stable structured output shapes
- sanitized audit summaries
- limited rendered component structures

Avoid large snapshots that are updated without meaningful review.

## Coverage Policy

Coverage may be tracked, but line coverage is not the release goal.

More important coverage includes:
- critical state transitions
- authorization paths
- deletion paths
- failure paths
- migration behavior
- provider contract behavior

Coverage thresholds may be introduced only when they improve quality rather than encourage trivial tests.

## Flaky Test Policy

A flaky Vitest test should be:
- marked immediately
- assigned an owner
- diagnosed
- fixed or quarantined with a deadline

Common causes to eliminate:
- shared mutable fixtures
- uncontrolled clock
- random IDs without deterministic seeds
- parallel writes to the same database records
- real network access

## Test Error Messages

Tests should fail with enough context to identify:
- expected state
- actual state
- relevant object or action ID
- workflow stage

They should not print raw Restricted data or secrets.

## CI Integration

GitHub Actions should run:
- unit tests on every pull request
- core integration tests on every pull request
- full integration and migration suites on main or release candidates
- coverage when useful

Failed tests should preserve logs and reports without private data.

## Testing Requirements

Validation of the framework setup should include:
- clean repository test run succeeds
- watch mode works
- TypeScript path aliases resolve
- database integration tests run against PostgreSQL
- fake timers behave correctly
- fake provider can simulate timeout and uncertainty
- coverage report generates
- CI separates unit and integration failures clearly
- tests do not access real provider accounts
- one intentionally failing test produces useful diagnostics

## Validation Plan

The decision will be validated through:
- canonical object unit tests
- memory lifecycle tests
- Zod schema tests
- Drizzle repository integration tests
- job queue concurrency tests
- approval mutation tests
- provider adapter contract tests
- GitHub Actions execution
- test-runtime and flakiness review after the first ten CI runs

The choice should be considered successful when most defects are caught quickly below the browser level and integration failures remain reproducible.

## Rollback or Exit Strategy

If Vitest becomes inadequate, North Vector may migrate to Jest or the Node.js test runner.

Migration should:
1. preserve test files and behavioral coverage
2. replace framework-specific APIs incrementally
3. validate fake timers, mocks, and ESM behavior
4. preserve PostgreSQL integration setup
5. run both frameworks temporarily if necessary
6. update CI and documentation
7. use a superseding ADR

The project should not weaken unit and integration coverage during a framework migration.

## Residual Risks

- framework changes or compatibility issues
- over-mocking
- slow database integration suite
- test-environment differences from production
- flaky parallel tests
- coverage metrics creating false confidence
- component tests duplicating Playwright coverage

## Assumptions

- TypeScript remains the primary language
- Node.js remains the primary runtime
- the repository uses pnpm workspaces
- PostgreSQL can be provisioned locally and in CI
- one developer benefits from a fast watch workflow
- Playwright remains available for browser-level validation

## Review Triggers

Revisit this ADR when:
- Vitest compatibility materially slows upgrades
- test execution becomes unreliable
- ESM or workspace behavior causes recurring failures
- another framework materially improves reliability or maintenance
- a second language becomes a major part of the application
- browser-mode testing becomes central
- a security incident reveals test gaps caused by mocking

## Review Date

After the first production release or when the first review trigger occurs.

## Outcome

### Expected Outcome

Vitest should provide fast, clear, and maintainable unit and integration testing across the TypeScript workspace while Playwright remains focused on full-browser workflows.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Use Vitest during Phase 1 test setup and review runtime, flakiness, and ecosystem fit after the first full release cycle.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |