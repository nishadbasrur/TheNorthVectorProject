# Data Architecture v1.0

## Purpose

This document defines how North Vector should structure, store, relate, retrieve, synchronize, classify, and govern data across memory, integrations, automation, security, and the user interface.

The Data Architecture exists to create one coherent information model from many different sources.

Its purpose is not to build a giant undifferentiated database.

Its purpose is to preserve meaning, provenance, relationships, privacy, and operational usefulness.

## Core Principle

North Vector should treat data as connected evidence, not isolated records.

Every important object should preserve what it is, where it came from, how certain it is, what it relates to, and how it may be used.

## Primary Objectives

The architecture should help Chief answer:
- What data exists?
- What type of object is it?
- Where did it come from?
- Which version is current?
- How is it related to goals, people, projects, risks, and decisions?
- How sensitive is it?
- How long should it remain?
- Which systems may read or modify it?

## Architectural Goals

The data layer should support:
- one coherent object model
- source provenance
- confidence and evidence
- relationship mapping
- temporal history
- privacy classification
- selective retrieval
- synchronization
- conflict resolution
- retention and deletion
- auditability
- portability

## High-Level Data Layers

### Source Layer

External and user-provided data enters through:
- direct user input
- voice
- calendar
- email
- contacts
- files
- GitHub
- academic systems
- financial systems
- health systems
- location
- weather

### Ingestion Layer

The system:
- validates
- normalizes
- classifies
- deduplicates
- timestamps
- attaches source metadata

### Canonical Object Layer

North Vector stores normalized objects such as:
- Person
- Goal
- Task
- Commitment
- Event
- Project
- Risk
- Opportunity
- Decision
- Memory
- Review
- File
- Message
- Automation

### Relationship Layer

Objects connect through explicit links.

### Retrieval Layer

Chief retrieves only context relevant to the current objective.

### Presentation Layer

The user interface displays readable views over the same underlying objects.

## Canonical Object Model

Every canonical object should contain a shared base structure.

Suggested fields:
- object_id
- object_type
- title
- summary
- status
- source_refs
- created_at
- updated_at
- effective_from
- effective_until
- confidence
- importance
- sensitivity
- retention_class
- review_at
- version
- owner
- tags
- related_object_ids
- audit_reference

## Core Object Types

### Identity Object

Represents stable facts about Nishad.

### Person Object

Represents another individual and links to contacts, relationships, messages, and commitments.

### Goal Object

Represents an intended outcome across a defined time horizon.

### Task Object

Represents a discrete action.

### Commitment Object

Represents an obligation involving consequence, trust, or reliance.

### Event Object

Represents something scheduled or time-bound.

### Project Object

Represents a coordinated body of work producing artifacts or outcomes.

### Risk Object

Represents a possible negative outcome with probability, severity, and mitigation.

### Opportunity Object

Represents a time-sensitive opening with upside, cost, and alignment.

### Decision Object

Represents a choice, options, assumptions, recommendation, action, and outcome.

### Memory Object

Represents durable or temporary knowledge used by Chief.

### Review Object

Represents reflection, evaluation, lessons, and changes.

### Message Object

Represents an email or communication reference.

### File Object

Represents a document, repository file, attachment, or local artifact.

### Automation Object

Represents a recurring or triggered workflow.

### Notification Object

Represents a surfaced signal requiring awareness or action.

## Source Reference Model

Each object may have one or more source references.

A source reference should contain:
- source_ref_id
- provider
- source_type
- external_id
- source_url
- captured_at
- last_verified_at
- source_version
- raw_record_reference
- trust_level
- permission_scope

## Provenance

North Vector should preserve whether information came from:
- Nishad directly
- an external provider
- a document
- a third party
- a system inference
- a derived calculation

Provenance should remain visible in the Memory Inspector and high-stakes decisions.

## Evidence Model

Evidence records should contain:
- evidence_id
- claim_or_object_id
- source_ref_id
- evidence_type
- summary
- strength
- supports_or_contradicts
- observed_at
- confidence
- sensitivity

## Confidence Model

Suggested confidence labels:
- Confirmed
- High
- Moderate
- Low
- Tentative
- Unknown

Confidence should depend on:
- source reliability
- recency
- user confirmation
- number of independent sources
- contradiction
- inference depth

## Relationship Model

Relationships should be explicit objects or typed edges.

Suggested relationship types:
- supports
- depends_on
- blocks
- affects
- caused_by
- related_to
- owned_by
- assigned_to
- involves
- derived_from
- supersedes
- contradicts
- evidence_for
- mitigates
- creates
- fulfills

## Relationship Record

Each relationship should contain:
- relationship_id
- from_object_id
- to_object_id
- relationship_type
- direction
- confidence
- source
- created_at
- updated_at
- effective_from
- effective_until
- status

