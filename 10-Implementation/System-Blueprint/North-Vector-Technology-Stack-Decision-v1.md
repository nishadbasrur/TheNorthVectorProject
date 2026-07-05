# North Vector Technology Stack Decision v1.0

## Status

**Superseded in part as of 2026-07-03.** The Database, Database Layer, Authentication, and Deployment rows below no longer reflect what's actually running. See `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`, `ADR-0102-Use-Firebase-Auth-for-Identity.md`, and `ADR-0103-Use-Firebase-Cloud-Functions-for-Scheduled-Execution.md` for the current decisions and their rationale. This document is left in place with corrections inline rather than rewritten, per this project's ADR-supersession convention.

## Purpose

This document confirms the initial technology stack for North Vector V1.

The goal is to make the first implementation path clear enough to begin coding without reopening foundational technology choices on every ticket.

---

# Decision

Originally decided:

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

Actual, as of 2026-07-03:

```text
Frontend: Next.js, React, TypeScript
Backend: Next.js server-side TypeScript + Firebase Cloud Functions (TypeScript, separate deploy)
Database: Firestore (Cloud Firestore, native mode)
Database Layer: none — direct Firestore SDK access via typed store modules, no ORM
Authentication: Firebase Auth (email/password)
Styling: Tailwind CSS (adopted as planned) plus hand-rolled custom-property-based classes for the design system
UI Components: hand-rolled (shadcn/ui config/components never present — not adopted)
Deployment: Firebase App Hosting (not Vercel — never adopted)
Version Control: GitHub
```

---

# Rationale

## Next.js, React, and TypeScript

Next.js provides a mature full-stack React framework with strong TypeScript support, simple routing, server-side capabilities, and a straightforward deployment path.

Using one TypeScript codebase across frontend and backend reduces context switching and makes the early build faster.

## PostgreSQL (superseded — see Firestore below)

North Vector was originally assessed as fundamentally relational, given users, memories, goals, projects, tasks, plans, approvals, executions, reviews, and many relationships between them. PostgreSQL was a strong fit for that domain model on paper.

In practice, the `db/`/`services/` Postgres implementation accumulated zero production data or callers before it was deleted. When Firebase Auth and Firebase Cloud Functions were adopted for other reasons (see below), consolidating the database onto the same platform (Firestore) removed the operational cost of running two cloud platforms for a single-user product. See `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md` for the full rationale and accepted tradeoffs (no relational joins, no server-enforced schema).

## Drizzle (superseded)

Drizzle provided a type-safe, relatively lightweight database layer for the PostgreSQL era. With Postgres gone, there is no database for Drizzle to access. Firestore is used directly via its own SDKs, with no ORM layer — see ADR-0101 and `10-Implementation/ADRs/ADR-0018-Use-Drizzle-ORM-for-Phase-1-Database-Access.md`.

## Auth.js (never implemented)

Auth.js (`next-auth`, `@auth/core`) remained a listed dependency but was never actually wired up — no login flow existed until Firebase Auth was implemented directly (see `10-Implementation/ADRs/ADR-0102-Use-Firebase-Auth-for-Identity.md`). Firebase Auth was chosen once Firestore Security Rules needed a real identity to check against, and Firebase Auth was already available in the same Firebase project as Firestore.

## Tailwind CSS and shadcn/ui

Tailwind was adopted as planned and remains in use. shadcn/ui was not — the UI ended up as hand-rolled components using Tailwind plus custom-property-based classes, not shadcn's component library.

## Vercel (superseded)

Vercel was the originally planned deployment path. The application deploys to Firebase App Hosting instead, once Firestore and Firebase Auth were adopted — running the Next.js app on the same platform as the rest of the backend removed a reason to keep Vercel as a separate hosting provider. See `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`.

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
- NV-004: Configure Database Connection (superseded — became Firestore client/Admin SDK initialization, not a Postgres connection string)
- NV-005: Configure Migration Tooling (moot — Firestore has no migration framework; see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`)

---

# Outcome

North Vector V1 has a confirmed implementation stack.

The project can now proceed into runnable application setup.