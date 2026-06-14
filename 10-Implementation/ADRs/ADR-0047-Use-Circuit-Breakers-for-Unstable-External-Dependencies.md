# ADR-0047: Use Circuit Breakers for Unstable External Dependencies

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will implement circuit breakers around critical external dependencies to prevent cascading failures during provider outages, severe degradation, or persistent error conditions.

When a dependency becomes unreliable, the system should fail fast and degrade gracefully rather than repeatedly attempting operations that are unlikely to succeed.

## Context

North Vector depends on:
- model providers
- Calendar providers
- authentication services
- storage systems
- notification providers
- future third-party integrations

External dependencies can experience:
- outages
- elevated latency
- quota exhaustion
- authentication failures
- service degradation
- network instability

Without circuit breakers:
- retries may amplify outages
- queues may grow uncontrollably
- latency may increase dramatically
- worker pools may become blocked
- cascading failures may spread through the platform

## Decision Drivers

- resilience
- stability
- graceful degradation
- provider protection
- operational visibility
- failure containment

## Circuit Breaker Principles

A circuit breaker should monitor dependency health and transition between defined states.

Typical states:

```text
Closed
Open
Half-Open
```

### Closed

Normal operation.

Requests are allowed.

### Open

Dependency is considered unhealthy.

Requests fail fast.

No additional load is sent.

### Half-Open

Controlled testing state.

A limited number of requests are allowed to determine whether recovery has occurred.

## Failure Detection

Circuit breakers may react to:
- error rates
- timeout rates
- latency thresholds
- provider-specific failures

Thresholds should be configurable.

## Fail-Fast Behavior

When a circuit is open:

Preferred outcomes:

```text
Return Fallback
Queue Work
Defer Execution
Return Temporary Failure
```

Avoid:

```text
Infinite Retries
Blocking Threads
Provider Flooding
```

## Relationship to Retry Policies

Retries should respect circuit-breaker state.

An open circuit should suppress unnecessary retries.

## Relationship to Backpressure

Backpressure manages load.

Circuit breakers manage unhealthy dependencies.

Together they prevent cascading failures.

## Relationship to Failover

When supported:

```text
Primary Provider
-> Circuit Opens
-> Fallback Provider
```

Failover policies remain configuration-driven.

Circuit breakers do not automatically imply failover.

## User Experience

Users should receive:
- predictable failures
- understandable messaging
- degraded but stable behavior

rather than long waits followed by failure.

## Monitoring Requirements

Metrics should include:
- circuit state
- open events
- recovery events
- failure rates
- latency trends

Circuit transitions should be observable.

## Operational Benefits

Circuit breakers enable:
- failure isolation
- provider protection
- faster recovery
- improved resilience
- more predictable behavior during outages

## Consequences

### Positive

- reduced cascading failures
- improved stability
- lower provider stress during outages
- faster failure detection
- better user experience under degradation

### Negative

- configuration complexity
- threshold tuning requirements
- risk of false positives
- additional operational monitoring

## Implementation Notes

Typical flow:

```text
Dependency Healthy
  -> Closed

Failure Threshold Reached
  -> Open

Recovery Window
  -> Half-Open

Successful Validation
  -> Closed
```

Circuit-breaker decisions should be deterministic and observable.

## Testing Requirements

Tests should verify:
- circuits open under sustained failure
- open circuits fail fast
- half-open recovery behavior works correctly
- retries respect circuit state
- monitoring captures transitions
- fallback behavior remains predictable

## Outcome

North Vector gains protection against cascading dependency failures by isolating unstable external systems and allowing the platform to degrade gracefully during outages and service degradation.