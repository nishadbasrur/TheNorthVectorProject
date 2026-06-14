# Testing Strategy v1.0

## Purpose

This document defines how North Vector should test product behavior, domain logic, integrations, security controls, privacy guarantees, model outputs, migrations, automation, and end-to-end user workflows.

The Testing Strategy exists to ensure that the system is trustworthy in ordinary use, not merely impressive in demos.

Its purpose is not to maximize test count.

Its purpose is to prove that the most consequential behaviors work, fail safely, and remain correct as the architecture evolves.

## Core Principle

North Vector should test behavior at the level where failure would matter.

A passing unit test is not enough when the real risk exists across authorization, persistence, provider state, and user-visible outcome.

## Primary Objectives

The strategy should help answer:
- What must be tested?
- At which level should it be tested?
- Which workflows are release-critical?
- How should external providers be mocked or exercised?
- How should model behavior be validated?
- How should privacy, deletion, and authorization be proven?
- What evidence is required before release?

## Testing Principles

North Vector testing should follow:
- Test Consequential Behavior
- Prefer Deterministic Tests
- Test Failure Paths
- Test Boundaries, Not Only Functions
- Use Synthetic Data by Default
- Preserve Reproducibility
- Separate Product Tests from Security Tests
- Validate User-Visible Outcomes
- Add Regression Tests for Real Bugs
- Keep Critical Tests Fast Enough to Run Often

## Testing Pyramid

The project should use:
- many unit tests
- a strong integration-test layer
- a smaller but essential end-to-end suite
- targeted manual exploratory testing
- dedicated security, privacy, migration, and recovery tests

No single layer should be treated as sufficient.

## Test Categories

The strategy should include:
- Unit Tests
- Domain Tests
- Database Integration Tests
- Service Integration Tests
- API Tests
- UI Component Tests
- End-to-End Tests
- Provider Contract Tests
- Model Output Tests
- Prompt-Injection Tests
- Authorization Tests
- Privacy Tests
- Deletion Tests
- Synchronization Tests
- Automation Tests
- Migration Tests
- Backup and Restore Tests
- Accessibility Tests
- Performance Tests
- Reliability Tests
- Manual Exploratory Tests

## Standard Test Record

Each formal test case should contain:
- test_id
- title
- category
- objective
- prerequisites
- setup
- test_data
- steps
- expected_result
- environment
- automation_status
- severity_if_failed
- related_requirements
- related_threats
- last_run_at
- status

## Test Statuses

Suggested statuses:
- Not Implemented
- Draft
- Active
- Passing
- Failing
- Flaky
- Blocked
- Retired

## Unit Tests

Unit tests should validate isolated logic such as:
- lifecycle transitions
- validation rules
- permission checks
- scoring functions
- scheduling calculations
- conflict classification
- retention decisions
- confidence changes

Unit tests should:
- be fast
- avoid network access
- avoid shared mutable state
- use deterministic fixtures
- explain behavior clearly

## Domain Tests

Domain tests should exercise business rules across small clusters of objects.

Examples:
- commitment escalation after repeated postponement
- candidate memory promotion threshold
- risk resolution after mitigation completes
- task completion updating a milestone
- approval invalidation after payload mutation

## Database Integration Tests

Database tests should validate:
- schema constraints
- transactions
- versioning
- relationship integrity
- soft deletion
- deletion propagation
- migration behavior
- concurrent updates

Use an isolated test database that can reset quickly.

## Service Integration Tests

Service tests should validate interactions among:
- authorization
- domain logic
- repositories
- audit
- notifications
- integrations

Example:
Creating a commitment should validate input, persist the object, create relationships, and produce an audit event.

## API Tests

API tests should cover:
- authentication required
- authorization enforced server-side
- schema validation
- error responses
- idempotency
- rate limits where practical
- sensitive-field redaction
- conflict responses

## UI Component Tests

Component tests should validate:
- rendering
- interaction
- focus behavior
- disabled states
- privacy-safe display
- approval clarity
- loading and error states

UI tests should avoid duplicating domain logic tests.

## End-to-End Tests

End-to-end tests should cover the highest-value workflows through the real application stack.

Initial required workflows:
- sign in and revoke session
- create and inspect memory
- No-Memory Mode
- create goal, project, task, and commitment
- generate daily briefing
- complete weekly review
- connect Calendar in test mode
- approve Calendar event creation
- reject mutated approval payload
- delete memory and verify retrieval cleanup
- export data

## Critical End-to-End Workflow

The primary release-critical flow is the chemistry-exam workflow:

