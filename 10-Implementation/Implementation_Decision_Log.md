# Implementation Decision Log v1.0

## Purpose

This document provides a lightweight record of implementation decisions that matter to delivery, but do not always require a full Architecture Decision Record.

The Implementation Decision Log exists to preserve important choices made during active development, especially around sequencing, scope, tooling, tradeoffs, temporary constraints, and implementation behavior.

Its purpose is not to replace ADRs.

Its purpose is to capture decisions quickly enough that the project does not lose context while moving.

## Core Principle

Small decisions accumulate into architecture.

North Vector should record implementation choices when forgetting the rationale could create confusion, rework, or inconsistent behavior later.

## Primary Objectives

The log should help answer:
- What decision was made?
- Why was it made?
- When was it made?
- Who made it?
- Which work or components does it affect?
- Is the decision temporary or durable?
- Does it require a future ADR, review, or migration?
- What evidence should determine whether it remains valid?

## Decision Log vs ADR

Use the Implementation Decision Log when the choice is:
- tactical
- limited in scope
- reversible
- needed quickly
- unlikely to shape the long-term architecture by itself

Use a full ADR when the choice:
- changes a major system boundary
- creates long-term provider dependence
- changes the security or privacy model
- affects data ownership
- is expensive to reverse
- governs many components
- accepts significant residual risk

A decision may begin in this log and later be promoted into an ADR.

## Decision Categories

Suggested categories:
- Scope
- Sequence
- Technical Stack
- Data Model
- Integration
- AI and Model Behavior
- Security
- Privacy
- Testing
- Deployment
- Operations
- User Experience
- Temporary Workaround
- Technical Debt
- Research

## Decision Statuses

Suggested statuses:
- Proposed
- Active
- Temporary
- Confirmed
- Reversed
- Superseded
- Promoted to ADR
- Deprecated

## Standard Decision Record

Each decision should contain:
- decision_id
- date
- title
- category
- status
- decision_owner
- context
- decision
- rationale
- alternatives_considered
- affected_components
- affected_backlog_items
- security_impact
- privacy_impact
- data_impact
- operational_impact
- temporary_or_durable
- review_trigger
- review_at
- related_adr
- related_issue_or_pr
- outcome
- lessons
- superseded_by

## Decision ID Format

Recommended format:

```text
IDL-0001
```

Numbers should be sequential and never reused.

## Decision Record Template

```markdown
## IDL-[NUMBER]: [Decision Title]

Date:
[YYYY-MM-DD]

Status:
[Proposed | Active | Temporary | Confirmed | Reversed | Superseded | Promoted to ADR | Deprecated]

Category:
[Category]

Decision Owner:
[Name or role]

### Context

[What problem or constraint required a decision?]

### Decision

[State the decision clearly.]

### Rationale

[Why this choice was made.]

### Alternatives Considered

- [Alternative]
- [Alternative]

### Affected Components

- [Component]
- [Component]

### Affected Backlog Items

- [Backlog item]

### Security Impact

[None, Low, Moderate, High, or explanation]

### Privacy Impact

[None, Low, Moderate, High, or explanation]

### Data Impact

[Schema, migration, retention, provenance, or deletion implications]

### Operational Impact

[Deployment, monitoring, rollback, or support implications]

### Temporary or Durable

[Temporary | Durable]

### Review Trigger

[Condition that should cause review]

### Review Date

[YYYY-MM-DD or Not Scheduled]

### Related ADR

[ADR or None]

### Related Issue or PR

[Link or identifier]

### Outcome

[Complete after implementation or real use]

### Lessons

- [Lesson]
```

## Logging Standards

A decision should be recorded when:
- it changes the agreed build sequence
- a P0 item is deferred
- a provider limitation changes scope
- a temporary workaround is introduced
- a safety control is intentionally staged
- the implementation differs from architecture documentation
- a new dependency is added for a consequential reason
- a migration approach is selected
- a release gate is waived or tightened

## Decision Quality Standard

Each decision should be:
- specific
- understandable without private memory
- honest about tradeoffs
- linked to affected work
- explicit about whether it is temporary
- assigned a review trigger when uncertainty remains

## Temporary Decisions

Temporary decisions should always include:
- why the workaround is needed
- what limitation it creates
- when it should be removed
- which backlog item owns cleanup

Temporary should not mean indefinite.

## Decision Reversal

