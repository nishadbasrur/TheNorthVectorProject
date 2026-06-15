# North Vector Relationship Model v1

## Purpose

North Vector should not store information as isolated records. It should understand how goals, projects, tasks, memories, decisions, and reviews connect.

The relationship model allows the system to answer:

- Why does this task matter?
- Which goal does this project support?
- Which memories explain this decision?
- What risks are connected to this plan?
- What should be prioritized today?

## Core Objects

### Goal

A goal is a desired future outcome.

Examples:

- Become an orthopedic surgeon
- Build North Vector into an ambient Chief-of-Staff system
- Maintain strong academic performance at UConn

Goals explain direction.

### Project

A project is a structured effort that supports one or more goals.

Examples:

- Firestore Persistence Layer
- UConn Premed Preparation
- EMT Certification Pathway

Projects explain strategy.

### Task

A task is a discrete action that can be completed.

Examples:

- Create `task-store.ts`
- Email a physician for shadowing
- Review Chemistry Chapter 1

Tasks explain execution.

### Memory

A memory is durable context that helps the system understand Nishad, interpret future situations, and make better recommendations.

Examples:

- Nishad prefers ambient voice-first tools over manual dashboard input.
- Firestore rejects undefined values.
- Nishad wants North Vector to feel more like JARVIS than a normal app.

Memories explain context.

### Decision

A decision is a meaningful choice that should be remembered.

Examples:

- Use Firestore for early persistence.
- Build the web app as a control room, not the final interface.
- Prioritize tasks before goals/projects in the database layer.

Decisions explain tradeoffs.

### Review

A review is a reflection checkpoint over time.

Examples:

- Daily review
- Weekly review
- Monthly strategy review
- Semester review

Reviews explain progress and course correction.

### Risk

A risk is a possible problem that could threaten a goal, project, task, or system.

Examples:

- Firestore rules are currently permissive during development.
- Raw OpenAI exports may contain too much unstructured data.
- The task page form may become too dominant as the task list grows.

Risks explain what could go wrong.

---

## Relationship Types

### supports

Object A helps advance Object B.

Examples:

- Project supports Goal
- Task supports Project
- Memory supports Decision

```text
Task: Build Firestore task storage
supports
Project: Firestore Persistence Layer
