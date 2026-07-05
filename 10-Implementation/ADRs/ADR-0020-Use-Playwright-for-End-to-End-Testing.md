# ADR-0020: Use Playwright for End-to-End Testing

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
- Security Owner
- Operations Owner

## Related Documents

- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Development_Workflow_and_Standards.md`
- `10-Implementation/Deployment_and_Operations_Plan.md`
- `10-Implementation/Release_Checklist.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0008-Use-Next.js-for-the-Phase-1-Web-Application.md`
- `10-Implementation/ADRs/ADR-0019-Use-GitHub-Actions-for-Continuous-Integration.md`

## Context

North Vector Phase 1 requires end-to-end testing across workflows that span:
- authentication
- session and device state
- canonical objects
- memory lifecycle
- Chief conversation
- planning
- Google Calendar synchronization
- approval
- execution
- verification
- audit history
- export
- deletion

Unit and integration tests are necessary, but they cannot prove that the full application behaves correctly from the user's point of view.

The MVP has several release-critical workflows where failure may occur only when browser state, server logic, database transactions, provider adapters, and UI rendering interact together.

Examples include:
- a revoked session still showing cached private data
- a changed Calendar payload remaining approvable
- deleted memory disappearing from the database but remaining visible in the interface
- a streamed Chief response failing to create the intended structured proposal
- an approved event being created twice after retry

The testing tool should support modern browser automation, reliable waiting, network inspection, screenshots, traces, multiple browser engines, authenticated state, and CI execution.

## Decision Drivers

- reliable browser automation
- strong TypeScript support
- Next.js compatibility
- deterministic waiting
- network and request inspection
- screenshots and traces
- CI integration
- cross-browser coverage
- authenticated-session support
- accessibility-friendly selectors
- parallel execution
- maintainability by one developer

## Options Considered

### Option A: Playwright

Description:
Use Playwright as the primary end-to-end browser automation framework.

Advantages:
- first-class TypeScript support
- Chromium, Firefox, and WebKit coverage
- automatic waiting
- strong locator model
- trace viewer
- screenshots and video
- network interception
- storage-state and authentication support
- good CI tooling
- active development and documentation
- suitable for Next.js and streamed interfaces

Disadvantages:
- browser binaries add installation and CI time
- tests can still become flaky if state and selectors are poorly designed
- parallel execution requires isolated data
- full browser tests are slower than unit and integration tests

Risks:
- test suite becomes too broad and slow
- developers rely on brittle visual or text selectors
- trace artifacts contain private data if real accounts are used

### Option B: Cypress

Description:
Use Cypress for browser-based end-to-end testing.

Advantages:
- strong interactive developer experience
- broad ecosystem
- good debugging interface
- familiar frontend-testing model

Disadvantages:
- browser and multi-tab behavior has historically been more constrained
- architecture differs from a real external browser process
- some cross-origin and provider flows may require additional work
- WebKit coverage is not equivalent to Playwright's model

Risks:
- authentication and multi-context workflows become awkward
- tests depend on Cypress-specific behavior

### Option C: Selenium or WebDriver

Description:
Use Selenium-based browser automation.

Advantages:
- mature standard
- broad browser support
- language-independent ecosystem
- widely understood

Disadvantages:
- more boilerplate
- weaker default waiting ergonomics
- slower debugging experience
- greater setup and maintenance overhead

Risks:
- flaky timing behavior
- implementation slows due to infrastructure and driver issues

### Option D: Browserless Integration Tests Only

Description:
Test API routes, React components, and services without running a real browser.

Advantages:
- faster tests
- simpler CI
- easier deterministic setup
- lower maintenance

Disadvantages:
- cannot validate actual navigation, cookies, browser caching, focus, or rendering
- misses user-visible integration failures
- weak evidence for release-critical workflows

Risks:
- all components pass while the real product fails
- browser security and session behavior remain untested

### Option E: Manual End-to-End Testing Only

Description:
Use a release checklist and manually exercise the application.

Advantages:
- flexible exploration
- low automation setup cost
- useful for usability judgment

Disadvantages:
- slow and inconsistent
- difficult to reproduce
- easy to skip under release pressure
- regression coverage does not accumulate

Risks:
- critical workflow failures recur
- release confidence depends on memory

## Decision

North Vector will use Playwright as the primary end-to-end testing framework for Phase 1.

Playwright will test release-critical workflows through the real web application and database stack using synthetic data and fake or dedicated provider environments.

The initial browser target will be Chromium for fast pull-request feedback.

Release-candidate or scheduled suites should also cover WebKit and Firefox for the highest-value workflows when practical.

## Required End-to-End Workflows

The Phase 1 suite should include:
- sign in and sign out
- session expiration and revocation
- trusted and untrusted device behavior
- create and inspect memory
- confirm and reject memory candidates
- No-Memory Mode
- create goal, project, task, and commitment
- Today view
- daily briefing
- weekly review
- connect Calendar test account or fake provider
- synchronize events
- propose Calendar event creation
- approve exact payload
- reject mutated payload
- create event exactly once
- verify provider state
- delete memory and verify retrieval cleanup
- export data

## Release-Critical Chemistry Exam Test

The primary end-to-end scenario should:
1. authenticate the test user
2. enter a chemistry exam through Chief
3. create or approve the exam Event
4. create linked study Tasks
5. synchronize Calendar constraints
6. propose a study block
7. inspect the exact action payload
8. approve the action
9. create the Calendar event once
10. verify the provider result
11. show the plan in Today and the daily briefing
12. show progress in the weekly review
13. confirm the audit chain

This workflow should block MVP release when failing.

## Test Environment

End-to-end tests should run against:
- a dedicated test application instance or local test server
- an isolated database (originally PostgreSQL; actually Firestore, see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md` — note no isolated test Firestore instance actually exists yet, local dev has been hitting the real project)
- synthetic seed data
- test authentication configuration
- fake providers by default
- dedicated real-provider test accounts only for contract or staging validation

