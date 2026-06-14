# Development Workflow and Standards v1.0

## Purpose

This document defines how North Vector should be developed, reviewed, tested, documented, released, and maintained.

The Development Workflow and Standards exist to turn implementation into a repeatable engineering process rather than a sequence of improvised edits.

Its purpose is not to create bureaucracy.

Its purpose is to make changes understandable, reviewable, testable, and safe.

## Core Principle

Every meaningful change should leave behind enough evidence to answer:
- what changed
- why it changed
- how it was tested
- what risks were considered
- how it can be reversed

## Primary Objectives

The workflow should help the project answer:
- How should work be proposed?
- How should branches and commits be used?
- What standards should code meet?
- What tests are required?
- How should security and privacy be reviewed?
- When is a change ready to merge?
- How should releases and rollbacks work?
- How should technical debt be recorded?

## Development Principles

North Vector development should follow:
- Build Vertical Slices
- Prefer Small Changes
- Preserve Type Safety
- Test Consequential Behavior
- Keep Security and Privacy in Scope
- Document Architectural Decisions
- Avoid Premature Abstraction
- Keep Main Deployable
- Make Failure Visible
- Review Real Outcomes

## Work Item Types

Development work should be tracked as:
- Feature
- Bug
- Security Finding
- Privacy Finding
- Technical Debt
- Refactor
- Documentation
- Research Spike
- Migration
- Incident Follow-Up

## Standard Work Item

Each work item should contain:
- title
- problem statement
- scope
- acceptance criteria
- affected components
- security and privacy impact
- dependencies
- test plan
- rollback or recovery notes
- status
- owner
- priority

## Issue Quality

A good issue should explain the problem and desired outcome without dictating unnecessary implementation detail.

Bad:
`Fix memory.`

Better:
`Deleted memories still appear in semantic retrieval. Remove deleted records from the vector index and add an end-to-end deletion test.`

## Research Spikes

Use a research spike when:
- an external API is uncertain
- a technical assumption needs validation
- hardware feasibility is unknown
- multiple architecture options have unclear tradeoffs

A spike should be time-bounded and produce:
- findings
- evidence
- recommendation
- unresolved questions
- next decision

A spike should not quietly become production code.

## Planning Workflow

Recommended flow:
1. Identify a user or system problem.
2. Confirm that it belongs in the current roadmap phase.
3. Define acceptance criteria.
4. Identify security, privacy, data, and migration impact.
5. Break work into the smallest coherent vertical slice.
6. Implement.
7. Test.
8. Review.
9. Merge.
10. Observe real behavior.

## Vertical Slice Standard

A vertical slice should produce a user-visible or operationally complete result across the required layers.

Example:
`Create a task from Chief conversation`

May include:
- structured model output
- validation
- authorization
- task persistence
- audit event
- UI confirmation
- test coverage

Avoid building isolated infrastructure that remains unused for long periods.

## Branching Strategy

Recommended branches:
- `main`: protected and deployable
- short-lived feature branches
- emergency fix branches when needed

Examples:
- `feature/memory-candidate-review`
- `fix/calendar-duplicate-creation`
- `security/revoke-stale-sessions`

Avoid long-lived development branches that drift from main.

## Branch Creation

Create a branch for:
- production code changes
- migrations
- security-sensitive changes
- multiple related files
- work requiring review

Direct commits may remain acceptable for isolated low-risk documentation updates in a personal repository.

## Branch Lifetime

Branches should remain short-lived.

If a branch grows too large:
- split it
- merge safe foundations separately
- use feature flags
- rebase or update regularly

## Commit Standards

Commits should be:
- focused
- descriptive
- buildable where practical
- free of secrets
- easy to review

## Commit Message Format

Use a concise imperative summary.

Examples:
- `Add memory candidate review flow`
- `Fix stale Calendar event overwrite`
- `Add deletion propagation tests`

Optional body should explain:
- reason
- tradeoff
- migration note
- risk

Avoid:
- `stuff`
- `updates`
- `final fix`
- `working now`

## Commit Scope

A commit should represent one understandable change.

Do not mix:
- formatting the whole repository
- schema migration
- feature logic
- unrelated bug fixes

unless the changes are inseparable.

## Pull Request Standard

Production code should normally enter main through a pull request.

Each pull request should include:
- summary
- problem solved
- implementation notes
- screenshots or examples when useful
- test evidence
- security and privacy impact
- data or migration impact
- known limitations
- rollback notes

## Pull Request Size

Prefer changes small enough to review carefully.

When a pull request becomes difficult to explain:
- split by vertical slice
- separate mechanical refactor from behavior change
- separate migration from feature enablement

## Draft Pull Requests

Use draft pull requests for:
- early architectural feedback
- visible work in progress
- risky migrations
- large interface changes

Draft status should not replace local testing.

