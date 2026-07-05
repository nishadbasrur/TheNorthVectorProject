# North Vector Initial Repository Structure v1.0

## Status

**Superseded as of 2026-07-03.** `db/`, `drizzle/`, `server/`, and `services/` as described below were deleted entirely (the Postgres/Drizzle layer they held had accumulated no real production data or callers) and never replaced with equivalents in those exact shapes. See `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`. Left in place with corrections inline rather than rewritten, per this project's ADR-supersession convention.

## Purpose

This document defines the initial source-code structure for North Vector V1.

The goal is to give the implementation a clean home before coding begins.

---

# Recommended Structure (as originally planned)

```text
/
├── app/
├── components/
├── db/
├── drizzle/
├── lib/
├── server/
├── services/
├── types/
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
└── .env.example
```

# Actual Structure (as of 2026-07-03)

```text
/
├── app/                  # unchanged — Next.js routes, including app/api/v1/*
├── components/           # unchanged in spirit — auth/, layout/, domain/ (not ui/dashboard/forms as planned)
├── lib/                  # absorbed db/'s and services/' roles — see below
├── functions/            # new — separate Firebase Cloud Functions project, not in original plan
├── public/
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── firebase.json         # new — Firebase project config (Firestore rules, App Hosting, Functions)
├── firestore.rules       # new — Firestore Security Rules, the actual authorization boundary
└── .env.example
```

`db/`, `drizzle/`, `drizzle.config.ts`, `server/`, `services/`, and `types/` do not exist. There is no dedicated `types/` directory — types are colocated with the module that defines them (for example, `TaskRecord` lives in `lib/task-store.ts`, not a shared `types/domain.ts`).

---

# Directory Responsibilities

## app/

Contains Next.js application routes, layouts, pages, and route handlers.

Expected areas:

```text
app/
├── api/
├── dashboard/
├── memories/
├── goals/
├── projects/
├── tasks/
├── plans/
├── decisions/
└── reviews/
```

---

## components/

Contains reusable React UI components.

Expected areas:

```text
components/
├── ui/
├── layout/
├── dashboard/
├── forms/
└── domain/
```

---

## db/ (deleted, never populated with real data)

Was planned to contain database connection and schema definitions. Deleted along with the rest of the Postgres/Drizzle layer — see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`.

---

## drizzle/ (deleted, never populated with real migrations)

Was planned to contain database migration files. Deleted along with `db/`. Firestore has no migration framework; see ADR-0101.

---

## lib/ (actual scope is much larger than originally planned)

In practice, `lib/` absorbed the responsibilities originally split across `db/`, `server/`, and `services/`, in addition to shared utilities. Actual contents include:

```text
lib/
├── firebase.ts            # client SDK init
├── firebase-admin.ts      # Admin SDK init, trusted server-only code
├── task-store.ts          # typed Firestore store module, one per collection
├── goal-store.ts
├── project-store.ts
├── decision-memory.ts
├── memory-store.ts
├── owner.ts                # shared owner-email constant
├── require-owner.ts        # server-side Bearer-token verification
├── risk-engine.ts          # pure rule logic, no Firestore dependency (deliberately, so it's importable from functions/)
├── encryption.ts           # AES-256-GCM for Plaid access tokens at rest
├── plaid.ts                # server-only Plaid client
├── decision-engine.ts
├── memory-retrieval.ts
├── env.ts                  # now orphaned — only db/index.ts imported it, and that's gone
└── ... other utilities
```

---

## server/ (never created)

The `server/auth/queries/actions/chief` split was never implemented. Backend logic lives in `app/api/v1/*` route handlers and `lib/`.

---

## services/ (deleted, mostly never had real callers)

Was implemented briefly as Drizzle-backed repositories (`user-service.ts`, `memory-service.ts`, etc.), then deleted with the rest of the Postgres/Drizzle layer. `decision-service.ts` and `approval-service.ts` were found to have zero callers anywhere in the app before deletion. `task-service.ts`, `goal-service.ts`, and `project-service.ts` did back live API routes (`app/api/v1/tasks`, `/goals`, `/projects`), which were rewired to the Firestore-backed `lib/*-store.ts` modules instead of being left broken. The other routes that depended on deleted services (`plans`, `me`, `executions`, `memories`, `reviews`) were stubbed to `501 Not Implemented`.

---

## functions/ (new — not in the original plan)

A separate Firebase Cloud Functions v2 project (own `package.json`, `tsconfig.json`, esbuild-based build), deployed independently via `firebase deploy --only functions`. See `10-Implementation/ADRs/ADR-0103-Use-Firebase-Cloud-Functions-for-Scheduled-Execution.md`.

```text
functions/
├── src/
│   ├── index.ts       # dailyRiskScan (onSchedule), sendTestEmail (onRequest)
│   ├── email.ts
│   └── require-owner.ts
├── package.json
└── tsconfig.json
```

---

## types/

Contains shared TypeScript types.

Expected files:

```text
types/
├── domain.ts
├── api.ts
└── status.ts
```

---

## public/

Contains static assets.

---

# Naming Principles

Use clear, boring names.

Prefer:

```text
goal-service.ts
project-service.ts
```

Avoid clever abstractions too early.

---

# V1 Simplicity Rule

Do not create folders for systems that do not exist yet.

Avoid premature directories for:

- agents
- workflows
- integrations
- event bus
- provider adapters
- embeddings
- simulations

Those can be added when implementation reaches that stage.

---

# Implementation Impact

This structure supports:

- NV-002: Create Runnable App Skeleton
- NV-003: Configure Environment Management
- NV-004: Configure Database Connection (became Firestore/Admin SDK initialization, not Postgres)
- NV-005: Configure Migration Tooling (moot for Firestore)
- NV-009 through NV-018: Core Services (implemented in `lib/`, not `services/`)
- NV-019 through NV-025: API Routes
- NV-026 through NV-029: Frontend Screens

---

# Outcome

North Vector now has an initial repository structure for implementation.

The project is ready to begin coding with NV-002.