## Temporal Model

North Vector should distinguish:
- record creation time
- source event time
- effective time
- last verified time
- expiration time
- review time

A fact may be recorded today but have been true months earlier.

## Versioning

Meaningful objects should support version history.

Each version should preserve:
- version number
- changed fields
- previous values
- reason
- actor
- timestamp
- source

## Supersession

When new data replaces old data, the system should mark the old object or version as:
- superseded
- archived
- contradicted
- expired

It should not silently erase useful history.

## Status Model

Common statuses should be normalized where practical.

Examples:
- Proposed
- Active
- Waiting
- At Risk
- Completed
- Deferred
- Archived
- Deleted
- Superseded

Object-specific statuses may still exist.

## Data Classification

Each object should use:
- Public
- Internal
- Sensitive
- Restricted

Classification should affect:
- storage
- retrieval
- display
- device access
- logging
- export
- retention

## Retention Model

Each object should declare:
- retention class
- review date
- expiration date
- archive policy
- deletion dependencies

## Canonical vs Source Data

### Source Data

Provider-native or raw input.

### Canonical Data

Normalized North Vector object used across systems.

### Derived Data

Summaries, scores, patterns, or inferences created from canonical and source data.

The distinction should remain explicit.

## Ingestion Pipeline

Suggested pipeline:

Receive Data
↓
Authenticate Source
↓
Validate Schema
↓
Classify Sensitivity
↓
Normalize Fields
↓
Resolve Identity
↓
Detect Duplicates
↓
Link Existing Objects
↓
Create or Update Canonical Object
↓
Generate Candidate Derived Records
↓
Write Audit Event

## Schema Validation

Incoming data should be validated for:
- required fields
- type
- format
- size
- allowed values
- timestamp validity
- source scope
- malformed content

## Identity Resolution

The system should resolve references to:
- Nishad
- people
- courses
- projects
- files
- events
- accounts

Ambiguous resolution should create a candidate match rather than a silent link.

## Deduplication

Deduplication may use:
- external IDs
- provider and account
- normalized title
- date and time
- content hash
- linked people
- semantic similarity

Duplicate confidence should be visible.

## Conflict Resolution

When records conflict, North Vector should consider:
- source authority
- recency
- user confirmation
- provider version
- confidence
- context

Consequential conflicts should remain unresolved until clarified.

## Source Authority

Authority may depend on domain.

Examples:
- official academic portal for posted grade
- calendar provider for current event time
- Nishad for personal preference
- bank provider for current balance
- clinician record for documented medical instruction

## Synchronization Model

Each integrated object should track:
- provider
- external ID
- source version
- last synced
- sync status
- source of truth
- pending local changes

## Synchronization States

Suggested states:
- Current
- Pending Upload
- Pending Download
- Delayed
- Conflict
- Authentication Expired
- Permission Limited
- Error
- Disconnected

## Source of Truth

Each field or object should define whether truth is owned by:
- North Vector
- external provider
- user
- shared reconciliation

This should prevent circular overwrite behavior.

## Eventual Consistency

External systems may update asynchronously.

North Vector should:
- preserve provider versions
- compare timestamps
- avoid overwriting newer data
- communicate stale state
- reconcile later

## Query Model

The system should support queries by:
- object type
- time
- status
- goal
- project
- person
- source
- sensitivity
- confidence
- relationship
- full text
- semantic similarity

## Retrieval Architecture

Retrieval should combine:
- exact lookup
- structured filtering
- graph traversal
- semantic search
- recency ranking
- importance ranking
- permission filtering

## Retrieval Authorization

Authorization should occur before and after retrieval.

The system should ensure:
- the query may access the category
- the device may display the result
- restricted records remain filtered
- public mode rules are applied

## Context Assembly

Chief should assemble context based on:
- current objective
- active session
- linked objects
- recency
- importance
- evidence quality
- available token or processing budget

The system should not load every related record.

## Context Summarization

Long histories should be summarized into:
- current state
- major changes
- unresolved conflicts
- active commitments
- relevant evidence

Raw history should remain inspectable.

## Memory Promotion

Derived observations should become memory only when:
- useful later
- sufficiently clear
- appropriately sourced
- privacy-compatible
- confirmed or supported

## Data Quality Dimensions

North Vector should monitor:
- completeness
- accuracy
- timeliness
- consistency
- uniqueness
- provenance
- validity

## Data Quality Record

Each quality issue may contain:
- issue_id
- object_id
- dimension
- severity
- description
- detected_at
- source
- recommended_resolution
- status

## Search Indexes

Possible indexes include:
- full-text index
- semantic vector index
- relationship graph index
- temporal index
- provider ID index