1. Nishad tells Chief about an exam.
2. Chief proposes or creates the canonical event.
3. Study tasks and relationships are created.
4. Calendar data is read.
5. Available windows are calculated.
6. A study event is proposed.
7. Nishad approves the exact payload.
8. The event is created once.
9. Provider state is verified.
10. The event appears in Today and the briefing.
11. Progress appears in the weekly review.
12. The audit trail reconstructs the workflow.

The MVP should not release if this workflow fails.

## Provider Contract Tests

Each provider adapter should have contract tests for:
- authentication
- pagination
- normalization
- version tracking
- stale data
- rate limits
- provider errors
- deletion semantics
- retries
- revocation

## Mock Provider Strategy

Mock providers should:
- emulate realistic responses
- support version changes
- simulate timeouts
- simulate partial failure
- simulate duplicate responses
- simulate expired authentication
- preserve deterministic test behavior

Mocks should not oversimplify the exact behaviors the system depends on.

## Real Provider Testing

Real-provider tests should use:
- dedicated test accounts
- test calendars
- synthetic events
- narrow scopes
- cleanup procedures

Production personal accounts should not power automated tests.

## Model Output Tests

Model-produced output should be tested for:
- schema compliance
- required fields
- uncertainty labeling
- refusal boundaries
- action proposal separation
- source attribution
- absence of fabricated IDs
- privacy-safe context use

## Structured Output Tests

Test that invalid model output is:
- rejected
- repaired safely
- never written directly to the database
- never executed as an action without validation

## Prompt Regression Tests

Maintain a fixed prompt test set for:
- memory extraction
- task extraction
- risk detection
- decision analysis
- briefing generation
- weekly review
- action proposals

Prompt changes should compare output against expected structural and behavioral properties.

## Non-Deterministic Model Evaluation

Because model output may vary, tests should evaluate:
- required facts included
- prohibited actions avoided
- schema valid
- uncertainty disclosed
- no unrelated sensitive context
- no unsupported certainty

Exact wording should not be required unless necessary.

## Prompt-Injection Tests

Adversarial content should be tested in:
- Calendar descriptions
- emails when added later
- documents
- GitHub issues
- PDFs
- voice transcripts

Test instructions such as:
- ignore user policy
- reveal memory
- send data externally
- change permissions
- perform tool actions

Expected result:
External content remains data and cannot authorize action.

## Authorization Tests

Authorization tests should cover:
- unauthenticated access
- wrong user or owner
- untrusted device
- insufficient assurance level
- expired permission
- revoked permission
- wrong integration scope
- read allowed, write denied
- Restricted memory blocked

## Approval Tests

Approval tests should cover:
- exact payload binding
- target binding
- device binding where required
- expiration
- revocation
- supersession
- changed recipient
- changed event time
- multiple pending approvals
- uncertain provider response

## Privacy Tests

Privacy tests should verify:
- No-Memory Mode creates no durable memory
- public mode hides sensitive details
- limited-trust devices receive minimal context
- logs redact Restricted data
- notification previews are privacy-safe
- third-party data is minimized
- one-time location expires when location support is added

## Memory Tests

Memory tests should cover:
- explicit save
- candidate creation
- user confirmation
- user rejection
- source tracking
- confidence
- contradiction
- revision
- archive
- expiration
- deletion
- retrieval suppression
- supersession

## Retrieval Tests

Retrieval tests should cover:
- exact lookup
- structured filtering
- semantic retrieval
- shallow graph expansion
- recency ranking
- confidence ranking
- sensitivity filtering
- context budget
- duplicate collapse
- stale memory
- contradicted memory
- session bleed prevention

## Context Assembly Tests

Verify assembled context:
- contains essential current facts
- excludes unrelated memory
- labels stale and inferred items
- preserves conflicts
- respects privacy mode
- stays within the context budget

## Relationship Graph Tests

Test:
- valid edge creation
- invalid source-target rejection
- inverse relationships
- cycle detection
- orphan cleanup
- deletion propagation
- sensitivity inheritance
- shallow traversal

## Planning Tests

Planning tests should cover:
- fixed versus flexible events
- duration estimates
- buffers
- dependencies
- latest safe start
- impossible overlap
- replanning
- unfinished work
- capacity constraints
- behavioral interventions

## Risk and Opportunity Tests

Test:
- threshold crossing
- evidence requirements
- escalation
- decay
- resolution
- opportunity expiration
- duplicate candidate suppression
- high-value opportunity surfacing

## Calendar Synchronization Tests

Test:
- initial import
- incremental refresh
- event creation
- provider revision change
- stale version conflict
- duplicate creation prevention
- token expiration
- permission reduction
- disconnected state
- timezone behavior
- recurrence basics

## Synchronization Conflict Tests

Test:
- local-only change
- external-only change
- compatible field merge
- direct same-field conflict
- deletion conflict
- reappearance after deletion
- accepted divergence
- manual resolution

