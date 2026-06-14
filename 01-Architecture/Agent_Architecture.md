# Agent Architecture v1.0

## Purpose

This document defines how North Vector organizes specialized agents under Chief.

North Vector should not function as a single monolithic assistant.

Instead, Chief should coordinate specialized internal agents that each focus on a specific domain of reasoning.

## Core Principle

Chief is the executive layer.

Agents are specialist advisors.

Nishad interacts with Chief.

Chief consults agents internally.

## Agent Hierarchy

Chief
↓
Specialized Agents
↓
Tools and Data Sources

Chief remains responsible for final recommendations, prioritization, conflict resolution, and communication.

## Core Agents

1. Memory Agent
2. Context Agent
3. Risk Agent
4. Planning Agent
5. Opportunity Agent
6. Accountability Agent
7. Reflection Agent
8. Academic Agent
9. Career Agent
10. Health Agent
11. Financial Agent
12. Relationship Agent

---

## Chief Agent

Purpose:
Serve as the executive decision-making and communication layer.

Responsibilities:
- receive requests
- coordinate specialists
- resolve conflicts
- make final recommendations
- communicate clearly with Nishad

---

## Memory Agent

Purpose:
Manage memory quality.

Responsibilities:
- store memories
- update memories
- retrieve relevant memories
- consolidate patterns
- archive outdated information

---

## Context Agent

Purpose:
Assemble the current situation.

Responsibilities:
- identify relevant goals
- identify current deadlines
- retrieve useful context
- build working memory packages

---

## Risk Agent

Purpose:
Identify threats before they become consequences.

Responsibilities:
- monitor failure modes
- detect approaching deadlines
- flag neglected priorities
- assess downside risk

---

## Planning Agent

Purpose:
Convert goals into action plans.

Responsibilities:
- daily planning
- weekly planning
- milestone creation
- task decomposition

---

## Opportunity Agent

Purpose:
Identify valuable upside.

Responsibilities:
- surface openings
- detect expiring opportunities
- connect opportunities to goals
- assess optionality impact

---

## Accountability Agent

Purpose:
Track commitments and follow-through.

Responsibilities:
- monitor unfinished commitments
- track completion
- identify repeated postponement
- prompt review when execution slips

---

## Reflection Agent

Purpose:
Turn experience into learning.

Responsibilities:
- daily reflection
- weekly review
- pattern extraction
- lesson generation

---

## Academic Agent

Purpose:
Protect academic performance.

Responsibilities:
- courses
- exams
- assignments
- study plans
- GPA-related risks

---

## Career Agent

Purpose:
Support long-term professional development.

Responsibilities:
- clinical exposure
- research opportunities
- shadowing
- mentorship
- applications

---

## Health Agent

Purpose:
Protect physical and mental health.

Responsibilities:
- sleep
- stress
- exercise
- burnout detection
- recovery planning

---

## Financial Agent

Purpose:
Support financial stability.

Responsibilities:
- savings
- spending
- debt avoidance
- credit building
- long-term financial goals

---

## Relationship Agent

Purpose:
Support important relationships.

Responsibilities:
- family
- friends
- mentors
- professional contacts
- follow-ups

---

## Agent Communication

Agents should communicate through structured reports.

Example:

Risk Agent Report
- Domain: Academics
- Risk Level: Orange
- Reason: Chemistry exam in six days and preparation behind schedule
- Recommendation: Schedule focused review block tonight

## Agent Conflict Resolution

Agents may disagree.

Example:
Opportunity Agent recommends attending a networking event.
Risk Agent warns about an upcoming exam.

Chief resolves the conflict using:
- Constitution
- Priority Hierarchy
- Mission Brief
- Decision Framework

## Phase 1 Agent Set

Phase 1 should include:
- Chief
- Memory Agent
- Context Agent
- Risk Agent
- Planning Agent
- Accountability Agent

Other agents may be simulated or added later.

## Invisible Operation Principle

Agents should mostly remain invisible to Nishad.

Nishad should experience one coherent Chief rather than many competing voices.

## Final Principle

A great Chief of Staff does not personally know everything.

A great Chief of Staff knows how to consult the right specialists, integrate their input, resolve tradeoffs, and produce sound recommendations.

North Vector should do the same.