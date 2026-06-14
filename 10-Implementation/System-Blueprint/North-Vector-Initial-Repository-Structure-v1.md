# North Vector Initial Repository Structure v1.0

## Purpose

This document defines the initial source-code structure for North Vector V1.

The goal is to give the implementation a clean home before coding begins.

---

# Recommended Structure

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

## db/

Contains database connection and schema definitions.

Expected files:

```text
db/
├── index.ts
├── schema.ts
└── relations.ts
```

---

## drizzle/

Contains database migration files and migration metadata.

Expected areas:

```text
drizzle/
└── migrations/
```

---

## lib/

Contains shared utility code.

Examples:

```text
lib/
├── env.ts
├── dates.ts
├── validation.ts
└── constants.ts
```

---

## server/

Contains backend-only application logic.

Expected areas:

```text
server/
├── auth/
├── queries/
├── actions/
└── chief/
```

---

## services/

Contains domain services.

Expected files:

```text
services/
├── user-service.ts
├── memory-service.ts
├── goal-service.ts
├── project-service.ts
├── task-service.ts
├── plan-service.ts
├── decision-service.ts
├── approval-service.ts
├── execution-service.ts
└── review-service.ts
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
- NV-004: Configure Database Connection
- NV-005: Configure Migration Tooling
- NV-009 through NV-018: Core Services
- NV-019 through NV-025: API Routes
- NV-026 through NV-029: Frontend Screens

---

# Outcome

North Vector now has an initial repository structure for implementation.

The project is ready to begin coding with NV-002.