# Canonical Object Model v1.0

## Purpose

This document defines the shared structure used to represent the major entities inside North Vector.

The Canonical Object Model exists to prevent every subsystem and integration from inventing its own incompatible version of a goal, task, person, event, memory, or decision.

Its purpose is to create a stable internal language that the reasoning, memory, automation, interface, and integration layers can all understand.

## Core Principle

Every important thing in North Vector should have one canonical identity, clear provenance, explicit relationships, and a traceable lifecycle.

Source systems may describe the same thing differently.

The canonical model should preserve source detail while presenting one coherent internal object.

## Primary Objectives

The model should help Chief answer:
- What type of object is this?
- What is its stable identity?
- What is its current state?
- Where did it come from?
- How certain is it?
- What does it relate to?
- Who owns or controls it?
- How sensitive is it?
- How does it change over time?

## Canonical Object Families

North Vector should support the following primary object families:
- Identity
- Person
- Relationship
- Goal
- Project
- Task
- Commitment
- Habit
- Milestone
- Event
- Message
- File
- Decision
- Risk
- Opportunity
- Memory
- Review
- Notification
- Automation
- Integration
- Device
- Session
- Permission
- Action
- Incident
- Evidence
- Source Reference

## Shared Base Object

Every canonical object should inherit a common base structure.

Suggested fields:
- object_id
- object_type
- schema_version
- title
- summary
- status
- owner_id
- source_refs
- created_at
- updated_at
- effective_from
- effective_until
- last_verified_at
- confidence
- importance
- sensitivity
- retention_class
- review_at
- expires_at
- version
- tags
- related_object_ids
- deleted_at
- archived_at
- audit_reference

## Object Identity

### Stable Internal ID

Every canonical object should receive a stable North Vector object ID.

The ID should remain unchanged even if:
- title changes
- source provider changes
- the object is moved
- external identifiers change
- the object is archived

### External IDs

External provider identifiers should be stored in Source Reference objects.

One canonical object may map to multiple external IDs.

### Identity Collision

When two records may refer to the same real-world object, North Vector should create a candidate match rather than merging automatically when confidence is uncertain.

## Object Type

Each object should declare a stable object_type.

Examples:
- goal
- task
- event
- person
- memory

Object types should use controlled values rather than arbitrary free text.

## Schema Version

Every object should include a schema_version.

Schema versioning should allow:
- migrations
- backward compatibility
- validation
- auditability

## Title and Summary

### Title

A concise human-readable label.

### Summary

A short current-state explanation.

The summary should describe the object, not duplicate the entire record.

## Status

Each object family may use specialized statuses, but shared lifecycle states should remain normalized where practical.

Common states:
- Proposed
- Active
- Waiting
- At Risk
- Blocked
- Completed
- Deferred
- Archived
- Superseded
- Deleted

## Ownership

The owner field should identify who or what controls the object.

Possible owners:
- Nishad
- North Vector
- External Provider
- Shared

Ownership affects:
- edit authority
- synchronization
- conflict resolution
- deletion behavior

## Source References

Each object should link to one or more source references.

Examples:
- Google Calendar event
- Gmail message
- academic assignment
- GitHub file
- direct user statement
- system inference

Source references should never be replaced by a single vague source label when detailed provenance exists.

## Time Fields

### created_at

When the canonical object was first created.

### updated_at

When the canonical object last changed.

### effective_from

When the underlying fact or state became true.

### effective_until

When it stopped being true or relevant.

### last_verified_at

When the object was last checked against its source or confirmed by Nishad.

### expires_at

When the object should stop affecting active behavior unless reviewed.

## Confidence

Confidence should express uncertainty about the object's accuracy or interpretation.

Suggested values:
- Confirmed
- High
- Moderate
- Low
- Tentative
- Unknown

Confidence should not replace evidence.

## Importance

Importance indicates how much the object may affect planning or judgment.

Suggested values:
- Critical
- High
- Moderate
- Low

Importance should be contextual and revisable.

## Sensitivity

Suggested classifications:
- Public
- Internal
- Sensitive
- Restricted

Sensitivity should control:
- retrieval
- display
- device access
- logging
- export
- retention

## Retention Class

Suggested retention classes:
- Ephemeral
- Session
- Short-Term
- Active
- Long-Term
- Archived

## Tags

Tags may support organization and filtering.

Tags should not replace canonical relationships or object types.

Examples:
- academics
- finance
- UConn
- North Vector

## Relationship Links

Objects should connect through typed relationships rather than embedded assumptions.

Examples:
- task supports goal
- risk threatens project
- event involves person
- decision affects opportunity
- memory derived from message

## Identity Object

### Purpose

Represents stable facts about Nishad.

### Suggested Fields

- legal_name
- preferred_name
- date_of_birth
- home_region
- education_status
- primary_timezone
- communication_preferences
- accessibility_preferences

Restricted identity fields should remain separately protected.

## Person Object

### Purpose

