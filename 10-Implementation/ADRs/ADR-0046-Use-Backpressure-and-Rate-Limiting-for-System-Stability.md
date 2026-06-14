# ADR-0046: Use Backpressure and Rate Limiting for System Stability

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will implement backpressure and rate-limiting mechanisms to protect system stability, provider integrations, and critical workflows during periods of elevated load.

The system must degrade gracefully rather than allowing uncontrolled resource consumption.

## Context

North Vector performs work involving:
- API requests
- model-provider calls
- synchronization jobs
- projection updates
- export generation
- notifications
- background workflows
- future automation systems

Demand may exceed capacity because of:
- user activity spikes
- provider slowdowns
- retry storms
- workflow bugs
- synchronization cascades
- external outages

Without controls:
- queues can grow indefinitely
- providers can be overwhelmed
- costs can spike
- latency can become unpredictable
- cascading failures can occur

## Decision Drivers

- reliability
- resilience
- cost control
- operational stability
- provider protection
- graceful degradation

## Backpressure Principles

When downstream systems cannot keep up:

```text
Slow Down
Queue
Reject
Defer
```

rather than allowing uncontrolled growth.

The system should make load visible and manageable.

## Rate Limiting Principles

Rate limits should protect:
- APIs
- providers
- worker systems
- synchronization pipelines
- automation workflows

Rate limits may be applied by:
- actor
- workflow
- integration
- environment
- system component

## Examples

### User API Limits

Prevent abusive or accidental overload.

### Provider Limits

Respect external-provider quotas.

### Worker Limits

Control concurrent execution volume.

### Synchronization Limits

Prevent synchronization storms.

## Queue Protection

Queues should define:
- maximum depth
- concurrency limits
- retry limits
- dead-letter thresholds

Queues should not grow indefinitely.

## Provider Protection

Provider integrations should account for:
- quotas
- rate limits
- billing constraints
- provider availability

The system should avoid creating self-inflicted provider outages.

## Graceful Degradation

When limits are reached:

Preferred outcomes:

```text
Deferred
Queued
Temporarily Unavailable
```

Avoid:

```text
System Crash
Provider Exhaustion
Unbounded Retries
```

## Relationship to Retry Policies

Retries should respect rate limits.

Retry storms can amplify outages if not controlled.

Backpressure mechanisms should work together with retry logic.

## Relationship to Dead-Letter Queues

Rate limiting handles overload.

Dead-letter queues handle unrecoverable work.

Both mechanisms contribute to system stability.

## Monitoring Requirements

Metrics should include:
- queue depth
- rejection rates
- provider utilization
- concurrency levels
- throttling frequency
- retry volume

Operational visibility is required.

## Operational Benefits

Backpressure and rate limiting enable:
- predictable system behavior
- provider protection
- cost management
- graceful degradation
- improved resilience

## Consequences

### Positive

- increased stability
- reduced cascading failures
- safer provider usage
- more predictable performance
- better operational control

### Negative

- occasional request delays
- added implementation complexity
- throughput constraints under heavy load
- monitoring requirements

## Implementation Notes

Typical controls may include:

```text
Request Rate Limits
Concurrency Limits
Queue Depth Limits
Provider Quotas
Circuit Breakers
```

The exact mechanism may vary by subsystem.

## Testing Requirements

Tests should verify:
- limits activate correctly
- overload does not crash the system
- retries respect throttling rules
- provider quotas are honored
- queue growth remains bounded
- graceful degradation behavior is predictable

## Outcome

North Vector gains controlled resource management and graceful degradation capabilities that improve reliability, reduce cascading failures, and protect both internal systems and external providers from overload.