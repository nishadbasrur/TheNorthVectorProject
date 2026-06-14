# ADR-0068: Use Budget and Usage Governance for Platform Operations

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use budget and usage governance for platform operations.

The system should track resource consumption, set reasonable limits, and surface unusual usage before it becomes an operational or financial problem.

## Context

North Vector may rely on paid infrastructure and external services for hosting, storage, monitoring, synchronization, background processing, and intelligent workflow support.

As workflows become more capable, resource usage may grow in ways that are difficult to predict.

Without governance, the platform may experience:
- unexpected costs
- runaway background jobs
- excessive provider usage
- inefficient workflows
- unclear ownership of spending

## Governance Principles

Budget and usage governance should include:
- usage measurement
- budget limits
- alert thresholds
- per-workflow attribution
- provider-level reporting
- owner assignment
- review processes

## Resource Categories

Governed resources may include:
- compute
- storage
- provider usage
- monitoring volume
- queue processing
- export generation
- synchronization jobs

## Cost Attribution

Where practical, usage should be attributable to:
- workflow
- environment
- provider
- feature
- user-visible capability

This allows the system to identify which parts of the platform are expensive.

## Alerting

The system should generate alerts when usage exceeds expected levels.

Alerts should distinguish between:
- normal growth
- suspicious spikes
- runaway jobs
- provider misuse
- deployment-related changes

## Limits

Some workflows may require hard limits or throttles.

Others may use soft limits with alerts and review.

The limit strategy should reflect operational risk.

## Relationship to Backpressure

Backpressure protects system stability.

Budget governance protects operational sustainability.

Both may limit work, but they solve different problems.

## Relationship to Observability

Usage and budget metrics should be visible through operational dashboards.

Financial blind spots are operational blind spots.

## Consequences

### Positive

- reduces surprise spending
- improves operational planning
- identifies inefficient workflows
- supports sustainable scaling
- helps prevent runaway work

### Negative

- requires measurement infrastructure
- may add workflow limits
- dashboards and alerts require maintenance
- attribution may be imperfect

## Testing Requirements

Tests should verify:
- usage is measured consistently
- limits are enforced where required
- alerts trigger at thresholds
- runaway workflows are contained
- usage is attributable to major workflow categories

## Outcome

North Vector gains operational and financial discipline by making resource usage visible, governable, and bounded as the platform grows.