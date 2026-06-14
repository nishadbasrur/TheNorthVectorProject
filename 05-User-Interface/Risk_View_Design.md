# Risk View Design v1.0

## Purpose

This document defines how North Vector should present risks, evidence, escalation levels, mitigation plans, timelines, and resolution status.

The Risk View exists to make threats understandable and actionable without turning the interface into a wall of warnings.

## Core Principle

Risk information should create clarity, not anxiety.

The interface should explain what is happening, why it matters, and what action reduces the danger.

## Primary Objectives

The Risk View should help Nishad answer:
- What could go wrong?
- How serious is it?
- How likely is it?
- When does action need to happen?
- Which goals are affected?
- What should I do next?
- Is the risk improving or getting worse?

## Default View

The default Risk View should show:
- active risks
- escalation level
- category
- probability
- severity
- time horizon
- affected goals
- mitigation status

Resolved and archived risks should remain available through filters.

## Risk Categories

The interface should support:
- Safety
- Health
- Academic
- Career
- Financial
- Relationship
- Project
- Legal and Administrative

## Risk Levels

Suggested escalation states:
- Green
- Yellow
- Orange
- Red
- Critical

Each level should use both color and text.

Color alone should never communicate severity.

## Risk Card

Each risk card should include:
- title
- category
- escalation level
- probability
- severity
- deadline or time horizon
- affected goal
- short evidence summary
- primary mitigation action
- trend

Possible quick actions:
- Review Risk
- Start Mitigation
- Update Status
- Accept Risk
- Resolve Risk
- Add Evidence

## Risk Detail View

The detail page should contain:

### Risk Summary

- title
- description
- category
- current status
- escalation level

### Why It Matters

Explain:
- consequences
- affected goals
- affected relationships
- reversibility

### Evidence

Show:
- warning signs
- missed tasks
- schedule data
- behavioral patterns
- user statements
- external signals

Evidence should distinguish:
- confirmed facts
- inferences
- assumptions

### Probability and Severity

Display both separately.

A low-probability, irreversible risk may still deserve attention.

### Timeline

Show:
- first detected
- current state
- latest safe intervention date
- next review
- projected consequence date

### Mitigation Plan

Display:
- recommended actions
- owner
- due date
- completion status
- fallback plan

### Related Goals

Show which goals may be affected and how.

### Related Failure Modes

Show relevant patterns from the Failure Mode Registry.

### Risk History

Show:
- escalation changes
- evidence updates
- interventions
- outcomes

### Resolution Criteria

Define what must be true for the risk to become stabilized or resolved.

## Risk Portfolio View

The portfolio view should help identify:
- total active risks
- highest-severity risks
- recurring categories
- compound risks
- neglected mitigations
- risks affecting the same goal

Suggested columns:
- Risk
- Category
- Level
- Probability
- Severity
- Deadline
- Goal
- Mitigation Status

## Compound Risk View

The interface should show when several moderate risks combine.

Example:
- poor sleep
- exam preparation behind
- work shift scheduled
- assignment due

Individually manageable.

Together, high risk.

The compound-risk view should explain the interaction.

## Trend Indicators

Each risk should show whether it is:
- improving
- stable
- worsening
- newly detected

Trend should be based on evidence, not cosmetic animation.

## Mitigation Progress

Mitigation should show:
- not started
- in progress
- partially effective
- effective
- failed

The interface should connect mitigation work directly to risk reduction.

## Risk Acceptance

The user should be able to intentionally accept a risk.

The flow should record:
- why the risk is accepted
- expected upside
- downside limits
- fallback plan
- review date

Accepted risk should remain visible, but not treated as unresolved negligence.

## Risk Resolution

When resolving a risk, record:
- what changed
- which mitigation worked
- whether the warning was accurate
- lessons learned
- related memory updates

## Risk Creation Flow

The creation flow should ask for:
- title
- category
- description
- probability
- severity
- time horizon
- affected goals
- mitigation idea
- source

North Vector should help convert vague concerns into structured risks.

## Sorting and Filters

Allow sorting by:
- escalation level
- deadline
- severity
- probability
- goal impact
- category
- trend

Allow filtering by:
- active
- resolved
- accepted
- category
- goal
- project

## Today View Integration

Only the most relevant active risks should appear on the Today View.

The full Risk View should provide deeper analysis.

## Notification Integration

Risk notifications should link directly to the relevant detail page and mitigation action.

Example:
`Chemistry preparation risk increased to Orange.`

Action:
`Open mitigation plan`

## Visual Design

The Risk View should feel:
- serious
- calm
- evidence-based
- restrained

Avoid:
- flashing alerts
- excessive red
- dramatic language
- dense dashboards

## Mobile Risk View

On phone, prioritize:
- risk level
- why it matters
- next mitigation action
- deadline
- trend

Detailed history may collapse.

## Wearable Risk View

For glasses or watch, show only:
- risk title
- level
- one-line reason
- immediate action

Sensitive details should hand off to phone or MacBook.

## Accessibility

The Risk View should support:
- non-color severity labels
- screen readers
- keyboard navigation
- scalable text
- clear focus states

## Empty States

No active risks:
`No active risks currently require attention.`

No critical risks:
`No Red or Critical risks are active.`

## Error States

If risk analysis is unavailable:
`Risk analysis is temporarily unavailable. Existing records remain visible, but current assessments may be outdated.`

## Failure Modes

### Alarmism

The interface exaggerates danger.

### Warning Fatigue

Too many low-value risks remain visible.

### Weak Evidence

Risk claims lack support.

### No Mitigation

The system identifies danger without a next action.

### Static Risk

The status never updates as circumstances change.

### Accepted-Risk Confusion

Intentional risk is treated the same as neglected risk.

### Color Dependence

Severity is communicated only visually.

## Phase 1 Implementation

Phase 1 should include:
- active risk list
- risk cards
- escalation levels
- probability and severity
- affected goals
- evidence summary
- mitigation plan
- trend
- risk detail view
- resolve and accept actions

Compound-risk visualization can come later.

## Success Criteria

The Risk View succeeds if Nishad can quickly understand:
- what is at risk
- how serious it is
- why the system believes it
- what action reduces the danger
- whether the situation is improving

## Final Principle

A risk should never appear as a vague cloud of concern.

The interface should turn uncertainty into a visible path toward control.