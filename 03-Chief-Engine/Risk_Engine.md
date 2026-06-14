# Risk Engine v1.0

## Purpose

This document defines how North Vector identifies, evaluates, monitors, escalates, and mitigates risks.

The Risk Engine exists to recognize problems before they become consequences.

Its job is not to create anxiety.

Its job is to provide early, proportionate, and actionable warning.

## Core Principle

Most preventable failures become visible before they occur.

North Vector should detect weak signals early, connect them to known patterns, and recommend intervention before the situation becomes expensive, urgent, or irreversible.

## Risk Definition

A risk is a possible future outcome that could negatively affect:
- safety
- health
- academics
- career
- finances
- relationships
- reputation
- projects
- future optionality

A risk is not the same as a problem.

A problem already exists.

A risk may still be prevented.

## Risk Categories

### Safety Risks

Examples:
- unsafe environment
- dangerous travel conditions
- physical threat

### Health Risks

Examples:
- sleep deprivation
- burnout
- neglected symptoms
- poor recovery

### Academic Risks

Examples:
- approaching exam with insufficient preparation
- missed assignment
- declining performance
- unrealistic course load

### Career Risks

Examples:
- missed application deadline
- neglected mentor relationship
- weak follow-up
- reputation damage

### Financial Risks

Examples:
- unnecessary debt
- overspending
- speculation with meaningful funds
- missed payment

### Relationship Risks

Examples:
- broken commitment
- neglected important relationship
- unresolved conflict
- poor communication

### Project Risks

Examples:
- scope expansion
- architecture without execution
- dependency failure
- missed milestone

### Legal and Administrative Risks

Examples:
- missed forms
- expired documents
- compliance failures
- contractual obligations

## Risk Record Structure

Each risk should contain:
- risk_id
- title
- description
- category
- status
- probability
- severity
- reversibility
- time_horizon
- detection_date
- trigger
- early_warning_signs
- affected_goal_ids
- affected_event_ids
- affected_project_ids
- related_failure_mode_ids
- mitigation_plan
- owner
- escalation_level
- review_at
- source
- confidence
- resolution_status

## Risk Statuses

### Emerging

Weak signals exist, but the risk is not yet clearly active.

### Active

Evidence supports that the risk is developing.

### Escalating

Probability, severity, or urgency is increasing.

### Stabilized

Mitigation is working and the risk is under control.

### Resolved

The threat has passed or been eliminated.

### Accepted

The risk is understood and intentionally tolerated.

## Probability Scale

Suggested scale:
- Very Low
- Low
- Moderate
- High
- Very High

Probability should reflect evidence, not emotion.

## Severity Scale

Suggested scale:
- Minor
- Moderate
- Serious
- Severe
- Critical

Severity should reflect realistic consequences.

## Reversibility

Risks should be classified as:
- easily reversible
- partially reversible
- difficult to reverse
- irreversible

Low-probability but irreversible risks may still deserve attention.

## Risk Score

A conceptual risk score may be calculated as:

Risk Score =
Probability
× Severity
× Time Sensitivity
× Irreversibility
× Goal Impact
+ Behavioral Adjustment

Exact numerical weights should be tested and refined.

## Detection Sources

The Risk Engine should monitor:
- calendar
- deadlines
- task status
- goal progress
- project status
- health patterns
- finances
- communication obligations
- behavioral memory
- Failure Mode Registry
- user statements
- external integrations

## Early Warning Signals

Examples include:
- repeated postponement
- declining completion rate
- preparation below target
- missed sleep
- unresolved commitments
- shrinking time buffer
- rising workload
- project scope growth
- important message left unanswered
- emotionally driven decision-making

## Failure Mode Integration

Known failure modes should increase risk sensitivity.

Example:

Failure Mode:
Underestimating difficult academic workload.

Current Situation:
Chemistry exam in seven days with little preparation.

Result:
Elevated academic risk before a generic deadline-only system would escalate.

## Escalation Levels

### Green

No meaningful risk or the risk is well controlled.

Chief may monitor quietly.

### Yellow

Early warning signs are present.

Chief should surface the risk and recommend a small corrective action.

### Orange

The risk is actively developing.

Chief should recommend direct intervention and explain likely consequences.

### Red

Consequences are likely or already beginning.

Chief should interrupt, simplify priorities, and recommend immediate action.

### Critical

Safety, health, legal, or severe irreversible harm may be imminent.

Chief should clearly prioritize urgent protective action.

## Escalation Logic

A risk should escalate when:
- probability increases
- severity increases
- deadline approaches
- mitigation is not followed
- repeated postponement occurs
- related risks combine
- a known failure mode activates
- available options narrow

## De-Escalation Logic

A risk may de-escalate when:
- preparation improves
- mitigation is completed
- the deadline moves
- evidence changes
- the threat disappears
- consequences become less likely

## Compound Risks

Multiple small risks may combine into a serious situation.

Example:
- poor sleep
- exam preparation behind
- work shift scheduled
- assignment due same week

Individually manageable.

Together, they may create a high academic and health risk.

The engine should detect interactions, not only isolated risks.

## Risk Mitigation

Every meaningful risk should have a mitigation plan.

A mitigation plan may include:
- immediate action
- deadline
- owner
- required resources
- fallback option
- review time

Example:

Risk:
Chemistry exam preparation behind.

Mitigation:
- complete diagnostic quiz tonight
- schedule two focused sessions tomorrow
- attend office hours
- reduce optional commitments until caught up

## Risk Acceptance

Not every risk should be eliminated.

Some risks are worth taking because they create opportunity.

Risk acceptance should be explicit.

Questions:
- What is the upside?
- Is the downside tolerable?
- Can damage be contained?
- Is the decision aligned with the Constitution?

## False Positive Control

Too many warnings destroy trust.

Chief should avoid:
- constant alarm
- vague danger language
- escalating every missed task
- treating all uncertainty as risk

Warnings should be proportional, specific, and actionable.

## False Negative Control

The engine should avoid missing high-impact risks because:
- the signal is subtle
- the deadline is distant
- the user has not asked
- the issue crosses multiple domains

Important risks should be surfaced proactively.

## Risk Communication

A useful warning should include:
- what the risk is
- why it matters
- evidence
- severity
- time horizon
- recommended action
- confidence

Example:

`Orange academic risk: Your chemistry exam is in five days, and two planned review sessions remain incomplete. Because you historically underestimate difficult science workloads, I recommend protecting a 90-minute review block tonight and postponing optional project work.`

## Risk Review Cadence

Suggested defaults:
- critical and red risks: continuous or daily
- orange risks: daily
- yellow risks: every few days or weekly
- green risks: passive monitoring
- strategic risks: monthly or quarterly

## Risk Resolution

When a risk is resolved, North Vector should record:
- what changed
- which mitigation worked
- whether the warning was accurate
- what lesson should be preserved
- whether a behavioral or planning model should change

Resolved risks should feed the Reflection Engine.

## Example Risk Record

```json
{
  "risk_id": "risk_academic_001",
  "title": "Insufficient preparation for CHEM 1127Q exam",
  "category": "academic",
  "status": "active",
  "probability": "high",
  "severity": "serious",
  "reversibility": "partially_reversible",
  "time_horizon": "5_days",
  "escalation_level": "orange",
  "related_failure_mode_ids": ["FM-002"],
  "mitigation_plan": [
    "Complete diagnostic review tonight",
    "Schedule two focused study sessions",
    "Attend office hours"
  ],
  "confidence": 0.88
}
```

## Phase 1 Implementation

Phase 1 should support:
- manual and rule-based risk creation
- probability and severity
- escalation levels
- links to goals, events, projects, and failure modes
- mitigation plans
- review dates
- proactive warnings
- resolution tracking

Advanced prediction models should come later.

## Success Criteria

The Risk Engine succeeds if Chief can reliably answer:
- What could go wrong?
- How likely is it?
- How serious would it be?
- When must action occur?
- What warning signs are already present?
- What intervention has the highest leverage?
- Is the warning proportionate?

## Final Principle

The best time to solve a problem is before it becomes one.

The Risk Engine exists to make that possible.