# Relationship Graph Model v1.0

## Purpose

This document defines how North Vector should represent, store, validate, traverse, rank, and maintain relationships between canonical objects.

The Relationship Graph Model exists because goals, tasks, people, risks, decisions, files, events, and memories only become operationally useful when their connections are explicit.

Its purpose is not to create a decorative network diagram.

Its purpose is to let Chief reason over structure, dependency, influence, and context.

## Core Principle

Relationships should be first-class data.

North Vector should not bury critical connections inside free-text notes or assume that two objects are related merely because they were retrieved together.

## Primary Objectives

The graph should help Chief answer:
- What supports this goal?
- What threatens this project?
- Which tasks depend on this event?
- Which people are involved in this commitment?
- Which memories influenced this decision?
- What will be affected if this object changes or disappears?
- How strong and current is the relationship?

## Graph Components

The model contains:
- Nodes
- Edges
- Edge Types
- Direction
- Confidence
- Provenance
- Effective Time
- Status
- Access Rules

## Nodes

Each node should correspond to a canonical North Vector object.

Examples:
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
- Review
- File
- Message
- Automation
- Evidence

The graph should reference canonical object IDs rather than duplicate full objects.

## Edges

An edge represents a typed relationship between two nodes.

Every edge should answer:
- Which objects are connected?
- What kind of relationship exists?
- In which direction?
- How certain is it?
- Where did the relationship come from?
- When is it valid?

## Standard Relationship Record

Each relationship should contain:
- relationship_id
- from_object_id
- to_object_id
- relationship_type
- directionality
- status
- confidence
- importance
- source_refs
- created_at
- updated_at
- effective_from
- effective_until
- last_verified_at
- review_at
- expires_at
- sensitivity
- owner_id
- attributes
- audit_reference

## Directionality

### Directed

The relationship has a meaningful source and target.

Examples:
- task supports goal
- risk threatens project
- decision creates action

### Undirected

The relationship is symmetrical.

Examples:
- object related to object
- duplicate candidate

### Reciprocal

Two directed relationships exist with different meanings.

Example:
- person mentors Nishad
- Nishad is mentee of person

The system should avoid treating all relationships as symmetrical.

## Core Relationship Types

### supports

One object contributes to another.

Examples:
- task supports goal
- project supports strategic objective

### depends_on

One object cannot proceed without another.

Examples:
- task depends on file
- milestone depends on approval

### blocks

One object prevents another from progressing.

### threatens

A risk may negatively affect a goal, project, event, or relationship.

### mitigates

An action, task, or control reduces a risk.

### creates

One object produces another.

Examples:
- decision creates task
- review creates lesson

### fulfills

A task or event satisfies a commitment or milestone.

### involves

An object includes a person, organization, device, or other participant.

### owned_by

An object is controlled or primarily maintained by an owner.

### assigned_to

Responsibility is delegated to a person or system.

### derived_from

An object was generated from another source or record.

### evidence_for

An evidence object supports a claim, memory, risk, or decision.

### contradicts

One object or evidence item conflicts with another.

### supersedes

A newer object or version replaces an older one.

### caused_by

One object is considered a cause or contributing cause of another.

### affects

A broad directional influence exists without stronger causal certainty.

### related_to

A low-specificity connection exists.

This should be used sparingly when no better relationship type applies.

### part_of

An object belongs inside a larger object.

Examples:
- task part of project
- milestone part of goal

### follows

One object occurs or should occur after another.

### precedes

One object occurs or should occur before another.

### scheduled_for

A task, review, or action is tied to an event or time block.

### concerns

A message, file, or review concerns a person, project, course, or decision.

### communicates_with

A message or action connects to a person or institution.

### located_at

An event, device, or person is associated with a place.

### governed_by

An object is constrained by a policy, rule, or permission.

### requires_approval_from

An action or workflow requires authorization from an identity or role.

## Edge Type Registry

Relationship types should be governed by a registry.

Each type should define:
- name
- description
- valid source object types
- valid target object types
- directionality
- inverse type if one exists
- transitivity
- default confidence rules
- default retention behavior
- sensitivity inheritance

## Inverse Relationships

Some relationship types should have defined inverses.

Examples:
- supports ↔ supported_by
- depends_on ↔ required_by
- owned_by ↔ owns
- assigned_to ↔ responsible_for
- part_of ↔ contains
- precedes ↔ follows

The system may materialize inverse edges or compute them dynamically.

## Transitivity