When a decision is reversed:
1. Keep the original record.
2. Mark it Reversed or Superseded.
3. Add the new decision ID.
4. Explain what evidence changed.
5. Update affected implementation and documentation.

## Promotion to ADR

Promote a decision into an ADR when:
- its scope expands
- reversal becomes expensive
- it establishes a durable boundary
- it affects security, privacy, or data ownership materially
- multiple later decisions depend on it

The decision-log record should then link to the ADR and use status `Promoted to ADR`.

## Decision Review Cadence

Review the log:
- at the end of each sprint
- before major releases
- during architecture reviews
- after incidents
- when temporary decisions reach review date

## Decision Dashboard

A simple implementation dashboard should show:
- recent decisions
- temporary decisions
- overdue reviews
- reversed decisions
- decisions awaiting ADR promotion
- decisions affecting current release

## Initial Decision Entries

## IDL-0001: Freeze Broad Architecture Expansion After Implementation Planning

Date:
2026-06-14

Status:
Active

Category:
Scope

Decision Owner:
Nishad

### Context

The North Vector repository now contains extensive architecture, security, privacy, data, implementation, testing, deployment, and operational planning documents. Continuing to create new architecture documents risks delaying actual implementation.

### Decision

After the current implementation-document sequence is complete, new broad architecture documents should be frozen until the first working vertical slice is implemented.

### Rationale

The largest current project risk is replacing coding with continued planning. The repository already contains enough design guidance to begin Phase 1.

### Alternatives Considered

- continue documenting every future subsystem
- begin coding while allowing unlimited parallel architecture work
- freeze all documentation permanently

### Affected Components

- project governance
- implementation roadmap
- Phase 1 backlog

### Affected Backlog Items

- P1-001: Initialize Application Repository
- P1-021: Implement Canonical Base Object Schema

### Security Impact

Low. Existing security architecture remains available.

### Privacy Impact

Low.

### Data Impact

None.

### Operational Impact

Focus shifts toward executable work and milestone validation.

### Temporary or Durable

Temporary.

### Review Trigger

Review after the first working vertical slice or when implementation reveals a missing architecture decision.

### Review Date

After completion of P1-030 and the first usable application flow.

### Related ADR

None.

### Outcome

Pending.

### Lessons

- The project now needs evidence from code more than additional speculative breadth.

## IDL-0002: Use the Chemistry Exam Workflow as the First Vertical Slice

Date:
2026-06-14

Status:
Confirmed

Category:
Sequence

Decision Owner:
Nishad

### Context

The MVP requires a workflow that tests memory, goals, tasks, planning, Calendar constraints, approvals, execution, verification, and audit history together.

### Decision

The chemistry-exam planning workflow will be the first release-critical vertical slice.

### Rationale

It exercises the largest number of core North Vector concepts while remaining understandable, bounded, and personally useful.

### Alternatives Considered

- generic task manager flow
- email drafting flow
- weekly review as the first slice
- wearable capture flow

### Affected Components

- canonical objects
- memory
- planning
- Calendar integration
- approval and execution
- audit
- Today view

### Affected Backlog Items

- P1-126: Implement Chemistry Exam End-to-End Test

### Security Impact

Moderate because the workflow includes an external Calendar write.

### Privacy Impact

Low to Moderate depending on event content.

### Data Impact

Requires stable Event, Task, Goal, Memory, Action, and Relationship objects.

### Operational Impact

Becomes the main end-to-end release gate.

### Temporary or Durable

Durable through MVP.

### Review Trigger

Review after the first complete end-to-end implementation.

### Review Date

At Milestone A completion.

### Related ADR

None currently.

### Outcome

Pending.

### Lessons

- Vertical slices should validate architecture through real user value.

## IDL-0003: Start with a Modular Monolith

Date:
2026-06-14

Status:
Proposed

Category:
Technical Stack

Decision Owner:
Technical Lead

### Context

North Vector contains many logical domains, but Phase 1 is a single-user MVP operated by one developer.

### Decision

Implement Phase 1 as a modular monolith with one primary web application, one worker process, and one PostgreSQL database.

### Rationale

This preserves domain boundaries without creating early distributed-systems complexity.

### Alternatives Considered

- microservices by domain
- serverless functions for every subsystem
- one unstructured application module

### Affected Components

- web application
- worker
- database
- deployment
- observability

### Affected Backlog Items

- P1-001
- P1-020
- P1-131
- P1-132

### Security Impact

Generally positive because fewer service boundaries and credentials are required.

### Privacy Impact

