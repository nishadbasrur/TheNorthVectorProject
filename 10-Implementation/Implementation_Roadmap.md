# Implementation Roadmap v1.0

## Purpose

This document defines how North Vector should move from architecture documents into a working, testable, secure product.

The Implementation Roadmap exists to convert the full design into an ordered sequence of build phases, technical milestones, decision gates, and validation checkpoints.

Its purpose is not to implement every feature at once.

Its purpose is to build the smallest trustworthy system that proves the core model, then expand capability without losing control.

## Core Principle

North Vector should earn complexity.

Each phase should produce a usable artifact, validate a major architectural assumption, and avoid depending on systems that have not yet been proven.

## Primary Objectives

The roadmap should help answer:
- What should be built first?
- Which components are foundational?
- What can be deferred?
- What dependencies exist?
- What proves that a phase is complete?
- When is the system safe enough to add more autonomy?
- What should remain manual until later?

## Implementation Strategy

North Vector should be built in layers:

1. Foundation
2. Canonical Data and Memory
3. Core Chief Interaction
4. Planning and Review
5. Integrations
6. Automation
7. Security Hardening
8. Wearables and Advanced Context
9. Scaled Autonomy

Each layer should remain usable before the next layer begins.

## Guiding Constraints

The implementation should:
- begin as a single-user system
- prioritize desktop and mobile before wearables
- use read-only integrations first
- separate reasoning from execution
- preserve auditability from the beginning
- use explicit confirmation for external actions
- avoid financial or medical autonomy
- avoid continuous location tracking
- avoid full inbox or full-drive ingestion
- avoid multi-agent complexity in early phases

## Phase 0: Repository and Project Foundation

### Objective

Create a stable engineering environment for implementation.

### Deliverables

- repository structure
- README and architecture index
- coding standards
- environment configuration
- issue and milestone structure
- branch strategy
- secret-management approach
- automated formatting and linting
- basic test framework
- CI workflow

### Technical Decisions

Select:
- primary language
- backend framework
- frontend framework
- database
- authentication provider or library
- hosting approach
- local development workflow

### Recommended Starting Stack

A practical starting point may use:
- TypeScript
- Next.js or React for interface
- Node.js backend services
- PostgreSQL
- pgvector for semantic retrieval
- Redis or lightweight cache where needed
- OAuth integrations
- GitHub Actions for CI

The exact stack may change after prototyping.

### Completion Criteria

Phase 0 is complete when:
- project builds locally
- tests run automatically
- no secrets are committed
- environment separation exists
- one deployment target works
- repository standards are documented

## Phase 1: Canonical Data Foundation

### Objective

Implement the internal language of North Vector.

### Deliverables

- canonical base object schema
- Person
- Goal
- Project
- Task
- Commitment
- Event
- Risk
- Opportunity
- Decision
- Memory
- Evidence
- Source Reference
- typed relationships
- versioning
- sensitivity labels
- retention fields
- audit events

### Database Work

Implement:
- canonical_objects
- object_relationships
- source_references
- evidence_records
- audit_events
- schema migrations
- soft deletion
- indexes

### API Work

Create secure CRUD APIs for:
- objects
- relationships
- source references
- memory candidates
- reviews

### Completion Criteria

Phase 1 is complete when:
- canonical objects can be created, updated, linked, archived, and deleted
- every change produces an audit event
- source and sensitivity are preserved
- relationship traversal works for direct links
- deletion propagates to retrieval indexes

## Phase 2: Memory Lifecycle and Retrieval

### Objective

Build memory that is useful, cautious, and inspectable.

### Deliverables

- memory candidate creation
- explicit save flow
- memory confirmation
- confidence and evidence
- review dates
- contradiction handling
- archive and expiration
- no-memory mode
- Memory Inspector interface
- exact retrieval
- structured retrieval
- semantic retrieval
- shallow graph expansion
- context assembly

### Retrieval Work

Implement:
- objective classification
- permission filtering
- relevance scoring
- recency and confidence ranking
- context tiers
- context compression
- retrieval logging

### Completion Criteria

Phase 2 is complete when:
- the system can save a user-approved memory
- inferred memories remain candidates
- Nishad can inspect, edit, archive, and delete memory
- retrieval excludes stale, deleted, restricted, or irrelevant records
- Chief can explain why a memory was used

## Phase 3: Chief Conversation Experience

### Objective

Create the main interface through which Nishad communicates with Chief.

### Deliverables

- Chief Conversation View
- session creation and history
- text input
- structured response cards
- decision mode
- planning mode
- reflection mode
- command mode
- context strip
- memory notices
- action confirmation tray
- session summary

### Model Integration

Implement:
- model provider abstraction
- system-policy layer
- context injection
- structured response schemas
- tool proposal format
- refusal and uncertainty handling

### Completion Criteria

Phase 3 is complete when:
- Chief can hold coherent sessions
- current objective remains visible
- responses use relevant memory
- no external action occurs directly from reasoning
- pending actions are inspectable and confirmable
- sessions can be resumed

## Phase 4: Planning, Goals, Tasks, and Reviews

### Objective

Make North Vector useful for daily execution and long-term direction.

### Deliverables

- goals dashboard
- project view
- task and commitment view
- Today view
- planning engine
- daily briefing
- evening shutdown
- weekly review
- decision records
- risk and opportunity views
- progress and milestone tracking

### Planning Engine Features

Implement:
- fixed versus flexible time
- task duration estimates
- deadlines
- buffers
- dependency ordering
- next-action selection
- replanning
- behavioral failure-mode interventions

### Completion Criteria

Phase 4 is complete when:
- Chief can generate a day plan from local data
- tasks link to goals and projects
- commitments are distinct from ordinary tasks
- weekly review updates priorities and lessons
- risks and opportunities influence planning

## Phase 5: Google Calendar Integration

### Objective

Connect North Vector to scheduled reality.

### Initial Scope

- read approved calendars
- normalize events
- classify fixed and flexible events
- detect conflicts
- calculate free time
- create events on one approved calendar
- ask before modifying or deleting existing events

### Technical Work

Implement:
- OAuth
- scoped calendar permissions
- sync adapter
- incremental refresh
- event normalization
- provider version tracking
- conflict handling
- audit logging

### Completion Criteria

Phase 5 is complete when:
- Chief can accurately summarize the day
- calendar freshness is visible
- event creation is verified
- conflicting edits do not overwrite silently
- planning uses real calendar constraints

## Phase 6: Gmail and Contacts Integration

### Objective

Support communication obligations and relationship follow-through.

### Gmail Initial Scope

- search approved messages
- read threads
- summarize important messages
- extract candidate tasks and commitments
- create drafts
- require approval before sending

### Contacts Initial Scope

- read-only search
- identity resolution
- email and phone lookup
- relationship-memory linking

### Completion Criteria

Phase 6 is complete when:
- Chief can find a relevant email
- thread context is read before drafting
- recipient identity is verified
- email drafts remain reviewable
- sending requires exact approval
- no broad autonomous inbox management exists

## Phase 7: Academic System Integration

### Objective

Create a continuously updated map of coursework and academic obligations.

### Initial Scope

- read course list
- read assignments
- read announcements
- read grades where available
- import syllabus files
- normalize deadlines
- detect clusters
- create local tasks and study plans

### Completion Criteria

Phase 7 is complete when:
- Chief can answer what is due and when
- official grades remain distinct from projections
- syllabus and announcement conflicts are visible
- study plans connect to calendar and tasks
- the system does not submit graded work

## Phase 8: Files, Drive, and GitHub Integration

### Objective

Give North Vector controlled access to working documents and project history.

### Google Drive Initial Scope

- one approved folder
- file search
- Google Docs and PDF reading
- file summaries
- create new files
- confirmed updates
- version conflict protection

### GitHub Initial Scope

- one approved repository
- file read
- file creation
- file update
- commit creation
- issue creation
- pull request creation
- secret scanning

### Completion Criteria

Phase 8 is complete when:
- files can be found by meaning and title
- updates preserve current versions
- GitHub changes return a verified commit SHA
- secrets block commits
- shared or destructive changes require stronger confirmation

## Phase 9: Notification Center

### Objective

Create a controlled signal layer for reminders, risks, approvals, and opportunities.

### Deliverables

- notification object model
- priority levels
- grouping
- duplicate suppression
- snooze
- dismiss
- confirmation queue
- quiet hours
- privacy-safe previews
- feedback controls

### Completion Criteria

Phase 9 is complete when:
- notifications are grouped by urgency
- repeated unchanged alerts are suppressed
- sensitive content is hidden on public surfaces
- approvals can be reviewed separately
- low-value routine runs remain silent

## Phase 10: Automation Foundation

### Objective

Allow safe recurring and triggered workflows.

### Initial Automations

- Morning Briefing
- Weekly Review
- Assignment Intake
- Exam Preparation Monitor
- Calendar Conflict Monitor
- Mentor Follow-Up Assistant
- Integration Health Check

### Technical Work

Implement:
- automation records
- trigger engine
- scheduling
- condition evaluation
- permissions
- approval modes
- run records
- idempotency
- retries
- automatic pause
- failure handling
- audit dashboard

### Completion Criteria

Phase 10 is complete when:
- automations can dry-run
- each run explains why it fired
- duplicate effects are prevented
- high-impact actions wait for approval
- failure and partial success are visible
- any automation can be paused immediately

## Phase 11: Voice Interface

### Objective

Allow natural hands-free interaction without weakening privacy or authority.

### Initial Scope

- push-to-talk
- transcription
- transcript preview
- interruption
- mute and stop
- voice session manager
- explicit microphone state
- raw-audio deletion
- no-memory voice mode

### Deferred Features

- continuous wake phrase
- always-listening behavior
- broad bystander capture
- voice-only authentication

### Completion Criteria

Phase 11 is complete when:
- voice sessions are reliable
- Nishad can inspect transcripts
- uncertain names or actions require confirmation
- raw audio follows retention policy
- external actions still use normal approval controls

## Phase 12: Security and Privacy Hardening

### Objective

Validate that the system remains trustworthy as capability expands.

### Deliverables

- passkey or strong authentication
- trusted-device registration
- session revocation
- restricted-data reauthentication
- secret manager
- prompt-injection defenses
- deletion verification
- security testing suite
- backup restoration tests
- incident-response playbooks
- privacy dashboard

### Completion Criteria

Phase 12 is complete when:
- critical authorization tests pass
- deleted data no longer appears in indexes
- revoked devices and tokens stop working
- prompt-injection tests cannot authorize actions
- a full isolated restore succeeds
- incident exercises produce actionable results

## Phase 13: Financial and Health Read-Only Integrations

### Objective

Add sensitive data only after the security and privacy foundation is proven.

### Financial Scope

- read balances
- read transactions
- due-date monitoring
- savings summaries
- no payments, transfers, trades, or applications

### Health Scope

- sleep
- activity
- workouts
- appointments
- medication reminders
- manual symptom and energy logging
- no diagnosis or medication changes

### Completion Criteria

Phase 13 is complete when:
- access is category-specific
- Restricted data requires strong authentication
- public and wearable surfaces hide details
- financial actions remain impossible
- health guidance stays within wellness and planning boundaries

## Phase 14: Location, Weather, and Travel Context

### Objective

Make plans more situationally aware.

### Initial Scope

- one-time location
- saved places
- route planning
- departure timing
- weather-aware planning
- severe-weather alerts
- travel-day briefing

### Deferred Features

- continuous location history
- passive geofencing
- autonomous safety conclusions

### Completion Criteria

Phase 14 is complete when:
- departure timing accounts for travel and buffer
- temporary location expires
- weather changes plans only when operationally relevant
- location data does not become continuous surveillance

## Phase 15: Wearable and Glasses Interface

### Objective

Extend North Vector into low-friction, glanceable interfaces.

### Initial Scope

- brief notifications
- navigation cues
- quick capture
- simple confirmation
- phone handoff
- privacy-safe display

### Rear-View Awareness Research Track

Separate engineering work should validate:
- camera placement
- display field of view
- latency
- battery
- thermal constraints
- privacy indicators
- low-light behavior
- safety impact

### Completion Criteria

Phase 15 is complete when:
- wearables operate as limited-trust devices
- no Restricted memory is stored locally
- sensitive actions hand off to a trusted device
- microphone and camera state remain obvious

## Phase 16: Advanced Reasoning and Judgment

### Objective

Improve decision quality without expanding authority prematurely.

### Features

- comparable-decision retrieval
- decision calibration
- outcome review
- confidence tracking
- behavioral intervention selection
- scenario analysis
- opportunity-cost modeling
- multi-domain tradeoff analysis

### Completion Criteria

Phase 16 is complete when:
- recommendations show assumptions and uncertainty
- prior decision outcomes improve later judgment
- behavioral memories remain revisable
- high-stakes recommendations use stronger evidence thresholds

## Phase 17: Scoped Autonomy Expansion

### Objective

Allow narrow autonomous behavior only after repeated reliability is demonstrated.

### Possible Scope

- create local tasks automatically
- move flexible study blocks within approved windows
- archive clearly resolved low-risk notifications
- refresh and summarize approved data sources
- generate drafts automatically

### Actions That Should Remain Approval-Gated

- sending messages
- changing shared events
- publishing files
- deleting data
- merging pull requests
- financial actions
- medical actions
- legal submissions

### Completion Criteria

Autonomy may expand only when:
- run history is reliable
- duplicate rate is negligible
- permissions remain narrow
- rollback exists where relevant
- monitoring is active
- Nishad explicitly approves the scope

## Cross-Phase Workstreams

Some work should continue across all phases.

### Documentation

Keep architecture and implementation synchronized.

### Testing

Add tests with every feature.

### Threat Modeling

Review new attack surfaces before release.

### Data Quality

Monitor provenance, staleness, and conflict.

### Accessibility

Build keyboard, screen-reader, scaling, and reduced-motion support from the start.

### Performance

Track latency, retrieval speed, synchronization delay, and model cost.

### Privacy

Review data collection and retention before enabling each integration.

## Milestone Structure

Suggested major milestones:

### Milestone A: Trusted Memory Prototype

Includes:
- canonical data
- memory lifecycle
- retrieval
- Memory Inspector

### Milestone B: Chief Desktop Prototype

Includes:
- conversation
- goals
- tasks
- planning
- reviews

### Milestone C: Connected Chief

Includes:
- Calendar
- Gmail
- Contacts
- academic system
- files

### Milestone D: Safe Automation

Includes:
- triggers
- approval
- monitoring
- failure recovery

### Milestone E: Private Personal Operating System

Includes:
- security hardening
- privacy dashboard
- backups
- sensitive read-only integrations

### Milestone F: Ambient Chief

Includes:
- voice
- mobile
- wearables
- location and environment

## MVP Definition

The Minimum Viable Product should include:
- single-user authentication
- canonical data model
- memory candidates and confirmation
- Chief conversation interface
- goals, tasks, commitments, projects
- daily briefing
- weekly review
- Google Calendar read integration
- exact confirmation before writes
- audit log
- no-memory mode
- data export and deletion

The MVP should not include:
- continuous listening
- autonomous email sending
- financial actions
- health diagnosis
- continuous location
- multi-user access
- broad autonomous planning changes

## MVP Success Test

The MVP succeeds if Nishad can:
1. tell Chief an important goal
2. save relevant memory
3. inspect what was remembered
4. create tasks and commitments
5. connect the calendar
6. receive a useful daily briefing
7. replan the day
8. complete a weekly review
9. approve a calendar action safely
10. delete data and verify removal

## Development Method

Recommended method:
- build vertical slices
- test with real personal workflows
- keep scope narrow
- validate one integration at a time
- prefer working prototypes over speculative architecture expansion
- record decisions and outcomes

## Vertical Slice Example

A useful first vertical slice:

User says:
`I have a chemistry exam next Friday.`

System should:
1. create or link the exam event
2. create a goal or milestone relationship
3. generate study tasks
4. place candidate study blocks
5. ask before writing to Calendar
6. show preparation risk
7. include the exam in the briefing
8. update status during weekly review

This single slice tests memory, planning, risk, calendar, approval, and interface behavior.

## Technical Debt Policy

Technical debt should be recorded when:
- shortcuts reduce safety
- schema behavior is temporary
- provider handling is incomplete
- tests are missing
- privacy controls are deferred