Tests must never use Nishad's real production personal data.

## Test Data Isolation

Each test or test worker should use isolated data through one of:
- unique test user or tenant identifier
- database schema or transaction reset
- deterministic seeded namespace
- full database reset between suites

Parallel tests must not mutate the same objects unless the test explicitly validates concurrency.

## Authentication Strategy

Playwright may use storage state to avoid repeating expensive authentication setup for every test.

However, authentication-specific tests must still exercise:
- login
- logout
- expiration
- revocation
- reauthentication
- wrong-account access

Stored authentication state must be synthetic and treated as a secret artifact.

## Selector Strategy

Tests should prefer:
- accessible role
- label
- visible name
- stable test ID only when semantic selectors are insufficient

Avoid brittle selectors based on:
- generated class names
- DOM position
- incidental styling
- long exact text that may change harmlessly

Test IDs should describe user-facing purpose, not implementation structure.

## Waiting Strategy

Tests should wait for observable application state rather than arbitrary sleep delays.

Good waits include:
- element becomes visible
- response reaches expected status
- action state becomes Verified
- audit entry appears
- sync freshness timestamp changes

Fixed timeouts should be rare and justified.

## Network Control

Playwright may intercept or mock network calls for:
- model providers
- Calendar provider
- object storage
- authentication edge cases
- provider timeout and rate-limit scenarios

Provider contract tests should remain separate from application-flow tests so mocks do not create false confidence about real provider behavior.

## Trace and Artifact Policy

On failure, CI should preserve:
- trace
- screenshot
- video when useful
- console logs
- sanitized network metadata

Artifacts should:
- contain only synthetic data
- exclude secrets and raw tokens
- use bounded retention
- be accessible only to authorized repository users

## Browser Coverage

### Pull Requests

Run critical workflows in Chromium.

### Main and Release Candidates

Run the critical workflow in:
- Chromium
- WebKit
- Firefox where practical

Broader cross-browser coverage may remain scheduled if runtime becomes excessive.

## Mobile and Responsive Coverage

Phase 1 is desktop-first, but selected tests should verify:
- narrow viewport does not expose or hide critical controls incorrectly
- approval and deletion dialogs remain usable
- navigation remains functional

Full mobile-product behavior is not required for MVP.

## Accessibility Integration

Playwright tests should use semantic locators and may integrate automated accessibility checks.

Critical flows should verify:
- keyboard navigation
- visible focus
- dialog focus management
- labeled controls
- approval and destructive-action clarity

Automated checks do not replace manual screen-reader review.

## Flaky Test Policy

A flaky end-to-end test should be:
- marked immediately
- assigned an owner
- investigated
- fixed or quarantined with a deadline

Repeated reruns are not an acceptable steady-state solution.

Quarantined release-critical tests still block release unless a documented exception proves the failure is test infrastructure rather than product behavior.

## Test Organization

Suggested structure:

```text
apps/web/e2e/
  auth/
  memory/
  planning/
  calendar/
  approval/
  deletion/
  export/
  fixtures/
  helpers/
```

Tests should focus on user-visible workflows rather than reproducing every lower-level domain rule.

## Page Objects and Helpers

Small reusable helpers may be used for:
- authentication
- seed setup
- provider fake control
- navigation
- audit assertions

Avoid large page-object layers that hide the actual workflow and make tests difficult to read.

## CI Integration

GitHub Actions should (as originally planned — not implemented; the actual `.github/workflows/ci.yml` runs typecheck/lint/test/build only, no Playwright or database service step):
1. install Playwright browsers
2. start a database (originally PostgreSQL; would actually be Firestore/emulator now, see ADR-0101)
3. apply migrations (moot for Firestore)
4. seed synthetic data
5. start the web and worker processes
6. run Playwright
7. upload traces and screenshots on failure
8. stop and clean up services

CI should use pinned Playwright and browser versions through the lockfile.

## Performance of the Test Suite

The suite should remain layered.

Do not move every condition into Playwright.

Use Playwright for:
- real browser behavior
- multi-layer workflow integration
- user-visible security and privacy state
- release-critical flows

Use unit and integration tests for:
- exhaustive state transitions
- edge-case validation
- domain calculations
- repository behavior
- provider adapter contracts

