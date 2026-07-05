# ADR-0103: Use Firebase Cloud Functions for Scheduled Execution

## Status

Accepted

## Date

2026-07-03

## Decision Owner

Nishad

## Reviewers

- Project Owner

## Related Documents

- `10-Implementation/ADRs/ADR-0007-Use-Database-Backed-Jobs-Before-a-Workflow-Platform.md` (superseded in part by this ADR)
- `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`
- `functions/src/index.ts`
- `lib/risk-engine.ts`

## Context

This ADR is written retroactively, after `functions/` (a Firebase Cloud Functions v2, TypeScript project) was built and deployed to run `dailyRiskScan`, a function scheduled to execute once daily that reads tasks and goals from Firestore, evaluates risk using the same `evaluateRisks` logic the dashboard uses, writes the result to a `daily-runs` collection, and conditionally emails a summary.

This is a narrower problem than the one ADR-0007 was written to solve. ADR-0007 addressed general background-job infrastructure for an anticipated set of job types — Calendar sync, embedding generation, daily briefing generation, notification delivery, retention cleanup, backup verification, and others — all backed by a durable, retryable, database-resident job queue. None of those other job types have been built. The actual, current need was narrower: run one function, once a day, unattended, against Firestore, with real (not client-inferred) timestamps.

ADR-0007's proposed mechanism (a PostgreSQL-backed jobs table with a polling worker) is unavailable regardless, since PostgreSQL no longer exists (see ADR-0101).

## Decision Drivers

- needed unattended, scheduled execution independent of the Next.js app being open in a browser
- needed to reuse `lib/risk-engine.ts`'s existing evaluation logic exactly, not reimplement it
- needed real server-assigned timestamps, not a client or function-instance clock
- already on Firebase for Firestore and Auth (see ADR-0101, ADR-0102); Cloud Functions is part of the same platform
- single job today; no current evidence of a need for retries, dead-letter handling, or multiple concurrent job types

## Options Considered

### Option A: Firebase Cloud Functions v2, `onSchedule`

Description:
A TypeScript Cloud Functions project (`functions/`), deployed separately from the Next.js app, exporting a function built with `onSchedule` from `firebase-functions/v2/scheduler`, backed by Cloud Scheduler and Pub/Sub under the hood. Runs on a cron expression with an explicit timezone.

Advantages:
- already on the same platform as Firestore and Auth — no new provider
- `onSchedule` handles the scheduling infrastructure (Cloud Scheduler, Pub/Sub trigger) entirely; nothing to build or operate for the scheduling mechanism itself
- Admin SDK access from within the function, consistent with server-side access elsewhere in the system (see ADR-0101)
- `lib/risk-engine.ts` could be imported directly by both the Next.js app and the Cloud Function once its types were decoupled from Firestore-client-SDK-importing files — avoiding logic duplication was achievable, not just aspirational
- Firestore's `FieldValue.serverTimestamp()` provides a genuinely server-assigned timestamp, resolved by Firestore's backend at write-commit time, directly satisfying the "real timestamp, never cached or inferred" requirement
- manually triggerable for testing via Cloud Scheduler's "Force run," without waiting for the real schedule

Disadvantages:
- no durable job queue, no retry policy, no dead-letter handling, no idempotency-key tracking — if `dailyRiskScan` fails mid-run, there is no automatic retry or record of a failed attempt beyond Cloud Functions' own logs
- one function per scheduled job; there is no shared job-type registry or generic worker the way ADR-0007 envisioned
- code sharing between the Next.js app and `functions/` required real engineering work (a decoupling refactor of `lib/risk-engine.ts`, a bundler-based build step in `functions/` using esbuild) rather than being free

