# Data Quality and Provenance Model v1.0

## Purpose

This document defines how North Vector should evaluate data quality, preserve source history, track evidence, detect weak or stale information, and communicate uncertainty.

The Data Quality and Provenance Model exists because North Vector will make recommendations from data collected across conversations, integrations, files, devices, and system inferences.

Its purpose is not to make every record look equally trustworthy.

Its purpose is to preserve the difference between official facts, direct statements, derived estimates, stale records, and uncertain conclusions.

## Core Principle

North Vector should never separate a claim from the evidence and source conditions that justify it.

Data should remain useful only to the degree that its provenance, quality, and current validity are understood.

## Primary Objectives

The model should help Chief answer:
- Where did this information come from?
- How reliable is the source?
- How current is it?
- Is it complete?
- Is it internally consistent?
- Does another source contradict it?
- Is it a direct fact, inference, estimate, or summary?
- Is it strong enough to support this decision or action?

## Data Quality Dimensions

North Vector should evaluate:
- Accuracy
- Completeness
- Timeliness
- Consistency
- Validity
- Uniqueness
- Provenance
- Relevance
- Granularity
- Confidence

## Accuracy

Accuracy represents how likely the record is to reflect reality.

Signals may include:
- authoritative source
- direct user confirmation
- independent corroboration
- successful verification
- low contradiction

Accuracy should not be inferred solely from formatting or confidence of wording.

## Completeness

Completeness represents whether required fields or context are present.

Examples:
- an event has a time but no location
- an assignment has a title but no due date
- a financial transaction lacks a merchant category
- a memory has a statement but no source

Incomplete data may still be useful, but the missing fields should remain visible.

## Timeliness

Timeliness represents whether the data is current enough for its purpose.

The same record may be timely for one use and stale for another.

Examples:
- a two-hour-old calendar is usually acceptable
- a two-day-old traffic estimate is not
- an old stable preference may still be current

## Consistency

Consistency represents whether related records agree.

Examples:
- assignment due date matches the syllabus and portal
- calendar and task systems use the same event time
- the current goal status matches supporting milestone state

## Validity

Validity represents whether data follows required schema and domain rules.

Examples:
- due date is a valid timestamp
- confidence uses an allowed value
- end time does not precede start time
- object type matches the schema

## Uniqueness

Uniqueness represents whether one real-world object is represented once canonically.

Duplicate records may create:
- repeated reminders
- conflicting tasks
- inflated evidence counts
- duplicate actions

## Provenance

Provenance represents the origin and transformation history of data.

It should answer:
- original source
- capture time
- provider and account
- source version
- transformations applied
- user confirmations
- derived records
- subsequent corrections

## Relevance

Relevance represents whether a record matters to the current objective.

High-quality but unrelated data should not enter context.

## Granularity

Granularity represents the level of detail.

Examples:
- raw transcript
- message summary
- structured commitment
- monthly spending total

North Vector should use the least detailed form that still supports the task.

## Confidence

Confidence represents uncertainty in the interpreted claim or normalized record.

Suggested values:
- Confirmed
- High
- Moderate
- Low
- Tentative
- Unknown

Confidence should be explainable and revisable.

## Provenance Chain

A provenance chain may look like:

Gmail Message
↓
Normalized Message Object
↓
Extracted Commitment Candidate
↓
User Confirmation
↓
Active Commitment Memory
↓
Risk Alert

Each stage should preserve the preceding source links.

## Standard Provenance Record

Each provenance record should contain:
- provenance_id
- object_id
- source_ref_id
- source_type
- provider
- account_id
- external_id
- source_version
- original_timestamp
- captured_at
- transformation_type
- transformation_version
- actor
- confidence
- verification_status
- derived_from_object_ids
- audit_reference

## Source Types

Suggested source types:
- Direct User Statement
- User Correction
- External Provider Record
- File or Document
- Voice Transcript
- Device Sensor
- Manual Entry
- System Inference
- Derived Calculation
- Aggregated Summary
- Third-Party Statement

## Source Trust Levels

Suggested trust levels:
- Authoritative
- Strong
- Moderate
- Weak
- Untrusted
- Unknown

