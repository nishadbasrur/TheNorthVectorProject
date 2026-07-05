# ADR-0101: Use Firestore as the Primary Database

## Status

Accepted

## Date

2026-07-03

## Decision Owner

Nishad

## Reviewers

- Project Owner

## Related Documents

- `10-Implementation/ADRs/ADR-0001-Use-PostgreSQL-as-Primary-Database.md` (superseded by this ADR)
- `10-Implementation/ADRs/ADR-0012-Use-a-Managed-PostgreSQL-Provider-for-Production.md` (superseded by this ADR)
- `10-Implementation/ADRs/ADR-0018-Use-Drizzle-ORM-for-Phase-1-Database-Access.md` (superseded by this ADR)
- `10-Implementation/ADRs/ADR-0010-Use-pgvector-for-Initial-Semantic-Retrieval.md` (deprecated; no replacement decided)
- `10-Implementation/ADRs/ADR-0102-Use-Firebase-Auth-for-Identity.md`
- `10-Implementation/ADRs/ADR-0103-Use-Firebase-Cloud-Functions-for-Scheduled-Execution.md`

## Context

This ADR is written retroactively. North Vector's `db/` (Drizzle schema, Neon Postgres client) and `services/` (Drizzle-backed repositories) directories, along with `drizzle/migrations/` and `drizzle.config.ts`, were deleted from the codebase in a single consolidation session and replaced end-to-end with Firestore. By the time this record was written, Firestore was already the live primary store for tasks, goals, projects, decisions, Plaid bank-connection metadata, and scheduled risk-scan output, deployed to production on Firebase App Hosting.

The practical driver was not a database capability gap in Postgres. It was that the project had already committed to Firebase for authentication (see ADR-0102) and Cloud Functions (see ADR-0103), the Postgres/Drizzle layer had accumulated zero real production data or migrations, and the fastest path to a working, deployed, single-user product was to stop operating two separate cloud platforms (a managed Postgres provider plus Firebase) and consolidate on one.

North Vector remains single-user. The canonical objects being stored (tasks, goals, projects, decisions, Plaid items, scheduled-run records) are shallow — few relationships, no deep joins, no requirement for multi-row transactions spanning unrelated object types at the volumes involved so far.

## Decision Drivers

- ecosystem consistency with Firebase Auth and Cloud Functions already in use
- zero additional infrastructure to provision, patch, or back up
- built-in, declarative security rules as the primary authorization boundary
- client SDK usable directly from Next.js pages without a separate API layer for simple CRUD
- Admin SDK available for trusted server code (API routes, Cloud Functions) that must bypass client-facing rules
- low operational overhead for one developer
- willingness to accept weaker relational guarantees given the shallow, single-user data shape actually in use

## Options Considered

### Option A: Firestore

Description:
Use Firestore (Cloud Firestore, native mode) as the sole primary data store, accessed via the Firebase client SDK from the browser and Next.js API routes, and via the Firebase Admin SDK from trusted server code (API routes handling secrets, Cloud Functions).

Advantages:
- already part of the Firebase project backing Auth, Hosting, and Functions — no new provider, no new credentials to manage
- Firestore Security Rules provide declarative, server-enforced authorization independent of application code, which is what actually gates access to owner-only data today
- schemaless documents fit the shallow, evolving shape of tasks/goals/projects/decisions without a migration step per field addition
- Admin SDK cleanly bypasses client rules for privileged server operations (decrypting and storing Plaid tokens, writing scheduled-run results), which was a real requirement this session
- generous free tier and pay-per-use pricing appropriate for single-user volume

