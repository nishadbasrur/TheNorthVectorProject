# North Vector Memory Schema v1

## 1. What a Memory Is

A memory is a durable piece of information that North Vector may use later to understand Nishad, interpret context, make recommendations, prioritize work, or connect future situations to past facts, preferences, goals, lessons, and decisions.

A memory is not a raw chat message.

A memory should be:

- useful later
- specific enough to act on
- connected to a domain
- traceable to a source
- assigned confidence
- reviewable or editable
- safe to delete, archive, or supersede

## 2. Memory Types

### fact
Stable information about Nishad or the world.

Example: Nishad is attending UConn starting Fall 2026.

### preference
A recurring preference, taste, style, or desired way of doing things.

Example: Nishad prefers polished, executive-style UI with human-readable labels.

### goal
A desired future outcome.

Example: Nishad wants to build North Vector into an ambient Chief-of-Staff system.

### project
An active or planned initiative.

Example: North Vector is being built as a Next.js and Firebase web app.

### task_context
Context that helps interpret future tasks.

Example: Tasks should connect to goals, projects, domains, energy level, and priority.

### lesson
Something learned from experience.

Example: Raw mock data is useful for design, but real persistence is needed for an actual application.

### decision
A choice Nishad made and may need to remember later.

Example: Firestore will be used for early persistent storage.

### constraint
A limitation, boundary, dependency, or rule.

Example: Firestore does not accept undefined field values.

### routine
A repeated behavior, workflow, or cadence.

Example: Run npm run check before committing major changes.

### relationship
Information about a person, organization, mentor, advisor, contact, or collaborator.

Example: Claude helped generate the executive dashboard redesign.

### identity
A deeper self-description, long-term orientation, or personal pattern.

Example: Nishad thinks in systems and wants low-friction, ambient tools rather than manual dashboards.

### event
A dated occurrence worth remembering.

Example: On June 14, 2026, North Vector added Firestore-backed task management.

## 3. Domains

Each memory should have at least one domain.

Recommended domains:

- north_vector
- academic
- medicine
- career
- finance
- health
- family
- relationships
- personal_development
- travel
- technology
- productivity
- style
- legal
- household

## 4. Confidence and Status

### Confidence

Use a number from 0 to 1.

- 1.0 = directly stated, highly reliable
- 0.8 = strongly inferred from repeated statements
- 0.6 = plausible but should be confirmed
- 0.4 = weak or uncertain
- 0.2 = likely outdated or questionable

### Status

Each memory should have a status.

- active: usable normally
- candidate: captured but needs review
- archived: preserved but not actively used
- superseded: replaced by a newer memory
- rejected: reviewed and intentionally not used

## 5. Import Rules

### Import a memory if it is:

- useful for future recommendations
- connected to goals, projects, preferences, constraints, routines, or identity
- likely to remain relevant beyond the conversation
- specific enough to guide behavior
- something Nishad would expect the system to remember

### Do not import if it is:

- temporary chatter
- emotional venting with no durable value
- duplicate information
- too vague to be useful
- private/sensitive without clear future utility
- contradicted by newer information

### Summarize instead of importing raw text when:

- a conversation contains many related details
- the exact wording is not important
- the memory is better as a clean statement
- multiple messages point to the same conclusion

### Merge memories when:

- they describe the same fact or preference
- one is a minor wording variation
- newer information updates older information
- several small facts belong under one project or goal

### Archive or supersede when:

- a memory is outdated but historically useful
- a goal changes
- a project is completed
- a preference changes
- a newer memory is more accurate

## Core Memory Object

```ts
type MemoryStatus = "active" | "candidate" | "archived" | "superseded" | "rejected";

type MemoryType =
  | "fact"
  | "preference"
  | "goal"
  | "project"
  | "task_context"
  | "lesson"
  | "decision"
  | "constraint"
  | "routine"
  | "relationship"
  | "identity"
  | "event";

type MemoryDomain =
  | "north_vector"
  | "academic"
  | "medicine"
  | "career"
  | "finance"
  | "health"
  | "family"
  | "relationships"
  | "personal_development"
  | "travel"
  | "technology"
  | "productivity"
  | "style"
  | "legal"
  | "household";

type MemoryRecord = {
  id: string;
  content: string;
  type: MemoryType;
  domains: MemoryDomain[];
  tags: string[];
  confidence: number;
  status: MemoryStatus;
  source: string;
  sourceDate?: string;
  createdAt: string;
  updatedAt: string;
  supersedes?: string[];
  relatedMemoryIds?: string[];
};
