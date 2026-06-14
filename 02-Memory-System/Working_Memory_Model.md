# Working Memory Model v1.0

## Purpose

This document defines the temporary, task-specific information North Vector actively holds during a conversation, decision, planning session, or reasoning cycle.

Working memory is not long-term storage.

It is the active workspace used by Chief to reason about what matters right now.

## Core Principle

Long-term memory contains what North Vector knows.

Working memory contains what Chief is actively thinking about.

A strong working-memory system should remain focused, compact, current, and easy to refresh.

## Working Memory Lifecycle

Trigger
↓
Objective Detection
↓
Context Assembly
↓
Working Memory Creation
↓
Reasoning
↓
Update During Interaction
↓
Outcome Capture
↓
Clear or Consolidate

## Working Memory Contents

A working-memory package may contain:
- current objective
- current user request
- active facts
- relevant goals
- upcoming deadlines
- active commitments
- known constraints
- active risks
- active opportunities
- relevant behavioral patterns
- relevant relationship context
- assumptions
- missing information
- provisional conclusions
- next actions

## Standard Working Memory Object

Suggested fields:
- session_id
- objective
- objective_type
- active_domain
- current_input
- critical_facts
- relevant_goal_ids
- relevant_event_ids
- relevant_memory_ids
- constraints
- active_risks
- active_opportunities
- behavioral_context
- relationship_context
- assumptions
- missing_information
- current_plan
- provisional_recommendation
- confidence
- created_at
- updated_at
- expiration_policy

## Working Memory Types

### Conversational Working Memory

Used during ordinary dialogue.

Contains:
- recent conversation turns
- current question
- relevant personal context
- unresolved references

### Decision Working Memory

Used when evaluating a choice.

Contains:
- decision statement
- alternatives
- goals affected
- risks
- opportunities
- behavioral factors
- reversibility
- recommendation status

### Planning Working Memory

Used when creating schedules or action plans.

Contains:
- available time
- deadlines
- dependencies
- task estimates
- energy constraints
- priority order

### Risk Working Memory

Used when evaluating an emerging threat.

Contains:
- risk description
- likelihood
- severity
- warning signs
- affected goals
- recommended intervention

### Reflection Working Memory

Used when reviewing an outcome.

Contains:
- expected result
- actual result
- contributing factors
- lessons
- candidate behavioral updates

## Capacity Limits

Working memory should remain intentionally small.

Suggested Phase 1 limits:
- 1 primary objective
- 3 to 7 critical facts
- 1 to 5 relevant goals
- 1 to 5 active risks
- 1 to 3 opportunities
- 1 to 3 behavioral patterns
- 1 provisional plan or recommendation

If more information is needed, Chief should retrieve it in stages rather than loading everything at once.

## Priority Rules

When working memory is full, preserve:

1. Safety and health information
2. Time-sensitive obligations
3. High-priority goals
4. Serious risks
5. Directly relevant facts
6. Behavioral patterns with strong predictive value
7. Important relationship context
8. Opportunities
9. Historical examples

Lower-priority information should be removed first.

## Refresh Rules

Working memory should refresh when:
- the user's objective changes
- new information materially changes the situation
- an assumption is corrected
- a deadline passes
- a risk level changes
- Chief moves from planning to execution or reflection

Old working memory should not silently carry over into unrelated tasks.

## Persistence Rules

Working memory is temporary by default.

It may persist:
- for the duration of a conversation
- through a multi-step planning session
- until a decision is completed
- until an event or task is resolved

At the end of the session, Chief should decide whether any information deserves promotion into long-term memory.

## Promotion to Long-Term Memory

Working-memory content may be promoted when it represents:
- a new confirmed fact
- a meaningful commitment
- a durable preference
- a goal update
- a behavioral observation
- an important decision
- a lesson from reflection

Temporary speculation should not be promoted automatically.

## Cleanup Rules

When a reasoning cycle ends, Chief should:
- preserve the final outcome
- store any important new memory
- archive temporary context if needed
- remove irrelevant assumptions
- clear unresolved clutter

## Contradictions

If working memory contains conflicting information:

1. mark the conflict explicitly
2. compare source reliability
3. ask for clarification when necessary
4. avoid collapsing uncertainty into a false conclusion

## Context Switching

When the conversation changes domains, Chief should create a new working-memory frame.

Example:

Academic planning
↓
Financial question

The financial question should not inherit irrelevant academic details unless they affect the answer.

## Multi-Agent Use

Specialized agents may receive copies of the working-memory package relevant to their role.

Examples:
- Risk Agent receives risks, deadlines, and behavioral patterns
- Planning Agent receives available time, goals, and constraints
- Relationship Agent receives only relevant people and commitments

Agents should not receive unrelated sensitive context.

## Working Memory Failure Modes

### Overload

Too many facts remain active.

Result:
- weak prioritization
- generic output
- slower reasoning

### Starvation

Too little context is active.

Result:
- shallow recommendations
- missed risks

### Stale Carryover

Old context persists after the objective changes.

Result:
- irrelevant or distorted reasoning

### Assumption Drift

Unconfirmed assumptions are treated as facts.

Result:
- overconfident recommendations

### Premature Consolidation

Temporary thoughts are stored as permanent memories.

Result:
- inaccurate long-term memory

## Phase 1 Implementation

Phase 1 should support:
- one working-memory object per active session
- explicit objective and domain fields
- links to retrieved memories
- assumptions and missing-information fields
- size limits
- manual refresh triggers
- promotion review at session end

Advanced autonomous context switching can come later.

## Success Criteria

The Working Memory Model succeeds if Chief:
- remains focused on the current objective
- uses the right context without excessive noise
- refreshes when circumstances change
- preserves uncertainty
- avoids contaminating unrelated tasks
- promotes only durable information into long-term memory

## Final Principle

Working memory is the room where Chief thinks.

Only the people, facts, risks, and goals necessary for the current decision should be invited inside.