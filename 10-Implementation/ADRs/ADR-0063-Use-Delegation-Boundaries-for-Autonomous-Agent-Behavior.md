# ADR-0063: Use Delegation Boundaries for Autonomous Agent Behavior

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will define explicit delegation boundaries for autonomous or semi-autonomous agent behavior.

Agents may only act within clearly defined scopes, limits, permissions, and revocation rules.

## Context

A Chief of Staff platform may eventually perform tasks without step-by-step supervision.

Examples include:
- preparing briefings
- organizing tasks
- drafting messages
- proposing calendar changes
- monitoring goals
- executing approved workflows

Autonomy without boundaries creates risk. The system must know what it is allowed to do, what it must ask about, and what it must never do.

## Delegation Model

Delegation should define:
- permitted action categories
- prohibited action categories
- risk thresholds
- approval requirements
- time limits
- revocation behavior

## Scope Examples

A user may allow:

```text
Draft calendar suggestions
```

but not:

```text
Move meetings automatically
```

A user may allow:

```text
Prepare email drafts
```

but not:

```text
Send emails automatically
```

## Default Behavior

Agents should operate under least authority.

If delegation is ambiguous, the agent should ask or stop.

## Revocation

Delegation must be revocable.

Revocation should take effect for future actions and should be auditable.

## Relationship to Authorization and Consent

Delegation does not replace authorization or consent.

It defines the operating envelope for autonomous behavior.

## Audit Requirements

Autonomous decisions should preserve:
- delegation rule used
- action proposed or taken
- actor identity
- timestamp
- outcome

## Consequences

### Positive

- safer autonomy
- clearer agent behavior
- stronger user trust
- better governance

### Negative

- more policy modeling
- requires delegation UX
- requires careful edge-case handling

## Testing Requirements

Tests should verify:
- agents cannot exceed delegation scope
- ambiguous delegation fails closed
- revoked delegation blocks action
- audit records preserve delegation context
- high-risk actions still require approval

## Outcome

North Vector gains a bounded autonomy model where agents can help proactively without escaping user-defined control.