Positive because data movement is reduced.

### Data Impact

One transactional source for canonical state.

### Operational Impact

Simpler deployment and debugging.

### Temporary or Durable

Durable for Phase 1; reviewable later.

### Review Trigger

Measured scaling, reliability, or deployment constraints that cannot be resolved cleanly in the monolith.

### Review Date

Post-MVP architecture review.

### Related ADR

Should be promoted to an ADR before implementation foundation is finalized.

### Outcome

Pending.

### Lessons

- Logical modularity does not require physical distribution.

## IDL-0004: Keep Google Calendar as the Only MVP External Integration

Date:
2026-06-14

Status:
Active

Category:
Scope

Decision Owner:
Nishad

### Context

The broader North Vector vision includes Gmail, Contacts, academic systems, files, GitHub, finance, health, location, weather, voice, and wearables.

### Decision

Google Calendar will be the only external product integration required for the MVP.

### Rationale

Calendar provides the strongest immediate connection between planning and real constraints while keeping integration scope manageable.

### Alternatives Considered

- include Gmail in MVP
- include academic portal in MVP
- ship a local-only MVP

### Affected Components

- integration framework
- synchronization
- planning
- approval and execution

### Affected Backlog Items

- P1-080 through P1-085

### Security Impact

Reduces the initial permission and token surface.

### Privacy Impact

Reduces external data ingestion.

### Data Impact

Only Calendar source references and event synchronization are needed initially.

### Operational Impact

One provider health model and one OAuth connection.

### Temporary or Durable

Temporary through MVP.

### Review Trigger

MVP proves value and Calendar synchronization remains stable through real use.

### Review Date

Post-MVP expansion review.

### Related ADR

Potential ADR for first-integration scope.

### Outcome

Pending.

### Lessons

- One well-integrated source is more valuable than several fragile connections.

## IDL-0005: Require Server-Side Payload-Bound Approval for External Actions

Date:
2026-06-14

Status:
Confirmed

Category:
Security

Decision Owner:
Security and Execution Owners

### Context

A visual confirmation step does not provide meaningful control unless backend execution verifies the exact approved action.

### Decision

Every MVP external write must use a server-side approval record bound to the target and immutable payload, with expiration and revalidation before execution.

### Rationale

This prevents approval reuse, payload mutation, and frontend-only enforcement.

### Alternatives Considered

- simple UI confirmation flag
- session-wide approval
- action-type-only approval

### Affected Components

- proposed actions
- approval service
- execution service
- Calendar adapter
- audit

### Affected Backlog Items

- P1-090 through P1-094

### Security Impact

High positive impact.

### Privacy Impact

Positive because unintended sharing or writes are reduced.

### Data Impact

Requires immutable or hash-bound action payload records.

### Operational Impact

More explicit action states and verification.

### Temporary or Durable

Durable.

### Review Trigger

Any future autonomy expansion or delegated-access model.

### Review Date

Before enabling any additional external write integration.

### Related ADR

Should be promoted to an ADR.

### Outcome

Pending.

### Lessons

- Confirmation is a security property only when enforced at execution.

## IDL-0006: Use Candidate Memory Before Implicit Promotion

Date:
2026-06-14

Status:
Confirmed

Category:
Privacy

Decision Owner:
Memory System Owner

### Context

North Vector should learn from interactions without allowing weak inferences or one-time observations to become durable identity claims.

### Decision

Implicitly inferred durable memories must begin in Candidate state and require validation before ordinary active retrieval.

### Rationale

This preserves trust, inspectability, and the ability to correct the system before the inference shapes future behavior.

### Alternatives Considered

- automatic memory creation
- no implicit memory at all
- automatic promotion based only on model confidence

### Affected Components

- memory lifecycle
- Memory Inspector
- retrieval
- model extraction

### Affected Backlog Items

- P1-031
- P1-032
- P1-037

### Security Impact

Low.

### Privacy Impact

High positive impact.

### Data Impact

Requires Candidate status and promotion workflow.

### Operational Impact

Creates a review queue.

### Temporary or Durable

Durable.

### Review Trigger

Only if future evidence demonstrates a safe narrow category for automatic promotion.

### Review Date

After one month of real memory use.

### Related ADR

Should be promoted to an ADR.

### Outcome

Pending.

### Lessons

- Personalization should become more confident only after evidence earns it.

## IDL-0007: Use PostgreSQL for Canonical, Relationship, and Initial Vector Data

