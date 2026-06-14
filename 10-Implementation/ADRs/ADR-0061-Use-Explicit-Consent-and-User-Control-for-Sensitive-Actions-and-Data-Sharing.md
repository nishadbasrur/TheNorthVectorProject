# ADR-0061: Use Explicit Consent and User Control for Sensitive Actions and Data Sharing

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will require explicit user consent and meaningful user control for sensitive actions, external execution, and data sharing.

The system must not assume that access to data implies permission to act on it or share it.

## Context

North Vector may eventually interact with calendars, email, documents, tasks, memories, personal goals, and external services.

Some actions are low risk. Others may affect the user's schedule, relationships, finances, reputation, privacy, or commitments.

A Chief of Staff system must preserve user agency. The platform should help the user make better decisions, not quietly take control away from them.

## Consent Principles

Consent should be:
- explicit
- informed
- revocable
- specific to the action or category of actions
- recorded when consequential

Consent should not be hidden in vague blanket permissions.

## Sensitive Actions

Sensitive actions include:
- external writes
- calendar changes
- message sending
- data exports
- deletion workflows
- sharing personal information
- autonomous execution
- provider access expansion

## User Control

Users should be able to:
- approve actions
- deny actions
- revoke permissions
- inspect what was approved
- understand consequences
- change automation boundaries

## Default Behavior

When consent is unclear, the system should fail closed.

```text
Do not act
```

is safer than acting without clear permission.

## Relationship to Authorization

Authorization determines whether an actor is permitted.

Consent determines whether the user has allowed a sensitive action.

Both may be required.

## Audit Requirements

Consequential consent events should be auditable.

Examples:
- consent granted
- consent revoked
- action approved
- sharing denied

## Consequences

### Positive

- preserves user agency
- increases trust
- reduces privacy and safety risk
- supports accountable automation

### Negative

- may add friction
- requires consent-state tracking
- requires thoughtful user experience design

## Testing Requirements

Tests should verify:
- sensitive actions require consent
- revoked consent blocks future actions
- unclear consent fails closed
- audit records capture consequential consent changes
- consent is not confused with authorization

## Outcome

North Vector gains a user-controlled consent model that protects agency, privacy, and trust while enabling safe expansion into sensitive workflows.