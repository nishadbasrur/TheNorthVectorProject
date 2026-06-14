# Today View Design v1.0

## Purpose

This document defines the primary daily interface of North Vector.

The Today View is the first screen Nishad should see when opening the system.

Its job is to answer, within seconds:

- What matters today?
- What is happening?
- What is at risk?
- What should I do next?

## Core Principle

The Today View should create immediate clarity.

It should not become a dense dashboard, a task graveyard, or a source of guilt.

The page should emphasize the few facts most likely to affect the current day.

## Primary Objectives

The Today View should:
- establish situational awareness
- surface the primary priority
- show fixed commitments
- identify active risks
- highlight useful opportunities
- preserve important relationship obligations
- recommend the next action
- provide fast access to Chief

## Information Hierarchy

The default order should be:

1. Safety and health alerts
2. Executive daily summary
3. Primary priority
4. Immediate schedule
5. Active risks
6. Secondary priorities
7. Commitments and follow-ups
8. Opportunities
9. Goal alignment
10. System status

## Page Structure

Suggested regions:

1. Daily Header
2. Executive Summary
3. Next Action Card
4. Top Priorities
5. Timeline
6. Risk and Opportunity Rail
7. Commitments
8. Health and Capacity
9. Chief Input
10. End-of-Day Review

## Daily Header

The header should show:
- date
- day of week
- current time
- location or active context when useful
- current privacy mode
- voice activation control

Optional greeting:
`Good morning, Nishad.`

The greeting should remain restrained.

## Executive Summary

The summary should contain one to three sentences.

Example:

`Today is academically focused. Chemistry preparation remains the highest-leverage activity. You have classes in the morning, one mentor follow-up due, and no critical health or schedule issues.`

The summary should avoid repeating every card below it.

## Next Action Card

This is the most important card on the page.

It should show:
- exact next action
- estimated duration
- why it matters
- start button
- defer or revise control

Example:

Title:
`Complete chemistry diagnostic review`

Duration:
`45 minutes`

Reason:
`Exam in six days; preparation is behind target.`

Primary action:
`Start`

## Top Priorities

Display:
- one primary priority
- up to two secondary priorities

Each item should include:
- title
- priority level
- deadline or time window
- related goal
- status

The interface should resist displaying more than three items as top priorities.

## Timeline

The timeline should show:
- classes
- work
- appointments
- study blocks
- travel time
- deadlines
- transition windows

The timeline should distinguish:
- fixed events
- flexible blocks
- preparation requirements

Current time should be visually obvious.

## Risk Rail

Display only meaningful active risks.

Each risk should show:
- escalation level
- short explanation
- affected goal
- recommended mitigation

Example:

`Orange Academic Risk`

`Chemistry preparation is one session behind.`

Action:
`Review recovery plan`

## Opportunity Rail

Display only one to three high-value opportunities.

Each opportunity should show:
- title
- expiration date
- strategic value
- required next action

Low-value opportunities should not clutter the Today View.

## Commitments and Follow-Ups

This area should show obligations involving other people or institutions.

Examples:
- email professor
- send mentor update
- submit form
- confirm meeting

Each item should include:
- person or organization
- due time
- consequence of delay
- status

## Health and Capacity

Show only actionable health context.

Possible fields:
- sleep quality
- energy level
- workload density
- recovery recommendation

Example:

`Energy: Moderate`

`Avoid scheduling high-focus work after 9 PM.`

The interface should not turn health into a constant scorecard.

## Goal Alignment

A compact section should connect today's work to larger goals.

Example:

`Today's chemistry review supports your freshman GPA goal, which supports medical school competitiveness.`

This should reinforce meaning without becoming repetitive.

## Chief Input

Provide a persistent input for:
- text
- voice
- quick capture
- decision questions
- plan changes

Suggested placeholder:
`Ask Chief, capture something, or change the plan...`

## Quick Actions

Possible quick actions:
- Add Task
- Capture Note
- Start Voice Session
- Review Schedule
- Log Completion
- Replan Day

Quick actions should remain few and high-value.

## Dynamic Behavior

The Today View should update when:
- an event ends
- a task is completed
- risk changes
- schedule changes
- a new opportunity appears
- the user reports lower energy

Updates should preserve stability and avoid constant visual rearrangement.

## Morning State

Morning view should emphasize:
- executive summary
- schedule
- primary priority
- preparation needs

## Midday State

Midday view should emphasize:
- completed work
- remaining priorities
- replanning
- emerging delays

## Evening State

Evening view should emphasize:
- unfinished commitments
- tomorrow preparation
- short reflection
- shutdown recommendation

## Completion Interaction

When a task is completed:
- update status immediately
- show the next action
- avoid excessive celebration
- capture outcome evidence when useful

Example:
`Completed. Next best action: Biology notes, 30 minutes.`

## Deferral Interaction

When deferring an item, ask only what matters.

Possible questions:
- Why is this moving?
- When should it return?
- What will replace it?

Repeated deferral should notify the Accountability Engine.

## Replanning

A `Replan Day` action should:
- review remaining time
- preserve fixed commitments
- reassess priority
- account for current energy
- produce a realistic revised plan

The system should not simply push every unfinished item later.

## Empty States

Examples:

No active risks:
`No active risks require attention.`

No commitments:
`No external follow-ups are due today.`

No opportunities:
`No time-sensitive opportunities are active.`

## Error States

Examples:

Calendar sync failure:
`Calendar data may be outdated. Last successful sync: 8:14 AM.`

Risk engine unavailable:
`Risk analysis is temporarily unavailable. Tasks and calendar remain current.`

## Mobile Today View

On phone, prioritize:
- next action
- current event
- top priorities
- active risk
- voice button

Secondary details should collapse.

## Wearable Today View

For glasses or watch, reduce to:
- next event
- next action
- critical alert
- quick confirmation

## Visual Design

The Today View should feel:
- calm
- intentional
- precise
- readable
- uncluttered

Use:
- restrained navy accents
- neutral backgrounds
- strong hierarchy
- generous spacing
- minimal motion

## Failure Modes

### Task Dump

Too many tasks appear at once.

### Everything Is Urgent

Priority loses meaning.

### Risk Dominance

The page feels anxious and defensive.

### Static View

The interface fails to update as the day changes.

### Excessive Gamification

Progress feels childish or manipulative.

### No Clear Next Action

The page informs but does not guide.

### Over-Personalization

Too much private context appears on the default screen.

## Phase 1 Implementation

Phase 1 should include:
- daily executive summary
- next action card
- top three priorities
- schedule timeline
- active risks
- active opportunities
- commitments
- Chief input
- replan day action
- responsive layout

Health, goal alignment, and advanced timeline behavior may begin in simplified form.

## Success Criteria

The Today View succeeds if Nishad can open North Vector and understand within ten seconds:
- where he needs to be
- what matters most
- what is slipping
- what opportunity exists
- what action to take next

## Final Principle

The Today View should not make Nishad manage the system.

It should help Nishad manage the day.