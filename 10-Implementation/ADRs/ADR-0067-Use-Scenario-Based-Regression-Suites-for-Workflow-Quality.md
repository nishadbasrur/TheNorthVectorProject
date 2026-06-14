# ADR-0067: Use Scenario-Based Regression Suites for Workflow Quality

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will maintain scenario-based regression suites for important workflows.

These suites will provide repeatable checks against known situations so that workflow quality does not drift silently over time.

## Context

North Vector workflows may change as retrieval, memory, configuration, providers, and workflow rules evolve.

A change that improves one case may break another. Scenario-based testing helps catch these regressions before release.

## Scenario Types

Scenarios should cover:
- routine planning
- ambiguous requests
- stale information
- conflicting information
- sensitive action requests
- approval-required workflows
- provider failure situations

## Evaluation Use

Scenario suites should run before major behavior changes and before changes to high-risk workflows.

Results should be tracked over time.

## Consequences

### Positive

- catches regressions earlier
- improves workflow reliability
- makes quality measurable
- supports safer release decisions

### Negative

- requires maintenance
- scenario coverage can become stale
- not every quality issue is easy to measure

## Testing Requirements

Tests should verify:
- scenarios run consistently
- failures are visible
- high-risk regressions block release
- scenario inventory remains version controlled

## Outcome

North Vector gains a repeatable quality-control layer for workflows through scenario-based regression testing.