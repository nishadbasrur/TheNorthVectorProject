# ADR-0037: Use Contract Testing for External Provider Integrations

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use contract testing for external provider integrations.

Provider integrations must be validated against explicit behavioral contracts to detect incompatibilities before they reach production workflows.

## Context

North Vector depends on external systems such as:
- Google Calendar
- authentication providers
- AI model providers
- storage providers
- notification providers
- future integrations

External providers evolve independently.

They may change:
- payload structures
- validation requirements
- rate limits
- error formats
- authentication behavior
- API versions

Traditional unit tests cannot guarantee that assumptions about external systems remain valid.

## Decision Drivers

- integration reliability
- provider change detection
- safer upgrades
- deployment confidence
- reduced production failures
- provider abstraction support

## Contract Principles

A contract defines:
- expected requests
- expected responses
- required fields
- optional fields
- error handling
- version assumptions

Contracts should focus on behavior rather than implementation details.

## Applicable Integrations

Contract tests should be created for:
- Google Calendar
- model providers
- authentication integrations
- storage providers
- notification systems
- future external dependencies

## Test Types

### Provider Contract Tests

Verify that provider behavior matches expectations.

Examples:
- create event
- update event
- delete event
- refresh authentication

### Adapter Contract Tests

Verify that North Vector adapters expose a consistent internal interface regardless of provider.

## Provider Abstraction Relationship

Contract testing supports provider abstraction.

All providers implementing the same interface should pass the same contract suite where practical.

Example:

```text
Calendar Provider Interface
  Google Calendar
  Future Calendar Provider
```

Both implementations should satisfy identical behavioral expectations.

## Test Environments

Contract tests may use:
- dedicated provider test accounts
- sandbox environments
- controlled staging systems

Production accounts should not be used.

## Data Requirements

Contract tests must use:
- synthetic data
- test calendars
- test identities
- disposable resources

Real personal information must not be required.

## Failure Detection

Contract tests should detect:
- schema changes
- missing fields
- API version incompatibilities
- authentication regressions
- behavior changes
- unexpected error responses

## Error Handling

Contract tests should verify:
- expected failures
- timeout handling
- authorization failures
- rate limiting
- unavailable services

Success-only testing is insufficient.

## CI Integration

Contract tests may run:
- on schedule
- before releases
- after provider upgrades
- during integration development

The execution frequency may vary depending on provider cost and rate limits.

## Consequences

### Positive

- earlier integration failure detection
- safer provider upgrades
- stronger abstraction boundaries
- improved deployment confidence
- reduced production surprises

### Negative

- additional maintenance effort
- test-account management
- provider-rate-limit considerations
- occasional false positives when providers change intentionally

## Implementation Notes

Typical structure:

```text
Provider Interface
  -> Shared Contract Suite
  -> Provider-Specific Adapter
```

The contract suite should express expected behavior.

The adapter implementation should satisfy that behavior.

## Relationship to Unit Tests

Unit tests verify local logic.

Contract tests verify assumptions about external systems.

Both are required.

## Relationship to End-to-End Tests

Playwright validates user-visible workflows.

Contract tests validate provider behavior directly.

They serve different purposes.

## Testing Requirements

Tests should verify:
- provider authentication works as expected
- required fields remain available
- adapter outputs remain canonical
- provider errors are normalized correctly
- version changes are detected
- unsupported provider behavior fails clearly

## Outcome

North Vector gains a reliable mechanism for detecting provider incompatibilities early while preserving abstraction boundaries and reducing integration-related production failures.