Trust should be domain-specific.

An authoritative source for one field may not be authoritative for another.

## Domain Authority Examples

### Academic

Official academic portal:
Authoritative for posted grades and formal deadlines.

Syllabus:
Strong for planned course policy and schedule, but may be superseded by announcements.

### Calendar

Current provider event:
Authoritative for stored event time.

Nishad:
Authoritative for intent and whether the event remains meaningful.

### Finance

Institution provider:
Authoritative for posted balances and transactions.

North Vector:
Authoritative only for derived projections and categorization.

### Health

Clinical record:
Authoritative for documented care instructions.

Consumer wearable:
Moderate for wellness trends, not clinical conclusions.

### Preferences

Nishad:
Authoritative for stated preference.

Repeated behavior:
Supporting evidence but not superior to explicit correction.

## Transformation Types

Possible transformations include:
- Normalization
- Classification
- Summarization
- Extraction
- Aggregation
- Inference
- Calculation
- Merge
- Split
- Correction
- Redaction

## Transformation Transparency

Derived objects should record:
- what transformation occurred
- what model, rule, or process produced it
- which source records were used
- whether the result was user confirmed

## Raw vs Canonical vs Derived

### Raw Data

Original source content or provider response.

### Canonical Data

Normalized internal object.

### Derived Data

Inference, summary, score, prediction, or relationship created from raw or canonical data.

The system should never present derived data as raw fact.

## Evidence Model

Evidence should support or contradict a claim.

Each evidence record should contain:
- evidence_id
- claim_or_object_id
- source_ref_id
- evidence_type
- summary
- strength
- direction
- observed_at
- confidence
- sensitivity
- status

## Evidence Direction

Suggested values:
- Supports
- Contradicts
- Contextualizes
- Neutral

## Evidence Strength

Suggested values:
- Strong
- Moderate
- Weak
- Anecdotal
- Unknown

Evidence strength should consider:
- source authority
- directness
- recency
- independence
- sample size
- ambiguity

## Directness

Evidence may be:
- Direct
- Indirect
- Inferred

Direct evidence should generally outrank indirect evidence.

## Independent Corroboration

Multiple sources should increase confidence only when they are genuinely independent.

Three summaries copied from one original source should not count as three independent confirmations.

## Quality Score

North Vector may calculate a quality score for internal ranking.

A conceptual model may include:

`quality = accuracy + completeness + timeliness + consistency + provenance_strength - contradiction_penalty - staleness_penalty`

The score should not replace dimension-level explanation.

## Dimension-Level Status

Each quality dimension may use:
- Good
- Acceptable
- Weak
- Failing
- Unknown

## Standard Data Quality Record

Each data-quality assessment should contain:
- quality_record_id
- object_id
- assessed_at
- accuracy_status
- completeness_status
- timeliness_status
- consistency_status
- validity_status
- uniqueness_status
- provenance_status
- overall_quality
- quality_issues
- recommended_action
- assessment_method
- audit_reference

## Quality Issue Types

Suggested issue types:
- Missing Required Field
- Stale Data
- Source Unavailable
- Conflicting Sources
- Invalid Format
- Duplicate Candidate
- Weak Provenance
- Unverified Inference
- Unsupported Relationship
- Broken Source Link
- Suspicious Value
- Incomplete Deletion
- Schema Mismatch

## Standard Quality Issue Record

Each issue should contain:
- issue_id
- object_id
- issue_type
- severity
- description
- detected_at
- affected_fields
- source_refs
- recommended_resolution
- status
- resolved_at
- resolution_summary

## Quality Issue Statuses

Suggested statuses:
- Open
- Under Review
- Resolved
- Accepted
- Deferred
- Superseded
- Not Applicable

## Severity

Suggested severity levels:
- Informational
- Low
- Moderate
- High
- Critical

Severity should reflect the consequence of using the bad data.

## Fitness for Purpose

A record should be judged relative to the intended use.

Example:
A rough estimated duration may be acceptable for low-stakes planning but not for a tightly constrained exam-day schedule.

## Decision Quality Thresholds

Suggested thresholds:

### Low-Stakes Recommendation

May use Moderate-quality data with disclosed uncertainty.

### Consequential Planning

Should use current, sufficiently complete, and traceable data.

### High-Stakes Action

Should require strong provenance, current verification, and conflict resolution.

### Restricted Domain Decision

Health, finance, legal, and security contexts should use stricter thresholds.

## Data Freshness Rules

Each object type should define:
- freshness threshold
- stale threshold
- expiration threshold
- refresh method
- fallback behavior

## Freshness Examples

- current location: minutes
- weather: minutes to hours
- calendar: minutes to hours
- academic deadlines: hours
- financial balance: hours to one day
- stable identity: months or years
- behavioral memory: periodic review

## Stale Data Behavior

When data becomes stale, North Vector should:
- attempt refresh
- lower quality status
- label it clearly
- avoid consequential action
- use last confirmed value only when safe

## Source Verification

Verification may include:
- provider re-fetch
- user confirmation
- checksum comparison
- version-token comparison
- cross-source comparison
- successful execution result

## Verification Statuses

Suggested statuses:
- Verified
- Partially Verified
- Unverified
- Verification Failed
- Source Unavailable
- Superseded

## Contradiction Detection

The system should detect contradictions across:
- current and historical versions
- direct statements and inferences
- multiple providers
- user correction and stored memory
- official and estimated records

## Contradiction Record

Each contradiction should contain:
- contradiction_id
- object_or_claim_ids
- detected_at
- conflicting_fields
- source_refs
- severity
- recommended_resolution
- status
- resolved_by
- resolved_at

## Contradiction Handling

When contradiction is consequential:
- preserve both claims
- prevent silent overwrite
- lower confidence
- block high-impact action
- ask for clarification or refresh source

## Missing Data

Missing data should be represented explicitly rather than invented.

Examples:
- unknown due date
- missing location
- unavailable balance
- unclear relationship role

## Unknown vs Null

The model should distinguish:
- not provided
- not applicable
- deliberately withheld
- unavailable
- unknown
- deleted

## Imputation

North Vector may estimate missing values only when:
- the estimate materially helps
- the method is appropriate
- uncertainty is visible
- the estimate is not mistaken for official data

## Estimate Record

Each estimate should contain:
- estimated_field
- estimated_value
- method
- source_inputs
- confidence
- generated_at
- valid_until
- official_value_available

## Duplicate Detection

Duplicates may be detected using:
- provider and external ID
- normalized title
- timestamp
- content hash
- relationship overlap
- semantic similarity

## Duplicate Resolution

Possible actions:
- merge
- link as related but separate
- mark one superseded
- keep both
- request review

## Quality Inheritance

Derived data should inherit quality limitations from source data.

A highly polished summary of weak data remains weak.

## Confidence Propagation

When multiple transformations occur, confidence should generally not increase without new evidence or confirmation.

## Provenance for Summaries

Summaries should preserve links to the source records they compress.

The system should be able to expand a summary back into its supporting records.

## Provenance for Graph Edges

Inferred relationships should preserve:
- source objects
- inference rule
- confidence
- review date

## Provenance for Recommendations

Consequential recommendations should preserve:
- goals considered
- data sources used
- assumptions
- risks
- confidence
- stale or excluded data

## Provenance for Actions

Executed actions should link to:
- user instruction
- approval
- payload
- target state
- provider response
- verification result

## User Corrections

User correction should:
- create a new provenance event
- lower or supersede conflicting data
- update confidence
- preserve prior state historically
- trigger context invalidation

## Source Removal

When a source is disconnected or deleted:
- mark dependent provenance links unavailable
- review derived data
- lower confidence if necessary
- delete unsupported data according to policy

## Broken Provenance

A record has broken provenance when:
- source reference no longer resolves
- provider version is missing
- transformation is undocumented
- evidence was deleted

Broken provenance should create a quality issue.

## Data Quality Monitoring

The system should monitor:
- stale records
- missing required fields
- duplicate rates
- contradiction rates
- invalid schema
- source failures
- unsupported inferences
- broken links
- unresolved quality issues

## Quality Dashboard