## Review Standard

Review should evaluate:
- correctness
- architectural alignment
- readability
- maintainability
- security
- privacy
- authorization
- data integrity
- failure handling
- test quality
- observability
- documentation

## Review Questions

Reviewers should ask:
- Does this solve the stated problem?
- Is there a simpler design?
- Are permissions enforced server-side?
- What happens when dependencies fail?
- Could this expose sensitive data?
- Is source provenance preserved?
- Can the operation duplicate or overwrite state?
- Is deletion behavior correct?
- Are tests realistic?

## Self-Review

Before requesting review, the author should:
- inspect the final diff
- remove debug code
- verify no secrets exist
- run required tests
- review logging for sensitive data
- confirm migration and rollback notes
- update documentation

## Code Style

Use:
- strict TypeScript
- clear names
- small focused functions
- explicit return types for public boundaries
- immutable data where practical
- early validation
- structured errors

Avoid:
- hidden global state
- unexplained magic values
- broad `any` types
- swallowed errors
- deeply nested control flow
- premature generic frameworks

## TypeScript Standards

The project should enable strict compiler settings.

Avoid using:
- `any` without a documented boundary
- unsafe non-null assertions
- unchecked type coercion
- broad string values where enums or unions are appropriate

External data should remain `unknown` until validated.

## Naming Standards

Use names that describe domain meaning.

Good:
- `approvalExpiresAt`
- `sourceOfTruth`
- `memoryConfidence`

Weak:
- `data2`
- `flag`
- `thing`

## Function Standards

Functions should:
- do one coherent thing
- make side effects explicit
- accept validated inputs
- return structured results
- distinguish expected errors from unexpected failures

## Module Standards

Domain modules should own their logic.

Examples:
- memory promotion belongs in memory domain logic
- Calendar version conflicts belong in the Calendar adapter and sync layer
- action authorization belongs in the approval and execution system

Avoid putting business logic directly inside UI components or route handlers.

## API Standards

APIs should:
- authenticate
- authorize
- validate input
- use stable schemas
- return structured errors
- generate request IDs
- create audit events where required
- avoid exposing internal stack traces

## Validation Standard

Validate at every external boundary:
- API input
- provider response
- model output
- file upload
- webhook
- environment configuration

Use shared schemas where possible.

## Error Handling Standard

Errors should distinguish:
- validation error
- authentication error
- authorization error
- not found
- conflict
- provider error
- retryable failure
- internal error

User-facing messages should explain impact without exposing secrets.

## Logging Standard

Logs should be structured and minimal.

Include:
- request ID
- component
- action
- status
- duration
- sanitized identifiers

Do not log:
- tokens
- passwords
- full Restricted records
- full message bodies
- private model context unless explicitly necessary and protected

## Audit Standard

Application logs and audit logs are different.

Application logs support debugging.

Audit logs preserve meaningful user, permission, data, and action history.

Consequential operations should create audit events even when no error occurs.

## Database Standards

Database changes should use migrations.

Schema design should include:
- stable IDs
- ownership
- timestamps
- versioning
- foreign-key integrity where appropriate
- sensitivity and retention metadata
- indexes based on actual query needs

## Migration Standards

Every migration should define:
- purpose
- forward transformation
- validation
- rollback or roll-forward strategy
- data-loss risk
- deployment order

High-risk migrations require a tested backup.

## Transaction Standards

Use transactions when multiple writes must remain consistent.

Example:
- create task
- create relationship
- create audit event

The system should not leave partially connected canonical state after an ordinary failure.

## External Integration Standards

Each integration adapter should:
- use narrow scopes
- validate provider data
- preserve external IDs and versions
- define retry behavior
- distinguish current, stale, and uncertain state
- support revocation
- create audit events

## Model Integration Standards

Model output should be treated as untrusted input.

It should:
- use structured schemas
- be validated
- preserve uncertainty
- avoid direct database writes
- avoid direct tool execution
- pass through authorization and approval layers

## Prompt Standards

Prompts should:
- clearly separate user instructions from retrieved content
- label untrusted external content
- request structured output where possible
- avoid embedding unnecessary sensitive data
- be versioned for consequential workflows

## Prompt Injection Testing

Any feature that retrieves external content should test:
- instructions inside email
- instructions inside Calendar descriptions
- instructions inside files
- attempts to reveal memory
- attempts to execute actions

## Security Review Triggers

A dedicated security review is required when a change introduces:
- new authentication behavior
- new permission scope
- external write action
- Restricted data
- secret handling
- file upload or parsing
- public sharing
- wearable or sensor access
- new third-party dependency with elevated access

## Privacy Review Triggers

A dedicated privacy review is required when a change introduces:
- new data category
- new memory behavior
- longer retention
- precise location
- health or financial data
- third-party personal data
- new notification surface
- model-provider data transmission