Represents another individual.

### Suggested Fields

- full_name
- preferred_name
- role
- organization
- contact_refs
- relationship_id
- notes_summary
- sensitivity

A Person Object should not become a broad psychological profile.

## Relationship Object

### Purpose

Represents the operational context between Nishad and another person or institution.

### Suggested Fields

- person_id
- relationship_type
- closeness
- trust_level
- current_status
- communication_preference
- active_commitment_ids
- follow_up_at
- last_interaction_at
- privacy_level

Interpretive fields should preserve confidence and evidence.

## Goal Object

### Purpose

Represents an intended outcome.

### Suggested Fields

- goal_level
- domain
- description
- why_it_matters
- success_criteria
- target_at
- parent_goal_id
- progress_method
- progress_value
- priority
- risk_status
- next_milestone_id
- review_cadence

## Project Object

### Purpose

Represents coordinated work producing artifacts or outcomes.

### Suggested Fields

- description
- objective
- project_status
- start_at
- target_at
- owner_ids
- milestone_ids
- task_ids
- artifact_ids
- risk_ids
- related_goal_ids
- next_action

## Task Object

### Purpose

Represents a discrete action.

### Suggested Fields

- description
- task_type
- priority
- due_at
- planned_start_at
- estimated_duration
- completed_at
- parent_project_id
- related_goal_ids
- dependency_ids
- next_action
- postponement_count
- source_of_truth

## Commitment Object

### Purpose

Represents an obligation with consequence, reliance, or trust.

### Suggested Fields

- description
- commitment_type
- committed_to_person_id
- committed_to_organization
- due_at
- consequence_of_delay
- status
- repair_plan
- renegotiated_at
- source_statement

## Habit Object

### Purpose

Represents a recurring behavior or routine.

### Suggested Fields

- target_frequency
- recurrence_rule
- measurement_method
- related_goal_ids
- active_from
- review_at
- current_consistency
- last_completed_at

Habits should not be reduced to streaks alone.

## Milestone Object

### Purpose

Represents a meaningful project or goal checkpoint.

### Suggested Fields

- parent_goal_id
- parent_project_id
- success_criteria
- target_at
- completed_at
- dependency_ids
- risk_status

## Event Object

### Purpose

Represents a scheduled or time-bound occurrence.

### Suggested Fields

- event_category
- start_at
- end_at
- timezone
- location_id
- participant_ids
- flexibility
- recurrence_rule
- preparation_task_ids
- travel_duration
- source_calendar_id
- external_visibility

## Message Object

### Purpose

Represents an external communication reference.

### Suggested Fields

- channel
- sender_person_id
- recipient_person_ids
- subject
- sent_at
- received_at
- thread_id
- body_summary
- action_required
- response_due_at
- attachment_file_ids
- source_message_id

Full message bodies should generally remain source-held rather than copied into every canonical object.

## File Object

### Purpose

Represents a document, repository file, attachment, or artifact.

### Suggested Fields

- file_type
- provider
- path_or_url
- owner
- mime_type
- size
- version_ref
- content_summary
- checksum
- sharing_status
- related_project_ids
- related_goal_ids

## Decision Object

### Purpose

Represents a meaningful choice and its reasoning history.

### Suggested Fields

- decision_statement
- options
- criteria
- assumptions
- evidence_ids
- recommendation
- selected_option
- reversibility
- confidence
- decided_at
- outcome_review_at
- actual_outcome
- lesson_ids

## Risk Object

### Purpose

Represents a possible negative outcome.

### Suggested Fields

- category
- description
- probability
- severity
- escalation_level
- time_horizon
- affected_goal_ids
- affected_project_ids
- evidence_ids
- mitigation_action_ids
- trend
- accepted_at
- resolved_at
- resolution_criteria

## Opportunity Object

### Purpose

Represents a possible positive opening.

### Suggested Fields

- category
- description
- strategic_value
- goal_alignment
- expires_at
- effort
- financial_cost
- opportunity_cost
- upside
- dependency_ids
- next_action
- pursued_at
- captured_at
- declined_at

## Memory Object

### Purpose

Represents knowledge available for future retrieval.

### Suggested Fields

- memory_type
- statement
- source_ids
- evidence_ids
- confidence
- status
- user_confirmed
- use_contexts
- contradiction_ids
- decay_policy
- review_at
- last_used_at

## Review Object

### Purpose

Represents structured reflection and learning.

### Suggested Fields

- review_type
- period_start
- period_end
- executive_summary
- win_ids
- miss_ids
- observation_ids
- interpretation_ids
- lesson_ids
- decision_ids
- next_action_ids
- completed_at

## Notification Object

### Purpose

Represents a surfaced signal.

### Suggested Fields

- category
- priority
- title
- message
- triggered_at
- expires_at
- related_object_ids
- action_ids
- delivery_channels
- status
- seen_at
- resolved_at

## Automation Object

### Purpose

Represents a repeatable workflow.