The dashboard should show:
- overall data health
- stale critical records
- unresolved contradictions
- duplicate candidates
- weak-provenance memories
- broken source links
- recent corrections
- integration quality by provider

## Domain-Specific Quality Rules

### Academic

- official grades remain distinct from projections
- syllabus dates may be superseded by announcements
- missing due dates should block automatic scheduling

### Financial

- pending and posted transactions remain distinct
- cached balances show last refresh
- estimates never replace official balances

### Health

- consumer sensor data remains distinct from clinical records
- isolated readings should not create diagnoses
- source device and timestamp remain visible

### Location

- accuracy radius must be preserved
- approximate location cannot support exact claims

### Voice

- transcript confidence should influence memory writes
- uncertain names and numbers require confirmation

## Data Quality and Privacy

Quality review should not justify collecting unnecessary data.

More data is not automatically better data.

## Data Quality and Security

Suspicious quality changes may indicate:
- data poisoning
- provider compromise
- unauthorized edit
- schema attack
- broken integration

High-severity anomalies should create a security review.

## Data Quality and Automation

Automations should define minimum quality requirements.

Examples:
- calendar change requires current event version
- financial alert requires recent balance
- email send requires verified recipient
- memory update requires known source

## Quality Gates

Before consequential action, check:
- source available
- provenance intact
- confidence above threshold
- data current
- required fields complete
- conflicts resolved
- target version verified

## Quality Gate Result

Suggested outcomes:
- Pass
- Pass with Warning
- Block
- Request Refresh
- Request Clarification

## Audit Logging

Quality and provenance events should record:
- source captured
- transformation applied
- verification completed
- issue detected
- contradiction detected
- user correction
- duplicate merged
- confidence changed
- provenance broken
- issue resolved

## User Inspection

Nishad should be able to inspect:
- original source
- transformation history
- confidence
- quality issues
- contradictions
- verification date
- how the data influenced a recommendation

## Explainability

Chief should be able to say:
- `This date came from the official academic portal and was last verified today.`
- `This preference is based on three past choices but has not been explicitly confirmed.`
- `This balance is from yesterday and may be stale.`
- `Two sources disagree, so I did not treat either as definitive.`

## Testing

The system should test:
- stale provider data
- missing source reference
- duplicate assignment
- conflicting event times
- weak inference promoted to memory
- deleted source leaving derived summary
- unreliable transcript name
- official value versus estimate
- source version mismatch

## Error Handling

If provenance is missing:
`I have this record, but I cannot verify where it came from. I will not use it for a high-impact action.`

If data is stale:
`This balance was last updated yesterday and may no longer be current.`

If sources conflict:
`The syllabus and course announcement show different due dates. I preserved both and need the current official date before scheduling.`

If a transformation fails:
`The source record was preserved, but the normalized object was not created.`

## Failure Modes

### Source Flattening

All sources are treated as equally authoritative.

### Confidence Theater

A score appears precise without explainable evidence.

### Provenance Loss

Derived records cannot be traced back to sources.

### Stale Authority

An old official record overrides newer valid information.

### Duplicate Evidence Inflation

Copies of one source falsely increase confidence.

### Inference Laundering

A tentative conclusion becomes presented as direct fact.

### Missingness Concealment

Unknown values are silently filled or ignored.

### Quality Gate Bypass

Automation acts despite weak or conflicting data.

### Dashboard Complacency

A high aggregate score hides a critical weak record.

## Phase 1 Implementation

Phase 1 should support:
- provenance records
- source trust levels
- evidence objects
- quality dimensions
- freshness rules
- quality issues
- contradiction records
- verification statuses
- duplicate detection
- source and transformation history
- quality gates for consequential actions
- user inspection

Advanced probabilistic data fusion and automated source-reputation learning can come later.

## Success Criteria

The Data Quality and Provenance Model succeeds if North Vector can always explain:
- where a claim came from
- how it was transformed
- how current and complete it is
- how confident the system should be
- whether other evidence disagrees
- whether the data is fit for the current purpose

## Final Principle

North Vector should not merely store answers.

It should preserve the chain of evidence that makes an answer worth trusting.