# Implementation Risk Register v1.0

## Purpose

This document defines the primary implementation risks facing North Vector and the process for identifying, assessing, mitigating, monitoring, escalating, accepting, and closing those risks.

The Implementation Risk Register exists to prevent technical, operational, security, privacy, product, and execution risks from remaining implicit until they become incidents.

Its purpose is not to predict every possible failure.

Its purpose is to make the highest-leverage uncertainties visible early enough to change the build plan.

## Core Principle

A risk should be recorded when uncertainty could materially affect trust, schedule, data integrity, security, privacy, cost, or the ability to deliver the MVP.

North Vector should manage risks before they become bugs, outages, or abandoned architecture.

## Primary Objectives

The register should help answer:
- What could derail implementation?
- How likely is each risk?
- What would the impact be?
- What evidence supports the assessment?
- What mitigation is already in place?
- What early warning signal should be monitored?
- Who owns the response?
- When should the risk be escalated, accepted, or closed?

## Risk Categories

The register should cover:
- Product Scope
- Architecture
- Data
- Memory and Retrieval
- Security
- Privacy
- Integrations
- AI and Model Behavior
- Automation
- Operations
- Testing
- Cost
- Schedule
- Dependency and Provider
- Hardware and Wearables
- User Trust
- Governance and Documentation

## Standard Risk Record

Each implementation risk should contain:
- risk_id
- title
- category
- description
- cause
- potential_consequence
- likelihood
- impact
- severity
- detectability
- time_horizon
- affected_milestones
- affected_components
- owner
- evidence
- early_warning_signals
- preventive_actions
- contingency_actions
- current_controls
- residual_risk
- status
- review_at
- accepted_by
- accepted_at
- closed_at
- closure_reason
- related_issue_ids
- related_incident_ids
- audit_reference

## Risk Statuses

Suggested statuses:
- Identified
- Assessing
- Active
- Mitigating
- Monitoring
- Escalated
- Accepted
- Materialized
- Resolved
- Closed
- Superseded

## Likelihood Scale

### Rare

Unlikely under expected conditions.

### Unlikely

Possible, but not expected.

### Possible

Credible and may occur.

### Likely

Expected to occur without intervention.

### Almost Certain

Already emerging or repeatedly observed.

## Impact Scale

### Minimal

Small inconvenience or local rework.

### Low

Limited delay or bounded defect.

### Moderate

Meaningful schedule, trust, or product impact.

### High

Major workflow failure, sensitive-data risk, or substantial rework.

### Critical

Could invalidate the architecture, cause serious exposure, or make the system unsafe to use.

## Severity

Severity should combine likelihood and impact, but should not be reduced to a purely mathematical score.

Suggested labels:
- Low
- Moderate
- High
- Critical

Security, privacy, deletion, authorization, and data-integrity risks may warrant higher severity even when likelihood appears low.

## Detectability

Suggested levels:
- Easy
- Moderate
- Difficult
- Very Difficult

A low-likelihood risk with poor detectability may still deserve strong preventive controls.

## Time Horizon

Suggested values:
- Immediate
- Current Sprint
- Phase 1
- Pre-MVP Release
- Post-MVP
- Long-Term

## Risk Ownership

Every Active, Mitigating, Escalated, or Accepted risk should have one accountable owner.

The owner is responsible for:
- maintaining the assessment
- monitoring warning signals
- driving mitigation
- escalating when thresholds are crossed
- recording closure or acceptance

## Risk Review Cadence

Review risks:
- weekly during active implementation
- before each sprint
- before each release
- after major architecture changes
- after incidents
- after provider or scope changes

Critical risks should be reviewed continuously until contained.

## Escalation Rules

Escalate a risk when:
- likelihood or impact increases
- warning signals appear
- mitigation is late or ineffective
- release-critical work is blocked
- user trust may be affected
- a security or privacy boundary weakens
- the risk materializes

## Risk Acceptance

A risk may be accepted only when:
- mitigation cost exceeds expected value
- the residual risk is understood
- compensating controls exist where appropriate
- the acceptance has an owner
- a review or expiration date exists

Risks involving Critical authorization, secret exposure, deletion failure, or uncontrolled external action should not be accepted casually.

## Risk Closure

A risk may close when:
- the underlying condition no longer exists
- mitigation reduces residual risk to an acceptable level
- the affected feature is removed
- the risk is superseded by a more accurate record
- the risk materialized and transitioned into incident or defect management

## Initial Risk Register

# Product and Scope Risks

## IR-001: Architecture Continues Without Implementation

Category:
Product Scope

Likelihood:
Likely

Impact:
High

Severity:
High

Time Horizon:
Immediate

Description:
The project may continue producing architecture documents while delaying the first working vertical slice.

Potential Consequences:
- loss of momentum
- no real-world validation
- architecture based on untested assumptions
- increasing psychological and technical barrier to starting

