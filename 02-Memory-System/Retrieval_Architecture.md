# Retrieval Architecture v1.0

## Purpose

This document defines how North Vector selects and retrieves relevant memories during reasoning, planning, conversation, risk assessment, and decision-making.

The objective is not to retrieve the most information.

The objective is to retrieve the most useful information.

## Core Principle

Memory only creates value when the right memory appears at the right moment.

North Vector should retrieve what matters, ignore what does not, and preserve uncertainty when confidence is limited.

## Retrieval Pipeline

Input
↓
Objective Detection
↓
Domain Detection
↓
Candidate Memory Search
↓
Filtering
↓
Ranking
↓
Context Assembly
↓
Reasoning

## Step 1: Objective Detection

Before retrieval begins, Chief should identify the task.

Examples:
- answer a question
- evaluate a decision
- create a plan
- detect risk
- prepare a daily briefing
- review progress

The objective determines what memory types should be searched.

## Step 2: Domain Detection

North Vector should identify the affected life domains.

Possible domains:
- academics
- career
- health
- finances
- relationships
- projects
- personal development

Example:

Question:
`Should I go to this party?`

Likely domains:
- relationships
- academics
- health

## Step 3: Candidate Memory Search

North Vector should search relevant memory categories.

Potential sources:
- identity memory
- strategic memory
- operational memory
- behavioral memory
- goal memory
- relationship memory
- event memory
- project memory
- risk memory
- opportunity memory

Search methods may include:
- exact field matching
- metadata filters
- semantic similarity
- graph traversal
- recent-memory activation

## Step 4: Filtering

Candidate memories should be removed when they are:
- expired
- deleted
- irrelevant
- too low confidence
- superseded
- outside the authorized sensitivity scope

Archived memories should only be included when historical context is necessary.

## Step 5: Ranking

Candidate memories should receive a retrieval score.

Conceptually:

Retrieval Score =
Relevance
+ Importance
+ Confidence
+ Goal Impact
+ Recency
+ Current Activation
- Staleness
- Contradiction Penalty

The exact weights may change through testing.

## Ranking Factors

### Relevance

How directly does the memory affect the current objective?

### Importance

How consequential is the memory?

### Confidence

How reliable is the memory?

### Goal Impact

How strongly does the memory affect an active goal?

### Recency

How recently was the memory created, updated, or reinforced?

### Current Activation

Has the memory been relevant to recent conversations, events, or plans?

### Staleness

Is the memory old, unreviewed, or possibly outdated?

### Contradiction Penalty

Does conflicting evidence exist?

## Retrieval Modes

### Conversational Retrieval

Purpose:
Answer the current request with relevant personal context.

Prioritize:
- recent conversation context
- active goals
- relevant preferences
- related memories

### Decision Retrieval

Purpose:
Support a choice.

Prioritize:
- Constitution
- Decision Framework
- affected goals
- risks
- opportunities
- behavioral patterns
- relevant relationships

### Planning Retrieval

Purpose:
Create a realistic plan.

Prioritize:
- deadlines
- available time
- active commitments
- dependencies
- behavioral patterns
- previous planning outcomes

### Risk Retrieval

Purpose:
Detect threats.

Prioritize:
- upcoming deadlines
- active commitments
- known failure modes
- previous similar outcomes
- health constraints

### Daily Briefing Retrieval

Purpose:
Create current operational awareness.

Prioritize:
- today's events
- approaching deadlines
- top goals
- active risks
- active opportunities
- unresolved commitments

### Reflection Retrieval

Purpose:
Review outcomes and identify lessons.

Prioritize:
- recent events
- completed or missed tasks
- goal progress
- previous plans
- behavioral memories

## Memory-Type Priority

Retrieval order should depend on the objective, but a general default is:

1. Active operational memories
2. Relevant goals and events
3. Relevant behavioral memories
4. Strategic memories
5. Identity and constitutional memories
6. Historical archives

Identity memories may outrank all others when value conflicts arise.

## Multi-Hop Retrieval

North Vector should retrieve connected memories through relationships.

Example:

Chemistry Exam
↓
CHEM 1127Q Course
↓
Competitive GPA Goal
↓
Medical School Goal
↓
Known Workload Underestimation Pattern
↓
Recommended Early Study Intervention

Multi-hop retrieval allows Chief to connect daily facts to long-term consequences.

## Query Expansion

North Vector may expand a search using related concepts.

Example:

Input:
`chem test`

Expanded concepts:
- CHEM 1127Q
- exam
- stoichiometry
- study plan
- GPA risk

Expansion should remain controlled to avoid irrelevant retrieval.

## Retrieval Limits

Working memory should remain intentionally constrained.

Recommended initial limits:
- 5 to 10 primary memories
- 5 supporting memories
- 1 to 3 historical examples

More context should only be added when necessary.

## Conflict Handling

When retrieved memories conflict:

1. Preserve the conflict.
2. Compare confidence and recency.
3. Prefer user-confirmed and newer evidence when appropriate.
4. Ask for clarification when the conflict affects the recommendation.
5. Avoid presenting uncertain information as settled fact.

## Sensitivity and Authorization

Retrieval must respect memory sensitivity.

Restricted memories should only be retrieved:
- for authorized objectives
- when necessary
- within approved tools and interfaces

Sensitive memory should never be exposed casually in notifications or wearable displays.

## Retrieval Feedback

After reasoning, North Vector should evaluate retrieval quality.

Questions:
- Were the selected memories useful?
- Was important context missed?
- Was irrelevant context included?
- Did stale memory distort the answer?

Feedback should improve ranking weights over time.

## Phase 1 Retrieval Strategy

Phase 1 should prioritize reliability over sophistication.

Recommended approach:
- structured database filters
- keyword and semantic search
- explicit links between memories
- simple weighted ranking
- strict working-memory limits

Advanced graph reasoning and autonomous query planning can come later.

## Success Criteria

The Retrieval Architecture succeeds if Chief:
- remembers important context without being reminded
- avoids irrelevant personal details
- detects related risks and goals
- distinguishes current facts from historical context
- handles contradictions transparently
- remains focused rather than overwhelmed

## Final Principle

North Vector does not need to remember everything at once.

It needs to remember exactly what matters now.