Disadvantages:
- no multi-document ACID transactions across arbitrary collections without explicit transaction APIs (unlike Postgres's default transactional semantics)
- no relational joins; denormalization or multiple round-trips are required for related-object queries
- no built-in full-text or vector search (pgvector's role is currently unfilled — see ADR-0010, deprecated with no replacement)
- query capabilities are more restrictive than SQL (no arbitrary WHERE clause combinations without composite indexes)
- schemaless-by-default means schema discipline is entirely an application-layer (TypeScript) convention, not database-enforced

Risks:
- as the object graph grows, denormalization decisions made ad hoc (as in `lib/risk-engine.ts` reading both `tasks` and `goals` independently) may not scale cleanly to more complex cross-collection logic
- no database-level constraint enforcement means a bug in application code can write malformed documents that TypeScript types would have caught only at compile time, not at write time

### Option B: Keep PostgreSQL, Move to a Managed Postgres-Compatible BaaS (e.g. Supabase)

Description:
Replace the Neon/Drizzle combination with a platform bundling managed Postgres, auth, and storage, while keeping SQL and relational guarantees.

Advantages:
- would have preserved ADR-0001's relational and transactional reasoning
- SQL, joins, and pgvector-equivalent extensions remain available
- realtime subscriptions available similarly to Firestore

Disadvantages:
- still a second platform alongside Firebase (Auth and Cloud Functions were already committed to Firebase independently of the database choice)
- would have required re-deciding and re-implementing auth (already working via Firebase Auth) or running two separate identity systems
- migration effort comparable to moving to Firestore, without removing the two-platform operational overhead this decision was trying to eliminate

Risks:
- solves the "Postgres/Drizzle had zero production traction" problem without solving the "two cloud platforms for a single-user app" problem

### Option C: Stay on Neon Postgres + Drizzle, Invest in Making It Production-Ready

Description:
Keep the original ADR-0001/ADR-0018 stack, write real migrations, and finish wiring the `services/` layer to actual routes.

Advantages:
- no rework of the (unused) Drizzle schema already drafted
- preserves the relational/transactional guarantees the original ADRs argued for

Disadvantages:
- the `services/` layer was already found to be dead code with zero real callers by the time this decision was made — most of `db/` and `services/` had never been exercised against real data
- would not resolve the two-platform operational split from Firebase Auth/Functions
- highest short-term implementation cost of the three options, for a benefit (relational integrity) not yet needed at single-user scale

Risks:
- sunk-cost continuation of infrastructure that had already proven to be unused

## Decision

North Vector will use Firestore (Cloud Firestore, native mode) as the primary and sole database.

Firestore will store:
- tasks, goals, projects, decisions (application domain data)
- Plaid bank connection metadata, with access tokens encrypted at rest before write (see `lib/encryption.ts`)
- scheduled risk-scan output (`daily-runs` collection)

Access pattern:
- client-side and simple server-side reads/writes go through typed store modules (`lib/task-store.ts`, `lib/goal-store.ts`, `lib/project-store.ts`, `lib/decision-memory.ts`) using the Firebase client SDK directly — no ORM, no repository abstraction layer
- privileged server-only operations (anything touching Plaid access tokens, or writes from Cloud Functions) use the Firebase Admin SDK via `lib/firebase-admin.ts`, which authenticates via a service account and bypasses Firestore Security Rules entirely
- Firestore Security Rules (`firestore.rules`) are the enforced authorization boundary for all client SDK access — currently a single-owner-email allow rule, with explicit deny-all overrides for collections that must never be reached by a browser session (`plaid_items`, and write access to `daily-runs`)

No ORM or query-builder layer will be introduced. Firestore's own SDKs are used directly.

## Rationale

This ADR is retroactive: Firestore was already live in production, storing real data, by the time this record was written. The rationale below explains why that choice was reasonable, not a pretense that a forward-looking bake-off happened first.

The strongest driver was consistency, not a database capability comparison. Firebase Auth and Firebase Cloud Functions were already decided and implemented independently (see ADR-0102 and ADR-0103); Firestore was the data store already present in that same Firebase project, reachable with the same credentials and the same Admin SDK already being used elsewhere. Introducing or keeping a second cloud platform (Postgres, whether self-hosted, Neon-managed, or Supabase-managed) for the sole purpose of preserving relational guarantees that the actual data shape does not yet require was not justified against the operational cost of running two platforms for a single-user product.

The `db/` and `services/` directories being deleted had accumulated no real usage — `services/decision-service.ts` and `services/approval-service.ts` were found to be dead code with zero callers, and no production data had ever been written through the Postgres path. The switching cost was therefore lower than it would be for a system with real Postgres data and traffic.

## Consequences

### Positive Consequences

- one platform (Firebase) for auth, hosting, functions, and data — one set of credentials, one console, one deployment story
- Firestore Security Rules provide a real, independently-enforced authorization boundary that has already been used to correctly lock down `plaid_items` and deny unauthenticated access (verified empirically multiple times this session)
- no infrastructure to provision or patch; Google operates Firestore entirely
- fast iteration — schema changes are just TypeScript type changes plus a Firestore Security Rules update when access patterns change, no migration files
- Admin SDK bypass-of-rules cleanly separates "trusted server code" from "client-reachable code," which mapped directly onto the real requirement of keeping Plaid access tokens away from any client-reachable path

### Negative Consequences

- no relational joins or multi-collection transactions by default; `lib/risk-engine.ts` and similar logic must fetch multiple collections independently and reconcile in application code
- no server-enforced schema; a malformed write is only caught if application code catches it first
- semantic/vector retrieval (originally pgvector's role, ADR-0010) has no replacement yet — deferred, not solved
- query flexibility is materially lower than SQL; some queries that would be a single Postgres `WHERE` clause require either a composite index or a client-side filter after a broader fetch

### Operational Consequences

- Firestore Security Rules changes now require the same care as a database migration would have — a rules mistake can either lock out legitimate access or (as demonstrated earlier this session, before rules were tightened) leave a collection open to any caller with the public API key
- Firestore has no built-in point-in-time-recovery workflow equivalent to what ADR-0012 assumed Postgres would provide; backup/restore strategy for Firestore is not yet defined
- the Admin SDK service account (`FIREBASE_SERVICE_ACCOUNT_KEY`) is now one of the most sensitive credentials in the system — it bypasses all Firestore Security Rules, not just the ones for a single collection

### Security and Privacy Consequences

- Firestore Security Rules are the sole authorization boundary for client-reachable data; there is no defense-in-depth from a second, application-layer authorization check the way a service layer in front of Drizzle might have provided
- the single-owner-email rule pattern (`request.auth.token.email == "..."`) is simple and has been empirically verified to deny unauthenticated access, but it is a single hardcoded check, not a role or claims-based system — acceptable for single-user Phase 1, would need revisiting for multi-user
- encryption of sensitive values (Plaid access tokens) is handled at the application layer (`lib/encryption.ts`, AES-256-GCM) before Firestore write, since Firestore itself provides encryption at rest but not field-level encryption

### Data and Migration Consequences

- there is no formal migration framework; schema evolution happens by changing TypeScript types and, where needed, backfilling or handling missing fields defensively in application code
- documents do not currently carry a schema version field; adding one would be advisable before the object shapes diverge significantly across historical documents
- no data currently requires migration from the deleted Postgres layer, since it held no real production data

## Implementation Notes

Already implemented and live:
- `lib/firebase.ts` — client SDK initialization (`db` export)
- `lib/firebase-admin.ts` — Admin SDK initialization for server-only trusted code
- `lib/task-store.ts`, `lib/goal-store.ts`, `lib/project-store.ts`, `lib/decision-memory.ts` — typed client-SDK store modules, no ORM
- `firestore.rules` — single-owner-email authorization, explicit deny-all for `plaid_items` and for direct client writes to `daily-runs`
- Admin SDK used from Next.js API routes (`app/api/v1/plaid/*`) and from Cloud Functions (`functions/src/index.ts`)

## Validation Plan

Already validated through real production use rather than a prospective plan:
- CRUD flows for tasks, goals, projects verified via the deployed app
- Firestore Security Rules verified empirically multiple times by attempting unauthenticated reads/writes against live collections and confirming denial
- Admin SDK write path verified via the Plaid token-exchange flow (encrypted token written to `plaid_items`, confirmed unreadable by any client-rules path) and the `dailyRiskScan` Cloud Function (confirmed a real document with server timestamp appears in `daily-runs` after a manual trigger)

## Rollback or Exit Strategy

Firestore data can be exported via Google Cloud's managed export/import tooling or read out programmatically via the Admin SDK (as already demonstrated by ad hoc verification scripts used this session).

If Firestore proves insufficient:
1. export existing collections
2. select a replacement store (relational or otherwise) informed by actual measured limitations, not the original hypothetical ones
3. reintroduce a data-access layer behind the existing typed store module boundaries (`lib/*-store.ts`), which already isolate calling code from the underlying SDK
4. migrate collection by collection, since store modules are already separated by domain object
5. use a superseding ADR

The typed store module pattern already in place (one file per collection, exposing typed functions rather than exposing the SDK directly to callers) reduces the blast radius of a future migration, even though it is not a formal repository/ORM abstraction.

## Residual Risks

- no relational integrity enforcement; cross-collection consistency bugs are possible and would only be caught by application logic or tests, not the database
- no defined backup/restore or disaster-recovery process for Firestore data
- security rules are the single point of authorization enforcement with no independent second layer
- semantic/vector retrieval has no decided path forward (ADR-0010 deprecated, unresolved)
- documents have no schema version field, which will make future breaking schema changes harder to reason about

## Assumptions

- North Vector remains single-user through the period this ADR governs
- data volumes remain well within Firestore's standard operational envelope (no evidence otherwise so far)
- the object graph remains shallow enough that client-side reconciliation across collections (as in the risk engine) remains tractable
- Firebase remains the identity and function-hosting platform (see ADR-0102, ADR-0103), so consolidating the database onto the same platform continues to make sense

## Review Triggers

Revisit this ADR when:
- multi-user support is introduced (the single-owner-email rule model will not scale to that)
- cross-collection query or transaction needs grow beyond what client-side reconciliation can handle correctly
- a semantic/vector retrieval requirement becomes concrete (ADR-0010's deprecated status should be resolved at that point, not before)
- a real backup/restore or disaster-recovery requirement emerges
- Firestore Security Rules complexity grows to the point where a second, application-layer authorization check becomes warranted

## Review Date

Not scheduled — revisit on trigger.

## Outcome

### Expected Outcome

A single-platform, low-operational-overhead data store consistent with the already-decided Firebase Auth and Cloud Functions choices, sufficient for single-user Phase 1 data volumes and shapes.

### Actual Outcome

Live in production. Verified working for: task/goal/project/decision CRUD from the Next.js app; encrypted Plaid access token storage via Admin SDK, confirmed unreachable via client rules; scheduled Cloud Function writes with server-assigned timestamps, confirmed via manual trigger and direct Admin SDK read-back.

### Lessons

- deleting an unused infrastructure layer (Postgres/Drizzle, zero production data) was materially cheaper than migrating a live one would have been — the earlier this kind of consolidation happens, the less it costs
- Firestore Security Rules mistakes are easy to make silently; this session both discovered an accidentally-open collection and later had to correct a rules change that would have denied the intended owner along with everyone else — rules changes now warrant the same review discipline a schema migration would get
- documenting this decision after the fact, rather than before, meant the "Options Considered" section is necessarily reconstructed rather than contemporaneous; future infrastructure-level decisions of this size would benefit from a lightweight ADR at decision time rather than a full one after the fact

### Follow-Up Decision

Keep. Resolve ADR-0010's deprecated status with a real decision once semantic/vector retrieval becomes a concrete requirement.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-07-03 | Initial ADR, written retroactively after implementation | Nishad |
