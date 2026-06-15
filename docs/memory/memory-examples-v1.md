
Memory Examples v1

Purpose:
This document provides canonical examples of properly structured memories inside North Vector.

It serves as a reference for:

* manual memory entry
* automated imports
* OpenAI export ingestion
* future Chief-of-Staff reasoning systems
* memory quality control

All imported memories should resemble one of the patterns below.

⸻

FACTS

Facts represent objective information about Nishad, his environment, history, or circumstances.

Example 1

content: Nishad will attend UConn beginning Fall 2026.
type: fact
domains:
  - academic
confidence: 1.0
status: active

Example 2

content: Nishad lives in Shrewsbury, Massachusetts.
type: fact
domains:
  - personal
confidence: 1.0
status: active

Example 3

content: Nishad owns a 13-inch MacBook Air with an M5 processor.
type: fact
domains:
  - technology
confidence: 1.0
status: active

⸻

PREFERENCES

Preferences describe favored choices, styles, behaviors, and recurring tendencies.

Example 1

content: Nishad prefers American Express products over most competing financial institutions.
type: preference
domains:
  - finance
confidence: 0.95
status: active

Example 2

content: Nishad prefers structured, step-by-step learning rather than broad unstructured study.
type: preference
domains:
  - academic
confidence: 1.0
status: active

Example 3

content: Nishad prefers long-term planning over short-term decision making.
type: preference
domains:
  - personal
confidence: 1.0
status: active

⸻

GOALS

Goals describe desired future outcomes.

Example 1

content: Nishad intends to become an orthopedic surgeon.
type: goal
domains:
  - medicine
  - career
confidence: 1.0
status: active

Example 2

content: Nishad aims to graduate from college with little or no undergraduate debt.
type: goal
domains:
  - finance
  - academic
confidence: 1.0
status: active

Example 3

content: Nishad aims to maintain a GPA above 3.9 during undergraduate studies.
type: goal
domains:
  - academic
confidence: 1.0
status: active

⸻

PROJECTS

Projects represent ongoing initiatives with multiple actions or milestones.

Example 1

content: North Vector is a personal Chief-of-Staff platform being developed by Nishad.
type: project
domains:
  - technology
  - north_vector
confidence: 1.0
status: active

Example 2

content: Etherea Foundation operates technology education programs for senior citizens.
type: project
domains:
  - nonprofit
confidence: 1.0
status: active

Example 3

content: TechLink provides technology assistance to senior citizens throughout Shrewsbury.
type: project
domains:
  - nonprofit
confidence: 1.0
status: active

⸻

DECISIONS

Decisions capture important commitments and chosen paths.

Example 1

content: Nishad selected UConn over other university options.
type: decision
domains:
  - academic
confidence: 1.0
status: active

Example 2

content: Nishad chose American Express as his preferred long-term banking ecosystem.
type: decision
domains:
  - finance
confidence: 0.95
status: active

Example 3

content: Nishad decided to prioritize EMT experience during college.
type: decision
domains:
  - medicine
confidence: 1.0
status: active

⸻

LESSONS

Lessons represent learned principles and conclusions.

Example 1

content: Consistent execution produces better results than waiting for motivation.
type: lesson
domains:
  - productivity
confidence: 0.95
status: active

Example 2

content: Small daily progress compounds more reliably than occasional intense effort.
type: lesson
domains:
  - productivity
confidence: 0.95
status: active

Example 3

content: Career opportunities are often created through relationships before formal applications.
type: lesson
domains:
  - career
confidence: 0.9
status: active

⸻

CONSTRAINTS

Constraints represent limitations, requirements, dependencies, or realities that affect planning.

Example 1

content: Medical school admissions require maintaining a highly competitive GPA.
type: constraint
domains:
  - medicine
  - academic
confidence: 1.0
status: active

Example 2

content: Firestore documents cannot store undefined values directly.
type: constraint
domains:
  - technology
  - north_vector
confidence: 1.0
status: active

Example 3

content: UConn is located far enough from home that commuting is impractical.
type: constraint
domains:
  - academic
confidence: 1.0
status: active

⸻

IDENTITY

Identity memories describe stable characteristics, values, and self-concept.

Example 1

content: Nishad is a highly future-oriented systems thinker.
type: identity
domains:
  - personal
confidence: 1.0
status: active

Example 2

content: Nishad values competence, independence, structure, and intentional living.
type: identity
domains:
  - personal
confidence: 1.0
status: active

Example 3

content: Nishad naturally organizes life through interconnected systems rather than isolated goals.
type: identity
domains:
  - personal
confidence: 1.0
status: active

⸻

NORTH VECTOR SPECIFIC EXAMPLES

Example 1

content: The long-term vision for North Vector is an ambient Chief-of-Staff system rather than a traditional productivity application.
type: identity
domains:
  - north_vector
  - technology
confidence: 1.0
status: active

Example 2

content: North Vector should eventually operate through voice, smart glasses, and proactive assistance.
type: goal
domains:
  - north_vector
  - technology
confidence: 1.0
status: active

Example 3

content: The memory system is the foundational layer upon which all future North Vector intelligence will be built.
type: fact
domains:
  - north_vector
confidence: 1.0
status: active

⸻

MEMORY QUALITY RULES

A good memory:

✅ Contains one idea
✅ Is understandable without conversation context
✅ Can be true or false
✅ Can be referenced later by an agent
✅ Uses clear language
✅ Avoids emotional filler
✅ Avoids conversational phrasing

Bad:

content: We talked about how maybe I kinda wanted to become an orthopedic surgeon someday.

Good:

content: Nishad intends to become an orthopedic surgeon.

⸻

