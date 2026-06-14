# ADR-0017: Use pnpm for Package and Workspace Management

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

## Related Documents

- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Development_Workflow_and_Standards.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0002-Use-a-Modular-Monolith-for-Phase-1.md`
- `10-Implementation/ADRs/ADR-0006-Use-TypeScript-Across-the-Phase-1-Application.md`
- `10-Implementation/ADRs/ADR-0008-Use-Next.js-for-the-Phase-1-Web-Application.md`

## Context

North Vector Phase 1 will use TypeScript across a modular-monolith codebase containing:
- a Next.js web application
- a background worker
- shared domain packages
- database and migration code
- integration adapters
- AI and model-provider code
- security utilities
- shared UI components
- configuration packages

The repository needs one package manager and workspace system that supports:
- deterministic installs
- shared packages
- local package linking
- efficient disk use
- reproducible CI
- dependency isolation
- straightforward scripts
- future monorepo growth

The project will initially be maintained by one developer, but the package and workspace structure should remain understandable and not create avoidable dependency sprawl.

The choice should reduce setup friction while preserving clear dependency boundaries across apps and packages.

## Decision Drivers

- reliable lockfile
- workspace support
- efficient installation
- deterministic CI behavior
- strict dependency boundaries
- good TypeScript and Node.js compatibility
- broad tooling support
- simple local development
- manageable learning curve
- future monorepo support
- supply-chain visibility

## Options Considered

### Option A: pnpm

Description:
Use pnpm as the package manager and workspace tool for the Phase 1 repository.

Advantages:
- strong workspace support
- efficient content-addressed package store
- deterministic lockfile
- strict dependency resolution
- fast installs
- good monorepo behavior
- broad support across modern TypeScript tools
- prevents some undeclared dependency access that npm and Yarn Classic may allow

Disadvantages:
- slightly less familiar than npm for some developers
- symlinked node_modules structure can expose compatibility issues in poorly maintained packages
- requires pnpm installation or Corepack
- some documentation examples assume npm

Risks:
- a dependency may behave incorrectly under pnpm's stricter structure
- workspace configuration may become unnecessarily complex
- contributors may use the wrong package manager and modify the lockfile incorrectly

### Option B: npm Workspaces

Description:
Use npm and its built-in workspace support.

Advantages:
- installed with Node.js
- broad familiarity
- simple onboarding
- good compatibility with most tools
- no separate package-manager setup

Disadvantages:
- less efficient workspace installation
- dependency isolation can be looser
- monorepo ergonomics are less refined in some workflows
- lockfile changes may become noisy

Risks:
- undeclared dependencies may work locally and fail elsewhere
- workspace scripts may require more custom handling

### Option C: Yarn Modern

Description:
Use Yarn Berry with workspaces and optional Plug'n'Play.

Advantages:
- mature workspace features
- strong constraints and tooling
- efficient installs
- Plug'n'Play can enforce dependency correctness

Disadvantages:
- more configuration complexity
- Plug'n'Play compatibility varies
- greater conceptual overhead
- some tools and examples need special configuration

Risks:
- environment complexity distracts from product implementation
- compatibility debugging slows one developer

### Option D: Bun

Description:
Use Bun as package manager and possibly runtime or test runner.

Advantages:
- very fast installs and scripts
- integrated runtime and tooling
- growing TypeScript ecosystem

Disadvantages:
- younger ecosystem
- compatibility and production behavior remain less proven for the full stack
- choosing it may couple package management to runtime decisions
- some packages and deployment systems still assume Node.js tooling

Risks:
- unexpected compatibility issues
- premature adoption of a rapidly changing toolchain

### Option E: Separate Package Management Per Application

Description:
Use independent package files and installs for web, worker, and shared code.

Advantages:
- simple isolated projects
- clear deployment units
- no workspace configuration

Disadvantages:
- duplicate dependencies and lockfiles
- difficult shared-package development
- version drift
- slower installs and CI
- more manual coordination

Risks:
- web and worker use incompatible shared-domain versions
- duplicated configuration increases maintenance

## Decision

North Vector will use pnpm for package and workspace management during Phase 1.

The repository will maintain:
- one root `pnpm-lock.yaml`
- one `pnpm-workspace.yaml`
- one pinned package-manager version
- package-level manifests for apps and shared packages
- root scripts for common development, test, build, lint, type-check, and migration workflows

Corepack should be used where practical to pin and activate the approved pnpm version.

The repository should reject accidental npm or Yarn lockfiles.

## Workspace Structure

Recommended workspace layout:

```text
apps/*
packages/*
```

Initial packages may include:
- `apps/web`
- `apps/worker`
- `packages/domain`
- `packages/database`
- `packages/integrations`
- `packages/ai`
- `packages/security`
- `packages/ui`
- `packages/config`

The exact number of packages should remain small until real boundaries justify separation.

## Dependency Rules

Each package should declare every dependency it imports.

Packages should not rely on accidental hoisting or undeclared transitive dependencies.

Recommended dependency direction:

```text
apps
  -> application packages
  -> domain and shared packages

provider adapters
  -> shared contracts
  -> domain-safe types
```

Domain packages should not import:
- Next.js
- provider SDKs
- UI frameworks
- deployment-platform code

## Version Pinning

The repository should pin:
- Node.js major and minor policy where practical
- pnpm version
- direct dependency versions through the lockfile

Use controlled update tooling, but do not automatically merge major dependency changes without review.

## Package Manager Enforcement

The project should use one or more of:
- `packageManager` field in root `package.json`
- Corepack
- CI lockfile checks
- preinstall guard script
- documentation

The build should fail when the lockfile is out of sync.

## Rationale

pnpm is a strong fit for North Vector's TypeScript modular-monolith structure.

It supports shared packages cleanly, installs efficiently, and enforces more honest dependency declarations than looser node_modules layouts.

That strictness is useful for a codebase where domain, integration, AI, security, and UI boundaries matter. A package should work because it declared what it needs, not because another package happened to install a transitive dependency at the repository root.

The choice also keeps the toolchain conventional enough to work well with Next.js, Node.js, Playwright, database tooling, and common CI platforms.

## Consequences

### Positive Consequences

- one deterministic lockfile
- efficient package storage
- strong workspace support
- clearer dependency declarations
- simpler shared-package development
- reproducible CI installs
- reduced duplicate dependencies
- good fit for web and worker packages

### Negative Consequences

- pnpm-specific commands and workspace configuration
- some packages may expose symlink assumptions
- contributors must use the pinned package manager
- workspace boundaries can become overengineered
- package publishing behavior may require additional configuration later

### Operational Consequences

- CI should use frozen-lockfile installs
- deployment platforms must support pnpm or Corepack
- build caches should include lockfile and package-manager version
- dependency installation failures should preserve logs
- production artifacts should not depend on undeclared workspace state

### Security and Privacy Consequences

- one lockfile improves dependency review
- strict declarations reduce hidden dependency use
- package integrity still depends on the npm ecosystem
- dependency and secret scans remain required
- lifecycle scripts should be reviewed for sensitive build environments
- production installs should avoid unnecessary development dependencies

### Data and Migration Consequences

- no direct canonical-data impact
- migration and database packages can share exact versions with the application
- package-version changes affecting serialized data should still use explicit schema migrations

## Installation Standard

Local setup should use:

```text
corepack enable
pnpm install
```

CI should use:

```text
pnpm install --frozen-lockfile
```

The exact commands may evolve, but deterministic lockfile enforcement must remain.

## Script Standards

Root scripts should provide clear entry points such as:
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm db:migrate`
- `pnpm db:seed`

Scripts should delegate to workspace packages rather than duplicating logic.

## Workspace Package Standards

Each package should define:
- name
- private or publishable status
- exports
- types
- scripts
- dependencies
- dev dependencies

Internal packages should use a consistent namespace if useful.

## Dependency Classification

Use:
- `dependencies` for runtime requirements
- `devDependencies` for build, test, and development tooling
- `peerDependencies` only when a consumer must supply a compatible package
- optional dependencies only with explicit fallback behavior

Avoid placing most packages in the root manifest merely for convenience.

## Dependency Update Policy

Updates should be:
- reviewed
- tested
- grouped sensibly
- scanned for vulnerabilities
- monitored after deployment

Major upgrades should include:
- changelog review
- migration notes
- targeted regression tests
- rollback plan for high-impact framework or database changes

## Supply-Chain Controls

Phase 1 should include:
- dependency scanning
- lockfile review
- package provenance review for sensitive dependencies
- minimal dependency count
- no unreviewed install scripts for high-risk packages
- prompt removal of abandoned or vulnerable packages

## CI and Cache Rules

CI cache keys should include:
- operating system
- Node.js version
- pnpm version
- `pnpm-lock.yaml`

A cache hit must not bypass lockfile validation.

## Deployment Rules

Deployment platforms should:
- use the pinned pnpm version
- install with a frozen lockfile
- build only required apps and packages where practical
- include production dependencies needed by the worker and web application

## Testing Requirements

Required tests and checks include:
- clean clone installs successfully
- frozen-lockfile install succeeds in CI
- lockfile mismatch fails
- undeclared dependency import fails or is detected
- web and worker build from workspace packages
- deployment build uses the pinned package manager
- accidental `package-lock.json` or `yarn.lock` is rejected
- dependency scan covers all workspaces

## Validation Plan

The decision will be validated through:
- repository initialization
- clean local install
- CI install
- web and worker build
- shared-package imports
- staging deployment
- first major dependency update

The choice should be considered successful when one command installs the full repository reproducibly and package boundaries remain clear without adding significant friction.

## Rollback or Exit Strategy

If pnpm creates a material compatibility or operational problem, North Vector may migrate to npm Workspaces or another package manager.

Migration should:
1. freeze dependency changes
2. regenerate the target lockfile from reviewed manifests
3. compare resolved versions
4. run all tests and builds
5. validate deployment environments
6. remove old package-manager files
7. update documentation and CI
8. use a superseding ADR

Package manifests and workspace boundaries should remain portable enough to support migration.

## Residual Risks

- dependency supply-chain compromise
- toolchain incompatibility
- accidental workspace cycles
- over-fragmented packages
- pnpm-specific assumptions in deployment
- lockfile merge conflicts
- install scripts from third-party packages

## Assumptions

- TypeScript and Node.js remain the primary application platform
- the repository uses a workspace or monorepo structure
- selected deployment platforms support pnpm
- one developer benefits from one root toolchain
- package count remains manageable
- Corepack remains available or pnpm can be installed explicitly

## Review Triggers

Revisit this ADR when:
- deployment platforms do not reliably support pnpm
- dependency compatibility issues become frequent
- the repository moves away from a workspace structure
- another package manager materially reduces complexity
- install or CI performance becomes unacceptable
- supply-chain controls require a different installation model
- Node.js toolchain strategy changes

## Review Date

After the first four implementation sprints or when the first review trigger occurs.

## Outcome

### Expected Outcome

pnpm should provide fast, deterministic, and strict package management for the Phase 1 workspace while keeping shared TypeScript packages easy to develop and deploy.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Use pnpm during repository initialization and evaluate compatibility, workspace ergonomics, and deployment support during the first four sprints.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |