# Privacy Architecture v1.0

## Purpose

This document defines how North Vector should collect, classify, process, retain, retrieve, disclose, export, and delete personal data.

The Privacy Architecture exists to ensure that memory, integrations, voice, automation, devices, and analytics remain useful without becoming invasive.

Its purpose is not merely to comply with privacy expectations.

Its purpose is to preserve Nishad's ability to understand and control how the system knows him.

## Core Principle

North Vector should collect the minimum information needed, use it only for clear purposes, and keep Nishad in control of what persists.

Privacy should be visible, understandable, and built into every layer.

## Primary Objectives

The architecture should help Chief answer:
- What data is being collected?
- Why is it needed?
- How long will it be retained?
- Where is it stored?
- Which systems can access it?
- What is inferred rather than directly stated?
- How can Nishad inspect, correct, export, or delete it?

## Privacy Principles

North Vector should follow:
- Data Minimization
- Purpose Limitation
- Explicit Consent
- User Control
- Transparency
- Contextual Integrity
- Selective Retention
- Revocability
- Security by Default
- Privacy-Preserving Personalization

## Data Categories

The system may process:
- Identity Data
- Contact Data
- Calendar Data
- Communication Data
- Academic Data
- Financial Data
- Health Data
- Location Data
- Device Data
- Behavioral Data
- Goal and Project Data
- Voice and Transcript Data
- Automation and Audit Data
- Inferred Data

## Data Classification

Suggested privacy classes:
- Public
- Internal
- Sensitive
- Restricted

### Public

Information intentionally safe for public exposure.

### Internal

Ordinary operational data used within North Vector.

### Sensitive

Personal information requiring careful access and display controls.

### Restricted

Highly sensitive information such as health, finance, credentials, identity documents, legal records, and intimate personal context.

## Data Source Types

North Vector should distinguish:
- Direct User Statement
- User-Approved Integration
- User-Created File
- Device Sensor
- External Provider
- System Inference
- Derived Summary
- Third-Party Statement

The source should remain attached to the data.

## Direct Data vs Inferred Data

### Direct Data

Information Nishad explicitly provided or an approved source reported.

Example:
`CHEM 1127Q exam is Friday.`

### Inferred Data

Information North Vector concluded from evidence.

Example:
`Nishad may underestimate preparation time for difficult coursework.`

Inferred data should:
- be labeled clearly
- include evidence
- include confidence
- remain revisable
- avoid becoming identity truth without confirmation

## Purpose Limitation

Each data item should have an intended purpose.

Examples:
- calendar data for planning
- sleep data for workload protection
- email data for commitment detection
- location for route timing

Data should not silently migrate into unrelated use cases.

## Data Collection Rules

Before collecting data, North Vector should determine:
- what field is needed
- why it is needed
- whether a less sensitive alternative exists
- whether one-time access is enough
- whether long-term retention is necessary
- whether explicit consent is required

## Data Minimization

Examples:
- use sleep duration instead of raw sensor streams
- use a file summary instead of duplicating the full document
- use approximate location when exact coordinates are unnecessary
- store a structured preference instead of the full conversation
- store masked account identifiers instead of full numbers

## Consent Model

Consent should be:
- specific
- informed
- revocable
- scoped
- separate for sensitive categories

Consent should not be bundled broadly when narrower choices are possible.

## Consent Types

### One-Time Consent

Applies to one action or retrieval.

### Session Consent

Applies during one active session.

### Persistent Consent

Applies until revoked.

### Category Consent

Applies to a defined data category.

### Integration Consent

Applies to a provider and scope.

## Sensitive Data Consent

Restricted categories should require explicit opt-in.

Examples:
- health records
- financial accounts
- precise location history
- private relationship notes
- identity documents

## Privacy Modes

### Standard Mode

Uses ordinary approved memory and integrations.

### No-Memory Mode

Prevents long-term memory creation unless explicitly requested.

### Sensitive Mode

Uses stricter retention, authentication, and display controls.

### Public Mode

Hides private previews and minimizes spoken disclosure.

### Local-Only Mode

Keeps supported processing on the local device and avoids cloud transmission where technically possible.

## Memory Privacy

Every memory should include:
- source
- confidence
- privacy classification
- purpose
- retention policy
- allowed retrieval contexts
- allowed devices
- review date
- deletion state

## Contextual Retrieval

A memory should only be retrieved when relevant to the current objective.

North Vector should not load unrelated personal details merely because they exist.

## Behavioral Privacy

Behavioral memories deserve special care.

They should:
- begin as observations or candidates
- require repeated evidence or confirmation
- avoid fixed identity labels
- include contradictory evidence
- expire or review over time
- remain inspectable

## Relationship Privacy

Relationship memory should contain only context useful for supporting the relationship.

Avoid:
- unnecessary profiling
- speculative judgments
- private details with no operational value
- importing third-party information without reason

## Voice Privacy

Voice privacy should enforce:
- visible microphone state
- limited raw audio retention
- transcript controls
- no-memory sessions
- bystander protections
- public-environment output limits
- explicit consent for recording others

## Location Privacy

Default rules:
- no continuous location history
- prefer one-time or while-in-use access
- expire temporary coordinates quickly
- restrict saved places
- avoid public display of exact addresses
- require explicit consent for geofencing

## Health Privacy

Health data should:
- be Restricted by default
- use category-specific permissions
- remain unavailable on untrusted devices
- avoid public spoken output
- use stronger authentication
- be retained only as long as useful

## Financial Privacy

Financial data should:
- be Restricted by default
- use masked account identifiers
- avoid lock-screen balances
- never appear on public wearables by default
- use read-only access in Phase 1
- keep audit logs free of unnecessary transaction detail

## Communication Privacy

Email and message content should:
- be retrieved only within approved scope
- avoid long-term full-body duplication
- preserve message references
- minimize quoting in memory
- protect third-party privacy

## Third-Party Data

North Vector may encounter personal data about other people through:
- email
- contacts
- calendar attendees
- shared files
- voice conversations

The system should:
- collect only what is needed
- avoid creating detailed profiles
- avoid inferring sensitive traits
- respect bystander and participant privacy
- restrict disclosure

## Data Retention

Each category should define retention.

Suggested retention classes:
- Ephemeral
- Short-Term
- Active
- Long-Term
- Archived

### Ephemeral

Deleted after immediate processing.

Examples:
- raw voice audio
- one-time location

### Short-Term

Retained for days or weeks.

Examples:
- active session context
- temporary energy state

### Active

Retained while relevant.

Examples:
- current goals
- active risks
- upcoming events

### Long-Term

Retained for durable value.

Examples:
- confirmed preferences
- major decisions
- stable relationship context

### Archived

Preserved historically but excluded from ordinary retrieval.

## Retention Review

Data should be reviewed when:
- review date arrives
- purpose expires
- goal ends
- source disconnects
- contradictory evidence appears
- user requests review

## Data Expiration

Data may expire automatically when:
- time horizon passes
- event ends
- project closes
- relationship context changes
- integration disconnects
- confidence degrades below threshold

Expiration should not necessarily mean deletion.

It may mean archive or removal from active retrieval.

## Deletion Model

Nishad should be able to delete by:
- individual item
- category
- source
- date range
- session
- project
- integration
- full account

## Deletion Scope

Deletion should distinguish:
- delete raw source copy
- delete normalized record
- delete derived memory
- delete summary
- delete audit reference
- preserve legally or operationally required minimal record

The interface should explain what remains.

## Soft Delete vs Hard Delete

### Soft Delete

Removed from active use but recoverable for a limited period.

### Hard Delete

Permanently removed where technically possible.

The difference should be clear before action.

## Data Correction

Nishad should be able to:
- edit a memory
- mark information inaccurate
- replace outdated preferences
- resolve contradictions
- correct source attribution
- downgrade confidence

Corrections should preserve version history when useful.

## Data Export

North Vector should support export of:
- memories
- goals
- tasks
- reviews
- automation history
- permissions
- integration records
- audit summaries

Exports should be readable and portable.

## Portability

Preferred export formats may include:
- JSON
- Markdown
- CSV
- PDF summaries

Exports should preserve source, timestamps, and relationships where practical.

## Data Access Transparency

The system should show:
- which component accessed data
- when
- for what purpose
- what action followed

This should be available through audit and memory inspection views.

## Device Privacy

Device trust should affect:
- visible data
- available memory
- notification previews
- confirmation options
- local caching

Wearables should receive the minimum necessary context.

## Public Display Rules

On public or shared surfaces:
- hide names when possible
- hide amounts
- hide health details
- hide addresses
- suppress sensitive previews
- require authentication for full content

## Notification Privacy

Notifications should use generic wording when necessary.

Example:
`A private follow-up is due today.`

Instead of exposing sensitive details on a lock screen.

## Analytics Privacy

Product analytics should:
- avoid collecting content by default
- use aggregated operational metrics
- minimize identifiers
- allow opt-out
- avoid tracking for advertising or engagement optimization

## Model and Provider Privacy

When external AI or processing providers are used, North Vector should define:
- what data is sent
- why
- retention terms
- training-use restrictions
- regional processing where relevant
- fallback options

Restricted data should use the strongest available processing controls.

## Local Processing

Local processing should be preferred when it meaningfully improves privacy and remains technically practical.

Potential local tasks:
- wake-word detection
- voice activity detection
- basic transcription
- classification
- secret scanning
- simple retrieval

## Cloud Processing

Cloud processing may be used for:
- complex reasoning
- large-model inference
- provider integrations
- synchronization

Cloud use should remain visible and governed by data classification.

## Data Sharing

North Vector should not share personal data with another person, provider, or service unless:
- required for the requested function
- permitted by scope
- appropriate to the context
- explicitly approved when sensitive

## Public Links and Publishing

Before publishing or creating a public link, Chief should show:
- exact content
- intended audience
- permanence
- access scope
- sensitive-data check

## Privacy Incident Types

Possible incidents include:
- unauthorized access
- wrong-device display
- unintended memory creation
- excessive retention
- bystander capture
- sensitive notification preview
- incorrect sharing scope
- deletion failure
- provider misuse or exposure

## Privacy Incident Response

The process should be:
1. Stop the affected flow.
2. Contain exposure.
3. Identify data and recipients.
4. Revoke access where possible.
5. Delete or correct affected data.
6. Notify Nishad clearly.
7. Review the root cause.
8. Improve controls.

## Privacy Audit

The system should periodically review:
- active data categories
- stale memories
- integration scope
- retained transcripts
- location data
- health and financial records
- public-device exposure
- third-party data
- deletion effectiveness

## Privacy Dashboard

The dashboard should show:
- connected data sources
- active privacy modes
- recent sensitive access
- candidate memories
- data due for review
- retention summary
- deletion and export controls

## Privacy Defaults

Recommended defaults:
- no continuous location tracking
- raw audio deleted after processing
- no autonomous health or financial ingestion
- behavioral inference conservative
- public notification previews hidden
- wearables limited to minimal context
- third-party data minimized
- sensitive categories opt-in

## Failure Modes

### Invisible Collection

Data is gathered without clear awareness.

### Purpose Drift

Data collected for one purpose is reused elsewhere.

### Over-Retention

Information remains after value expires.

### Inference Inflation

Tentative patterns become fixed truth.

### Third-Party Profiling

Contacts or bystanders become unnecessarily modeled.

### Deletion Ambiguity

The user cannot tell what was removed.

### Public Leakage

Sensitive content appears on the wrong surface.

### Privacy Theater

Controls exist visually but do not meaningfully constrain behavior.

## Phase 1 Implementation

Phase 1 should support:
- data classification
- source and purpose tracking
- no-memory mode
- category-specific consent
- memory inspection and correction
- retention policies
- deletion by item and source
- export
- public-device privacy
- restricted-data authentication
- privacy audit log

Advanced local-only processing and automated privacy-risk detection can come later.

## Success Criteria

The Privacy Architecture succeeds if Nishad can always understand:
- what North Vector knows
- where the information came from
- why it is being used
- how long it will remain
- which devices and systems can access it
- how to correct, export, or delete it

## Final Principle

North Vector should become more personal without becoming more intrusive.

Its memory should feel like trusted understanding, not invisible surveillance.