# ADR-0042: Use Configuration-Driven Provider Selection and Failover

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use configuration-driven provider selection for external integrations and model providers.

Provider choice, routing rules, and failover behavior should be controlled through configuration rather than hard-coded application logic.

## Context

North Vector depends on external providers such as:
- language-model providers
- Calendar providers
- storage systems
- notification services
- authentication providers

Provider availability, pricing, capabilities, and reliability may change over time.

Hard-coded provider dependencies make:
- migration difficult
- failover difficult
- testing difficult
- experimentation difficult

The system should support provider replacement without widespread code changes.

## Decision Drivers

- flexibility
- resilience
- maintainability
- provider independence
- operational control
- future extensibility

## Provider Selection Principles

Business logic should not decide:
- which provider implementation to use
- which backup provider to use
- routing policies

These decisions should be controlled through configuration and infrastructure composition.

## Example

Preferred:

```text
Model Provider
  -> Configuration
  -> Selected Adapter
```

Not:

```text
if provider == OpenAI
```

scattered throughout application code.

## Supported Scenarios

### Provider Replacement

Example:

```text
OpenAI
-> Anthropic
```

without major service-layer changes.

### Provider Failover

Example:

```text
Primary Provider Unavailable
-> Backup Provider
```

when business requirements permit.

### Environment-Specific Providers

Example:

```text
Development
-> Fake Provider

Production
-> Real Provider
```

## Failover Principles

Failover must not violate:
- approval requirements
- privacy constraints
- capability assumptions
- execution safety guarantees

Not every workflow is eligible for automatic failover.

## Capability Awareness

Provider selection should consider:
- supported features
- latency
- reliability
- cost
- privacy constraints
- operational requirements

The system should not assume all providers behave identically.

## Relationship to Provider Abstractions

Provider abstraction defines:

```text
what the application expects
```

Configuration-driven selection defines:

```text
which implementation is used
```

The two decisions complement one another.

## Relationship to Dependency Injection

Dependency injection supplies implementations.

Configuration determines which implementation is supplied.

## Operational Benefits

Configuration-driven selection enables:
- safer migrations
- controlled experiments
- resilience improvements
- provider flexibility
- easier testing

## Consequences

### Positive

- reduced vendor lock-in
- easier failover
- safer experimentation
- improved operational control
- simpler provider replacement

### Negative

- additional configuration complexity
- failover testing requirements
- provider capability differences require management

## Implementation Notes

Configuration may define:

```text
primary_provider
fallback_provider
routing_policy
timeout_policy
retry_policy
```

Business logic should remain unaware of provider-selection mechanics whenever possible.

## Testing Requirements

Tests should verify:
- provider selection respects configuration
- failover activates correctly when enabled
- unsupported capabilities fail safely
- fake providers work in development and testing
- provider replacement does not require service changes
- privacy and approval guarantees remain intact during failover

## Outcome

North Vector gains flexibility, resilience, and reduced provider lock-in by making provider selection and failover behavior configuration-driven rather than hard-coded throughout the application.