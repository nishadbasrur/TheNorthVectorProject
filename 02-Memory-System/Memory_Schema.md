# Memory Schema v1.0

## Purpose

This document defines the standard structure used to represent memories inside North Vector.

The objective is consistency.

Every memory should contain enough information to be understood, retrieved, updated, connected to other memories, and evaluated for usefulness.

## Core Principle

A memory is not just a sentence.

A memory is a structured record with identity, context, confidence, relationships, and lifecycle metadata.

## Standard Memory Record

Each memory record should contain the following fields.

### memory_id

Unique identifier for the memory.

Example:
`mem_2026_000142`

### memory_type

The category of memory.

Possible values include:
- identity
- strategic
- operational
- behavioral
- goal
- relationship
- academic
- project
- financial
- health
- decision
- event
- opportunity
- risk

### title

Short human-readable label.

Example:
`Chemistry exam preparation risk`

### summary

Concise statement of the memory.

Example:
`Nishad tends to underestimate preparation time for difficult chemistry exams.`

### details

Longer explanation containing relevant context.

### source

Where the memory came from.

Possible values:
- direct_user_statement
- observed_behavior
- calendar
- email
- uploaded_document
- system_inference
- reflection
- external_integration

### source_reference

Pointer to the original source when available.

Examples:
- conversation ID
- email ID
- calendar event ID
- document path

### created_at

Timestamp when the memory was created.

### updated_at

Timestamp when the memory was last changed.

### effective_from

Date when the memory became valid.

### expires_at

Optional expiration date for temporary memories.

### status

Possible values:
- active
- candidate
- archived
- expired
- contradicted
- deleted

### confidence

How certain the system is that the memory is accurate.

Recommended scale:
- 0.00 to 1.00

Interpretation:
- 0.90 to 1.00: confirmed
- 0.70 to 0.89: strong evidence
- 0.50 to 0.69: moderate evidence
- 0.30 to 0.49: weak evidence
- below 0.30: tentative

### importance

How consequential the memory is.

Recommended scale:
- 1 to 5

### sensitivity

Privacy classification.

Possible values:
- low
- moderate
- high
- restricted

### time_horizon

Expected duration of relevance.

Possible values:
- immediate
- short_term
- semester
- annual
- multi_year
- permanent

### domains

Life domains affected by the memory.

Examples:
- academics
- health
- finances
- relationships
- career
- projects
- personal_development

### tags

Searchable labels.

Example:
`[chemistry, workload, procrastination, exam]`

### related_memory_ids

Links to connected memories.

### related_goal_ids

Links to goals affected by the memory.

### related_people_ids

Links to relevant relationship records.

### related_project_ids

Links to active projects.

### evidence

Supporting observations or records.

Each evidence item may contain:
- evidence_id
- date
- source
- summary
- strength

### contradiction_ids

Links to memories or evidence that conflict with this record.

### recommended_response

Preferred intervention or action when this memory becomes relevant.

### retrieval_weight

Base priority used during retrieval.

Recommended scale:
- 0.00 to 1.00

### last_retrieved_at

Timestamp of most recent retrieval.

### retrieval_count

Number of times the memory has been retrieved.

### review_at

Date when the memory should be reviewed for accuracy.

### decay_policy

Possible values:
- none
- slow
- moderate
- rapid
- archive_after_expiry

### user_confirmed

Boolean indicating whether Nishad explicitly confirmed the memory.

### version

Version number of the memory record.

## Example Memory Record

```json
{
  "memory_id": "mem_2026_000142",
  "memory_type": "behavioral",
  "title": "Delayed starts on ambiguous tasks",
  "summary": "Nishad is more likely to delay tasks when the first action is unclear.",
  "source": "observed_behavior",
  "status": "active",
  "confidence": 0.86,
  "importance": 5,
  "sensitivity": "moderate",
  "time_horizon": "multi_year",
  "domains": ["academics", "projects"],
  "tags": ["procrastination", "ambiguity", "task initiation"],
  "recommended_response": "Break the task into a concrete first action.",
  "retrieval_weight": 0.92,
  "decay_policy": "slow",
  "user_confirmed": true,
  "version": 1
}
```

## Type-Specific Extensions

Different memory types may add specialized fields.

### Goal Memory

Additional fields:
- target_date
- success_criteria
- progress
- priority
- dependencies

### Relationship Memory

Additional fields:
- person_name
- relationship_type
- trust_level
- last_interaction_at
- follow_up_at

### Event Memory

Additional fields:
- start_time
- end_time
- location
- participants
- preparation_required

### Risk Memory

Additional fields:
- probability
- severity
- mitigation_plan
- escalation_level

### Opportunity Memory

Additional fields:
- expiration_date
- strategic_value
- required_action

### Decision Memory

Additional fields:
- alternatives
- reasoning
- recommendation
- outcome
- lessons

## Validation Rules

Every memory must include:
- memory_id
- memory_type
- title
- summary
- source
- created_at
- status
- confidence
- importance

Candidate behavioral memories should not become established without sufficient evidence.

Temporary operational memories should include either an expiration date or review date.

Sensitive memories should use the appropriate sensitivity classification.

## Update Rules

Memories should be updated rather than duplicated when the underlying fact remains the same.

Every significant update should:
- increment version
- update updated_at
- preserve prior versions in history
- record the reason for change

## Final Principle

The schema should be detailed enough to support good judgment but simple enough to remain usable.

North Vector should store structured understanding, not bureaucratic clutter.