Security, authorization, deletion, and audit debt should not be accepted casually.

## Feature Gate Policy

A feature should not ship when:
- required permissions are unclear
- failure behavior is undefined
- audit events are missing
- deletion behavior is untested
- Restricted data appears on inappropriate devices
- rollback or recovery is unavailable for consequential changes

## Release Gates

Each release should verify:
- tests pass
- migrations validated
- secrets scanned
- threat model updated
- permissions documented
- audit logging works
- rollback exists
- incident response is updated

## Performance Targets

Initial targets may include:
- ordinary interface response under two seconds where no model call is needed
- first streamed model output within a few seconds
- current-state retrieval under one second for ordinary queries
- integration freshness visible at all times
- automation trigger delay appropriate to the use case

These targets should be validated against real usage.

## Cost Controls

Track:
- model inference cost
- embedding cost
- storage
- provider API use
- background automation frequency
- logs and backups

The system should avoid running expensive reasoning cycles when deterministic logic is enough.

## Model Strategy

Use different models or processes for different tasks where appropriate.

Examples:
- deterministic code for permissions
- smaller model for classification
- stronger model for complex decisions
- local model for privacy-sensitive simple tasks

No model should directly bypass the authorization and execution layers.

## Build vs Buy Decisions

Potentially use managed services for:
- authentication
- PostgreSQL hosting
- secrets
- object storage
- monitoring

Build custom logic for:
- canonical object model
- memory lifecycle
- relationship graph
- planning behavior
- risk and opportunity reasoning
- approval and audit model

## Open Technical Questions

Questions requiring prototype validation:
- best model provider abstraction
- local versus cloud memory processing
- graph tables versus dedicated graph database
- semantic retrieval quality
- voice latency
- academic portal access method
- wearable hardware feasibility
- camera and display architecture for rear-view glasses

## Roadmap Review Cadence

Review the roadmap:
- after every major milestone
- after security or privacy incidents
- when provider constraints change
- when real usage disproves an assumption
- at least monthly during active development

## Roadmap Change Rules

A roadmap change should record:
- reason
- affected phase
- dependency impact
- risk impact
- whether MVP scope changes

## Failure Modes

### Architecture Forever

Documentation continues while no working slice is built.

### Premature Integration Sprawl

Many providers are connected before the data and permission model works.

### Automation Too Early

The system acts before monitoring and recovery exist.

### Wearable Distraction

Hardware work consumes effort before the core Chief is useful.

### Security Deferred

Sensitive integrations arrive before strong identity, deletion, and audit controls.

### MVP Inflation

The first release tries to include the entire vision.

### Prototype Lock-In

Early technical shortcuts become permanent architecture without review.

### Invisible Progress

Large amounts of work produce no usable user-facing result.

## Immediate Next Build Sequence

Recommended first implementation sequence:

1. Initialize application repository and development environment.
2. Implement canonical object base schema.
3. Implement Goal, Task, Commitment, Event, and Memory objects.
4. Implement audit events and versioning.
5. Build basic Memory Inspector.
6. Build Chief text conversation shell.
7. Implement context retrieval from local canonical data.
8. Build Today view and daily briefing from local data.
9. Add weekly review.
10. Connect Google Calendar read-only.
11. Add proposed calendar writes with confirmation.
12. Run the chemistry-exam vertical-slice test.

## Phase 1 Build Backlog

Initial engineering issues should include:
- repository setup
- database schema
- object API
- relationship API
- audit service
- memory candidate service
- retrieval service
- context assembler
- Chief session service
- conversation UI
- Memory Inspector UI
- Today UI
- planning service
- Calendar OAuth
- Calendar sync adapter
- approval service
- execution verifier

## Success Criteria

The Implementation Roadmap succeeds if:
- each phase produces a working artifact
- the system becomes useful before it becomes broad
- security and privacy mature with capability
- real workflows validate architectural assumptions
- autonomy expands only after reliability is demonstrated
- the project moves steadily from documents to execution

## Final Principle

North Vector should not be built as one giant leap toward Jarvis.

It should be built as a sequence of trustworthy capabilities, each useful on its own, each proving the foundation for the next.