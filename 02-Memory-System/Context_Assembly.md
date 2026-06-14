# Context Assembly v1.0

## Purpose

This document defines how North Vector converts retrieved memories, current events, active goals, risks, constraints, and user input into a focused context package for reasoning.

The objective is not to load everything Chief knows.

The objective is to assemble exactly what Chief needs for the current task.

## Core Principle

Retrieval finds candidate information.

Context Assembly decides what actually enters working memory.

Chief should reason from a compact, relevant, and trustworthy context package rather than from the entire memory database.

## Context Assembly Pipeline

User Input or Trigger
↓
Objective Detection
↓
Domain Detection
↓
Memory Retrieval
↓
Relevance Filtering
↓
Conflict and Uncertainty Check
↓
Context Compression
↓
Working Memory Package
↓
Chief Reasoning

## Step 1: Identify the Objective

Chief must first determine what it is trying to do.

Possible objectives:
- answer a question
- evaluate a decision
- create a plan
- detect risk
- identify an opportunity
- prepare a briefing
- reflect on an outcome

A context package should never be assembled before the objective is clear.

## Step 2: Identify the Affected Domains

Possible domains include:
- academics
- career
- health
- finances
- relationships
- projects
- personal development

Example:

Input:
`Should I go to a party tonight?`

Domains:
- relationships
- academics
- health

## Step 3: Retrieve Candidate Context

The Retrieval Architecture should provide candidate memories from:
- active goals
- upcoming events
- open commitments
- active risks
- relevant opportunities
- behavioral patterns
- important relationships
- strategic priorities
- constitutional rules

## Step 4: Apply Relevance Filtering

Each candidate item should be tested against the objective.

Questions:
- Does this change the recommendation?
- Does this change the risk assessment?
- Does this change timing?
- Does this affect a high-priority goal?
- Does this expose a conflict or constraint?

If not, it should usually remain outside working memory.

## Step 5: Check Accuracy and Uncertainty

Before inclusion, Chief should identify:
- confidence level
- last update date
- contradiction status
- missing information
- assumptions being made

Uncertainty must remain explicit.

## Step 6: Compress Context

Long records should be reduced to concise decision-relevant statements.

Example:

Raw memory:
Multiple records showing delayed preparation for difficult science exams.

Compressed context:
`Known pattern: Nishad underestimates preparation time for difficult science exams.`

Compression should preserve meaning while reducing noise.

## Standard Context Package

Every context package should contain the following sections when relevant.

### Current Objective

What Chief is trying to solve.

### Current Situation

The most important facts about what is happening now.

### Relevant Goals

Goals directly affected by the decision or task.

### Active Events and Deadlines

Time-sensitive obligations.

### Constraints

Examples:
- available time
- money
- energy
- existing commitments
- health limits
- legal requirements

### Active Risks

Threats that may affect the outcome.

### Active Opportunities

Potential upside worth considering.

### Behavioral Patterns

Relevant failure modes or success patterns.

### Relationship Context

People whose interests, expectations, or well-being are affected.

### Constitutional Guidance

Relevant values, principles, and priority rules.

### Assumptions

Facts currently treated as true but not fully confirmed.

### Missing Information

Questions that could materially change the recommendation.

## Context Package Example

### Objective

Evaluate whether Nishad should attend a party tonight.

### Situation

- Chemistry exam in six days
- One planned study block behind schedule
- Party is socially valuable
- No major obligation tomorrow morning

### Relevant Goals

- Maintain competitive GPA
- Build meaningful friendships
- Protect sleep and health

### Risks

- Reduced study time
- Sleep loss
- Known tendency to underestimate chemistry workload

### Opportunities

- Strengthen friendships
- Mental recovery

### Constraints

- Limited evening hours
- Exam preparation is not fully on track

### Constitutional Guidance

- Academic performance outranks entertainment
- Relationships require maintenance
- Health comes before achievement

### Missing Information

- Expected return time
- Current chemistry preparation level
- Importance of the event

## Context Size Limits

Context should remain intentionally constrained.

Recommended Phase 1 limits:
- 1 current objective
- 3 to 7 critical facts
- 1 to 5 relevant goals
- 1 to 5 risks
- 1 to 3 opportunities
- 1 to 3 behavioral patterns
- only necessary relationship context

More information should be added only when it materially improves reasoning.

## Context Priority Rules

When space is limited, prioritize:

1. Safety and health
2. Time-sensitive obligations
3. High-priority goals
4. Serious risks
5. Relevant behavioral patterns
6. Important relationships
7. Opportunities
8. Historical examples

## Dynamic Refresh

Context should refresh when:
- new information arrives
- the objective changes
- a deadline passes
- a risk level changes
- an assumption is corrected
- the user provides clarification

Chief should not continue reasoning from stale context.

## Multi-Step Tasks

Complex tasks may require multiple context packages.

Example:

College semester planning may require separate packages for:
- academic workload
- work schedule
- health routines
- clinical experience
- personal projects

Chief should synthesize the outputs after each domain is analyzed.

## Context Isolation

Sensitive or irrelevant information should not automatically spill into every interaction.

Examples:
- financial details should not appear in an academic conversation unless relevant
- private relationship details should not appear in wearable notifications
- archived personal information should not enter ordinary context without reason

## Failure Modes

### Context Overload

Too much information enters working memory.

Result:
- generic answers
- poor prioritization
- slow reasoning

### Context Starvation

Important information is missing.

Result:
- shallow recommendations
- overlooked risks

### Stale Context

Outdated facts remain active.

Result:
- incorrect assumptions

### Biased Context

Only risks or only opportunities are included.

Result:
- distorted judgment

### Unexplained Context

Chief relies on hidden assumptions without surfacing them.

Result:
- reduced trust

## Phase 1 Implementation

Phase 1 should use a structured context object.

Suggested fields:
- objective
- current_situation
- relevant_goals
- active_events
- constraints
- risks
- opportunities
- behavioral_patterns
- relationships
- constitutional_rules
- assumptions
- missing_information
- source_memory_ids

This object should be generated before every significant reasoning cycle.

## Success Criteria

Context Assembly succeeds if Chief:
- focuses on what matters now
- remembers critical facts without being reminded
- avoids unnecessary personal details
- surfaces uncertainty and missing information
- connects current decisions to long-term goals
- produces specific rather than generic recommendations

## Final Principle

A Chief of Staff does not think about everything at once.

A Chief of Staff brings the right facts into the room before the decision is made.

Context Assembly is how North Vector does that.