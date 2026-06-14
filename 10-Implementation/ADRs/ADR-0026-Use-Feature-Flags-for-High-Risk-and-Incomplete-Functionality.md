# ADR-0026: Use Feature Flags for High-Risk and Incomplete Functionality

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use feature flags to control high-risk, experimental, incomplete, or operationally sensitive functionality.

Feature flags must be used to reduce deployment risk, enable gradual rollout, and provide operational control without requiring immediate code rollback.

## Context

The platform includes workflows involving:
- AI-generated planning
- memory creation
- Calendar execution
- external integrations
- deletion operations
- synchronization logic
- approval pipelines
- future autonomous functionality

These capabilities may require staged rollout, testing, or emergency disablement.

A deployment should not automatically imply that every new capability becomes active for all users.

## Decision Drivers

- risk reduction
- safer releases
- operational flexibility
- rollback speed
- experimentation support
- gradual rollout
- incident response

## Feature Flag Categories

### Release Flags

Used for incomplete features that are deployed but not yet available.

Examples:
- new planning interface
- future memory visualization tools
- experimental retrieval systems

### Operational Flags

Used to disable problematic functionality.

Examples:
- Calendar execution
- synchronization jobs
- provider integrations

### Experiment Flags

Used to compare approaches.

Examples:
- retrieval ranking variants
- briefing generation strategies
- scheduling algorithms

### Emergency Kill Switches

Used to immediately disable high-risk functionality.

Examples:
- autonomous execution
- provider write operations
- bulk deletion operations

## High-Risk Features

The following categories should default to feature-flag protection:
- external write operations
- autonomous actions
- deletion workflows
- new AI execution behavior
- experimental memory processing
- major synchronization changes

## Flag Principles

Feature flags should:
- have clear ownership
- have documented purpose
- include removal criteria
- avoid becoming permanent configuration when unnecessary

Every flag should answer:
- why it exists
- who owns it
- when it can be removed

## Naming Conventions

Flags should be descriptive.

Examples:

```text
calendar_execution_enabled
memory_candidate_v2
experimental_retrieval_ranking
```

Avoid vague names.

Examples:

```text
new_feature
beta_mode
flag1
```

## Default Behavior

High-risk capabilities should fail closed.

If a flag cannot be evaluated reliably, the safer behavior should be selected.

Example:

```text
Calendar execution disabled
```

is preferable to:

```text
Calendar execution enabled accidentally
```

## Privacy and Security

Feature flags must not be treated as authorization.

A disabled feature may block access.

An enabled feature does not grant permission.

Authorization rules remain separate.

## Operational Benefits

Feature flags enable:
- safer deployments
- gradual rollout
- faster incident response
- reduced rollback frequency
- controlled experimentation

## Consequences

### Positive

- reduced release risk
- faster recovery from incidents
- safer experimentation
- controlled rollout process

### Negative

- additional complexity
- testing burden across flag states
- risk of stale flags
- configuration management overhead

## Implementation Notes

Each flag should include:

```text
name
owner
purpose
creation_date
removal_target
```

Flags should be centralized rather than scattered through the application.

## Lifecycle Management

Flags should be reviewed regularly.

Completed rollout flags should be removed.

Long-lived unused flags increase maintenance burden and cognitive load.

## Monitoring

Important flag changes should be logged.

Operational events should capture:
- flag name
- previous state
- new state
- actor
- timestamp

## Outcome

North Vector gains a controlled release mechanism that reduces operational risk while supporting experimentation, staged rollout, and rapid response to production issues.