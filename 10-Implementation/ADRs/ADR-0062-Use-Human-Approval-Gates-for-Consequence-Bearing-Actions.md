# ADR-0062: Use Human Approval Gates for Consequence-Bearing Actions

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will require human approval gates for consequence-bearing actions before execution unless the user has explicitly delegated that category of action under defined limits.

Automation must be bounded by approval policy.

## Context

North Vector is intended to become a Chief of Staff system capable of planning, recommending, coordinating, and eventually executing.

Execution may involve:
- modifying calendars
- sending communications
- changing tasks
- deleting data
- creating commitments
- sharing information

These actions can have real-world consequences.

## Approval Principles

Human approval should be required when an action may affect:
- time
- obligations
- reputation
- relationships
- privacy
- external systems
- irreversible data state

## Approval Payloads

Approval requests should include:
- proposed action
- target object
- expected effect
- risk level
- required permissions
- expiration time

Approvals must bind to the exact payload and version approved.

## Delegated Exceptions

Some actions may be delegated in advance.

Delegation must define:
- scope
- limits
- expiration
- revocation behavior
- audit requirements

## Failure Mode

If approval cannot be verified, execution must not proceed.

## Relationship to Consent

Consent allows a category of processing or action.

Approval authorizes a specific consequential execution.

Both may be required.

## Audit Requirements

The system should record:
- approval requested
- approval granted
- approval denied
- approval expired
- execution started
- execution verified

## Consequences

### Positive

- protects users from unsafe automation
- creates accountable execution
- reduces accidental harm
- supports trust in agents

### Negative

- adds friction
- requires approval UX
- requires expiration and replay handling

## Testing Requirements

Tests should verify:
- consequence-bearing actions require approval
- stale approvals fail
- changed payloads require reapproval
- expired approvals cannot execute
- audit chains are reconstructable

## Outcome

North Vector gains a safe execution model by placing human approval gates between AI-generated intent and real-world action.