# Relationship Memory Model v1.0

## Purpose

This document defines how North Vector stores, updates, retrieves, and reasons about relationships.

Relationships are not merely contacts.

They are living contexts involving trust, history, commitments, expectations, significance, and change over time.

The objective is not to optimize people for utility.

The objective is to help Nishad maintain meaningful relationships, honor commitments, preserve trust, and recognize relationship-dependent opportunities and risks.

## Core Principle

People should remain relationships, not database entries.

North Vector should preserve human context without reducing relationships to transactions.

## Relationship Categories

### Family

Examples:
- parents
- siblings
- extended family

Characteristics:
- foundational
- long-term
- high emotional significance

### Close Friends

Characteristics:
- trusted
- emotionally important
- maintained through reciprocity and presence

### Mentors

Examples:
- physicians
- professors
- advisors
- researchers

Characteristics:
- guidance
- professional development
- long-term influence

### Professional Relationships

Examples:
- supervisors
- coworkers
- collaborators
- organization leaders

Characteristics:
- reputation
- reliability
- collaboration
- opportunity

### Academic Relationships

Examples:
- professors
- teaching assistants
- advisors
- classmates

Characteristics:
- learning support
- recommendations
- academic opportunity

### Project Relationships

Examples:
- North Vector collaborators
- TechLink members
- Etherea members

Characteristics:
- shared goals
- execution
- role clarity
- accountability

### Acquaintances

Characteristics:
- limited history
- low current intimacy
- possible future relevance

## Standard Relationship Record

Each relationship should contain:
- person_id
- full_name
- preferred_name
- relationship_categories
- relationship_status
- importance
- trust_level
- closeness
- reciprocity
- first_known_at
- last_interaction_at
- normal_contact_frequency
- shared_context
- known_preferences
- relevant_goals
- active_commitments
- follow_up_at
- relationship_risks
- relationship_opportunities
- related_goal_ids
- related_project_ids
- related_event_ids
- interaction_history
- notes
- sensitivity
- confidence
- review_at

## Relationship Statuses

### New

Relationship is recently formed.

### Growing

Trust, familiarity, or frequency is increasing.

### Active

Relationship is receiving current attention.

### Stable

Relationship is healthy without requiring frequent contact.

### Neglected

Contact or follow-through has fallen below what the relationship reasonably requires.

### Dormant

Relationship is inactive but not damaged.

### Strained

Trust, communication, or expectations are under stress.

### Ended

Relationship is no longer active.

## Importance Levels

### Critical

Examples:
- immediate family
- deeply significant relationships
- primary mentors

### High

Examples:
- close friends
- major advisors
- key professional relationships

### Medium

Examples:
- professors
- supervisors
- collaborators

### Low

Examples:
- acquaintances
- low-context contacts

Importance should reflect actual personal significance, not status or prestige.

## Trust Levels

Suggested levels:
- complete
- high
- moderate
- limited
- unknown
- damaged

Trust should affect:
- recommendation confidence
- disclosure decisions
- reliance on commitments
- escalation of relationship risks

## Closeness

Suggested levels:
- very_close
- close
- moderate
- distant
- new

Closeness and importance should remain separate.

A distant family member may still be important.

A frequent acquaintance may not be close.

## Reciprocity

North Vector may track whether the relationship appears:
- balanced
- Nishad-led
- other-person-led
- unclear

This field should be used carefully and never as a crude score of worth.

## Interaction Memory

Important interactions may contain:
- interaction_id
- date
- type
- summary
- commitments_created
- emotional_tone
- follow_up_required
- related_event_ids
- source

Interaction types may include:
- conversation
- meeting
- call
- email
- text
- project collaboration
- social event
- conflict
- support event

## Commitment Tracking

Relationship-related commitments should remain visible.

Examples:
- promised follow-up
- introduction
- document to send
- meeting to schedule
- thank-you message

Missing these commitments can damage trust disproportionately.

## Relationship Health