Some relationships may be transitively useful.

Examples:
- task supports operational goal
- operational goal supports strategic goal
- therefore task indirectly supports strategic goal

Transitive inference should be labeled as derived rather than stored as direct truth unless useful.

## Non-Transitive Relationships

The system should not assume transitivity for:
- trusts
- communicates_with
- contradicts
- threatens
- located_at
- related_to

## Relationship Confidence

Suggested labels:
- Confirmed
- High
- Moderate
- Low
- Tentative
- Unknown

Confidence should reflect:
- direct user confirmation
- explicit source link
- repeated evidence
- inference depth
- contradiction
- recency

## Relationship Importance

Importance may indicate how much the connection matters for reasoning.

Suggested values:
- Critical
- High
- Moderate
- Low

Example:
A task's link to a medical-school goal may be useful but low in immediate operational importance.

A commitment's link to a professor may be high importance.

## Relationship Provenance

Every edge should preserve how it was created.

Possible sources:
- explicit user statement
- provider-native link
- system inference
- manual linking
- workflow output
- imported document

## Explicit vs Inferred Relationships

### Explicit

Directly stated or represented by a trusted source.

Example:
A calendar attendee is explicitly linked to an event.

### Inferred

Derived from context or similarity.

Example:
A file may concern a project because its content and folder suggest that relationship.

Inferred relationships should begin with lower confidence and remain reviewable.

## Relationship Statuses

Suggested statuses:
- Candidate
- Active
- Confirmed
- Contradicted
- Expired
- Archived
- Deleted
- Superseded

## Temporal Relationships

Relationships may be valid only during a time range.

Examples:
- person is current employer contact
- task blocks milestone until completion
- risk threatens goal during exam week
- device is trusted until revoked

The graph should preserve effective_from and effective_until.

## Dynamic Relationships

Some edges should update automatically.

Examples:
- overdue task threatens goal
- completed task fulfills milestone
- disconnected integration blocks automation

Dynamic edges should preserve the rule that created them.

## Derived Relationship Rules

Each derived relationship should record:
- rule_id
- source objects
- inference method
- confidence
- generated_at
- expiration

## Relationship Attributes

Edges may include type-specific attributes.

Examples:

For depends_on:
- dependency_type
- required_status
- blocking_reason

For threatens:
- probability
- severity
- time_horizon

For involves:
- participant_role
- attendance_status

For supports:
- contribution_strength
- mechanism

## Graph Validation

The system should validate:
- both node IDs exist
- relationship type is allowed
- source and target object types are valid
- required attributes exist
- timestamps are coherent
- duplicate edge policy is respected
- sensitivity rules are applied

## Duplicate Relationships

Two edges may be duplicates when they share:
- source
- target
- relationship type
- effective period
- source provenance

Duplicate candidate edges should merge evidence rather than create noise.

## Contradictory Relationships

The graph may contain conflicting edges.

Example:
- task supports goal
- task threatens goal due to time displacement

These are not necessarily invalid because one object may have different effects.

True contradictions should be represented explicitly and reviewed.

## Graph Traversal

Chief should support controlled traversal by:
- depth
- relationship type
- object type
- time range
- confidence
- sensitivity
- importance

## Traversal Depth

Default retrieval should use shallow traversal.

Suggested default:
- direct neighbors
- one additional hop when strategically relevant

Deep traversal should require a clear purpose to avoid context explosion.

## Common Graph Queries

### Goal Support Query

`What currently supports this goal?`

Traverse:
- supported_by
- contains
- part_of
- scheduled_for

### Risk Impact Query

`What will this risk affect?`

Traverse:
- threatens
- affects
- blocks

### Dependency Query

`What is preventing this project from moving?`

Traverse:
- depends_on
- blocks
- waiting_on

### Relationship Context Query

`What do I need to know before contacting this person?`

Traverse:
- involves
- commitment links
- message links
- event links
- relationship memory

### Decision Reconstruction Query

`What evidence and goals influenced this decision?`

Traverse:
- evidence_for
- concerns
- affects
- derived_from

### Deletion Impact Query

`What will be affected if this object is deleted?`

Traverse incoming and outgoing dependencies, derivations, and references.

## Path Ranking

Graph paths should be ranked using:
- relationship importance
- confidence
- recency
- path length
- objective relevance
- sensitivity compatibility

Shorter paths should not always outrank stronger or more relevant paths.

## Path Explanation

When graph reasoning influences a recommendation, Chief should be able to explain the path.

