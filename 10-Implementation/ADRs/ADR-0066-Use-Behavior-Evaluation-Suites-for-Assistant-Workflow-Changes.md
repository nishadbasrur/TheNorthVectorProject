# ADR-0066: Use Behavior Evaluation Suites for Assistant Workflow Changes

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will maintain behavior evaluation suites for assistant workflows that affect planning, memory use, recommendations, approval proposals, and user-facing outputs.

Important behavior changes should be tested against representative scenarios before broad rollout.

## Context

North Vector depends on assistant components for complex planning and workflow support.

Small changes to retrieval, memory formatting, tool contracts, or surrounding context can create unexpected behavior changes.

Evaluation suites provide repeatable checks for quality and reliability.

## Evaluation Categories

Evaluations may include:
- planning quality
- memory correctness
- sensitive-action handling
- consistency
- tool-use accuracy
- user preference alignment

## Release Use

Material behavior changes should pass relevant evaluation suites before broad rollout.

Failures should block or pause rollout until reviewed.

## Consequences

### Positive

- improves reliability
- catches regressions earlier
- supports safer behavior changes
- creates measurable quality standards

### Negative

- requires ongoing maintenance
- evaluation cases can become stale
- some behavior remains hard to measure

## Testing Requirements

Tests should verify:
- evaluation suites run consistently
- regressions are surfaced
- high-risk workflow failures block release
- evaluation results are stored
- scenario coverage remains representative

## Outcome

North Vector gains a repeatable mechanism for evaluating assistant workflow behavior before changes reach important workflows.