# ADR-0025: Use Health Checks and Readiness Probes for All Long-Running Services

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will implement explicit health checks and readiness probes for all long-running services, including the web application, background worker, and future infrastructure components.

## Context

The platform depends on:
- web services
- background workers
- PostgreSQL
- authentication systems
- provider integrations
- AI services
- job execution pipelines

A process being alive does not necessarily mean it is capable of serving requests safely.

Operational systems require a consistent method to determine:
- whether a service is running
- whether a service is ready to accept work
- whether a dependency failure should trigger intervention

## Decision Details

Every long-running service should expose:

### Liveness Check

Answers:

"Is the process alive?"

Used to detect:
- crashes
- deadlocks
- unrecoverable runtime failures

### Readiness Check

Answers:

"Can the service safely handle requests or jobs right now?"

Used to detect:
- unavailable databases
- startup initialization failures
- missing configuration
- dependency connectivity failures

## Health Categories

Recommended states:
- healthy
- degraded
- unhealthy

A degraded service may continue operating while generating alerts.

## Web Application Requirements

Readiness should validate:
- database connectivity
- required configuration
- critical internal services

Readiness should not depend on every third-party provider being available.

## Worker Requirements

Worker readiness should validate:
- database access
- job infrastructure availability
- required configuration
- ability to claim work

## Response Format

Health responses should be machine-readable.

Example:

```json
{
  "status":"healthy",
  "service":"web",
  "timestamp":"2026-06-14T12:00:00Z"
}
```

## Privacy Rules

Health endpoints must not expose:
- secrets
- connection strings
- tokens
- provider credentials
- internal personal data

## Monitoring Integration

Health endpoints may be consumed by:
- hosting platforms
- uptime monitors
- deployment systems
- future observability tooling

## Consequences

### Positive

- improved reliability
- safer deployments
- faster failure detection
- better operational visibility

### Negative

- additional implementation effort
- dependency checks require maintenance
- poorly designed checks can create false alarms

## Implementation Notes

Health checks should:
- execute quickly
- avoid expensive queries
- avoid mutating state
- return deterministic results

Readiness failures should be logged and observable through monitoring systems.

## Outcome

North Vector gains a standardized operational mechanism for determining whether services are alive, ready, and safe to receive production traffic or work.