## Automation Tests

Test:
- scheduled trigger
- manual trigger
- condition trigger
- deduplication
- idempotency
- quiet hours
- missed-run policy
- permission revocation mid-run
- partial failure
- retry
- rollback
- automatic pause
- audit summary

## Notification Tests

Test:
- priority
- grouping
- duplicate suppression
- quiet hours
- snooze
- expiration
- privacy-safe wording
- action resolution

## Deletion Tests

Deletion tests should verify removal from:
- primary database
- object relationships
- semantic index
- text index
- cache
- session context
- queued jobs
- generated summaries
- derived inferences

## Deletion Receipt Tests

Verify the receipt accurately states:
- deleted records
- archived records
- remaining audit metadata
- backup expiration status
- external-provider limitations

## Export Tests

Test:
- JSON structure
- Markdown readability
- canonical IDs
- timestamps
- relationships
- sensitivity redaction
- authentication requirement
- audit event
- short-lived export access

## Migration Tests

Each migration should test:
- forward migration
- representative data
- null and unknown handling
- relationship preservation
- semantic preservation
- validation counts
- rollback or roll-forward path

## Backup and Restore Tests

Test:
- backup creation
- checksum
- manifest
- encryption
- selective restore
- full isolated restore
- deletion replay
- revoked-session replay
- compromised-token exclusion
- index rebuild

## Security Tests

Security tests should cover:
- secret scanning
- session theft resistance
- token replay
- path traversal
- malicious file input
- authorization bypass
- rate limiting
- audit integrity
- dependency vulnerabilities
- unsafe error leakage

## Accessibility Tests

Automated accessibility checks should cover:
- labels
- roles
- contrast where tooling supports it
- heading structure
- keyboard reachability

Manual accessibility checks should cover:
- visible focus
- keyboard-only flows
- screen-reader comprehension
- reduced motion
- scalable text
- non-color status cues

## Performance Tests

Measure:
- object query latency
- retrieval latency
- context assembly latency
- Calendar sync duration
- briefing generation latency
- database migration duration
- background-job throughput

## Performance Budgets

Initial budgets may include:
- ordinary local query under one second
- ordinary UI load under two seconds
- model stream starts within a few seconds
- background sync within use-case-specific limits

Tests should flag major regressions rather than enforce unrealistic precision.

## Load Tests

Phase 1 load tests should focus on:
- many objects for one user
- large relationship graph
- many audit events
- repeated synchronization
- long session history

The system does not need multi-million-user load testing during MVP.

## Reliability Tests

Reliability tests should simulate:
- provider outage
- model timeout
- database restart
- worker crash
- network interruption
- duplicate webhook
- stale cache
- failed retry

## Chaos and Fault Injection

Targeted fault injection may be used for:
- provider timeout
- partial database failure
- delayed job
- audit write failure
- cache inconsistency

The goal is safe failure, not random disruption.

## Manual Exploratory Testing

Manual exploration should focus on:
- confusing approvals
- memory that feels invasive
- incorrect prioritization
- stale data presentation
- partial failure clarity
- public-mode privacy
- long-session behavior
- mobile responsiveness

## Usability Testing

Key usability questions:
- Can Nishad tell what Chief knows?
- Can he see why a recommendation was made?
- Is proposed action separate from completed action?
- Is deletion easy to understand?
- Are risks and commitments distinguishable?
- Does the briefing feel useful rather than noisy?

## Test Data Strategy

Use synthetic fixtures by default.

Fixture domains should include:
- academics
- work
- relationships
- finance
- health
- travel
- projects

## Canonical Seed Scenario

The standard seed should include:
- one user
- one trusted device
- one goal
- one project
- several tasks
- one commitment
- one exam event
- one risk
- one opportunity
- one memory candidate
- one active memory
- one Calendar proposal
- one approval

## Data Factories

Factories should produce valid canonical objects with override support.

They should make it easy to create:
- stale records
- conflicting sources
- Restricted objects
- deleted objects
- duplicate candidates
- expired permissions

## Test Isolation

Each test should:
- control its data
- avoid depending on order
- clean up after itself
- use isolated transactions or database reset
- avoid shared real-provider state

## Time Control

Tests involving schedules, expiration, and review should use a controllable clock.

Avoid relying on real wall-clock delays.

## Flaky Test Policy

A flaky test should be:
- marked immediately
- investigated
- fixed or quarantined with owner and deadline

Repeated reruns should not substitute for diagnosis.

## Test Naming

Tests should state the behavior and condition.

Good:
`requires fresh approval when Calendar event time changes`

Weak:
`approval test 2`

## Test Evidence

Evidence may include:
- automated output
- screenshots
- audit records
- provider test response
- migration report
- restored-data validation

