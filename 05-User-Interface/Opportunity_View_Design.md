# Opportunity View Design v1.0

## Purpose

This document defines how North Vector should present opportunities, strategic value, expiration, effort, risk, goal alignment, and recommended next actions.

The Opportunity View exists to help Nishad recognize and act on valuable openings without becoming distracted by every interesting possibility.

## Core Principle

Opportunities should be surfaced according to fit, timing, and leverage.

The interface should help distinguish a genuinely valuable opening from a shiny distraction.

## Primary Objectives

The Opportunity View should help Nishad answer:
- What valuable opportunities exist?
- Which goals do they support?
- How time-sensitive are they?
- What would they cost?
- What is the likely upside?
- What action is required?
- Is this worth pursuing now?

## Default View

The default Opportunity View should show:
- active opportunities
- strategic value
- expiration date
- goal alignment
- required next action
- effort and cost
- current status

Expired, captured, declined, and missed opportunities should remain available through filters.

## Opportunity Categories

The interface should support:
- Academic
- Career
- Research
- Clinical
- Financial
- Relationship
- Project
- Learning
- Health
- Personal Development

## Opportunity Statuses

Suggested statuses:
- Emerging
- Active
- Evaluating
- Pursuing
- Captured
- Declined
- Missed
- Expired

## Opportunity Card

Each card should include:
- title
- category
- strategic value
- expiration date
- related goals
- estimated effort
- estimated cost
- next action
- status

Possible quick actions:
- Review Opportunity
- Pursue
- Add Next Action
- Defer
- Decline
- Mark Captured

## Opportunity Detail View

The detail page should contain:

### Opportunity Summary

- title
- description
- category
- current status
- source

### Why It Matters

Explain:
- which goals it supports
- what leverage it creates
- how it expands optionality
- whether it is rare or replaceable

### Expiration and Timing

Show:
- decision deadline
- application deadline
- latest safe start date
- current urgency

### Required Action

Display the immediate next step clearly.

Example:
`Review the posting and draft an outreach email.`

### Effort and Cost

Show:
- estimated time
- financial cost
- energy demand
- ongoing commitment

### Expected Upside

Show:
- skill development
- relationship value
- career value
- financial value
- strategic leverage

### Downside and Risk

Show:
- displacement cost
- failure risk
- opportunity cost
- possible overcommitment

### Goal Alignment

Display linked goals and strength of alignment.

### Dependencies

Show:
- prerequisites
- required documents
- people involved
- other tasks that must happen first

### Decision History

Show:
- evaluation notes
- changes in value
- why the opportunity was pursued, deferred, or declined

## Opportunity Portfolio View

The portfolio view should help identify:
- highest-value opportunities
- expiring opportunities
- overloaded pursuit pipeline
- opportunities competing for the same resources
- opportunities linked to the same goal

Suggested columns:
- Opportunity
- Category
- Value
- Alignment
- Deadline
- Effort
- Status
- Next Action

## Opportunity Ranking

The interface should support ranking by:
- strategic value
- goal alignment
- optionality impact
- expiration
- effort-to-upside ratio
- relationship value
- financial value

The ranking logic should remain explainable.

## Strategic Value Labels

Suggested values:
- Transformative
- High
- Moderate
- Low
- Speculative

Value labels should not be used casually.

## Goal Alignment Labels

Suggested values:
- Direct
- Strong
- Supporting
- Weak
- Unrelated

## Effort Labels

Suggested values:
- Minimal
- Low
- Moderate
- High
- Sustained

## Opportunity Fit

The interface should evaluate whether the opportunity fits:
- current mission
- available time
- energy
- current commitments
- behavioral patterns
- risk tolerance

## Distraction Detection

North Vector should flag opportunities that appear exciting but weakly aligned.

Example:
`Interesting but low alignment. Pursuing this would displace higher-priority academic work.`

The interface should never shame curiosity.

It should make tradeoffs visible.

## Opportunity Comparison

Allow side-by-side comparison of opportunities.

Suggested criteria:
- strategic value
- effort
- cost
- deadline
- optionality
- risk
- relationship value
- goal alignment

## Pursuit Flow

When pursuing an opportunity, the system should:
- define the next action
- create deadlines
- link required tasks
- identify dependencies
- monitor risk
- update status

## Decline Flow

When declining, record:
- reason
- opportunity cost
- whether a similar opportunity should be monitored
- whether the decision was temporary or final

## Missed Opportunity Review

When an opportunity is missed, capture:
- whether it was detected early enough
- whether delay caused the miss
- whether it was actually valuable
- what rule should change

## Today View Integration

Only the most relevant one to three opportunities should appear on the Today View.

The full Opportunity View should provide the larger portfolio.

## Notification Integration

Opportunity notifications should focus on:
- high alignment
- unusual value
- expiration
- low effort relative to upside

Avoid noisy alerts for weak opportunities.

## Visual Design

The Opportunity View should feel:
- optimistic
- strategic
- restrained
- clear

Avoid:
- hype language
- gamified urgency
- flashy animations
- endless recommendation feeds

## Mobile Opportunity View

On phone, prioritize:
- title
- deadline
- why it matters
- next action
- effort

Detailed comparisons may collapse.

## Wearable Opportunity View

For glasses or watch, show only:
- opportunity title
- deadline
- one-line value
- immediate action

Detailed review should hand off to phone or MacBook.

## Accessibility

The Opportunity View should support:
- keyboard navigation
- screen readers
- non-color labels
- scalable text
- clear comparison tables

## Empty States

No active opportunities:
`No active opportunities currently require attention.`

No expiring opportunities:
`No high-value opportunities expire soon.`

## Error States

If external opportunity sources are unavailable:
`Some opportunity sources are temporarily unavailable. Existing records remain visible, but new openings may be missing.`

## Failure Modes

### Opportunity Spam

Too many weak opportunities appear.

### Hype Bias

Interesting opportunities are overrated.

### Risk Blindness

The interface shows upside without cost.

### Deadline Blindness

The opportunity is noticed too late.

### Goal Blindness

Fit with active goals is unclear.

### Overcommitment

Too many opportunities move into pursuit at once.

### No Next Action

The opportunity is visible but not actionable.

## Phase 1 Implementation

Phase 1 should include:
- active opportunity list
- opportunity cards
- strategic value
- expiration date
- goal alignment
- effort and cost
- next action
- pursue, decline, and captured states
- detail view
- sorting and filtering

Advanced automated discovery can come later.

## Success Criteria

The Opportunity View succeeds if Nishad can quickly understand:
- what opening exists
- why it matters
- whether it fits current priorities
- what it will cost
- when action is required
- whether to pursue or ignore it

## Final Principle

The Opportunity View should not make the future feel crowded.

It should make the right doors easier to see.