# ADR-0019: Use GitHub Actions for Continuous Integration

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
- Testing Owner

## Related Documents

- `10-Implementation/Development_Workflow_and_Standards.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Deployment_and_Operations_Plan.md`
- `10-Implementation/Release_Checklist.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0006-Use-TypeScript-Across-the-Phase-1-Application.md`
- `10-Implementation/ADRs/ADR-0017-Use-pnpm-for-Package-and-Workspace-Management.md`
- `10-Implementation/ADRs/ADR-0018-Use-Drizzle-ORM-for-Phase-1-Database-Access.md`

## Context

North Vector needs continuous integration to verify every meaningful code change before it is merged or released.

Phase 1 requires automated checks for:
- formatting
- linting
- TypeScript compilation
- unit tests
- integration tests
- database migrations
- application builds
- end-to-end tests
- secret scanning
- dependency review
- security-sensitive regression suites

The repository is hosted on GitHub and will use short-lived branches, pull requests, and protected main-branch workflows.

The CI system should:
- run automatically on pull requests and main
- integrate with GitHub status checks
- support pnpm workspaces
- provision PostgreSQL for integration tests
- preserve logs and artifacts
- handle secrets safely
- remain understandable to one developer
- avoid creating a second source-control or deployment platform dependency without need

## Decision Drivers

- native GitHub integration
- branch-protection support
- low setup overhead
- matrix and service-container support
- artifact retention
- secret management
- broad ecosystem
- pnpm and Node.js compatibility
- PostgreSQL integration testing
- security tooling
- manageable cost for one developer
- future deployment workflow support

## Options Considered

### Option A: GitHub Actions

Description:
Use GitHub Actions for pull-request checks, main-branch validation, scheduled security jobs, and release workflows.

Advantages:
- native repository integration
- direct status checks and branch protection
- strong marketplace and ecosystem
- supports service containers such as PostgreSQL
- easy access to commit and pull-request metadata
- integrated secrets and environments
- artifact and log retention
- suitable for pnpm, Next.js, Playwright, and Drizzle
- low operational overhead for one developer

Disadvantages:
- workflow syntax and action versions require maintenance
- runner behavior differs from local environments
- hosted-runner time and storage have plan limits
- third-party actions create supply-chain risk
- complex workflows can become difficult to debug

Risks:
- unpinned third-party actions
- secrets exposed to untrusted pull requests
- CI configuration becomes tightly coupled to GitHub
- slow workflows reduce development velocity

### Option B: CircleCI

Description:
Use CircleCI as a separate hosted CI platform.

Advantages:
- mature CI features
- strong caching and parallelism
- clear workflow model
- broad language support

Disadvantages:
- separate provider and configuration
- additional secrets and account administration
- pull-request checks still depend on GitHub integration
- more operational surface

Risks:
- duplicated platform management
- provider cost or integration drift

### Option C: Buildkite

Description:
Use Buildkite with self-hosted or managed agents.

Advantages:
- strong control over runners
- flexible pipelines
- good for specialized or private infrastructure

Disadvantages:
- runner operations
- more setup and maintenance
- excessive for Phase 1

Risks:
- CI infrastructure becomes its own project
- self-hosted runner security burden

### Option D: Self-Hosted CI on a Personal Machine

Description:
Run scripts on a Mac, home server, or private runner after pushes.

Advantages:
- full environment control
- low hosted-runner cost
- access to local hardware

Disadvantages:
- availability and maintenance concerns
- security burden
- difficult reproducibility
- weak isolation from personal environment
- unreliable for branch protection

Risks:
- repository code compromises the runner
- CI stops when the machine is unavailable
- hidden local state creates false passing results

### Option E: Local Checks Only

Description:
Rely on developer-run commands before commits or releases.

Advantages:
- no CI configuration
- fastest initial setup
- no hosted-runner cost

Disadvantages:
- checks are easy to skip
- environment state is not reproducible
- no branch-protection evidence
- regressions can reach main
- release confidence depends on memory

Risks:
- inconsistent testing
- secrets or migration problems are discovered late
- broken main branch

## Decision

North Vector will use GitHub Actions as the Phase 1 continuous integration platform.

GitHub Actions will run required checks on:
- pull requests
- pushes to main
- release candidates
- scheduled security and dependency workflows where useful

The default CI workflow should include:
- frozen-lockfile installation
- formatting check
- lint
- TypeScript type check
- unit tests
- integration tests
- application build
- secret scanning
- dependency or supply-chain checks

Release-candidate workflows should additionally include:
- database migration validation
- end-to-end tests
- authorization and deletion suites
- staging smoke tests where supported