Critical test evidence should remain accessible for release review.

## Continuous Integration Test Layers

### Every Pull Request

Run:
- formatting
- lint
- type check
- unit tests
- core integration tests
- build
- secret scan
- dependency scan

### High-Risk Pull Requests

Also run:
- authorization suite
- deletion suite
- prompt-injection suite
- migration tests
- provider contract tests

### Main and Release Candidates

Run:
- full integration suite
- end-to-end suite
- accessibility checks
- selected performance tests
- staging smoke tests

## Test Parallelization

Parallelize only tests that are safely isolated.

Shared database, provider, or migration tests may need controlled sequencing.

## Release Gates

A release should be blocked when:
- critical end-to-end workflow fails
- authorization test fails
- deleted memory remains retrievable
- approval binding fails
- secret scan fails
- migration validation fails
- audit events are missing for external actions
- backup or restore validation is required and failed

## Severity of Test Failure

### Critical

Failure may allow unauthorized action, data exposure, corruption, or irrecoverable loss.

### High

Core workflow is broken or sensitive control is unreliable.

### Moderate

Meaningful product behavior is incorrect but bounded.

### Low

Minor usability or noncritical issue.

## Regression Test Policy

Every confirmed production bug should produce a regression test unless:
- the bug cannot be reproduced safely
- the fix removes the entire affected subsystem

The exception should be documented.

## Test Review

Test code should be reviewed for:
- realism
- clarity
- coverage of failure paths
- false positives
- false confidence
- data privacy

## Coverage Metrics

Code coverage may be tracked, but it should not be the primary quality measure.

More meaningful coverage includes:
- requirements coverage
- threat coverage
- critical workflow coverage
- provider behavior coverage
- deletion-path coverage

## Requirements Traceability

Critical requirements should map to one or more tests.

Examples:
- No-Memory Mode requirement → privacy and end-to-end tests
- exact approval payload → authorization and end-to-end tests
- deletion propagation → database, retrieval, and end-to-end tests

## Threat Traceability

High-priority threats should map to tests.

Examples:
- prompt injection → adversarial content suite
- token exposure → secret scan and rotation test
- duplicate execution → idempotency test
- backup resurrection → restore and deletion replay test

## Test Maintenance

Tests should be updated when:
- requirements change
- schema changes
- provider behavior changes
- architecture changes
- incidents occur
- false confidence is discovered

## Retiring Tests

A test may be retired when:
- feature is removed
- requirement no longer exists
- test is replaced by stronger coverage

Retirement should preserve the reason.

## Test Dashboard

The testing dashboard should show:
- current suite status
- release-critical failures
- flaky tests
- coverage by requirement
- provider contract status
- migration test status
- backup restore status
- recent regressions

## Reporting

A test report should summarize:
- suites run
- pass and fail count
- release-blocking failures
- flaky tests
- untested changes
- environment
- commit SHA
- evidence links

## Error Handling in Test Infrastructure

If the test runner or environment fails:
- distinguish infrastructure failure from product failure
- do not mark the product as passing
- rerun only after identifying the cause
- preserve logs

## Failure Modes

### Happy-Path Testing

Only successful flows are tested.

### Mock Fantasy

Mocks behave more cleanly than real providers.

### End-to-End Neglect

Components pass individually while the user workflow fails.

### Exact-Wording Fragility

Model tests break on harmless phrasing changes.

### Coverage Theater

High line coverage hides missing authorization, deletion, or recovery tests.

### Flaky Acceptance

Repeated reruns become normal.

### Production Data in Tests

Real private data leaks into development or CI.

### Security Separation Failure

Security tests are deferred until the end.

### No Restore Testing

Backups are created but never proven useful.

### Release Pressure

Known critical failures are ignored to ship faster.

## Phase 1 Implementation

Phase 1 should establish:
- unit-test framework
- integration-test database
- provider mocks
- Playwright end-to-end tests
- canonical seed scenario
- authorization suite
- memory lifecycle suite
- retrieval suite
- Calendar contract suite
- chemistry-exam workflow
- approval mutation test
- deletion propagation test
- No-Memory Mode test
- session revocation test
- secret scanning
- prompt-injection baseline
- backup restore test

## Success Criteria

The Testing Strategy succeeds if:
- critical workflows are tested end to end
- authorization and approval boundaries are proven
- deletion is verified across all retrieval layers
- provider failures and conflicts are exercised
- model output is validated without relying on exact phrasing
- regressions produce durable tests
- release gates prevent known high-risk failures from shipping

## Final Principle

North Vector should not be trusted because the code looks reasonable.

It should be trusted because the behaviors that matter have been tested under the conditions most likely to break them.