## Testing Pyramid

The project should use:
- many focused unit tests
- database and service integration tests
- a smaller set of end-to-end tests
- targeted manual exploratory testing

## Unit Test Standard

Unit tests should cover:
- domain rules
- validation
- scoring logic
- permission checks
- lifecycle transitions
- conflict classification

## Integration Test Standard

Integration tests should cover:
- database transactions
- provider adapters
- synchronization
- audit creation
- deletion propagation
- model-output validation

## End-to-End Test Standard

End-to-end tests should cover critical user workflows.

Initial required workflows:
- save and delete memory
- No-Memory Mode
- chemistry exam planning
- Calendar event approval and creation
- approval payload mutation
- session revocation
- export
- deletion receipt

## Security Test Standard

Required security tests include:
- authorization bypass attempts
- revoked session access
- expired approval execution
- prompt injection
- secret detection
- duplicate external action prevention
- Restricted data on limited-trust device

## Regression Tests

Every production bug should produce a regression test when practical.

The test should fail before the fix and pass afterward.

## Test Data

Use synthetic data by default.

Test fixtures should include:
- fake people
- fake emails
- fake accounts
- fake health data
- fake addresses

Do not use production data casually.

## Test Naming

Tests should describe behavior.

Good:
`rejects Calendar write when provider version changed`

Weak:
`test update`

## Manual Testing

Manual testing should focus on:
- usability
- privacy in public mode
- confusing approvals
- unexpected context retrieval
- visual accessibility
- recovery from partial failure

## Definition of Ready

A work item is ready when:
- problem is clear
- acceptance criteria exist
- dependencies are understood
- data and permission impact are identified
- test approach is known

## Definition of Done

A change is done when:
- acceptance criteria pass
- code is reviewed
- tests pass
- security and privacy impacts are addressed
- migrations are validated
- documentation is updated
- audit behavior exists where required
- observability is sufficient
- rollback or recovery is understood

## CI Requirements

Continuous integration should run:
- formatting check
- lint
- type check
- unit tests
- integration tests
- build
- secret scan
- dependency scan

High-risk changes may require additional security tests.

## Merge Requirements

Before merge:
- required checks pass
- review comments are resolved
- no known Critical finding remains
- migrations are reviewed
- feature flags are configured
- documentation is current

## Merge Strategy

Recommended default:
- squash merge for ordinary feature branches

Use merge commits when preserving branch history is valuable.

Use rebase carefully and avoid rewriting shared history.

## Main Branch Standard

Main should remain:
- buildable
- testable
- deployable
- free of known Critical security failures

Broken main should be treated as an urgent issue.

## Feature Flags

Use feature flags when:
- a feature is incomplete but safely mergeable
- staged rollout is useful
- rollback through disablement is valuable

Flags should include:
- owner
- purpose
- creation date
- removal date or review date

## Release Workflow

Recommended release flow:
1. Merge reviewed changes.
2. Deploy to staging.
3. Run migrations.
4. Execute automated and manual smoke tests.
5. Verify monitoring.
6. Create backup checkpoint when needed.
7. Deploy to production.
8. Run production smoke tests.
9. Observe errors and key metrics.

## Release Notes

Each release should summarize:
- user-visible changes
- data or migration changes
- security and privacy changes
- known limitations
- rollback notes

## Release Versioning

Use semantic versioning when public releases begin.

Before that, milestone or date-based internal releases are acceptable.

## Smoke Test Standard

Production smoke tests should verify:
- authentication
- canonical object read
- memory retrieval
- Chief session creation
- Calendar sync where enabled
- audit event creation
- background worker health

## Rollback Standard

Every release should identify:
- previous application version
- migration compatibility
- feature flags
- worker pause controls
- integration pause controls
- backup checkpoint

Do not claim rollback is available if the schema change makes it unsafe.

## Incident Workflow

When a production incident occurs:
- contain
- preserve evidence
- communicate current impact
- restore safe operation
- create follow-up work
- add regression tests
- update runbooks and architecture where needed

## Hotfix Workflow

A hotfix should:
- remain narrowly scoped
- include minimum necessary tests
- preserve review where possible
- deploy quickly but not blindly
- be followed by cleanup and retrospective

## Technical Debt

Technical debt should be recorded when:
- a shortcut is intentional
- tests are deferred
- architecture is temporary
- provider behavior is incomplete
- manual recovery is required

Each debt item should contain:
- reason
- consequence
- affected area
- risk
- proposed resolution
- review date

## Unacceptable Debt

Do not knowingly defer:
- authentication enforcement
- authorization
- secret exposure
- deletion correctness
- audit for external actions
- data corruption risk
- Critical security findings

## Refactoring Standard

Refactoring should:
- preserve behavior unless intentionally changed
- include regression coverage
- avoid unrelated feature additions
- improve a named problem