Risks:
- as more scheduled job types are added, each will need its own function and its own hand-built resilience (as was done manually for `dailyRiskScan`'s email step: write succeeds first, notification failure is caught and logged, never allowed to undo or block the write) — there is no shared infrastructure enforcing that pattern automatically
- without a jobs table, there is no queryable history of "was this job supposed to run and didn't" beyond Cloud Functions logs and whatever the function itself writes (here, the `daily-runs` collection serves as an ad hoc run-history log, but that was a deliberate choice in this function, not a platform guarantee)

### Option B: Implement ADR-0007 as Originally Decided (Database-Backed Job Queue)

Description:
Build the PostgreSQL-backed jobs table, worker process, claiming/locking, retry, and dead-letter infrastructure ADR-0007 specifies.

Advantages:
- durable job state, retries, dead-letter handling, idempotency — real infrastructure for the eventual multi-job-type future
- one consistent mechanism for all future job types (Calendar sync, embeddings, notifications, etc.)

Disadvantages:
- requires PostgreSQL, which does not exist (see ADR-0101) — would mean reintroducing the exact infrastructure just removed, for one scheduled function
- significantly more implementation effort than the actual, current need (one daily scheduled read-and-summarize job) justified

Risks:
- building general job-queue infrastructure before a second job type exists risks the same "unused infrastructure" outcome that `db/`/`services/` had

### Option C: Third-Party Workflow Platform (Temporal, Inngest, Trigger.dev)

Description:
Use a managed workflow/scheduling platform, as ADR-0007's Option C also considered and rejected.

Advantages:
- durable workflow state, sophisticated retry and orchestration, without self-hosting

Disadvantages:
- a third cloud platform alongside Firebase, for one scheduled function
- new provider, new credentials, new operational surface

Risks:
- same "infrastructure built ahead of proven need" concern ADR-0007 originally raised about this option

## Decision

North Vector will use Firebase Cloud Functions v2 (`onSchedule`) for scheduled execution, starting with `dailyRiskScan`.

- `functions/` is a separate TypeScript project (its own `package.json`, `tsconfig.json`) from the Next.js app, deployed independently via `firebase deploy --only functions`
- code sharing with the main app is achieved by directly importing specific decoupled, dependency-free files from `lib/` (currently `lib/risk-engine.ts`, `lib/owner.ts`) into `functions/src/`, bundled at build time with esbuild so the deployed function is self-contained
- `dailyRiskScan` runs once daily (`0 6 * * *`, `America/New_York`), fetches tasks and goals from Firestore via the Admin SDK, calls the same `evaluateRisks` function the dashboard uses, and writes one document per run to a `daily-runs` collection using `FieldValue.serverTimestamp()` for the timestamp
- a second function, `sendTestEmail`, exists solely to allow manually verifying the notification path without waiting for a real flagged risk or the next scheduled run

This decision does not implement a general-purpose job queue, retry policy, dead-letter handling, or idempotency-key tracking. It solves the one scheduled-execution need that currently exists.

## Rationale

This ADR is retroactive: the function was already built, deployed, manually triggered, and verified (a real `daily-runs` document with a correct server timestamp was confirmed via direct Admin SDK read-back) by the time this record was written.

`onSchedule` was chosen over rebuilding ADR-0007's database-backed queue because the actual requirement — run one function daily, unattended, with real timestamps — did not need a queue at all. Building general job infrastructure for a future with more job types, before that future has any concrete second job type, would repeat the same mistake ADR-0007's own reasoning warned against for third-party workflow platforms: paying complexity cost before it is earned. The cost of this choice is that resilience (retries, failure visibility, idempotency) had to be hand-built into `dailyRiskScan` itself rather than provided by shared infrastructure — an explicit, accepted tradeoff, not an oversight.

## Consequences

### Positive Consequences

- unattended daily execution, independent of the Next.js app being open, working and verified in production
- no new infrastructure platform introduced
- `evaluateRisks` logic genuinely shared between the dashboard and the scheduled function — not reimplemented, verified by the refactor that removed its Firestore-client-SDK type coupling
- real server-assigned timestamps via `FieldValue.serverTimestamp()`, directly satisfying the original requirement
- manually triggerable for testing via Cloud Scheduler, which was used to verify the whole chain before waiting for the real 6am run

### Negative Consequences

- no retry if `dailyRiskScan` fails mid-run; a failure is visible only in Cloud Functions logs unless the function's own code handles it explicitly
- no dead-letter or failure-alerting mechanism beyond what was hand-built (the email failure path logs a warning but does not page anyone or retry)
- each new scheduled job type will require its own function and its own hand-built resilience pattern; there is no shared "job" abstraction to inherit correctness from

### Operational Consequences

- `functions/` requires its own `npm install`, its own typecheck/build step, and its own deploy command, separate from the Next.js app's `npm run build` — this was a real source of a production deploy failure this session (the root `package.json` build script had been incorrectly chained into `functions/`'s build, which broke Firebase App Hosting's deploy since `functions/` is deliberately excluded from the App Hosting source upload) and was corrected by decoupling the scripts
- secrets used by Cloud Functions (`RESEND_API_KEY`) use Firebase Functions' own Secret Manager-backed mechanism (`firebase functions:secrets:set`), a different mechanism from how the Next.js app's secrets are supplied locally (`.env.local`) or in production (`apphosting.yaml` secret references) — three different secret-injection mechanisms now exist across the system (local `.env.local`, App Hosting `secret:` references, Cloud Functions `defineSecret`), which is worth being aware of when adding new secrets
- billing requires the Blaze plan (confirmed already active before this work began); scheduled functions and their supporting services (Cloud Scheduler, Pub/Sub, Cloud Build for deploys) are not available on the free Spark plan

### Security and Privacy Consequences

- `dailyRiskScan` and `sendTestEmail` run under Cloud Functions' default compute service account, which has Firestore access sufficient for the Admin SDK to work — this was not specifically hardened or reviewed beyond confirming it works
- `sendTestEmail` is an HTTPS-triggered function reachable by anyone on the internet at its Cloud Functions URL; it is gated by the same owner-only Bearer-token verification pattern as the Next.js API routes (`functions/src/require-owner.ts`), not left open

### Data and Migration Consequences

- `daily-runs` is a new Firestore collection, append-only from the function's perspective, with no retention or cleanup policy defined yet — it will grow indefinitely at one document per day unless addressed later

## Implementation Notes

Already implemented and live:
- `functions/package.json`, `functions/tsconfig.json` — separate Node project, esbuild-based build (`--external:firebase-admin --external:firebase-functions`, everything else bundled)
- `functions/src/index.ts` — `dailyRiskScan` (`onSchedule`) and `sendTestEmail` (`onRequest`)
- `functions/src/email.ts` — Resend-based email sending, structured so a send failure never affects data already written
- `functions/src/require-owner.ts` — owner-only Bearer-token verification for HTTPS functions
- `lib/risk-engine.ts` — decoupled from `lib/task-store.ts`/`lib/goal-store.ts` types specifically so it could be imported into `functions/` without pulling in the client Firestore SDK

## Validation Plan

Already validated through real use, not a prospective plan:
- deployed and confirmed both functions appear via `firebase functions:list`
- manually triggered `dailyRiskScan` via Cloud Scheduler's "Force run" and confirmed a real `daily-runs` document appeared with a correct server timestamp, via a direct Admin SDK read-back script
- called `sendTestEmail` via curl with a real Firebase ID token and confirmed both the `{"ok":true}` response and actual email delivery to the inbox

## Rollback or Exit Strategy

If a general job-queue need emerges (multiple job types, retry requirements, cross-job dependencies):
1. this ADR does not need to be reversed to add it — a new decision can introduce a job-queue layer (Firestore-backed, since Postgres is not coming back per ADR-0101) alongside existing scheduled functions
2. existing scheduled functions like `dailyRiskScan` could migrate to be triggered by that queue instead of `onSchedule` directly, without changing their internal logic
3. use a new ADR when that need becomes concrete, rather than building it now

## Residual Risks

- no retry or alerting if a scheduled function fails silently; failure would currently only be noticed by manually checking Cloud Functions logs or noticing the absence of a daily email/document
- `daily-runs` has no retention policy and will grow unbounded
- each future job type repeats the hand-built-resilience pattern rather than inheriting it from shared infrastructure
- three distinct secret-management mechanisms across the system increase the chance of a future secret being wired up incorrectly (as happened once already this session, corrected before deploy)

## Assumptions

- job volume and variety remain low (currently: one scheduled function, one manual-test function)
- Firestore remains available as the backing store for any future job-history or job-queue needs
- Firebase remains the platform choice for the system generally (see ADR-0101, ADR-0102)

## Review Triggers

Revisit this ADR when:
- a second genuinely recurring scheduled job type is needed (Calendar sync, embeddings, etc., as originally listed in ADR-0007)
- a `dailyRiskScan` failure goes unnoticed in practice, motivating real alerting/retry infrastructure
- `daily-runs` growth becomes an operational concern
- cross-job dependencies or ordering requirements emerge that a single independent scheduled function cannot express

## Review Date

Not scheduled — revisit on trigger.

## Outcome

### Expected Outcome

Reliable, unattended daily execution of the risk scan, reusing existing evaluation logic, with real timestamps and a working test path — without introducing new infrastructure platforms.

### Actual Outcome

Live in production, verified end-to-end: scheduled trigger, Firestore Admin SDK reads, shared risk-evaluation logic, server-timestamped write, and conditional email notification, confirmed via both manual trigger and real email delivery.

### Lessons

- decoupling `lib/risk-engine.ts` from its Firestore-client-SDK-importing type dependencies was a small, targeted refactor that fully resolved the code-sharing problem — worth doing early for any other logic that might need to run in both the Next.js app and Cloud Functions later, rather than discovering the coupling at the point a second consumer is needed
- the root `package.json` build script being chained into `functions/`'s build broke a production deploy; scripts invoked by external tooling (App Hosting's buildpack, in this case) need to be kept minimal and not assume sibling directories exist, since deploy targets can have different file-inclusion rules than local development does

### Follow-Up Decision

Keep. Introduce a real job-queue or retry layer only when a second job type or a real observed failure makes the need concrete, not preemptively.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-07-03 | Initial ADR, written retroactively after implementation | Nishad |