## Security Tests in Playwright

End-to-end security checks should include:
- anonymous user cannot access private pages
- revoked session loses access
- limited-trust device receives reduced content
- frontend cannot bypass server-side approval
- changed action payload requires new approval
- sensitive export requires reauthentication
- private data is not visible after sign-out through browser back navigation or stale cache

## Privacy Tests in Playwright

Privacy-focused scenarios should include:
- No-Memory Mode creates no durable candidate or memory
- public view hides sensitive details
- deleted memory disappears from inspector and retrieval
- expired export link fails
- disconnected Calendar stops showing newly fetched data
- notification or UI preview uses privacy-safe wording

## Failure-State Tests

The suite should exercise:
- model timeout
- Calendar provider outage
- expired OAuth token
- worker unavailable
- stale data
- partial workflow failure
- uncertain external-action result
- database conflict

The UI should represent these states accurately rather than showing generic success or failure.

## Testing Requirements

Required validation of the Playwright setup includes:
- clean local run succeeds
- CI run succeeds
- screenshots and traces upload on failure
- parallel tests remain isolated
- fixed sleeps are absent from critical tests
- authentication state is protected
- Chromium release-critical flow passes
- WebKit critical smoke test passes before production release
- one intentionally failing test produces useful evidence
- real personal data never enters artifacts

## Rationale

Playwright is the best fit for North Vector's modern TypeScript and Next.js stack.

Its browser coverage, automatic waiting, strong locator model, tracing, and CI support make it well suited to the product's release-critical workflows.

The most important benefit is not convenience. It is evidence that the real application preserves trust boundaries across the browser, server, database, provider adapter, and worker.

The decision accepts that browser tests are slower and more fragile than lower-level tests. That is why the suite should remain focused on high-value workflows rather than becoming the only testing layer.

## Consequences

### Positive Consequences

- real browser validation
- strong TypeScript integration
- excellent failure traces
- cross-browser support
- reliable waiting and locators
- strong authentication-state support
- straightforward GitHub Actions integration
- release-critical workflows become repeatable
- privacy and cache behavior can be tested visibly

### Negative Consequences

- slower CI
- browser installation overhead
- test-data isolation complexity
- potential flakiness
- artifacts require privacy controls
- real-provider flows still require separate contract testing

### Operational Consequences

- CI runners need Playwright browser dependencies
- failures produce artifacts requiring bounded storage
- end-to-end environment startup and cleanup must be reliable
- test runtime should be monitored
- release workflows may require cross-browser matrices

### Security and Privacy Consequences

- test environments must use synthetic data
- authentication storage state must be protected
- traces and screenshots may contain sensitive test content
- provider secrets must remain unavailable to untrusted pull requests
- tests should verify stale-cache and browser-history privacy behavior

### Data and Migration Consequences

- end-to-end suites require repeatable migrations and seeds
- synthetic fixtures should reflect canonical object relationships
- migration changes must keep test setup current
- test cleanup must not affect staging or production

## Validation Plan

The decision will be validated through:
- Playwright setup in the repository
- authentication smoke test
- memory lifecycle flow
- approval mutation test
- deletion propagation test
- chemistry-exam end-to-end workflow
- CI artifact review
- Chromium and WebKit execution
- flakiness review after the first ten CI runs

The choice should be considered successful when failures are reproducible and diagnosable, and the release-critical workflows remain stable without excessive maintenance.

## Rollback or Exit Strategy

If Playwright becomes inadequate, North Vector may migrate to another browser-testing framework.

Migration should:
1. preserve the list of release-critical workflows
2. recreate synthetic fixtures and environment controls
3. preserve browser and privacy coverage
4. validate CI artifact behavior
5. run both suites temporarily for critical flows
6. remove Playwright only after equivalent coverage exists
7. use a superseding ADR

The project should not fall back to manual-only end-to-end validation.

## Residual Risks

- flaky timing or environment behavior
- browser updates change rendering or selectors
- test suite grows too slow
- mocks differ from real providers
- traces leak synthetic-but-sensitive-looking content
- cross-browser differences remain undiscovered if scheduled tests are skipped
- local and CI environment drift

## Assumptions

- Phase 1 remains a browser-based Next.js application
- GitHub-hosted runners support required browsers
- synthetic test data can represent critical workflows
- the application can expose deterministic test hooks without weakening production security
- one developer can maintain a focused end-to-end suite
- browser testing complements rather than replaces lower-level tests

## Review Triggers

Revisit this ADR when:
- flakiness materially slows development
- CI runtime becomes unacceptable
- a native desktop or mobile application becomes primary
- browser coverage requirements change
- Playwright maintenance or security posture declines
- another framework materially improves reliability
- test artifacts create privacy concerns

## Review Date

After the first production release or when the first review trigger occurs.

## Outcome

### Expected Outcome

Playwright should provide reliable end-to-end evidence that North Vector's most important workflows work safely through the real browser and application stack.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Use Playwright during Phase 1 test setup and review flakiness, runtime, and diagnostic quality after the first full release cycle.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |