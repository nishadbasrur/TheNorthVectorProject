# ADR-0044: Use Structured Error Taxonomy and Normalized Failure Codes

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use a structured error taxonomy and normalized failure codes across services, APIs, workflows, integrations, and background jobs.

Errors should be categorized consistently so that users, developers, monitoring systems, and operational tooling can reason about failures predictably.

## Context

North Vector interacts with:
- databases
- model providers
- Calendar providers
- authentication systems
- storage providers
- workflow engines
- approval systems
- background workers

Each dependency may produce different error formats.

Without normalization:
- troubleshooting becomes difficult
- monitoring becomes inconsistent
- retry behavior becomes unreliable
- user-facing messaging becomes fragmented

The platform requires a consistent failure language.

## Decision Drivers

- observability
- reliability
- consistency
- operational clarity
- user experience
- automated recovery
- auditability

## Error Principles

Errors should be:
- categorized
- machine-readable
- actionable
- traceable
- consistent

Errors should not rely exclusively on free-form text.

## Error Structure

Recommended fields:

```text
error_code
error_category
message
correlation_id
retryable
source
```

Human-readable messages may vary.

Error codes should remain stable.

## Error Categories

Examples:

### Validation Errors

```text
VALIDATION_ERROR
```

Examples:
- invalid input
- missing required fields
- schema violations

### Authorization Errors

```text
AUTHORIZATION_ERROR
```

Examples:
- insufficient permissions
- denied policy evaluation

### Authentication Errors

```text
AUTHENTICATION_ERROR
```

Examples:
- expired session
- invalid credentials

### Workflow Errors

```text
WORKFLOW_ERROR
```

Examples:
- invalid state transition
- expired approval

### External Provider Errors

```text
PROVIDER_ERROR
```

Examples:
- Calendar API failure
- model provider outage

### Infrastructure Errors

```text
INFRASTRUCTURE_ERROR
```

Examples:
- database unavailable
- storage unavailable

### Internal Errors

```text
INTERNAL_ERROR
```

Examples:
- unexpected system failures
- invariant violations

## Retry Classification

Errors should indicate whether they are:

```text
Retryable
Non-Retryable
```

This supports:
- worker recovery
- outbox processing
- automated retry policies

## Provider Normalization

Provider-specific failures should be mapped into normalized categories.

Example:

```text
Google Error
OpenAI Error
Database Error
```

may all map into canonical North Vector error classifications.

## User Experience

Users should receive:
- understandable messages
- actionable guidance
- stable behavior

Users should not see:
- stack traces
- provider-specific internals
- infrastructure details

## Logging Requirements

Structured logs should include:
- error code
- category
- correlation ID
- source system

This improves operational visibility.

## Monitoring Integration

Monitoring systems should alert using:
- normalized codes
- categories
- severity levels

rather than relying on string matching.

## Relationship to Sentry

Sentry captures error details.

The error taxonomy defines:
- classification
- meaning
- operational behavior

The two systems complement one another.

## Operational Benefits

Structured error taxonomies enable:
- faster troubleshooting
- cleaner monitoring
- safer retries
- better reporting
- improved user experience

## Consequences

### Positive

- consistent failure handling
- easier debugging
- improved monitoring
- better automation support
- cleaner integrations

### Negative

- taxonomy maintenance
- migration effort for legacy errors
- additional implementation discipline

## Implementation Notes

Example:

```json
{
  "error_code":"AUTHORIZATION_DENIED",
  "error_category":"AUTHORIZATION_ERROR",
  "retryable":false
}
```

Error codes should remain stable even when messages change.

## Testing Requirements

Tests should verify:
- provider errors normalize correctly
- retryable classifications are accurate
- user-facing messages remain safe
- monitoring receives normalized codes
- workflow failures use expected categories
- correlation IDs propagate correctly

## Outcome

North Vector gains a consistent and machine-readable failure model that improves reliability, observability, user experience, and operational decision-making across the platform.