## Documentation Standard

Documentation should be updated when changes affect:
- setup
- environment variables
- architecture
- data schema
- permissions
- integrations
- incident response
- deployment
- user-facing behavior

## Architecture Decision Records

Create an ADR for decisions involving:
- primary technology
- data ownership
- provider choice
- security boundary
- irreversible migration
- major interface pattern
- autonomy policy

## ADR Statuses

Suggested statuses:
- Proposed
- Accepted
- Superseded
- Rejected
- Deprecated

## Documentation Review

Architecture documents should be reviewed when implementation proves them wrong.

The repository should not preserve outdated architecture as if it remains current.

## Dependency Standards

Before adding a dependency, evaluate:
- maintenance activity
- security history
- license
- bundle or runtime cost
- transitive dependencies
- alternatives

## Dependency Updates

Updates should be:
- reviewed
- tested
- grouped sensibly
- monitored after deployment

Major upgrades should not be merged automatically without review.

## Secret Handling Standards

Developers should:
- use `.env.local` or secure keychain
- keep `.env.example` free of real values
- rotate exposed secrets immediately
- avoid copying tokens into issues or chat
- verify client bundles do not contain server secrets

## Local Development Standard

Local setup should support:
- one documented startup command
- repeatable migrations
- seed data
- test reset
- mocked integrations

## Environment Parity

Local, staging, and production should share:
- compatible runtimes
- migration behavior
- validation rules
- configuration schemas

Provider credentials and data must remain separate.

## Observability Standard

Every important background workflow should expose:
- run status
- duration
- error
- retry count
- last success

Consequential external actions should also expose verification state.

## Performance Review

Performance work should be driven by measurement.

Before optimizing:
- measure latency
- identify bottleneck
- define target
- confirm improvement

Avoid sacrificing correctness or auditability for premature speed.

## Accessibility Standard

Every new interface should support:
- keyboard navigation
- focus visibility
- screen-reader naming
- scalable text
- sufficient contrast
- non-color status cues
- reduced motion

## User Experience Review

Changes involving approvals, privacy, memory, or deletion should be reviewed for clarity.

The interface should make it obvious:
- what will happen
- what changed
- what remains uncertain
- how to undo or stop the action

## Security Finding Workflow

Security findings should:
- receive severity
- receive owner
- receive remediation target
- block release when Critical
- be retested before closure

## Privacy Finding Workflow

Privacy findings should:
- identify data category
- identify affected surface
- stop inappropriate processing
- include deletion or correction when needed
- update policy or defaults

## Code Ownership

As the project grows, assign ownership by domain:
- identity and security
- memory and retrieval
- planning and reviews
- integrations
- automation
- interface
- data platform

Ownership should not prevent cross-review for risky changes.

## Release Cadence

During early development:
- release small changes frequently to staging
- release to production only after milestone validation

As stability improves, adopt a predictable cadence without delaying urgent fixes.

## Outcome Review

After significant features launch, review:
- actual usage
- errors
- user corrections
- privacy complaints
- workflow value
- whether the original problem was solved

A merged feature is not automatically a successful feature.

## Development Metrics

Useful metrics include:
- lead time
- deployment frequency
- change failure rate
- test flakiness
- escaped defects
- incident recovery time
- open security findings
- technical debt age

Metrics should improve engineering judgment, not reward raw output volume.

## Failure Modes

### Giant Pull Requests

Changes become too large to review safely.

### Process Theater

Templates and checklists exist without changing behavior.

### Review by Style Only

Review ignores security, data, and failure paths.

### Test Blindness

Tests cover happy paths but not authorization, conflicts, or deletion.

### Main Branch Instability

Broken changes remain on main.

### Documentation Drift

Implementation and architecture diverge silently.

### Hotfix Accumulation

Emergency shortcuts become permanent design.

### Dependency Sprawl

Libraries accumulate faster than they are understood.

### Security as Final Step

Risk review happens after implementation is already committed.

### Architecture Without Delivery

Standards become an excuse to avoid shipping usable slices.

## Phase 1 Implementation

Phase 1 should establish:
- issue templates
- short-lived branches
- pull request template
- strict TypeScript
- formatting and linting
- CI checks
- unit and end-to-end test frameworks
- secret scanning
- dependency scanning
- migration standards
- ADR template
- release checklist
- incident and hotfix workflow

## Success Criteria

The Development Workflow and Standards succeed if:
- work is broken into reviewable slices
- main remains deployable
- code changes preserve security and privacy boundaries
- tests cover consequential failure paths
- migrations and releases are reversible or recoverable
- documentation remains aligned with implementation
- the project ships useful capabilities without losing engineering discipline

## Final Principle

North Vector should move quickly enough to become real, but carefully enough that every new capability remains understandable, testable, and worthy of trust.