## Required Workflow Structure

The initial workflow may use jobs such as:
- `quality`
- `unit-tests`
- `integration-tests`
- `build`
- `security`
- `e2e`

Jobs may be combined initially to reduce complexity, then separated when parallelism or diagnostics justify it.

## Trigger Rules

### Pull Requests

Run checks when files affecting the application, packages, migrations, configuration, or CI change.

Required pull-request checks should include:
- formatting
- lint
- type check
- unit tests
- core integration tests
- build
- secret scan

### Main Branch

Run the full required suite after merge.

Main should remain deployable.

### Release Candidates

Run:
- full integration suite
- end-to-end suite
- migration validation
- security-sensitive regressions
- release build

### Scheduled Workflows

May include:
- dependency audit
- secret scan
- test against upcoming runtime versions
- backup or restoration checks when securely supported

## Branch Protection

The main branch should require:
- passing required status checks
- resolved review comments where review is used
- no force pushes
- no direct destructive updates

For isolated documentation work, the project owner may choose a lighter workflow, but production code should normally pass through pull requests.

## Runner Model

Phase 1 should use GitHub-hosted runners by default.

Self-hosted runners should not be introduced unless:
- specialized hardware is required
- hosted-runner limits become material
- security isolation is designed and documented
- maintenance responsibility is accepted

## Environment and Version Pinning

CI should pin or define:
- operating-system runner version where practical
- Node.js version
- pnpm version through Corepack or approved setup
- PostgreSQL version for tests
- action versions by immutable commit SHA for sensitive workflows where practical

The workflow should not rely on floating `latest` behavior for critical components.

## Dependency Installation

CI should use:

```text
pnpm install --frozen-lockfile
```

The build should fail if the lockfile and manifests are inconsistent.

## Caching

Caches may include:
- pnpm store
- framework build caches
- Playwright browser downloads where safe

Cache keys should include:
- operating system
- Node.js version
- pnpm version
- lockfile hash

A cache hit must not bypass installation integrity or validation.

## Database Testing

Integration-test jobs should provision an isolated PostgreSQL service or equivalent ephemeral database.

The workflow should:
1. start PostgreSQL
2. enable required extensions where supported
3. apply migrations
4. seed synthetic fixtures
5. run integration tests
6. destroy the environment after the job

CI must never connect to staging or production databases for ordinary tests.

## pgvector Testing

The integration environment should use a PostgreSQL image or service that supports pgvector.

If the default service container does not support it, the workflow should use an approved image or install the extension in a reproducible way.

## Secret Management

CI secrets should:
- use GitHub Environments or repository secrets as appropriate
- remain unavailable to untrusted fork pull requests
- be scoped to the minimum workflow
- be rotated when exposed
- never be printed
- not be passed to jobs that do not require them

Most pull-request tests should use fake providers and synthetic credentials.

## Third-Party Action Policy

Third-party actions should be:
- necessary
- reputable
- reviewed
- pinned to a stable version or commit SHA
- granted minimum permissions

Prefer official GitHub or ecosystem-maintainer actions when practical.

Avoid actions that require broad repository write permissions for read-only checks.

## Workflow Permissions

Each workflow should declare minimal GitHub token permissions.

Default guidance:
- `contents: read`
- additional permissions only when required

Release or deployment workflows should use protected environments and explicit approval when appropriate.

## Security Scanning

CI should include or support:
- secret scanning
- dependency review
- package vulnerability scanning
- static analysis where useful
- lockfile integrity checks

Security tools should block merge when Critical findings meet the project's release rules.

## End-to-End Tests

Playwright or equivalent should run in a controlled environment with:
- synthetic data
- test authentication configuration
- fake or dedicated test providers
- screenshots and traces on failure

E2E artifacts should avoid containing real personal data or secrets.

## Migration Validation

Migration workflows should verify:
- migrations apply from an empty database
- migrations apply from representative prior schema state
- schema is consistent with application expectations
- destructive changes are identified
- rollback or roll-forward tests run where defined

## Failure Diagnostics

CI should preserve:
- test reports
- relevant logs
- screenshots
- Playwright traces
- coverage or migration reports when useful

Artifacts should have bounded retention and contain only synthetic or sanitized data.

## Concurrency and Cancellation

Pull-request workflows should cancel superseded runs for the same branch where safe.

Release and migration workflows should not be canceled automatically once a consequential operation begins unless the behavior is explicitly safe.

## Rationale

GitHub Actions provides the most direct and proportionate CI solution for a GitHub-hosted, TypeScript-first Phase 1 project.

It supports the project's testing and security requirements without requiring another operational platform. Native status checks also make it straightforward to protect main and connect test evidence to pull requests and commits.

The main risks are workflow complexity and supply-chain exposure through third-party actions. Those risks can be controlled through minimal permissions, pinned actions, synthetic test data, and keeping workflows understandable.

## Consequences

### Positive Consequences

- native pull-request and branch integration
- automated required checks
- reproducible hosted environments
- service containers for PostgreSQL
- artifact and log support
- simple status-check enforcement
- no separate CI provider account required
- broad TypeScript and security-tool ecosystem

### Negative Consequences

- GitHub platform dependency
- workflow YAML maintenance
- hosted-runner limits and queue time
- debugging can differ from local behavior
- third-party actions require supply-chain review
- complex matrix workflows may become noisy

### Operational Consequences

- CI status becomes part of release readiness
- workflow failures require runbook and diagnostic practices
- action and runtime versions require maintenance
- artifact retention and runner cost should be monitored
- protected environments may govern deployment workflows

### Security and Privacy Consequences

- secrets must be scoped carefully
- untrusted pull requests must not receive production credentials
- workflow permissions should be minimal
- artifacts must contain synthetic or sanitized data
- third-party actions become executable supply-chain dependencies
- self-hosted runners remain prohibited by default

### Data and Migration Consequences

- test databases remain ephemeral and synthetic
- migrations receive automated validation
- CI must not access production data
- schema and migration artifacts may be retained for release evidence

## Implementation Notes

Initial workflow files may include:

```text
.github/workflows/ci.yml
.github/workflows/e2e.yml
.github/workflows/security.yml
.github/workflows/release.yml
```

Phase 1 may begin with one `ci.yml` and split workflows only when necessary.

## Example CI Sequence

```text
Checkout
  -> Set up Node.js
  -> Enable Corepack
  -> Install with frozen lockfile
  -> Format check
  -> Lint
  -> Type check
  -> Unit tests
  -> Start PostgreSQL
  -> Apply migrations
  -> Integration tests
  -> Build web and worker
  -> Security scans
```

## Local Parity

Every CI command should have a documented local equivalent.

The goal is to make CI reproducible locally, not to create a hidden validation environment.

Root scripts should allow developers to run the same checks before pushing.

## Testing Requirements

Required validation includes:
- workflow runs on pull request
- required checks block merge when failing
- frozen-lockfile mismatch fails
- PostgreSQL service starts and migrations apply
- pgvector integration tests run
- secret scan detects a test secret
- fork or untrusted pull request cannot access protected secrets
- build artifacts are reproducible
- Playwright failure uploads sanitized traces
- superseded pull-request runs cancel safely
- main workflow runs after merge

## Validation Plan

The decision will be validated through:
- first repository CI workflow
- intentionally failing formatting check
- intentionally failing unit test
- migration test
- secret-detection test
- end-to-end artifact test
- branch-protection setup
- first staging release

The platform should be considered successful when every production-code change receives consistent automated evidence without excessive workflow maintenance or delay.

## Rollback or Exit Strategy

If GitHub Actions becomes inadequate, North Vector may migrate to another CI platform.

Migration should:
1. preserve the command-level scripts used locally
2. reproduce required checks on the new platform
3. verify secret isolation
4. validate PostgreSQL and pgvector testing
5. update branch protection
6. retain historical release evidence where needed
7. remove obsolete workflows
8. use a superseding ADR

CI logic should remain mostly in repository scripts rather than being embedded entirely in provider-specific YAML.

## Residual Risks

- GitHub Actions outage
- compromised third-party action
- workflow-secret exposure
- hosted-runner environment changes
- slow CI
- flaky browser tests
- configuration drift between local and CI
- excessive artifact retention
- accidental workflow permissions expansion

## Assumptions

- the repository remains on GitHub
- hosted-runner usage fits available plan limits
- Node.js, pnpm, PostgreSQL, and Playwright work reliably on hosted runners
- most external providers can be mocked in pull-request tests
- one developer benefits from native branch and status integration

## Review Triggers

Revisit this ADR when:
- CI duration becomes materially disruptive
- hosted-runner limits or costs become unacceptable
- specialized hardware is required
- GitHub Actions cannot support required deployment or security controls
- a workflow supply-chain incident occurs
- the repository moves away from GitHub
- another platform materially improves reliability or total operating complexity

## Review Date

After the first production release or when the first review trigger occurs.

## Outcome

### Expected Outcome

GitHub Actions should provide reliable, visible, and low-overhead continuous integration for the Phase 1 repository while enforcing tests, migration checks, and security gates before merge and release.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Use GitHub Actions during repository initialization and refine workflow structure after the first full release cycle.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |