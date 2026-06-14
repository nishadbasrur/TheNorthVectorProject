# Architecture Decision Record Template v1.0

## Purpose

This document defines the standard template North Vector should use to record consequential architecture and engineering decisions.

An Architecture Decision Record exists to preserve why a choice was made, which alternatives were considered, what tradeoffs were accepted, and when the decision should be revisited.

Its purpose is not to document every minor implementation detail.

Its purpose is to capture decisions that materially shape the system.

## Core Principle

A decision without recorded context becomes an unexplained constraint later.

North Vector should preserve not only what was chosen, but why that choice made sense at the time.

## When to Create an ADR

Create an ADR when a decision affects:
- system architecture
- primary technology choice
- data ownership
- provider selection
- security boundary
- permission model
- memory behavior
- privacy default
- deployment model
- irreversible or high-risk migration
- autonomy policy
- major interface pattern
- long-term maintainability

Do not create an ADR for:
- trivial naming choices
- routine bug fixes
- minor style changes
- temporary local experiments
- implementation details already governed by an existing ADR

## ADR File Naming

Recommended naming format:

```text
ADR-0001-Short-Decision-Title.md
```

Examples:

```text
ADR-0001-Use-PostgreSQL-as-Primary-Database.md
ADR-0002-Separate-Reasoning-from-Execution.md
ADR-0003-Use-Google-Calendar-as-First-Integration.md
```

## ADR Statuses

Suggested statuses:
- Proposed
- Accepted
- Rejected
- Superseded
- Deprecated

## ADR Template

```markdown
# ADR-[NUMBER]: [Decision Title]

## Status

[Proposed | Accepted | Rejected | Superseded | Deprecated]

## Date

[YYYY-MM-DD]

## Decision Owner

[Name or role responsible for the decision]

## Reviewers

[List of reviewers, if any]

## Related Documents

- [Architecture document]
- [Issue or pull request]
- [Related ADR]

## Context

Describe the problem, constraint, or opportunity that requires a decision.

Include:
- current system state
- relevant requirements
- user need
- security and privacy considerations
- technical constraints
- operational constraints
- timing or roadmap pressure

The Context section should explain why a decision is necessary now.

## Decision Drivers

List the factors that matter most.

Examples:
- data integrity
- security
- privacy
- developer velocity
- cost
- portability
- latency
- maintainability
- provider support
- recovery
- simplicity

## Options Considered

### Option A: [Name]

Description:
[Explain the option.]

Advantages:
- [Advantage]
- [Advantage]

Disadvantages:
- [Disadvantage]
- [Disadvantage]

Risks:
- [Risk]

### Option B: [Name]

Description:
[Explain the option.]

Advantages:
- [Advantage]

Disadvantages:
- [Disadvantage]

Risks:
- [Risk]

### Option C: [Name]

Description:
[Explain the option.]

Advantages:
- [Advantage]

Disadvantages:
- [Disadvantage]

Risks:
- [Risk]

## Decision

State the selected option clearly.

Example:
`North Vector will use PostgreSQL as the primary canonical data store for Phase 1.`

## Rationale

Explain why the selected option best satisfies the decision drivers.

Include:
- which tradeoffs were accepted
- why rejected options were less suitable
- what evidence or prototypes informed the choice
- which assumptions remain uncertain

## Consequences

### Positive Consequences

- [Positive consequence]
- [Positive consequence]

### Negative Consequences

- [Negative consequence]
- [Negative consequence]

### Operational Consequences

- [Deployment, maintenance, monitoring, or recovery impact]

### Security and Privacy Consequences

- [Permission, data handling, or attack-surface impact]

### Data and Migration Consequences

- [Schema, migration, portability, or deletion impact]

## Implementation Notes

Describe the practical implementation implications.

Include:
- affected components
- required dependencies
- migration steps
- feature flags
- testing requirements
- rollout sequence

Do not turn this section into a full technical specification unless the decision requires it.

## Validation Plan

Define how the decision will be tested or validated.

Examples:
- prototype
- benchmark
- security review
- end-to-end test
- staging rollout
- migration dry run
- user workflow test

## Rollback or Exit Strategy

Explain how the decision could be reversed, replaced, or migrated away from.

Include:
- technical rollback
- data migration
- provider exit
- cost or timeline
- irreversible consequences

## Residual Risks

List risks that remain after the decision.

- [Residual risk]
- [Residual risk]

## Assumptions

List assumptions the decision depends on.

- [Assumption]
- [Assumption]

## Review Triggers

Revisit this ADR when:
- [Condition changes]
- [Provider behavior changes]
- [Scale threshold is reached]
- [Security incident occurs]
- [User workflow disproves assumption]

## Review Date

[YYYY-MM-DD or Not Scheduled]

## Outcome

Complete this section after implementation or real use.

### Expected Outcome

[What the decision was expected to achieve.]

### Actual Outcome

[What happened in practice.]

### Lessons

- [Lesson]
- [Lesson]

### Follow-Up Decision

[Keep, revise, supersede, or deprecate.]

## Change History

| Date | Change | Author |
|---|---|---|
| YYYY-MM-DD | Initial ADR | Name |
```

## ADR Writing Standards

An ADR should be:
- specific
- concise enough to review
- honest about uncertainty
- explicit about tradeoffs
- linked to implementation
- updated when superseded

## Context Standards

The Context section should avoid vague statements such as:
`We need a better database.`

Better:
`North Vector needs one transactional store for canonical objects, relationships, audit records, and versioned updates. Phase 1 is single-user, but deletion, provenance, and migration reliability are release-critical.`

## Decision Standards

The Decision section should state one clear choice.

Weak:
`We may use PostgreSQL.`

Better:
`North Vector will use PostgreSQL as the primary Phase 1 database.`

## Rationale Standards

Rationale should explain why the choice fits the actual system.

Avoid:
- popularity as the only justification
- unsupported certainty
- ignoring rejected alternatives
- pretending tradeoffs do not exist

## Consequence Standards

Every accepted decision should document negative consequences.

A decision with only benefits is probably incomplete.

## Superseding an ADR

When a decision changes:
1. Create a new ADR.
2. Mark the old ADR as Superseded.
3. Link both records.
4. Preserve the original context.
5. Explain why the prior assumptions no longer hold.

Do not rewrite the old ADR as though the original decision never existed.

## Rejecting an ADR

A rejected ADR should remain in the repository when it contains useful analysis.

Its status should clearly show that it was not adopted.

## Deprecating an ADR

Use Deprecated when:
- the governed feature no longer exists
- the decision no longer applies
- no direct replacement exists

## ADR Numbering

ADR numbers should be sequential and never reused.

Deleted or rejected ADR numbers should remain reserved to preserve historical references.

## ADR Location

Recommended directory:

```text
10-Implementation/ADRs/
```

The repository may also maintain an ADR index.

## ADR Index

Suggested fields:
- ADR number
- title
- status
- date
- owner
- related system
- superseding ADR

## Review Workflow

Recommended workflow:
1. Draft ADR.
2. Share for review.
3. Resolve key objections.
4. Mark Accepted or Rejected.
5. Link implementation work.
6. Validate the decision after use.
7. Update outcome and lessons.

## Decision Threshold

Create an ADR when reversing the choice later would be:
- expensive
- risky
- confusing
- data-sensitive
- security-sensitive
- operationally disruptive

## Example Decision Topics

Possible North Vector ADRs:
- use PostgreSQL as canonical store
- use pgvector before a separate vector database
- begin as a modular monolith
- use Google Calendar as the first integration
- keep financial integrations read-only
- separate reasoning, approval, execution, and verification
- use candidate memory before automatic promotion
- use push-to-talk before always-listening voice
- require payload-bound approval for external actions
- keep wearables as limited-trust devices

## ADR and Implementation Alignment

When an ADR is accepted:
- related backlog items should reference it
- code comments may link to it where the decision is non-obvious
- tests should validate critical assumptions
- documentation should remain consistent

## ADR and Incident Review

An incident may reveal that an ADR assumption failed.

The post-incident review should determine whether to:
- revise implementation
- update the ADR outcome
- create a superseding ADR
- accept residual risk

## ADR and Technical Debt

An ADR may intentionally accept technical debt.

The record should include:
- why the debt is acceptable
- consequence
- exit plan
- review trigger

## Failure Modes

### Decision Amnesia

The project remembers the choice but forgets why it was made.

### ADR Bureaucracy

Every tiny change requires a formal record.

### Retroactive Justification

The ADR is written after implementation to make an arbitrary choice look deliberate.

### Tradeoff Concealment

Negative consequences are omitted.

### Stale Decision

An accepted ADR remains active after its assumptions fail.

### Silent Supersession

Implementation changes without updating the architecture record.

### Outcome Neglect

The project never checks whether the decision actually worked.

## Phase 1 Use

During Phase 1, ADRs should be created for at least:
- primary application stack
- database and ORM choice
- authentication provider
- model-provider abstraction
- job and automation infrastructure
- Google Calendar integration scope
- external-action approval enforcement
- memory candidate model
- deployment platform

## Success Criteria

The ADR process succeeds if:
- consequential decisions remain understandable months later
- tradeoffs and assumptions are visible
- implementation work links to decisions
- superseded choices preserve history
- real outcomes improve later architectural judgment

## Final Principle

North Vector should not merely accumulate architecture.

It should accumulate a traceable history of judgment.