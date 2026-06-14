# NV-003: Environment Management

## Status

Implemented

## Purpose

This note documents the initial environment-management setup for North Vector V1.

## Environment Variables

Required variables are defined in `.env.example`:

```text
DATABASE_URL
AUTH_SECRET
AUTH_URL
```

## Validation

Environment validation is implemented in:

```text
lib/env.ts
```

The application validates required variables using Zod.

Missing or invalid variables should fail clearly during startup or import.

## Rules

- Real secrets must not be committed.
- `.env.example` documents required values.
- Local `.env` files should remain untracked.
- New required variables should be added to both `.env.example` and `lib/env.ts`.

## Outcome

North Vector now has a basic environment-management pattern ready for database and authentication setup.