### Suggested Fields

- automation_type
- trigger_ids
- condition_set
- action_definition_ids
- permission_scope
- approval_mode
- status
- last_run_at
- next_run_at
- health_state
- version

## Integration Object

### Purpose

Represents a connection to an external provider.

### Suggested Fields

- provider
- account_ref
- capabilities
- permission_scope
- trust_level
- token_status
- last_sync_at
- sync_status
- revoked_at

## Device Object

### Purpose

Represents a registered device.

### Suggested Fields

- device_name
- device_type
- operating_system
- trust_level
- registered_at
- last_seen_at
- authentication_methods
- local_storage_capability
- restricted_data_access
- revoked_at

## Session Object

### Purpose

Represents an authenticated interaction session.

### Suggested Fields

- device_id
- started_at
- last_active_at
- assurance_level
- privacy_mode
- active_goal_or_objective
- summary
- pending_action_ids
- ended_at

## Permission Object

### Purpose

Represents a capability grant.

### Suggested Fields

- subject_id
- capability
- scope
- approval_mode
- assurance_required
- granted_at
- expires_at
- last_used_at
- revoked_at

## Action Object

### Purpose

Represents a proposed or executed operation.

### Suggested Fields

- action_type
- target_system
- target_object_id
- proposed_payload
- risk_level
- approval_status
- execution_status
- verification_status
- rollback_status
- requested_at
- executed_at

## Incident Object

### Purpose

Represents a security, privacy, automation, or operational incident.

### Suggested Fields

- category
- severity
- status
- detected_at
- affected_object_ids
- confirmed_impact
- uncertain_impact
- containment_actions
- recovery_actions
- root_cause
- closed_at

## Evidence Object

### Purpose

Represents support or contradiction for a claim, memory, risk, or decision.

### Suggested Fields

- evidence_type
- source_ref_id
- summary
- strength
- supports_or_contradicts
- observed_at
- related_object_id

## Source Reference Object

### Purpose

Represents the external or original source behind a canonical object.

### Suggested Fields

- provider
- source_type
- external_id
- source_url
- source_version
- captured_at
- last_verified_at
- trust_level
- permission_scope
- raw_record_reference

## Object Relationships

Common relationship types should include:
- supports
- depends_on
- blocks
- threatens
- creates
- fulfills
- involves
- owned_by
- assigned_to
- derived_from
- evidence_for
- contradicts
- supersedes
- mitigates
- related_to

## Object Lifecycle

Create
↓
Validate
↓
Activate
↓
Update
↓
Review
↓
Complete, Archive, Supersede, or Delete

Each lifecycle transition should create an audit event.

## Validation Rules

All canonical objects should be validated for:
- required fields
- valid object type
- schema version
- timestamp consistency
- sensitivity value
- retention value
- source references where required
- relationship integrity
- owner

## Update Rules

Updates should:
- preserve object_id
- increment version
- record changed fields
- preserve previous values where required
- update updated_at
- create audit event

## Merge Rules

When merging duplicate objects:
- select surviving canonical ID
- preserve all source references
- preserve version history
- reconcile conflicting fields
- redirect relationships
- record merge event

## Split Rules

When one object incorrectly represents multiple real objects:
- create new canonical objects
- redistribute source references
- redistribute relationships
- preserve original history
- record split reason

## Supersession Rules

Supersession should be used when a newer object replaces an older one but historical meaning remains.

Examples:
- revised goal
- changed preference
- replaced plan
- new policy version

## Deletion Rules

Deletion should respect:
- dependencies
- derived objects
- source references
- audit requirements
- retention policy
- backup behavior

## Serialization

Canonical objects should support stable serialization to:
- JSON
- Markdown summaries
- CSV for tabular subsets

Serialized output should preserve:
- object ID
- object type
- schema version
- timestamps
- source references
- sensitivity
- relationships

## API Representation

API responses should return:
- canonical fields
- explicit nullability
- consistent status values
- version
- permission-aware redaction

## Search Representation

Search indexes may include:
- title
- summary
- tags
- selected fields
- source labels
- relationship hints

Restricted fields should remain excluded or access-controlled.

## UI Representation

The interface should render object-specific views while preserving the shared base model.

Example:
A Risk card and Goal card look different, but both share:
- object ID
- title
- status
- confidence
- sensitivity
- source
- version

## Phase 1 Implementation

Phase 1 should implement canonical schemas for:
- Person
- Relationship
- Goal
- Project
- Task
- Commitment
- Event
- Risk
- Opportunity
- Decision
- Memory
- Review
- File
- Automation
- Permission
- Action
- Evidence
- Source Reference

## Success Criteria

The Canonical Object Model succeeds if every subsystem can reliably answer:
- what object it is handling
- which fields are authoritative
- where the object came from
- how it relates to other objects
- how it changed
- what sensitivity and retention rules apply

## Final Principle

North Vector should have many sources, many views, and many workflows.

It should still speak one internal language.