Example:
`This task matters because it supports the chemistry milestone, which supports your semester GPA goal.`

## Cycle Detection

The graph should detect problematic cycles.

Examples:
- goal depends on task that depends on same goal state
- automation triggers itself indirectly
- project milestones block one another circularly

Not all cycles are invalid, but dependency cycles should be surfaced.

## Orphan Detection

An orphaned relationship exists when:
- source object is deleted
- target object is deleted
- source reference disappears
- relationship loses all evidence

Orphans should be repaired, archived, or deleted.

## Sensitivity Inheritance

An edge should inherit the highest relevant sensitivity when the relationship itself reveals private information.

Example:
A public person object linked to a Restricted health event creates a Restricted relationship edge.

## Authorization

Graph queries should enforce permissions at:
- node level
- edge level
- path level
- output level

A permitted node should not expose a restricted relationship indirectly.

## Retrieval Privacy

The graph should not use unrelated sensitive relationships merely because they improve ranking slightly.

Objective relevance should be required.

## Graph Storage

Phase 1 may use relational relationship tables rather than a dedicated graph database.

Suggested structure:
- canonical_objects table
- object_relationships table
- relationship_types table
- relationship_evidence table

A dedicated graph database should only be added when query complexity justifies it.

## Suggested Relationship Table

Fields:
- relationship_id
- owner_id
- from_object_id
- to_object_id
- relationship_type
- status
- confidence
- importance
- effective_from
- effective_until
- source_refs
- attributes_json
- sensitivity
- created_at
- updated_at
- deleted_at

## Indexing

Useful indexes may include:
- from_object_id
- to_object_id
- relationship_type
- status
- effective period
- owner_id
- sensitivity

## Graph Caching

Frequently used subgraphs may be cached.

Examples:
- active goals and supporting tasks
- current-day events and commitments
- active project dependencies

Caches should expire and respect authorization changes.

## Graph Updates

Graph edges may change when:
- objects are created or deleted
- source systems update
- user corrects memory
- task completes
- risk changes
- project closes
- decision is reviewed

## Transactional Graph Updates

Related object and edge changes should occur atomically where possible.

Example:
Completing a task may:
- update task status
- create fulfills edge to milestone
- remove blocks edge
- update goal progress

## Audit Logging

Every edge change should record:
- relationship created
- relationship updated
- relationship confirmed
- relationship contradicted
- relationship expired
- relationship deleted
- relationship merged

## User Inspection

The interface should let Nishad inspect:
- direct relationships
- why a relationship exists
- source
- confidence
- last verification
- effect on recommendations
- correction or deletion controls

## Visual Graph View

A visual graph may be offered for exploration.

It should:
- begin with one focused object
- show limited depth
- group by object type
- allow filtering
- avoid rendering the entire knowledge graph at once

## Graph View Failure Modes

### Hairball Visualization

Too many nodes and edges appear at once.

### Edge Ambiguity

The user cannot tell what a connection means.

### Hidden Inference

Inferred links appear as confirmed fact.

### Stale Edges

Relationships remain active after context changes.

### Over-Traversal

Chief retrieves unrelated personal context.

### Graph Authority

A path is treated as causal proof when it only shows association.

### Broken Deletion

Deleted nodes remain reachable through stale edges.

### Relationship Type Sprawl

Too many vague or overlapping edge types accumulate.

## Graph Governance

New relationship types should be added only when:
- an existing type is insufficient
- the semantic distinction changes reasoning
- source and target constraints can be defined
- inverse and retention behavior are understood

## Relationship Review

Relationships should be reviewed when:
- confidence is low
- contradiction appears
- source disconnects
- effective period ends
- the relationship influences a high-stakes recommendation
- user disputes it

## Phase 1 Implementation

Phase 1 should support:
- typed directed edges
- relationship registry
- provenance
- confidence
- temporal validity
- sensitivity
- direct and shallow traversal
- dependency and impact queries
- cycle detection
- orphan cleanup
- deletion propagation
- user inspection

Advanced graph analytics, centrality scoring, and predictive link discovery can come later.

## Success Criteria

The Relationship Graph Model succeeds if North Vector can reliably explain:
- how two objects are connected
- where the connection came from
- how certain and current it is
- what depends on it
- what would be affected if it changed
- whether the relationship is direct or inferred

## Final Principle

North Vector should not merely know facts.

It should understand how those facts connect, while preserving the difference between evidence, influence, dependence, and causation.