Early Warning Signals:
- new documents added without code milestones
- no local application running
- roadmap expands faster than backlog completion
- repeated redesign of already documented systems

Preventive Actions:
- enforce the Phase 1 critical path
- begin with repository and canonical object implementation
- require each sprint to produce a working artifact
- use the chemistry-exam workflow as the primary vertical slice

Contingency Actions:
- freeze new architecture documents
- select one P0 backlog item and implement it end to end
- defer non-MVP research

Owner:
Nishad

Status:
Active

## IR-002: MVP Scope Inflation

Category:
Product Scope

Likelihood:
Likely

Impact:
High

Severity:
High

Description:
Future features such as Gmail, academic portals, voice, health, finance, location, or wearables may enter Phase 1 before the core MVP is trustworthy.

Potential Consequences:
- delayed release
- integration sprawl
- weak safety controls
- fragmented implementation

Early Warning Signals:
- P2 or future items relabeled as P0
- more than one external integration under active development
- wearable or voice work begins before Calendar and memory are stable

Preventive Actions:
- maintain explicit MVP cut line
- require new Phase 1 work to unblock a P0 workflow or close a safety gap
- review scope at each sprint start

Contingency Actions:
- move noncritical work to post-MVP
- disable unfinished features behind flags

Owner:
Nishad

Status:
Active

## IR-003: The MVP Is Technically Complete but Not Useful

Category:
Product

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
The system may satisfy infrastructure requirements but fail to improve real daily planning and execution.

Potential Consequences:
- low adoption
- architecture without value
- false confidence from passing technical tests

Early Warning Signals:
- daily briefing is generic or noisy
- Nishad continues using separate manual systems instead
- Chief cannot handle one real week of work
- workflows require too much correction

Preventive Actions:
- test against real personal workflows
- define usefulness criteria for briefing, planning, and review
- run a one-week MVP usage trial before expansion

Contingency Actions:
- simplify workflows
- revise retrieval and prioritization
- remove low-value features

Owner:
Nishad

Status:
Active

# Architecture Risks

## IR-004: Premature Microservice or Infrastructure Complexity

Category:
Architecture

Likelihood:
Possible

Impact:
Moderate

Severity:
Moderate

Description:
The implementation may split into too many services, queues, stores, or frameworks before boundaries are stable.

Potential Consequences:
- slower development
- difficult debugging
- deployment complexity
- increased cost

Early Warning Signals:
- multiple services before the MVP workflow exists
- separate databases without a proven need
- infrastructure work outnumbers product work

