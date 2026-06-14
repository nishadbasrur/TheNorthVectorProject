# Behavioral Memory Model v1.0

## Purpose

This document defines how North Vector identifies, stores, validates, retrieves, updates, and applies behavioral patterns.

Behavioral memory helps Chief understand not only what Nishad intends to do, but what he is likely to do under specific conditions.

The objective is prediction and intervention, not judgment.

## Core Principle

One observation is not a pattern.

Behavioral memories must be earned through evidence.

## Behavioral Memory Definition

A behavioral memory is a persistent observation about how Nishad tends to think, decide, act, avoid, learn, recover, or respond.

Examples:
- delays vague tasks
- performs better with structure
- researches when uncertain
- underestimates difficult workloads
- responds well to accountability

Behavioral memories describe tendencies, not permanent truths.

## Behavioral Categories

### Productivity Behaviors

Examples:
- task initiation
- procrastination
- planning habits
- execution consistency

### Decision Behaviors

Examples:
- risk tolerance
- analysis style
- information seeking
- commitment speed

### Learning Behaviors

Examples:
- active recall effectiveness
- verbal processing
- study preferences
- retention patterns

### Project Behaviors

Examples:
- project initiation
- follow-through
- architecture bias
- new idea diversion

### Stress Behaviors

Examples:
- over-analysis
- avoidance
- sleep disruption
- emotional reactivity

### Social Behaviors

Examples:
- follow-up reliability
- relationship maintenance
- communication style

### Financial Behaviors

Examples:
- spending tendencies
- saving consistency
- speculation risk

### Health Behaviors

Examples:
- sleep adherence
- exercise consistency
- burnout patterns

## Standard Behavioral Memory Record

Each record should contain:
- behavior_id
- title
- description
- category
- status
- confidence
- evidence_count
- supporting_evidence_ids
- contradictory_evidence_ids
- triggers
- early_warning_signs
- typical_outcomes
- recommended_responses
- escalation_conditions
- affected_domains
- related_goal_ids
- related_failure_mode_ids
- created_at
- updated_at
- review_at
- user_confirmed

## Confidence Levels

### Emerging

Limited evidence.

Pattern is possible but uncertain.

### Developing

Several observations support the pattern.

### Established

Repeated evidence supports the pattern across similar situations.

### Core Pattern

Observed consistently over a long period and highly predictive.

## Evidence Sources

Behavioral evidence may come from:
- direct user statements
- repeated actions
- missed tasks
- completed tasks
- reflection records
- decision outcomes
- project outcomes
- academic performance
- user confirmation

No single source should automatically become a core pattern.

## Trigger Mapping

Behavioral memories should identify the conditions that activate them.

Example:

Behavior:
Information gathering replaces action.

Triggers:
- uncertainty
- unfamiliar systems
- high-stakes decisions

Trigger mapping improves prediction.

## Early Warning Signs

Behavioral memories should define observable signals.

Example:

Pattern:
Architecture without execution.

Early warning signs:
- expanding documentation
- repeated redesign
- no working prototype

These signs allow Chief to intervene earlier.

## Outcome Mapping

Behavioral memories should connect patterns to likely consequences.

Example:

Pattern:
Delayed start on ambiguous work.

Likely outcomes:
- compressed timeline
- increased stress
- lower quality

## Intervention Mapping

Every important behavioral memory should include one or more interventions.

Example:

Pattern:
Delays vague tasks.

Recommended response:
- define the first action
- set a short start deadline
- create visible completion criteria

## Success Pattern Registry

Behavioral memory should track strengths as carefully as weaknesses.

Examples:
- performs well with structured plans
- learns effectively through recitation
- responds to direct feedback
- improves when preparation begins early

Chief should reinforce success patterns, not only correct failure modes.

## Failure Pattern Integration

Behavioral memories should link to the Failure Mode Registry.

Example:

Behavioral memory:
Nishad tends to over-research under uncertainty.

Related failure mode:
FM-007 Information Gathering as Avoidance.

This connection supports early risk detection.

## Behavioral Prediction

When a trigger appears, North Vector may generate a prediction.

Example:

Situation:
A large, vague assignment appears.

Prediction:
Elevated avoidance risk.

Recommended action:
Break the assignment into a concrete first step immediately.

Predictions should include confidence and supporting evidence.

## Escalation Rules

Behavioral history should increase intervention strength when:
- the same pattern is already active
- consequences are high
- deadlines are near
- previous outcomes were poor
- the user has repeatedly postponed action

Example:

Known pattern:
Underestimates chemistry workload.

Current situation:
Exam in four days and preparation behind schedule.

Action:
Increase risk level from Yellow to Orange.

## Contradiction Handling

People change.

Old behavioral memories should not become permanent identity labels.

When new evidence conflicts with an established pattern:

1. preserve the historical record
2. add contradictory evidence
3. lower confidence if appropriate
4. revise the pattern when evidence is sufficient
5. distinguish old behavior from current behavior

## Retrieval Rules

Behavioral memories should receive elevated priority during:
- planning
- scheduling
- decision evaluation
- risk assessment
- accountability reviews
- reflection

Behavior often predicts outcomes better than stated intentions.

## Review Cadence

Suggested defaults:
- emerging patterns: monthly
- developing patterns: quarterly
- established patterns: every 6 months
- core patterns: annually or when contradicted

High-risk patterns may be reviewed more often.

## Example Behavioral Memory Record

```json
{
  "behavior_id": "behavior_001",
  "title": "Delayed starts on ambiguous tasks",
  "description": "Nishad is more likely to delay work when the first action or success criteria are unclear.",
  "category": "productivity",
  "status": "established",
  "confidence": 0.86,
  "evidence_count": 7,
  "triggers": ["vague assignment", "unclear requirements"],
  "early_warning_signs": ["repeated planning", "research without action"],
  "typical_outcomes": ["compressed timeline", "increased stress"],
  "recommended_responses": ["define the first action", "set a start deadline"],
  "related_failure_mode_ids": ["FM-001"],
  "user_confirmed": true
}
```

## Phase 1 Implementation

Phase 1 should support:
- manual behavioral memory creation
- evidence linking
- confidence levels
- trigger and warning sign fields
- success patterns and failure patterns
- user confirmation
- simple prediction rules
- quarterly review

Fully automatic personality inference should be delayed.

## Success Criteria

The Behavioral Memory Model succeeds if Chief can answer:
- What is Nishad likely to do?
- What situations increase risk?
- What strengths should be used?
- What intervention is most effective?
- Is this pattern still accurate?

## Final Principle

Facts explain the situation.

Goals explain the destination.

Behavior explains what is likely to happen next.

North Vector needs all three.