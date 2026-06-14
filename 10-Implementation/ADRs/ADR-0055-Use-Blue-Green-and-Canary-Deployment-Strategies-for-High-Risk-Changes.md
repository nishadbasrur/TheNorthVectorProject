# ADR-0055: Use Blue-Green and Canary Deployment Strategies for High-Risk Changes

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use controlled deployment strategies such as blue-green deployments, canary releases, and phased rollouts for high-risk changes.

Large or consequential changes should be exposed gradually whenever practical rather than released universally in a single step.

## Context

North Vector will evolve through:
- workflow changes
- infrastructure changes
- provider integrations
- automation capabilities
- schema migrations
- operational improvements

Certain changes introduce elevated risk because they affect:
- critical workflows
- data integrity
- provider interactions
- system availability

Traditional all-at-once deployments can increase blast radius when unexpected issues occur.

## Decision Drivers

- deployment safety
- risk reduction
- operational resilience
- rollback flexibility
- reliability
- controlled exposure

## Deployment Principles

Changes should be introduced in ways that:
- limit impact
- increase observability
- support rollback
- allow validation under real conditions

Deployment strategy should reflect change risk.

## Blue-Green Deployment

Blue-green deployment maintains:

```text
Current Environment
New Environment
```

Traffic can be switched between environments after validation.

Benefits include:
- simplified rollback
- reduced deployment downtime
- production-like validation

## Canary Deployment

Canary deployment gradually exposes a change.

Example:

```text
1%
5%
25%
50%
100%
```

Traffic increases only after successful validation.

## Progressive Rollout

Rollouts may occur based on:
- percentage exposure
- user cohorts
- feature flags
- operational readiness

The rollout strategy should match the level of risk.

## Validation Requirements

Before broader rollout:

Evaluate:
- error rates
- latency
- workflow outcomes
- provider behavior
- system stability

Progression should be evidence-based.

## Rollback Principles

Rollback should be:
- fast
- predictable
- tested
- operationally simple

The ability to deploy is less valuable without the ability to recover.

## Relationship to Feature Flags

Feature flags control availability.

Deployment strategies control exposure.

The two techniques work well together.

## Relationship to Observability

Controlled rollouts require strong observability.

Metrics should determine whether rollout continues, pauses, or reverses.

## High-Risk Change Examples

Examples may include:
- provider replacements
- workflow-engine changes
- authentication changes
- major schema evolution
- automation-system introduction
- infrastructure migrations

These changes benefit from staged exposure.

## Operational Benefits

Controlled deployment strategies enable:
- safer releases
- smaller blast radius
- easier rollback
- earlier issue detection
- greater deployment confidence

## Consequences

### Positive

- reduced deployment risk
- improved reliability
- safer experimentation
- better incident containment
- more predictable releases

### Negative

- deployment-process complexity
- additional infrastructure requirements
- rollout monitoring overhead
- longer deployment timelines

## Implementation Notes

Strategy selection should be proportional to risk.

Not every change requires:
- blue-green deployment
- canary rollout
- phased exposure

The operational cost should be justified by expected risk.

## Testing Requirements

Tests should verify:
- rollout controls function correctly
- rollback procedures work reliably
- traffic-routing behavior is predictable
- observability supports rollout decisions
- deployment strategies integrate correctly with feature flags
- high-risk changes can be isolated when issues arise

## Outcome

North Vector gains safer release management by introducing high-risk changes through controlled exposure strategies that reduce blast radius, improve observability, and support rapid recovery when issues occur.