Preventive Actions:
- begin as a modular monolith
- use one primary database for canonical data (originally PostgreSQL; actually Firestore as of 2026-07-03, consolidated onto the same platform as Auth and Cloud Functions — see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`; vector data has no current store, semantic retrieval is undecided)
- add infrastructure only after measured limitations

Contingency Actions:
- consolidate services
- remove unused dependencies
- return jobs to a database-backed worker (moot as originally stated — there is no database-backed worker to return to; the current job model is scheduled Cloud Functions, see `10-Implementation/ADRs/ADR-0103-Use-Firebase-Cloud-Functions-for-Scheduled-Execution.md`)

Owner:
Technical Lead

Status:
Active

## IR-005: Canonical Object Model Becomes Too Generic

Category:
Architecture

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
A single generic object table may become difficult to validate, query, migrate, or understand.

Potential Consequences:
- schema ambiguity
- excessive JSON fields
- weak constraints
- difficult domain logic

Early Warning Signals:
- most fields live in unvalidated JSON
- object-specific logic spreads across the codebase
- queries require repeated type checks and casts

Preventive Actions:
- maintain shared base fields with object-family schemas
- add specialized tables when justified
- keep domain validation explicit

Contingency Actions:
- migrate high-value object families to dedicated tables
- introduce typed repositories

Owner:
Data Architecture Owner

Status:
Active

## IR-006: Provider Abstractions Are Either Too Thin or Too Abstract

Category:
Architecture

Likelihood:
Possible

Impact:
Moderate

Severity:
Moderate

Description:
Provider code may become scattered and tightly coupled, or the abstraction may be designed around imagined future providers rather than real needs.

Potential Consequences:
- difficult replacement
- leaky provider behavior
- unnecessary complexity

Early Warning Signals:
- provider-specific fields appear in domain code
- abstraction requires many unused methods
- simple changes affect unrelated integrations

Preventive Actions:
- design adapters from real Calendar and model use cases
- preserve provider-native metadata through source references
- keep domain interfaces narrow

Contingency Actions:
- refactor after the second concrete provider use case

Owner:
Integration Owner

Status:
Monitoring

# Data and Memory Risks

## IR-007: False or Weak Memories Become Active Truth

Category:
Memory and Retrieval

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
A transcript error, model inference, or single observation may be promoted into durable memory.

Potential Consequences:
- distorted recommendations
- identity freezing
- loss of trust

Early Warning Signals:
- many automatic memory writes
- candidate confirmation is bypassed
- memories lack source or confidence
- Nishad frequently corrects the system

Preventive Actions:
- use Candidate state
- require stronger thresholds for behavioral memory
- preserve evidence and confidence
- expose Memory Inspector

Contingency Actions:
- suspend implicit memory promotion
- audit recently created memories
- lower confidence and request confirmation

Owner:
Memory System Owner

Status:
Active

## IR-008: Deleted Data Remains Retrievable

Category:
Privacy

Likelihood:
Possible

Impact:
Critical

Severity:
Critical

Description:
Deleted memory or personal data may remain in embeddings, indexes, caches, session summaries, backups, or derived records.

Potential Consequences:
- privacy violation
- false deletion claims
- loss of trust

Early Warning Signals:
- deleted records appear in semantic search
- deletion tests fail intermittently
- indexes update asynchronously without verification

Preventive Actions:
- implement deletion propagation
- use tombstones and index cleanup
- block retrieval before physical cleanup completes
- maintain end-to-end deletion tests

Contingency Actions:
- disable affected retrieval path
- perform full index reconciliation
- issue accurate deletion status
- create privacy incident if exposure occurred

Owner:
Data and Privacy Owner

Status:
Active

## IR-009: Retrieval Includes Irrelevant or Excessively Sensitive Context

Category:
Memory and Retrieval

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
Context assembly may load unrelated personal details or Restricted data because of weak relevance or permission filtering.

Potential Consequences:
- invasive responses
- public disclosure
- provider overexposure
- higher model cost

Early Warning Signals:
- unrelated memories appear in answers
- large context payloads
- Restricted data frequently enters ordinary sessions

Preventive Actions:
- objective-first retrieval
- sensitivity cost in ranking
- shallow graph traversal
- context budget
- retrieval explainability

Contingency Actions:
- tighten filters
- disable semantic expansion temporarily
- require explicit context sources for sensitive categories

Owner:
Retrieval Owner

Status:
Active

## IR-010: Data Synchronization Silently Overwrites Newer State

Category:
Data

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
Local or external changes may overwrite one another without version checks or conflict review.

Potential Consequences:
- lost Calendar updates
- incorrect task state
- broken trust in synchronization

Early Warning Signals:
- provider versions are not stored
- last-write-wins is used broadly
- users report reverted changes

Preventive Actions:
- optimistic concurrency
- source-of-truth policies
- conflict records
- provider-state refresh before writes

Contingency Actions:
- pause writes
- reconcile provider history
- restore previous version where possible

Owner:
Synchronization Owner

Status:
Active

## IR-011: Data Model Migrations Corrupt Meaning

Category:
Data

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
A technically successful migration may alter semantic meaning, confidence, source, or relationship structure.

Potential Consequences:
- hidden data corruption
- invalid recommendations
- broken historical records

Early Warning Signals:
- migration validation checks only record counts
- default values replace unknown states
- canonical IDs change unexpectedly

Preventive Actions:
- migration dry runs
- semantic samples
- stable ID mapping
- provenance preservation
- pre-migration backup

Contingency Actions:
- stop cutover
- roll forward with corrective migration
- restore isolated trusted state

Owner:
Data Architecture Owner

Status:
Monitoring

# Security and Privacy Risks

## IR-012: Authentication Provider or Recovery Flow Becomes Weakest Link

Category:
Security

Likelihood:
Unlikely

Impact:
Critical

Severity:
High

Description:
Account recovery, session handling, or provider configuration may allow unauthorized access despite strong primary authentication.

Potential Consequences:
- account takeover
- access to private memory and integrations

Early Warning Signals:
- recovery without strong verification
- long-lived sessions
- unknown device access
- weak session revocation

Preventive Actions:
- passkeys or strong authentication
- high-assurance reauthentication
- device registration
- session revocation tests
- recovery audit events

Contingency Actions:
- revoke all sessions
- rotate credentials
- review access history
- disable recovery path temporarily

Owner:
Security Owner

Status:
Active

## IR-013: Secrets Are Committed or Logged

Category:
Security

Likelihood:
Possible

Impact:
Critical

Severity:
Critical

Description:
API keys, OAuth tokens, encryption keys, or credentials may enter Git history, logs, screenshots, or client bundles.

Potential Consequences:
- provider compromise
- unauthorized access
- expensive cleanup

Early Warning Signals:
- environment values referenced in client code
- secret scan findings
- verbose provider logs
- copied tokens in issues or chat

Preventive Actions:
- secret manager
- pre-commit and CI secret scanning
- structured log redaction
- client/server configuration separation

Contingency Actions:
- revoke and rotate immediately
- remove exposed values from reachable history where practical
- review provider access
- create incident record

Owner:
Security Owner

Status:
Active

## IR-014: Prompt Injection Influences Tool Use

Category:
AI and Security

Likelihood:
Likely

Impact:
Critical

Severity:
Critical

Description:
Calendar text, documents, emails, or webpages may contain instructions that attempt to manipulate Chief into revealing data or performing actions.

Potential Consequences:
- unauthorized external action
- data disclosure
- permission bypass attempts

Early Warning Signals:
- retrieved content is inserted without clear labels
- tool actions derive directly from document instructions
- prompt tests fail

Preventive Actions:
- treat external content as untrusted data
- separate reasoning from authorization and execution
- require explicit user authority
- maintain prompt-injection tests

Contingency Actions:
- disable affected retrieval source
- review recent actions
- tighten content isolation
- create security incident if action occurred

Owner:
AI Safety Owner

Status:
Active

## IR-015: Permission Scope Expands Beyond MVP Need

Category:
Privacy and Security

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
OAuth or application permissions may become broader than the workflow requires.

Potential Consequences:
- larger breach impact
- unclear authority
- user distrust

Early Warning Signals:
- full Calendar account scope when one calendar is enough
- write permission requested before write feature exists
- scopes not visible in settings

Preventive Actions:
- least-privilege scopes
- permission dashboard
- periodic access review
- read-only first

Contingency Actions:
- revoke connection
- reconnect with narrower scope
- remove locally cached out-of-scope data

Owner:
Integration and Security Owners

Status:
Active

## IR-016: Sensitive Data Appears in Logs, Monitoring, or Notifications

Category:
Privacy

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
Restricted information may leak through operational systems or lock-screen previews.

Potential Consequences:
- third-party exposure
- bystander disclosure
- privacy incident

Early Warning Signals:
- full prompts in error reports
- raw provider payloads in logs
- financial or health details in notification previews

Preventive Actions:
- structured redacted logs
- privacy-safe notification wording
- restricted error context
- observability review

Contingency Actions:
- purge exposed logs where possible
- disable affected telemetry or notifications
- notify Nishad if exposure occurred

Owner:
Privacy Owner

Status:
Monitoring

# Integration Risks

## IR-017: Google Calendar API Constraints Delay MVP

Category:
Integration

Likelihood:
Possible

Impact:
Moderate

Severity:
Moderate

Description:
OAuth setup, provider revision behavior, token handling, recurrence, or API quotas may prove more complex than expected.

Potential Consequences:
- delayed vertical slice
- incomplete conflict handling

Early Warning Signals:
- OAuth verification blocks staging
- recurrence causes normalization failures
- event version semantics are unclear

Preventive Actions:
- build a provider spike early
- start with one account and simple nonrecurring events
- use dedicated test calendar
- defer complex recurrence writes

Contingency Actions:
- release local-only planning first
- limit Calendar to read-only temporarily
- keep event creation manual until adapter is reliable

Owner:
Calendar Integration Owner

Status:
Active

## IR-018: Provider Outage or Rate Limit Makes Chief Appear Incorrect

Category:
Dependency and Provider

Likelihood:
Possible

Impact:
Moderate

Severity:
Moderate

Description:
External data may become stale or unavailable while the interface continues presenting it as current.

Potential Consequences:
- missed events
- false confidence
- bad planning

Early Warning Signals:
- failed sync without visible warning
- old data lacks timestamps
- retry backlog grows

Preventive Actions:
- visible freshness
- degraded mode
- provider-specific retry limits
- last successful sync indicators

Contingency Actions:
- label data stale
- pause external writes
- direct user to provider-native system

Owner:
Integration Owner

Status:
Monitoring

## IR-019: Model Provider Changes Behavior or Pricing

Category:
Dependency and Provider

Likelihood:
Possible

Impact:
Moderate

Severity:
Moderate

Description:
Model quality, API structure, latency, privacy terms, or pricing may change.

Potential Consequences:
- broken prompts
- increased cost
- degraded reasoning
- migration pressure

Early Warning Signals:
- output schema failures increase
- latency or cost spikes
- provider deprecation notice

Preventive Actions:
- model abstraction
- structured validation
- prompt regression suite
- usage and cost monitoring

Contingency Actions:
- switch model or provider
- use deterministic fallback
- reduce background model use

Owner:
AI Platform Owner

Status:
Monitoring

# AI and Model Risks

## IR-020: Model Output Appears More Certain Than Evidence

Category:
AI and Model Behavior

Likelihood:
Likely

Impact:
High

Severity:
High

Description:
The model may present inference, stale data, or incomplete context as fact.

Potential Consequences:
- bad planning
- false memories
- user overreliance

Early Warning Signals:
- unsupported definitive language
- source and uncertainty omitted
- user corrections are frequent

Preventive Actions:
- structured confidence fields
- source-aware prompting
- quality gates
- output validation
- high-stakes response tests

Contingency Actions:
- downgrade recommendation to draft
- request clarification
- block action until source verification

Owner:
AI Safety Owner

Status:
Active

## IR-021: Model Cost Becomes Unsustainable

Category:
Cost

Likelihood:
Possible

Impact:
Moderate

Severity:
Moderate

Description:
Frequent context assembly, background reasoning, embeddings, or large prompts may cause unexpected recurring cost.

Potential Consequences:
- inability to operate continuously
- pressure to weaken quality or privacy controls

Early Warning Signals:
- cost per session rises
- background jobs call models unnecessarily
- large repetitive contexts

Preventive Actions:
- model routing
- deterministic logic where possible
- context budgets
- embedding deduplication
- cost dashboard

Contingency Actions:
- reduce automation frequency
- switch models
- cache safe summaries
- disable low-value background reasoning

Owner:
Operations and AI Platform Owners

Status:
Monitoring

## IR-022: Model Output Bypasses Domain Logic

Category:
AI and Architecture

Likelihood:
Possible

Impact:
Critical

Severity:
High

Description:
Model-generated objects or actions may be written directly without schema, permission, or lifecycle validation.

Potential Consequences:
- corrupt data
- unsafe actions
- hidden policy bypass

Early Warning Signals:
- model handlers call repositories directly
- invalid enum values appear in storage
- action payloads lack approval records

Preventive Actions:
- structured output schemas
- service-layer validation
- proposal-only model interface
- authorization and approval separation

Contingency Actions:
- disable affected path
- audit recent model-generated records
- repair or delete invalid objects

Owner:
AI Platform and Domain Owners

Status:
Active

# Automation and Execution Risks

## IR-023: Duplicate External Actions

Category:
Automation

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
Timeouts, retries, repeated triggers, or uncertain provider responses may create duplicate Calendar events or future external actions.

Potential Consequences:
- operational confusion
- spam
- broken trust

Early Warning Signals:
- repeated provider calls share no idempotency key
- timeout automatically triggers immediate retry
- duplicate-event detection is absent

Preventive Actions:
- idempotency keys
- provider-state verification
- duplicate detection
- uncertain outcome state

Contingency Actions:
- stop retries
- identify duplicates
- remove extras with approval
- review execution history

Owner:
Execution Owner

Status:
Active

## IR-024: Approval UI Exists but Backend Enforcement Is Weak

Category:
Security and Product

Likelihood:
Possible

Impact:
Critical

Severity:
Critical

Description:
The interface may display a confirmation step while the execution service fails to bind approval to the exact target and payload.

Potential Consequences:
- fake control
- unintended external action

Early Warning Signals:
- approvals reference only action type
- changed payload executes without new approval
- approval checks occur only in frontend code

Preventive Actions:
- server-side approval service
- payload hash or immutable payload
- approval expiration
- mutation tests

Contingency Actions:
- disable external writes
- audit recent actions
- patch and retest before reactivation

Owner:
Security and Execution Owners

Status:
Active

## IR-025: Automation Expands Before Monitoring and Recovery

Category:
Automation

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
Recurring workflows may be enabled before run history, pause controls, failure classification, and recovery are ready.

Potential Consequences:
- silent repeated failures
- noisy notifications
- unsafe external actions

Early Warning Signals:
- automations have no dry-run mode
- no automatic pause
- no run dashboard
- failures are visible only in logs

Preventive Actions:
- defer automation until Phase 10 foundation
- require dry run and approval modes
- implement pause and audit first

Contingency Actions:
- pause all automation
- convert to manual trigger
- review past runs

Owner:
Automation Owner

Status:
Monitoring

# Testing and Quality Risks

## IR-026: Tests Cover Components but Not Real Workflows

Category:
Testing

Likelihood:
Likely

Impact:
High

Severity:
High

Description:
Unit and integration tests may pass while the chemistry-exam workflow or deletion path fails end to end.

Potential Consequences:
- false release confidence
- broken MVP experience

Early Warning Signals:
- no Playwright flow
- provider mocks exclude failure behavior
- release checklist relies on unit coverage

Preventive Actions:
- define release-critical end-to-end tests early
- run chemistry-exam flow on every release candidate
- maintain deletion and approval mutation tests

Contingency Actions:
- block release
- add regression flow
- reduce scope until full workflow works

Owner:
Testing Owner

Status:
Active

## IR-027: Mock Providers Hide Real Integration Problems

Category:
Testing and Integration

Likelihood:
Possible

Impact:
Moderate

Severity:
Moderate

Description:
Mocks may behave more cleanly than Google Calendar or model providers.

Potential Consequences:
- staging failures
- incorrect retry and conflict handling

Early Warning Signals:
- no dedicated test account
- provider contract tests never run
- mocks omit pagination, rate limits, or version changes

Preventive Actions:
- realistic contract mocks
- staging tests with real test provider
- record provider-specific edge cases

Contingency Actions:
- restrict feature scope
- update adapter contract and mocks

Owner:
Testing and Integration Owners

Status:
Monitoring

## IR-028: Flaky Tests Normalize Reruns

Category:
Testing

Likelihood:
Possible

Impact:
Moderate

Severity:
Moderate

Description:
Timing, model, provider, or shared-state tests may become nondeterministic.

Potential Consequences:
- ignored failures
- slow development
- real defects dismissed as flakiness

Early Warning Signals:
- frequent CI reruns
- uncontrolled clock and random data
- tests depend on real shared provider state

Preventive Actions:
- controlled clock
- deterministic fixtures
- isolated database
- quarantine policy with deadline

Contingency Actions:
- disable flaky test only with explicit owner and replacement plan
- redesign test boundary

Owner:
Testing Owner

Status:
Monitoring

# Operations and Deployment Risks

## IR-029: Backups Exist but Cannot Be Restored

Category:
Operations

Likelihood:
Possible

Impact:
Critical

Severity:
Critical

Description:
Backups may be created successfully but fail because of corruption, missing keys, incompatible schema, or incomplete deletion replay.

Potential Consequences:
- permanent data loss
- recovery of compromised or deleted state

Early Warning Signals:
- no isolated restore test
- backup verification limited to file existence
- encryption keys are undocumented or inaccessible

Preventive Actions:
- checksum and manifest
- monthly selective restore
- quarterly full restore
- deletion and revocation replay tests

Contingency Actions:
- block high-risk migration
- use provider-native recovery
- rebuild from portable export if needed

Owner:
Operations Owner

Status:
Active

## IR-030: Production and Staging Drift

Category:
Operations

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
Environment configuration, provider scopes, migrations, or manual changes may differ enough that staging no longer predicts production.

Potential Consequences:
- release failure
- privacy or permission surprises

Early Warning Signals:
- undocumented production variables
- staging uses different runtime or database behavior
- manual production edits

Preventive Actions:
- typed environment schema
- infrastructure and configuration history
- separate but equivalent environments
- release checklist

Contingency Actions:
- freeze release
- reconcile configuration
- rebuild staging parity

Owner:
Operations Owner

Status:
Monitoring

## IR-031: Audit Logging Fails During Consequential Action

Category:
Operations and Security

Likelihood:
Unlikely

Impact:
Critical

Severity:
High

Description:
An action may succeed externally while its audit record fails, leaving the system unable to reconstruct what happened.

Potential Consequences:
- loss of accountability
- unsafe retries
- incident uncertainty

Early Warning Signals:
- audit and action writes are not transactional where possible
- audit service errors are ignored
- no read-only safe mode

Preventive Actions:
- transactional local writes
- fail closed for high-impact action if audit unavailable
- provider verification and independent references

Contingency Actions:
- pause external writes
- reconstruct from provider history
- create incident record

Owner:
Audit and Execution Owners

Status:
Active

## IR-032: Background Worker Failure Goes Unnoticed

Category:
Operations

Likelihood:
Possible

Impact:
Moderate

Severity:
Moderate

Description:
Synchronization, cleanup, embeddings, or briefings may stop while the web application remains available.

Potential Consequences:
- stale Calendar data
- missed briefings
- delayed deletion cleanup

Early Warning Signals:
- queue age increases
- no recent successful run
- worker health absent from dashboard

Preventive Actions:
- worker health check
- queue metrics
- last-success alerts
- manual refresh fallback

Contingency Actions:
- restart worker
- inspect backlog
- discard expired jobs
- revalidate queued actions

Owner:
Operations Owner

Status:
Monitoring

# Schedule and Execution Risks

## IR-033: Phase 1 Backlog Is Too Large for One Developer

Category:
Schedule

Likelihood:
Likely

Impact:
High

Severity:
High

Description:
The P0 implementation may exceed available development time, especially with learning, testing, deployment, and integration work.

Potential Consequences:
- burnout
- abandoned project
- incomplete safety controls

Early Warning Signals:
- sprint work repeatedly carries over
- multiple domains remain half-built
- code and architecture both expand without release

Preventive Actions:
- sequence one vertical slice
- reduce UI polish before safety and workflow correctness
- use managed services where appropriate
- defer P1 work aggressively

Contingency Actions:
- redefine an Alpha before full MVP
- release local-only mode first
- narrow Calendar to read-only

Owner:
Nishad

Status:
Active

## IR-034: Skill Gaps Slow Implementation

Category:
Schedule and Capability

Likelihood:
Likely

Impact:
Moderate

Severity:
Moderate

Description:
The project spans frontend, backend, databases, OAuth, AI, security, deployment, and product design, exceeding one person's current experience in some areas.

Potential Consequences:
- long debugging cycles
- insecure shortcuts
- dependence on generated code without understanding

Early Warning Signals:
- copied code cannot be explained
- security-sensitive work proceeds without testing
- implementation stalls on setup or provider APIs

Preventive Actions:
- build in small slices
- use official documentation and managed services
- create research spikes
- seek targeted engineering review
- require understanding before merging generated code

Contingency Actions:
- simplify stack
- contract or collaborate on narrow specialties
- postpone high-risk features

Owner:
Nishad

Status:
Active

## IR-035: Planning Work Replaces Coding Work

Category:
Execution

Likelihood:
Almost Certain

Impact:
High

Severity:
Critical

Description:
The project may trigger Nishad's known tendency to enjoy architecture, systems, and optimization more than implementation.

Potential Consequences:
- continued document creation
- delayed learning through real code
- perfectionism and project stagnation

Early Warning Signals:
- asks what document comes next after implementation plan is complete
- creates additional standards before repository setup
- avoids starting because the stack choice is not perfect

Preventive Actions:
- set a hard architecture freeze after this section
- next action must be repository initialization
- track artifacts produced, not ideas described
- use a weekly implementation quota

Contingency Actions:
- prohibit new design docs until a vertical slice ships
- choose one two-hour build block and implement P1-001
- publicly or personally commit to a demo date

Owner:
Nishad

Status:
Escalated

# Trust and User Experience Risks

## IR-036: Chief Feels Invasive

Category:
User Trust

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
The system may surface memories, patterns, or private data in ways that feel creepy or disproportionate.

Potential Consequences:
- reduced use
- memory disabled entirely
- loss of trust in the whole system

Early Warning Signals:
- irrelevant personal references
- behavioral labels feel fixed or judgmental
- sensitive information appears without clear reason

Preventive Actions:
- relevance-first retrieval
- candidate memory
- Memory Inspector
- source and reason visibility
- conservative behavioral wording

Contingency Actions:
- lower memory retrieval scope
- disable implicit memory creation
- review and purge disputed memories

Owner:
Product and Privacy Owners

Status:
Monitoring

## IR-037: Chief Becomes Too Noisy

Category:
User Trust and Product

Likelihood:
Likely

Impact:
Moderate

Severity:
Moderate

Description:
Briefings, risks, reminders, and automation alerts may overwhelm Nishad.

Potential Consequences:
- alert fatigue
- ignored important signals
- system abandonment

Early Warning Signals:
- repeated unchanged notifications
- briefing becomes a task dump
- too many low-priority alerts

Preventive Actions:
- notification hierarchy
- deduplication
- quiet hours
- one primary action
- user feedback controls

Contingency Actions:
- bundle into digest
- raise thresholds
- disable low-value automations

Owner:
Product Owner

Status:
Monitoring

## IR-038: User Overrelies on Chief's Recommendations

Category:
User Trust

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
Nishad may treat Chief's recommendations as authoritative, especially in medical, financial, academic, or relationship contexts.

Potential Consequences:
- reduced independent judgment
- harmful high-stakes decisions

Early Warning Signals:
- recommendations lack assumptions
- user asks the system to decide without review
- model language is overly confident

Preventive Actions:
- disclose uncertainty
- show tradeoffs and source
- retain professional boundaries
- require confirmation for consequential decisions

Contingency Actions:
- narrow response to options and evidence
- recommend qualified human review where appropriate

Owner:
AI Safety and Product Owners

Status:
Monitoring

# Hardware and Future-Scope Risks

## IR-039: Wearable Hardware Distracts from Core Chief

Category:
Hardware and Wearables

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
Rear-view glasses or ambient-device research may consume attention before the software operating system proves value.

Potential Consequences:
- expensive prototyping
- fragmented project
- delayed MVP

Early Warning Signals:
- hardware purchases before desktop MVP
- camera and battery research replaces software implementation

Preventive Actions:
- maintain hardware as separate research track
- require core Chief milestone before active prototype build

Contingency Actions:
- archive hardware backlog temporarily
- restrict work to short feasibility notes

Owner:
Nishad

Status:
Monitoring

## IR-040: Voice Interface Creates Privacy and Reliability Problems

Category:
Voice and Privacy

Likelihood:
Possible

Impact:
High

Severity:
High

Description:
Voice transcription errors, bystander capture, public speech, and accidental commands may undermine trust.

Potential Consequences:
- false actions
- privacy exposure
- poor usability

Early Warning Signals:
- voice added before transcript and approval controls
- always-listening proposed for Phase 1
- names and numbers are not confirmed

Preventive Actions:
- defer voice until after MVP
- begin with push-to-talk
- display transcript
- retain normal approval gates

Contingency Actions:
- disable voice action commands
- use voice only for note capture

Owner:
Voice Interface Owner

Status:
Monitoring

# Governance and Documentation Risks

## IR-041: Architecture Documents Drift from Implementation

Category:
Governance

Likelihood:
Likely

Impact:
Moderate

Severity:
Moderate

Description:
Implementation may diverge while documents continue presenting outdated architecture as current.

Potential Consequences:
- confusion
- wrong assumptions
- unsafe maintenance

Early Warning Signals:
- code uses different schemas or providers
- ADRs are not created or updated
- release changes lack documentation

Preventive Actions:
- documentation review in Definition of Done
- ADR process
- architecture review after milestones

Contingency Actions:
- mark outdated documents explicitly
- reconcile implementation and architecture before next major feature

Owner:
Project Owner

Status:
Monitoring

## IR-042: Risk Register Becomes Static Documentation

Category:
Governance

Likelihood:
Possible

Impact:
Moderate

Severity:
Moderate

Description:
This register may be created once and never reviewed, updated, or linked to actual decisions.

Potential Consequences:
- warning signals ignored
- false sense of risk management

Early Warning Signals:
- review dates pass
- materialized risks do not update status
- backlog and release decisions ignore the register

Preventive Actions:
- weekly review cadence
- link risks to backlog and release checklist
- update after incidents and milestone reviews

Contingency Actions:
- archive obsolete risks
- rebaseline top ten risks
- assign explicit owners

Owner:
Project Owner

Status:
Active

## Top Ten Phase 1 Risks

The highest-priority risks at the start of Phase 1 are:
1. IR-035: Planning Work Replaces Coding Work
2. IR-014: Prompt Injection Influences Tool Use
3. IR-008: Deleted Data Remains Retrievable
4. IR-013: Secrets Are Committed or Logged
5. IR-024: Approval UI Exists but Backend Enforcement Is Weak
6. IR-001: Architecture Continues Without Implementation
7. IR-002: MVP Scope Inflation
8. IR-007: False or Weak Memories Become Active Truth
9. IR-023: Duplicate External Actions
10. IR-029: Backups Exist but Cannot Be Restored

## Risk Review Agenda

A weekly risk review should answer:
1. Which risks changed?
2. Which warning signals appeared?
3. Which mitigations are overdue?
4. Which risk now blocks the current sprint or release?
5. Did any risk materialize into an issue or incident?
6. Which risk can be closed or downgraded?
7. Is a new risk more important than one currently prioritized?

## Risk Dashboard

The implementation dashboard should show:
- top active risks
- Critical and High risks
- overdue reviews
- warning signals
- mitigation status
- risks by milestone
- accepted risks
- materialized risks

## Risk and Backlog Integration

Every High or Critical risk should map to one or more:
- backlog items
- tests
- runbooks
- release gates
- incident playbooks

## Risk and Release Integration

Before release, review:
- all Critical risks
- High risks affecting changed components
- warning signals since the last release
- accepted risks and expiration dates

## Risk and Incident Integration

When a risk materializes:
1. Mark it Materialized.
2. Create issue or incident record.
3. Preserve evidence.
4. execute contingency actions.
5. Update likelihood, impact, and controls.
6. Decide whether to close, revise, or create a successor risk.

## Risk and ADR Integration

An ADR should reference relevant implementation risks when a decision:
- accepts residual risk
- changes the threat surface
- changes provider dependence
- changes data or permission boundaries
- defers mitigation

## Risk Metrics

Useful metrics include:
- active risks by severity
- overdue mitigation count
- average time to close
- number of materialized risks
- repeated risk categories
- accepted-risk age
- percentage of High and Critical risks with tests and runbooks

Metrics should improve attention, not create false precision.

## Failure Modes

### Risk Theater

Risks are documented but do not affect work.

### Everything Is Critical

Severity inflation makes prioritization useless.

### No Ownership

Risks remain everybody's concern and nobody's responsibility.

### Mitigation Without Evidence

A control is listed but not tested.

### Acceptance Without Review

Residual risk remains accepted forever.

### Incident Disconnect

Materialized risks fail to update the register.

### Schedule Blindness

The project tracks technical risk but ignores execution behavior and scope creep.

## Phase 1 Implementation

Phase 1 should:
- create a structured risk register
- assign owners
- review risks weekly
- link top risks to backlog items and tests
- display Critical and High risks in release review
- update status after incidents and milestones
- treat IR-035 as an immediate execution constraint

## Success Criteria

The Implementation Risk Register succeeds if:
- the largest threats to MVP delivery are visible
- warning signals are recognized before failure
- mitigation work appears in the backlog
- release decisions reflect current risk
- accepted risks remain explicit and time-bounded
- implementation behavior changes in response to the register

## Final Principle

North Vector should not wait for uncertainty to become failure before taking it seriously.

The risk register should turn vague concern into specific ownership, evidence, and action.