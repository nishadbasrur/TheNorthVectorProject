# North Vector Technology Stack Decision v1.0

## Purpose

This document confirms the initial technology stack for North Vector V1.

The goal is to make the first implementation path clear enough to begin coding without reopening foundational technology choices on every ticket.

---

# Decision

North Vector V1 will use the following stack:

```text
Frontend: Next.js, React, TypeScript
Backend: Next.js server-side TypeScript
Database: PostgreSQL
Database Layer: Drizzle
Authentication: Auth.js
Styling: Tailwind CSS
UI Components: shadcn/ui
Deployment: Vercel initially
Version Control: GitHub
```

---

# Rationale

## Next.js, React, and TypeScript

Next.js provides a mature full-stack React framework with strong TypeScript support, simple routing, server-side capabilities, and a straightforward deployment path.

Using one TypeScript codebase across frontend and backend reduces context switching and makes the early build faster.

## PostgreSQL

North Vector is fundamentally relational.

The system contains users, memories, goals, projects, tasks, plans, approvals, executions, reviews, and many relationships between them.

PostgreSQL is a strong fit for this domain model.

## Drizzle

Drizzle provides a type-safe and relatively lightweight database layer.

It keeps schema definitions close to the code while avoiding unnecessary database abstraction complexity.

## Auth.js

Auth.js keeps authentication open-source and compatible with the Next.js ecosystem.

This avoids early vendor lock-in while leaving room for future authentication changes.

## Tailwind CSS and shadcn/ui

Tailwind and shadcn/ui allow rapid development of a clean, modern interface without spending early project energy building a design system from scratch.

## Vercel

Vercel is the fastest initial deployment path for a Next.js application.

Deployment strategy may evolve later if infrastructure requirements change.

---

# Non-Goals

This decision does not attempt to define:

- production scaling architecture
- mobile app framework
- advanced background job infrastructure
- external integration hosting
- multi-agent orchestration runtime
- long-term cloud provider strategy

Those decisions can be made later when the product requires them.

---

# Consequences

## Positive

- fast path to working software
- strong TypeScript consistency
- mature ecosystem
- simple deployment path
- good alignment with V1 scope
- low friction for AI-assisted development

## Negative

- Next.js server routes may not be ideal forever
- Vercel may not be the final infrastructure platform
- Auth.js setup can become complex
- background processing may require future infrastructure additions

---

# Implementation Impact

This decision unblocks:

- NV-002: Create Runnable App Skeleton
- NV-003: Configure Environment Management
- NV-004: Configure Database Connection
- NV-005: Configure Migration Tooling

---

# Outcome

North Vector V1 has a confirmed implementation stack.

The project can now proceed into runnable application setup.