Indexes should preserve authorization and deletion behavior.

## Embeddings

If embeddings are used:
- store only what is necessary
- preserve source linkage
- respect sensitivity
- delete when source is deleted
- prevent cross-category leakage
- avoid treating similarity as truth

## Graph Model

The relationship graph should support questions such as:
- Which tasks support this goal?
- Which risks threaten this project?
- Which decisions affected this outcome?
- Which people are linked to this commitment?

## Transaction Model

Important multi-object updates should use transactions where possible.

Example:
Completing a task may update:
- task status
- goal progress
- risk state
- review log

Partial writes should be detected and repaired.

## Idempotency

Ingestion and writes should use idempotency keys to prevent duplicate objects.

## Audit Model

Every meaningful data change should record:
- actor
- source
- action
- object
- old state
- new state or summary
- timestamp
- approval reference

## Storage Model

The architecture may use multiple stores:
- relational database for canonical objects
- graph database or relationship tables
- object storage for files
- search index for retrieval
- vector index for semantic search
- append-only audit store
- cache for active sessions

The system should avoid adding storage technologies without a clear reason.

## Suggested Phase 1 Storage

A practical Phase 1 could use:
- PostgreSQL for canonical objects and relationships
- object storage or repository links for files
- pgvector for semantic retrieval
- Redis or local cache for short-lived session state
- append-only audit tables

## Database Design Principles

Use:
- stable unique IDs
- foreign keys or validated references
- explicit timestamps
- soft deletion where useful
- version fields
- migration scripts
- indexes based on real query needs

## Multi-Tenancy

Phase 1 is single-user.

Schemas should still avoid hard-coding assumptions that make future isolation impossible.

Every user-owned object should include an owner identifier.

## Data Locality

The architecture should support knowing:
- local device data
- cloud data
- provider-held data
- cached data
- replicated data

## Offline Data

Offline records should track:
- local creation time
- pending sync
- conflict state
- source ownership

## Import and Export

North Vector should support import and export in:
- JSON
- Markdown
- CSV
- provider-native references

Exports should preserve:
- IDs
- source
- timestamps
- relationships
- status
- sensitivity

## Data Migration

Schema changes should use versioned migrations.

Migrations should define:
- old schema
- new schema
- transformation
- rollback strategy
- validation

## Backup and Restore

Backups should preserve:
- canonical records
- relationships
- audit logs
- encryption metadata
- deletion records

Restore should replay:
- revocations
- deletions
- supersession
- current versions

## Data Deletion

Deletion should propagate to:
- canonical records
- relationships
- search indexes
- embeddings
- caches
- local replicas
- derived objects

## Orphan Detection

The system should detect objects whose:
- parent was deleted
- source disappeared
- relationship target no longer exists
- provider link broke

Orphans should be repaired, archived, or deleted.

## Performance

The data layer should optimize for:
- fast current-state retrieval
- efficient relationship lookup
- bounded context assembly
- reliable writes
- understandable history

Performance should not justify weakening provenance or authorization.

## Observability

Monitor:
- ingestion failures
- sync delays
- duplicate rates
- conflict rates
- retrieval latency
- stale-data usage
- deletion failures
- orphan count
- index lag

## Error Handling

If ingestion fails:
`The source data was not added. Existing records remain unchanged.`

If conflict exists:
`Two sources disagree. I preserved both and did not overwrite the current record.`

If retrieval is incomplete:
`Some linked records could not be loaded, so this answer may be missing context.`

## Failure Modes

### Data Swamp

Everything is stored without useful structure.

### Source Loss

The system cannot explain where a fact came from.

### Duplicate Reality

Multiple objects represent the same thing.

### Silent Conflict

New data overwrites valid older data without review.

### Relationship Drift

Links become stale or incorrect.

### Retrieval Overreach

Too much unrelated personal data enters context.

### Index Leakage

Restricted or deleted data remains searchable.

### Schema Sprawl

Every integration invents incompatible object models.

### False Precision

Derived scores appear more certain than the evidence supports.

## Phase 1 Implementation

Phase 1 should support:
- canonical object base model
- goals, tasks, commitments, events, projects, risks, opportunities, people, decisions, and memories
- source references
- relationships
- confidence and sensitivity
- versioning
- synchronization status
- structured and semantic retrieval
- audit logging
- deletion propagation
- import and export

Advanced graph databases, predictive data quality, and multi-user tenancy can come later.

## Success Criteria

The Data Architecture succeeds if North Vector can always explain:
- what an object is
- where it came from
- how current it is
- how certain it is
- what it relates to
- who may access it
- how it changes or disappears

## Final Principle

North Vector's intelligence will only be as trustworthy as the structure beneath its memory.

The data layer should preserve truth, uncertainty, context, and control.