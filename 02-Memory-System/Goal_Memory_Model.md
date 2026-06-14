# Goal Memory Model v1.0

## Purpose

This document defines how North Vector stores, links, tracks, evaluates, and retrieves goals.

Goals give direction to the entire system.

Without goals, Chief can organize activity but cannot determine whether that activity matters.

## Core Principle

Goals are destinations.

Tasks are actions.

North Vector must keep them separate while preserving the relationship between them.

## Goal Hierarchy

### Level 1: Life Goals

Time Horizon:
5–20+ years

Examples:
- Become a physician
- Build financial independence
- Build a strong family life
- Maintain long-term health

### Level 2: Strategic Goals

Time Horizon:
1–5 years

Examples:
- Gain admission to medical school
- Graduate from UConn with a competitive record
- Build strong credit
- Develop meaningful clinical and research experience

### Level 3: Operational Goals

Time Horizon:
Months to years

Examples:
- Earn strong grades in foundational science courses
- Obtain EMT certification
- Build the first usable version of North Vector

### Level 4: Tactical Goals

Time Horizon:
Days to months

Examples:
- Prepare for a chemistry exam
- Submit a research application
- Complete a project milestone

### Level 5: Tasks

Time Horizon:
Minutes to days

Examples:
- Review limiting reagents
- Email a professor
- Draft a project outline

Tasks are not goals, but they should connect to goals.

## Goal Relationships

Every lower-level goal should connect to at least one higher-level goal whenever possible.

Example:

Review Stoichiometry
↓
Prepare for Chemistry Exam
↓
Earn Strong Chemistry Grade
↓
Maintain Competitive GPA
↓
Gain Admission to Medical School
↓
Become a Physician

This chain allows Chief to explain why a daily action matters.

## Standard Goal Record

Each goal should contain:
- goal_id
- title
- description
- goal_level
- domains
- status
- priority
- owner
- created_at
- target_date
- review_frequency
- success_criteria
- failure_criteria
- progress_method
- current_progress
- parent_goal_ids
- child_goal_ids
- dependency_ids
- related_project_ids
- related_people_ids
- related_event_ids
- risk_status
- active_risk_ids
- active_opportunity_ids
- confidence
- source
- notes

## Goal Statuses

### Proposed

A possible goal not yet accepted.

### Planned

Accepted but not currently active.

### Active

Currently being pursued.

### At Risk

Still active, but progress or dependencies are threatened.

### Blocked

Progress cannot continue until a dependency is resolved.

### Deferred

Intentionally postponed.

### Completed

Successfully achieved.

### Abandoned

No longer pursued.

### Superseded

Replaced by another goal.

## Goal Priority

Suggested levels:

### Critical

Directly affects safety, health, or primary life trajectory.

### High

Strongly supports major strategic objectives.

### Medium

Valuable but not currently urgent.

### Low

Optional or exploratory.

Priority should remain dynamic.

## Goal Domains

A goal may belong to multiple domains.

Examples:
- academics
- career
- health
- finances
- relationships
- projects
- personal development
- community

Multi-domain goals should preserve all relevant links.

## Success Criteria

Every active goal should define what completion means.

Poor example:
`Get better at chemistry.`

Better example:
`Complete all assigned chemistry practice, maintain an exam average of at least 90%, and demonstrate mastery of core problem types.`

Success criteria may be:
- quantitative
- milestone-based
- outcome-based
- behavior-based

## Failure Criteria

Failure criteria define when a goal should be reviewed rather than quietly drift.

Examples:
- deadline passes without completion
- required dependency becomes unavailable
- goal no longer aligns with Constitution
- cost becomes disproportionate to value
- goal repeatedly receives no meaningful attention

Failure criteria should trigger reflection, not automatic self-criticism.

## Progress Tracking

Possible progress methods:
- percentage
- milestones
- count toward target
- status checklist
- recurring behavior adherence
- qualitative review

Examples:

Shadowing Goal:
12 / 50 hours

Savings Goal:
$2,100 / $5,000

North Vector Prototype:
4 / 10 milestones complete

## Goal Dependencies

Some goals depend on others.

Example:

Medical School Admission
Depends On:
- competitive GPA
- MCAT completion
- clinical experience
- research or scholarly work
- recommendations

Dependencies should have explicit status.

A blocked dependency should raise goal risk.

## Goal Conflicts

Goals may compete for time, money, energy, or attention.

Examples:
- work more hours vs protect study time
- build North Vector vs maintain sleep
- pursue a new project vs finish an existing one

Chief should surface conflicts explicitly.

Conflict analysis should include:
- resources in conflict
- goals affected
- priority hierarchy
- possible compromise
- recommended tradeoff

## Goal Risk Status

Suggested levels:

### Green

On track.

### Yellow

Early warning signs.

### Orange

Meaningful intervention required.

### Red

Failure is likely without immediate action.

Risk status should consider:
- progress
- remaining time
- dependencies
- behavioral patterns
- workload
- resource constraints

## Goal Opportunity Tracking

Goals should also connect to opportunities.

Example:

Goal:
Gain research experience.

Opportunity:
A professor is accepting undergraduate assistants.

Chief should surface opportunities that materially accelerate important goals.

## Goal Review Cadence

Suggested defaults:
- Life Goals: every 6–12 months
- Strategic Goals: monthly
- Operational Goals: weekly or monthly
- Tactical Goals: daily or weekly
- Tasks: daily

Review frequency should increase when risk rises.

## Goal Review Questions

- Is this goal still aligned?
- Is progress on track?
- Are dependencies satisfied?
- Is the target date realistic?
- Is the goal receiving enough attention?
- Has the opportunity cost changed?
- Should the strategy change?
- Should the goal be deferred, revised, or abandoned?

## Goal Retrieval Rules

Goal memories should be retrieved when:
- planning
- evaluating decisions
- assessing risks
- identifying opportunities
- preparing briefings
- reviewing progress

The most relevant active and at-risk goals should enter working memory first.

## Goal Completion

When a goal is completed, North Vector should:
- record the outcome
- preserve completion evidence
- identify lessons
- update parent goals
- generate follow-up tasks if needed
- archive the goal when appropriate

Completion should create learning.

## Goal Failure or Abandonment

When a goal fails or is abandoned, North Vector should:
- record why
- distinguish poor execution from changed priorities
- identify lessons
- update related memories
- revise future planning assumptions

A failed goal should not become a permanent identity judgment.

## Example Goal Record

```json
{
  "goal_id": "goal_academic_001",
  "title": "Maintain a medical-school-competitive freshman GPA",
  "goal_level": "operational",
  "domains": ["academics", "career"],
  "status": "active",
  "priority": "critical",
  "target_date": "2027-05-15",
  "success_criteria": [
    "Maintain a cumulative GPA of at least 3.8",
    "Avoid preventable course failures or withdrawals",
    "Build sustainable study systems"
  ],
  "parent_goal_ids": ["goal_medical_school_admission"],
  "risk_status": "green",
  "review_frequency": "weekly"
}
```

## Phase 1 Implementation

Phase 1 should support:
- goal creation and editing
- hierarchical links
- status and priority
- progress tracking
- target dates
- dependencies
- risk status
- review reminders
- links to tasks and events

Complex automated scoring can come later.

## Success Criteria

The Goal Memory Model succeeds if Chief can consistently answer:
- What is Nishad trying to achieve?
- Why does it matter?
- What supports it?
- What threatens it?
- What should happen next?
- Is the goal still aligned?

## Final Principle

Goals give North Vector direction.

The system should always be able to connect today's action to tomorrow's outcome and tomorrow's outcome to the life Nishad is trying to build.