Date:
2026-06-14

Status:
Proposed

Category:
Data Model

Decision Owner:
Data Architecture Owner

### Context

Phase 1 needs transactional canonical objects, typed relationships, audit records, versioning, full-text search, and semantic retrieval.

### Decision

Use PostgreSQL as the primary data store, relational edge tables for the graph, and pgvector for initial semantic retrieval.

### Rationale

It provides sufficient capability while minimizing operational and synchronization complexity.

### Alternatives Considered

- PostgreSQL plus separate graph database
- PostgreSQL plus dedicated vector database
- document database
- local embedded database only

### Affected Components

- data platform
- retrieval
- relationships
- migrations
- backups

### Affected Backlog Items

- P1-020
- P1-023
- P1-026

### Security Impact

Positive because fewer stores require credentials and policy enforcement.

### Privacy Impact

Positive because fewer replicas exist.

### Data Impact

Centralizes canonical state and deletion propagation.

### Operational Impact

Simplifies backup and restore.

### Temporary or Durable

Durable for Phase 1.

### Review Trigger

Measured retrieval or graph performance becomes inadequate.

### Review Date

After one month of MVP usage or 100,000 canonical objects, whichever comes first.

### Related ADR

Should become an ADR before schema implementation.

### Outcome

Pending.

### Lessons

- A capable general-purpose database should be exhausted before adding specialized stores.

## IDL-0008: Keep Voice, Wearables, Finance, Health, and Location Outside Phase 1

Date:
2026-06-14

Status:
Active

Category:
Scope

Decision Owner:
Nishad

### Context

These capabilities increase privacy, security, hardware, and operational complexity without being required to prove the core MVP.

### Decision

Voice, wearables, financial integrations, health integrations, and location context remain outside Phase 1 implementation.

### Rationale

The core desktop Chief must become useful and trustworthy before ambient or highly sensitive capabilities are added.

### Alternatives Considered

- implement push-to-talk during MVP
- add read-only finance early
- prototype glasses in parallel

### Affected Components

- roadmap
- backlog
- privacy and security scope

### Affected Backlog Items

None in Phase 1.

### Security Impact

Substantially reduces Phase 1 attack surface.

### Privacy Impact

Substantially reduces sensitive-data scope.

### Data Impact

No Phase 1 schemas or ingestion pipelines required beyond future-compatible placeholders.

### Operational Impact

Fewer providers and devices to support.

### Temporary or Durable

Temporary.

### Review Trigger

MVP completes one stable week of real use and security hardening passes.

### Review Date

Post-MVP expansion review.

### Related ADR

None required unless scope changes.

### Outcome

Pending.

### Lessons

- Ambient capability should follow trust, not precede it.

## Decision Log Maintenance

When adding a decision:
1. Assign the next ID.
2. State the decision in one sentence.
3. Record why it was needed now.
4. Link affected backlog work.
5. Mark whether it is temporary.
6. Add a review trigger.
7. Promote it to an ADR when scope or permanence increases.

## Review Checklist

During each decision-log review:
- [ ] Temporary decisions are still justified.
- [ ] Review dates are current.
- [ ] Reversed decisions are linked to replacements.
- [ ] ADR-worthy decisions have been promoted.
- [ ] Implementation still matches Active decisions.
- [ ] Backlog and documentation reflect the latest choices.
- [ ] Outcomes and lessons are updated after real use.

## Failure Modes

### Decision Amnesia

Implementation choices are forgotten and later re-litigated.

### Log Everything

The log becomes cluttered with trivial choices.

### Temporary Forever

Workarounds remain active without review.

### ADR Avoidance

Major durable decisions remain in the lightweight log to escape deeper review.

### Outcome Neglect

The project records choices but never checks whether they worked.

### Documentation Drift

The decision log, ADRs, backlog, and implementation disagree.

## Phase 1 Implementation

During Phase 1, the log should record:
- scope changes
- sequencing changes
- selected libraries and providers
- temporary workarounds
- deferred P0 items
- changed release gates
- implementation departures from architecture
- decisions promoted to ADRs

## Success Criteria

The Implementation Decision Log succeeds if:
- tactical choices remain understandable
- temporary compromises have expiration conditions
- implementation and roadmap changes preserve rationale
- major choices are promoted into ADRs
- the project avoids repeatedly reopening settled questions without new evidence

## Final Principle

North Vector should move quickly without becoming forgetful about why it moved in a particular direction.