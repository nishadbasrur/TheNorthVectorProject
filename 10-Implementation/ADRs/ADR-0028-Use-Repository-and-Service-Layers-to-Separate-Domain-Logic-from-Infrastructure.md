# ADR-0028: Use Repository and Service Layers to Separate Domain Logic from Infrastructure

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use explicit repository and service layers to separate domain logic from infrastructure concerns such as databases, provider SDKs, web frameworks, background workers, and model APIs.

## Context

North Vector includes many domains:
- memory
- planning
- canonical objects
- relationships
- approvals
- execution
- Calendar synchronization
- jobs
- audit
- deletion

These domains must remain understandable and testable as the implementation grows.

Without clear layering, business rules may spread across:
- route handlers
- React components
- database queries
- provider adapters
- worker jobs
- model prompts

That would make the system hard to test, hard to change, and unsafe for sensitive workflows.

## Decision Drivers

- maintainability
- testability
- domain clarity
- infrastructure independence
- security enforcement
- predictable transactions
- future provider replacement

## Layer Responsibilities

### Domain Layer

Owns rules and concepts.

Examples:
- memory state transitions
- approval validity
- task status rules
- deletion eligibility

### Service Layer

Owns workflow orchestration.

Examples:
- create a memory candidate
- approve an action
- synchronize Calendar state
- generate a daily briefing

### Repository Layer

Owns persistence access.

Examples:
- load objects
- save relationships
- query pending jobs
- write audit records

### Infrastructure Layer

Owns external systems.

Examples:
- PostgreSQL
- Google Calendar
- object storage
- model providers
- authentication providers

## Boundaries

Route handlers and UI components should call services, not raw database queries.

Domain logic should not depend directly on:
- Next.js
- Drizzle
- Google SDKs
- Sentry
- model-provider SDKs

Provider adapters should not own domain policy.

## Benefits

This separation makes it easier to:
- test domain rules without infrastructure
- mock providers safely
- replace infrastructure later
- enforce authorization centrally
- keep UI code thin
- preserve auditability

## Consequences

### Positive

- clearer architecture
- better test coverage
- reduced framework coupling
- easier provider replacement
- safer workflows

### Negative

- additional files and abstractions
- some boilerplate
- requires discipline to avoid bypassing layers

## Implementation Notes

Suggested flow:

```text
UI / API Route
  -> Application Service
  -> Authorization
  -> Domain Logic
  -> Repository / Provider Adapter
  -> Audit
```

Repositories should expose intention-revealing methods rather than arbitrary database access.

## Testing

Tests should verify:
- domain rules without database dependency
- services with fake repositories where useful
- repositories against real PostgreSQL
- route handlers do not bypass authorization and services

## Outcome

North Vector gains cleaner boundaries between what the system means, how workflows execute, and which infrastructure stores or transports data.