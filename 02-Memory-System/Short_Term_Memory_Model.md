# Short-Term Memory Model v1.0

## Purpose

This document defines the temporary but persistent memory layer between working memory and long-term memory.

Short-term memory holds information that remains relevant across days or weeks but may not deserve permanent storage.

Examples include:
- current-week priorities
- active projects
- unresolved commitments
- recent conversations
- temporary plans
- recent risks
- near-term opportunities

## Core Principle

Working memory supports the current reasoning cycle.

Short-term memory preserves continuity across nearby reasoning cycles.

Long-term memory preserves durable knowledge.

## Short-Term Memory Lifecycle

Capture
↓
Validate
↓
Store Temporarily
↓
Retrieve Across Sessions
↓
Reinforce, Promote, Archive, or Expire

## Standard Short-Term Memory Record

Each record should contain:
- short_term_memory_id
- title
- summary
- memory_type
- source
- created_at
- updated_at
- expires_at
- status
- confidence
- importance
- domains
- related_goal_ids
- related_event_ids
- related_project_ids
- related_people_ids
- next_review_at
- promotion_candidate
- notes

## Short-Term Memory Categories

### Current Week Memory

Examples:
- top priorities
- major deadlines
- important events
- active risks

### Active Project Memory

Examples:
- current milestone
- next action
- blocker
- recent decision

### Recent Conversation Memory

Examples:
- unresolved questions
- recently stated preferences
- temporary intentions

### Active Commitment Memory

Examples:
- promised follow-up
- pending email
- incomplete obligation

### Temporary Plan Memory

Examples:
- study schedule
- travel itinerary
- interview preparation plan

### Emerging Pattern Memory

Examples:
- possible behavioral pattern not yet sufficiently validated

## Default Retention Windows

Suggested defaults:
- current week memory: 7–14 days
- active project memory: until milestone completion
- recent conversation memory: 14–30 days
- active commitments: until resolved
- temporary plans: until completion or replacement
- emerging patterns: 30–90 days pending review

Retention should depend on usefulness rather than arbitrary age alone.

## Promotion Rules

Short-term memory may be promoted into long-term memory when it becomes:
- a durable goal
- a confirmed preference
- an established behavioral pattern
- an important relationship fact
- a major decision
- a lasting lesson
- a recurring commitment

Promotion should require evidence or user confirmation when appropriate.

## Expiration Rules

Short-term memory should expire when:
- the event passes
- the commitment is completed
- the plan is replaced
- the information loses relevance
- no reinforcement occurs within the review window

Expired memory may be archived if historical value remains.

## Retrieval Rules

Short-term memory should receive high priority when:
- preparing daily or weekly briefings
- continuing recent conversations
- reviewing active projects
- monitoring commitments
- reassessing near-term risks

Short-term memory should normally outrank archival memory.

## Interaction with Working Memory

Working memory may pull from short-term memory when the current objective overlaps.

Example:

Short-term memory:
`Chemistry study plan is one session behind.`

Current question:
`Should I go out tonight?`

Working memory should retrieve that fact because it changes the recommendation.

## Interaction with Long-Term Memory

Short-term memory should use long-term memory for context.

Example:

Short-term fact:
`Current chemistry exam preparation is behind.`

Long-term behavioral memory:
`Nishad tends to underestimate difficult science workloads.`

Together, these support a stronger risk assessment.

## Short-Term Memory Failure Modes

### Temporary Clutter

Too many low-value items remain active.

### Forgotten Commitments

Important obligations expire without resolution.

### Premature Promotion

Temporary preferences become permanent records.

### Stale Continuity

Old short-term context affects unrelated current decisions.

### Missing Promotion

Durable lessons disappear because they were never reviewed.

## Phase 1 Implementation

Phase 1 should support:
- explicit expiration dates
- review reminders
- links to goals, events, people, and projects
- promotion flags
- active and expired states
- automatic expiration for low-risk temporary items
- manual review before promotion into behavioral or identity memory

## Success Criteria

The Short-Term Memory Model succeeds if Chief:
- remembers what happened recently
- preserves continuity across sessions
- keeps current priorities visible
- tracks unresolved commitments
- allows temporary information to disappear safely
- promotes durable information when evidence supports it

## Final Principle

Short-term memory is the bridge between what Chief is thinking now and what Chief will still need to remember next week.