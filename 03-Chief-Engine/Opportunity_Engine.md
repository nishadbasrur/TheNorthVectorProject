# Opportunity Engine v1.0

## Purpose

This document defines how North Vector identifies, evaluates, prioritizes, monitors, and surfaces opportunities.

The Opportunity Engine exists to prevent a system focused on risk from becoming overly defensive.

Its job is to notice openings that could create progress, leverage, relationships, skills, financial upside, or future optionality.

## Core Principle

A good Chief does not only prevent mistakes.

A good Chief also sees doors before they close.

North Vector should actively search for opportunities that align with Nishad's goals and values.

## Opportunity Definition

An opportunity is a time-sensitive or strategically valuable possibility that may improve:
- academic performance
- career development
- health
- finances
- relationships
- projects
- skills
- reputation
- future optionality

An opportunity is not automatically worth pursuing.

It must be evaluated against cost, risk, timing, and fit.

## Opportunity Categories

### Academic Opportunities

Examples:
- office hours
- tutoring
- academic workshops
- honors opportunities
- scholarships

### Career Opportunities

Examples:
- internships
- research positions
- shadowing
- mentorship
- networking

### Project Opportunities

Examples:
- partnerships
- grants
- collaborators
- useful technical tools

### Financial Opportunities

Examples:
- scholarships
- better savings options
- high-value employment
- cost reductions

### Relationship Opportunities

Examples:
- meaningful introductions
- mentor conversations
- reconnecting with important people

### Health Opportunities

Examples:
- improved routines
- recovery windows
- preventative care
- fitness programs

### Learning Opportunities

Examples:
- courses
- certifications
- books
- workshops
- technical skill development

## Standard Opportunity Record

Each opportunity should contain:
- opportunity_id
- title
- description
- category
- status
- discovered_at
- expiration_date
- source
- confidence
- strategic_value
- goal_alignment
- optionality_impact
- required_action
- estimated_effort
- estimated_cost
- estimated_upside
- downside_risk
- prerequisites
- related_goal_ids
- related_people_ids
- related_project_ids
- decision_deadline
- next_review_at

## Opportunity Statuses

### Emerging

Possible opportunity with incomplete information.

### Active

Currently available and relevant.

### Evaluating

Under review.

### Pursuing

Action is underway.

### Captured

Opportunity was successfully used.

### Declined

Intentionally not pursued.

### Missed

Expired without action.

### Expired

No longer available.

## Opportunity Value

Opportunity value should consider:
- long-term goal alignment
- strategic leverage
- skill development
- relationship value
- financial upside
- reputation value
- future optionality
- time sensitivity

## Opportunity Cost

Every opportunity consumes resources.

The engine should evaluate:
- time
- money
- attention
- energy
- displaced priorities
- risk introduced

A high-upside opportunity may still be a poor choice if it disrupts more important obligations.

## Opportunity Score

A conceptual score may be calculated as:

Opportunity Score =
Goal Alignment
+ Strategic Value
+ Optionality Impact
+ Time Sensitivity
+ Learning Value
+ Relationship Value
- Effort Cost
- Financial Cost
- Downside Risk
- Displacement Cost

Exact weights should be tested over time.

## Detection Sources

The Opportunity Engine should monitor:
- email
- calendar
- academic portals
- project updates
- professional networks
- research listings
- job postings
- scholarships
- user conversations
- relationship interactions
- external research

## Opportunity Triggers

Examples:
- application opens
- professor mentions research need
- mentor offers introduction
- calendar gap appears
- new grant becomes available
- relevant job is posted
- project collaborator becomes available

## Goal Matching

Every opportunity should be matched to active goals.

Example:

Opportunity:
Undergraduate research assistant position.

Related Goals:
- gain research experience
- build physician-scientist mentorship
- strengthen medical school application

The stronger the goal match, the higher the opportunity priority.

## Optionality Analysis

The engine should ask:
- Does this create future choices?
- Does this build transferable skills?
- Does this expand relationships?
- Does this reduce dependency?
- Does this preserve flexibility?

Opportunities that increase future optionality deserve additional weight.

## Time Sensitivity

Opportunities should be classified as:
- immediate
- expiring soon
- open-ended
- recurring

The engine should surface opportunities before urgency becomes panic.

## Opportunity Clusters

Several small opportunities may combine into a strategic path.

Example:
- attend office hours
- build professor relationship
- ask about research
- secure recommendation

Chief should recognize sequences, not just isolated openings.

## Opportunity-Risk Balance

The Opportunity Engine should work with the Risk Engine.

Example:

Opportunity:
Attend a networking dinner.

Risk:
Chemistry exam preparation is behind.

Possible result:
Attend only if a study target is completed first.

The objective is intelligent tradeoff, not reflexive yes or no.

## Opportunity Escalation

An opportunity should receive stronger attention when:
- it expires soon
- it strongly aligns with critical goals
- it is unusually rare
- it creates significant optionality
- required action is small relative to upside
- a trusted relationship is involved

## Opportunity De-Escalation

An opportunity may be deprioritized when:
- costs increase
- alignment weakens
- risk rises
- information changes
- a better opportunity appears
- required prerequisites are missing

## Missed Opportunity Review

When an opportunity is missed, North Vector should record:
- why it was missed
- whether the opportunity was actually valuable
- whether detection happened too late
- whether action was delayed
- what rule should change

Missed opportunities should feed the Reflection Engine.

## Opportunity Communication

A useful opportunity alert should include:
- what the opportunity is
- why it matters
- which goals it supports
- what action is required
- when it expires
- estimated cost and upside
- confidence

Example:

`High-value career opportunity: A UConn faculty member is seeking undergraduate research help. This aligns with your research and medical school goals. The application closes Friday. The immediate action is a 20-minute review of the posting and a draft outreach email.`

## False Positive Control

Too many opportunities create distraction.

Chief should avoid surfacing:
- weakly aligned options
- low-value events
- opportunities that duplicate existing commitments
- speculative opportunities with high cost and little evidence

## New Idea Diversion Rule

Because Nishad is naturally attracted to new ideas, the Opportunity Engine should distinguish between:
- strategically valuable opportunity
- interesting distraction

A new opportunity should not displace an active priority without explicit justification.

## Example Opportunity Record

```json
{
  "opportunity_id": "opp_career_001",
  "title": "Undergraduate research assistant opening",
  "category": "career",
  "status": "active",
  "expiration_date": "2026-09-15",
  "strategic_value": "high",
  "goal_alignment": "high",
  "optionality_impact": "high",
  "required_action": "Review posting and submit outreach email",
  "estimated_effort": "moderate",
  "downside_risk": "low",
  "related_goal_ids": ["goal_research_experience"],
  "confidence": 0.91
}
```

## Phase 1 Implementation

Phase 1 should support:
- manual opportunity creation
- expiration dates
- goal links
- strategic value
- required action
- opportunity status
- simple ranking
- alerts for expiring opportunities
- missed opportunity review

Automated internet-wide opportunity discovery should come later.

## Success Criteria

The Opportunity Engine succeeds if Chief can reliably answer:
- What valuable opening exists right now?
- Which goals does it support?
- How rare or time-sensitive is it?
- What does it cost?
- What action is required?
- Is it a real opportunity or a distraction?

## Final Principle

Risk protection preserves the future.

Opportunity recognition expands it.

North Vector must do both.