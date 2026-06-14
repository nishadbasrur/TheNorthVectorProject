# Long-Term Memory Model v1.0

## Purpose

This document defines what North Vector stores for months, years, or permanently.

Long-term memory preserves durable knowledge about Nishad's identity, goals, relationships, behavior, decisions, and life trajectory.

The objective is continuity without rigidity.

## Core Principle

Long-term memory should preserve what remains useful across time.

It should not freeze Nishad into an outdated version of himself.

Durable memory must remain revisable.

## Long-Term Memory Categories

### Identity Memory

Examples:
- Constitution
- values
- life mission
- core priorities
- personal operating principles

Retention:
Permanent unless explicitly revised.

### Strategic Memory

Examples:
- medical career direction
- long-term financial goals
- education strategy
- major life plans

Retention:
Multi-year, reviewed periodically.

### Goal Memory

Examples:
- becoming a physician
- maintaining financial independence
- building North Vector

Retention:
Until completed, abandoned, or superseded.

### Behavioral Memory

Examples:
- procrastination triggers
- learning preferences
- recurring success patterns
- recurring failure modes

Retention:
Long-term when validated by repeated evidence.

### Relationship Memory

Examples:
- family context
- close friends
- mentors
- key professional relationships

Retention:
As long as the relationship remains significant or historically meaningful.

### Decision Memory

Examples:
- major school decisions
- career choices
- financial commitments
- project pivots

Retention:
Long-term when the decision meaningfully affects future reasoning.

### Project Memory

Examples:
- major projects
- milestone history
- lessons learned
- strategic pivots

Retention:
Active while ongoing, archived after completion.

### Wisdom Memory

Examples:
- durable lessons
- validated principles
- high-value summaries of repeated experience

Retention:
Long-term and reviewed for continued accuracy.

## Standard Long-Term Memory Record

Each record should contain:
- memory_id
- memory_type
- title
- summary
- details
- source
- confidence
- importance
- sensitivity
- status
- created_at
- updated_at
- effective_from
- review_at
- decay_policy
- related_goal_ids
- related_people_ids
- related_project_ids
- related_event_ids
- supporting_evidence_ids
- contradiction_ids
- user_confirmed
- version

## Admission Criteria

Information should enter long-term memory only when it is:
- durable
- repeatedly relevant
- strategically important
- behaviorally predictive
- identity-defining
- relationship-significant
- historically meaningful
- explicitly requested by Nishad

Temporary information should remain in short-term or operational memory.

## Promotion from Short-Term Memory

Promotion should occur when:
- the information remains relevant beyond the original context
- repeated evidence supports it
- the user confirms it
- it affects long-term planning or judgment
- losing it would materially reduce future recommendation quality

Promotion should not happen automatically for:
- one-time moods
- temporary preferences
- unresolved speculation
- isolated mistakes
- casual conversation

## Confidence and Durability

Long-term storage does not imply certainty.

Each memory should preserve confidence.

Suggested confidence interpretation:
- confirmed
- strong evidence
- moderate evidence
- tentative

Low-confidence memories may still be stored if they are clearly labeled.

## Review Cadence

Suggested defaults:
- Constitution and core values: annually or when intentionally revised
- strategic goals: quarterly or semiannually
- behavioral memories: every 6 months or when contradicted
- relationship memories: every 6 to 12 months
- decision memories: after meaningful outcomes
- wisdom memories: annually

High-impact memories should be reviewed more often when circumstances change.

## Revision Rules

Long-term memory should be updated when:
- the user corrects it
- newer evidence contradicts it
- circumstances change
- the memory becomes too broad or inaccurate
- the memory no longer reflects current reality

Revision should:
- preserve prior versions
- record the reason for change
- update confidence
- update related links
- maintain historical context when useful

## Contradiction Handling

When a new memory conflicts with an established long-term memory:

1. Preserve both records temporarily.
2. Compare evidence and recency.
3. Lower confidence if appropriate.
4. Ask for clarification when the conflict matters.
5. Supersede the older memory only when justified.

North Vector should never silently rewrite important history.

## Identity Protection

Behavioral and strategic memories should not become permanent identity labels.

Poor example:
`Nishad is bad at chemistry.`

Better example:
`Nishad historically required additional preparation time for chemistry, though this pattern should be reviewed as performance changes.`

The system should distinguish:
- who Nishad is
- what Nishad has done
- what Nishad tends to do
- what Nishad is currently becoming

## Archival Rules

Long-term memories should be archived when they remain historically useful but no longer belong in active reasoning.

Examples:
- completed college courses
- former jobs
- finished projects
- expired strategic plans
- past relationship contexts

Archived memories remain searchable.

## Deletion Rules

Deletion should occur only when:
- Nishad requests it
- privacy requires it
- the record is false and has no historical value
- the record is a duplicate
- the record was stored in error

Deletion should be logged when appropriate.

## Retrieval Priority

Long-term memory should be retrieved based on relevance, not merely permanence.

Priority should consider:
- current objective
- active goals
- risk impact
- relationship impact
- behavioral predictive value
- confidence
- importance

A permanent memory should not appear in every context.

## Long-Term Memory and the Constitution

The Constitution is the highest-authority long-term memory.

Other long-term memories should remain consistent with it or explicitly surface conflicts.

If Nishad's values change, the Constitution should be revised deliberately rather than bypassed silently.

## Long-Term Memory and Wisdom

Long-term memory should increasingly contain:
- compressed lessons
- validated patterns
- durable principles
- strategic summaries

Over time, the system should rely less on raw event history and more on high-value understanding.

## Example Long-Term Memory Record

```json
{
  "memory_id": "mem_behavior_001",
  "memory_type": "behavioral",
  "title": "Needs concrete first actions for ambiguous work",
  "summary": "Nishad initiates difficult work more reliably when the first action is clearly defined.",
  "confidence": 0.88,
  "importance": 5,
  "status": "active",
  "decay_policy": "slow",
  "user_confirmed": true,
  "review_at": "2026-12-01",
  "version": 2
}
```

## Phase 1 Implementation

Phase 1 should support:
- durable memory storage
- memory types and status
- confidence and importance
- user confirmation
- review dates
- version history
- contradiction links
- archival status
- promotion from short-term memory

Automatic identity inference should remain conservative.

## Success Criteria

The Long-Term Memory Model succeeds if Chief:
- preserves continuity across months and years
- remembers important goals, people, and patterns
- revises outdated beliefs
- avoids turning temporary states into permanent identity
- keeps historical context without cluttering active reasoning
- allows Nishad to inspect, correct, and delete memories

## Final Principle

Long-term memory should make North Vector more familiar, more accurate, and more useful over time.

It should never make North Vector rigid, invasive, or trapped in the past.