North Vector may assess relationship health using:
- recent contact
- quality of interaction
- unresolved commitments
- conflict status
- trust changes
- Nishad's stated feelings
- the other person's expressed expectations

Relationship health should never be reduced to contact frequency alone.

Some strong relationships require little maintenance.

## Maintenance Rules

Chief may suggest maintenance when:
- an important relationship has been neglected
- a follow-up is overdue
- a mentor has not been updated after a meaningful milestone
- gratitude should be expressed
- a commitment remains open

Suggestions should remain natural and non-transactional.

## Family Rule

Family relationships receive elevated consideration under the Constitution.

Chief should account for:
- obligations
- emotional significance
- family well-being
- major family events
- long-term trust

Family should not be treated as optional background context.

## Mentor Rule

Mentorship relationships should be maintained through:
- preparation
- gratitude
- follow-through
- respectful communication
- meaningful updates

Chief should help Nishad avoid disappearing after receiving help.

## Relationship Opportunity Detection

Relationships may create opportunities such as:
- introductions
- shadowing
- research
- mentorship
- collaboration
- recommendations

North Vector may surface these opportunities, but should not encourage exploitative behavior.

The relationship must remain primary.

## Relationship Risk Detection

Possible risks include:
- missed follow-up
- broken promise
- poor communication
- unresolved conflict
- overreliance
- boundary violation
- reputation damage
- neglect of an important relationship

Relationship risks should be surfaced early and tactfully.

## Relationship Retrieval Rules

Relationship memory should be retrieved when:
- a person is mentioned
- a decision affects someone
- a commitment involves another person
- a follow-up is due
- an opportunity depends on a relationship
- a conflict is being evaluated
- a social or family event is being planned

Only relevant relationship details should enter context.

## Privacy and Sensitivity

Relationship memories may be highly sensitive.

North Vector should:
- minimize unnecessary exposure
- avoid showing private details in public notifications
- distinguish fact from interpretation
- avoid storing intimate details without clear value
- allow correction and deletion

## Boundary Rules

Chief should never encourage:
- manipulation
- deception
- manufactured intimacy
- transactional networking disguised as friendship
- pressure tactics
- invasive monitoring

Chief should prefer:
- honesty
- reciprocity
- respect
- consent
- clear boundaries

## Relationship Change

Relationships evolve.

North Vector should update:
- trust
- closeness
- status
- communication patterns
- commitments
- relevance

Past closeness should not be treated as permanent reality.

## Relationship Review Cadence

Suggested defaults:
- critical relationships: monthly awareness review
- high-importance relationships: every 2–3 months
- mentorship relationships: after major milestones and at least every semester
- professional relationships: context-dependent
- dormant relationships: only when relevant

Review should create awareness, not forced outreach.

## Example Relationship Record

```json
{
  "person_id": "person_mentor_001",
  "full_name": "Example Mentor",
  "relationship_categories": ["mentor", "professional"],
  "relationship_status": "growing",
  "importance": "high",
  "trust_level": "moderate",
  "closeness": "new",
  "last_interaction_at": "2026-06-10",
  "active_commitments": [
    "Send a brief update after orientation"
  ],
  "follow_up_at": "2026-07-15",
  "related_goal_ids": ["goal_medical_career_development"],
  "sensitivity": "moderate"
}
```

## Phase 1 Implementation

Phase 1 should support:
- person records
- relationship categories
- importance and trust
- interaction history
- commitments
- follow-up dates
- links to goals, projects, and events
- privacy classification

Advanced social inference should be delayed.

## Success Criteria

The Relationship Memory Model succeeds if Chief can help Nishad:
- remember important people
- honor commitments
- maintain family and friendships
- follow up with mentors
- preserve trust
- recognize relationship-dependent opportunities
- avoid manipulative or transactional behavior

## Final Principle

A great Chief of Staff understands the mission.

A great Chief of Staff also understands the people who matter to it.

North Vector should remember both.