# ADR-0050: Use Health Checks, Readiness Probes, and Liveness Probes for Service Reliability

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector services will expose explicit health checks, readiness probes, and liveness probes.

Operational systems must be able to determine whether a service:
- is running
- is healthy
- is ready to accept traffic
- should be restarted

These concerns must be evaluated independently.

## Context

North Vector includes:
- web services
- API services
- workers
- synchronization components
- background processors
- future distributed services

A process may be:
- running but unhealthy
- alive but not ready
- partially initialized
- blocked on dependencies

Simple process existence is not sufficient to determine service health.

## Decision Drivers

- reliability
- operational visibility
- deployment safety
- automatic recovery
- graceful startup
- graceful degradation

## Probe Types

### Liveness Probe

Answers:

```text
Should this process be restarted?
```

A liveness failure indicates the service cannot recover without intervention.

Examples:
- deadlocks
- unrecoverable initialization states
- permanently stalled workers

## Readiness Probe

Answers:

```text
Can this service safely accept work?
```

A readiness failure should remove the service from active traffic.

Examples:
- startup in progress
- configuration invalid
- database unavailable
- required dependencies unavailable

## Health Check

Provides operational insight into overall service condition.

Health checks may report:
- dependency status
- version information
- subsystem status
- degraded conditions

Health checks are not identical to readiness checks.

## Readiness Principles

A service should not be marked ready until:
- configuration validates
- required dependencies are available
- startup tasks complete
- critical subsystems initialize successfully

## Dependency Evaluation

Readiness checks may evaluate:
- database connectivity
- storage availability
- required provider configuration
- queue access

Readiness checks should focus on critical dependencies.

## Liveness Principles

Liveness checks should remain lightweight.

Transient dependency failures should not necessarily trigger process restarts.

The goal is detecting unrecoverable application states.

## Startup Behavior

Expected flow:

```text
Process Starts
  -> Not Ready
  -> Initialization
  -> Ready
```

Traffic should not be accepted before readiness succeeds.

## Degraded Operation

Health endpoints may report:

```text
Healthy
Degraded
Unhealthy
```

This provides richer operational visibility than binary status alone.

## Relationship to Configuration Validation

Invalid configuration should fail readiness.

Services should not accept traffic while improperly configured.

## Relationship to Observability

Health signals should integrate with:
- monitoring
- alerting
- dashboards
- deployment systems

Operational teams should have visibility into probe outcomes.

## Security Considerations

Health endpoints must not expose:
- secrets
- credentials
- provider tokens
- sensitive configuration values

Operational information should remain safe for exposure.

## Operational Benefits

Health probes enable:
- safer deployments
- automatic recovery
- traffic protection
- dependency visibility
- improved uptime

## Consequences

### Positive

- improved reliability
- safer rollouts
- better operational visibility
- reduced downtime
- cleaner recovery behavior

### Negative

- implementation effort
- monitoring configuration required
- probe maintenance overhead
- risk of poorly tuned probe behavior

## Implementation Notes

Typical behavior:

```text
Liveness
  -> Restart Decision

Readiness
  -> Traffic Routing Decision

Health Check
  -> Operational Visibility
```

The three concerns should remain conceptually separate.

## Testing Requirements

Tests should verify:
- invalid configuration fails readiness
- startup blocks readiness until initialization completes
- liveness detects unrecoverable states
- health checks report subsystem status correctly
- sensitive information is not exposed
- monitoring systems receive accurate signals

## Outcome

North Vector gains safer deployments, improved reliability, and stronger operational visibility through explicit health checks, readiness probes, and liveness probes.