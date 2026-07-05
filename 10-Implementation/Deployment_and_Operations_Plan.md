# Deployment and Operations Plan v1.0

## Status

**Partially superseded as of 2026-07-03.** The database/worker architecture sections below (Deployment Architecture, Database Deployment, and the Phase 1 Implementation checklist's "managed PostgreSQL"/"separate worker deployment" items) describe the original Postgres-plus-separate-worker plan, which was never built that way — see corrections inline and `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md` and `ADR-0103-Use-Firebase-Cloud-Functions-for-Scheduled-Execution.md`.

Separately, and out of scope for this correction pass: most of this document's broader operational maturity (staging environment, structured logging, error monitoring, health checks, encrypted daily backups, restore testing, feature flags, incident runbooks) was never built regardless of database choice — there is one production environment, no staging, no backup/restore process, and no formal monitoring beyond Firebase/Google Cloud's own default logging. That's a real operational gap worth its own review, not something to paper over by marking this document "done."

## Purpose

This document defines how North Vector should be deployed, monitored, operated, maintained, recovered, and updated in production.

The Deployment and Operations Plan exists to ensure that a working development system becomes a reliable personal operating system rather than a fragile demo.

Its purpose is not to imitate enterprise operations before the product needs them.

Its purpose is to create a small, disciplined operating model that protects availability, data integrity, privacy, and trust.

## Core Principle

Deployment is not the end of development.

Every release should preserve the ability to observe, verify, pause, recover, and roll back the system.

## Primary Objectives

The plan should help answer:
- How should North Vector move from staging to production?
- Which checks must pass before release?
- How should database migrations be handled?
- What should be monitored in production?
- How should incidents and outages be handled?
- How should backups and restores work operationally?
- How can the system degrade safely when providers fail?
- How should releases be rolled back?

## Operational Scope

The plan should cover:
- Application Deployment
- Worker Deployment
- Database Operations
- Schema Migrations
- Environment Configuration
- Secret Management
- Monitoring
- Logging
- Alerting
- Backups
- Restore Testing
- Incident Response
- Rollback
- Integration Health
- Cost Monitoring
- Capacity Planning
- Maintenance Windows
- Runbooks

## Environments

North Vector should maintain:
- Local Development
- Test
- Staging
- Production

Each environment should use separate:
- databases
- secrets
- OAuth credentials
- storage buckets
- model-provider keys
- observability configuration

Production data should not be copied into development or test environments by default.

## Environment Promotion Flow

Recommended flow:

Local Development
↓
Automated Test
↓
Staging
↓
Release Validation
↓
Production
↓
Post-Deployment Verification

No release should bypass staging for ordinary product changes.

## Deployment Architecture (as originally planned)

A practical Phase 1 deployment may include:
- Web application service
- Background worker service
- Managed PostgreSQL database
- Object storage
- Authentication provider
- Model provider
- Google Calendar integration
- Monitoring and error tracking

The initial architecture should remain a modular monolith, not a distributed microservice system.

## Deployment Architecture (actual, 2026-07-03)

- Next.js application on Firebase App Hosting (not Vercel/Render/Fly.io/Railway — those were never adopted)
- No separate always-running worker service. Background execution is one scheduled Firebase Cloud Function (`dailyRiskScan`, `functions/`), triggered on a cron schedule rather than a long-running process — see `10-Implementation/ADRs/ADR-0103-Use-Firebase-Cloud-Functions-for-Scheduled-Execution.md`
- Firestore as the database, part of the same Firebase project as Auth and Functions — see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`
- Object storage: not implemented — no export/upload/backup-artifact storage exists
- Authentication provider: Firebase Auth (see ADR-0102)
- Model provider: not implemented — there is no AI/LLM integration in the deployed app; the "risk scan" is deterministic rule logic (`lib/risk-engine.ts`), not model-driven
- Google Calendar integration: not implemented
- Monitoring and error tracking: not implemented beyond Firebase/Google Cloud's own default logging (no Sentry or equivalent)

## Web Application Deployment

The web application should host:
- interface
- authenticated API routes
- server-rendered views
- session handling
- low-latency application logic

Actual: Firebase App Hosting. The "possible hosting platforms" below were the original options considered; none were adopted.

Possible hosting platforms (as originally considered):
- Vercel
- Render
- Fly.io
- Railway
- another reputable managed platform

## Worker Deployment

**Not built as originally scoped.** There is no separate, always-running worker service. The one piece of background execution that exists (`dailyRiskScan`) runs as a Firebase Cloud Function on a cron schedule, not a persistent worker process. None of the other listed responsibilities (Calendar sync, automation triggers, embedding generation, notification delivery beyond the risk-scan email, backup verification) have been built. See ADR-0103.

Originally scoped, the worker should process:
- synchronization jobs
- automation triggers
- briefing generation
- retention cleanup
- embedding generation
- notification delivery
- backup verification jobs

## Database Deployment

**Superseded.** Firestore, not managed PostgreSQL — see ADR-0101. Firestore provides encryption at rest and TLS by default. Automated backups, point-in-time recovery, and tested restoration have not been set up for this project (a real gap, not yet addressed regardless of database choice). Access control is enforced via Firestore Security Rules (`firestore.rules`) rather than network-level database access control.

Originally scoped: use managed PostgreSQL with:
- encryption at rest
- TLS connections
- automated backups
- point-in-time recovery where practical
- access control
- monitoring
- tested restoration

Direct public database exposure should be avoided. (This principle still holds — Firestore Security Rules are what currently enforce it.)

## Storage Deployment

Object storage may hold:
- exports
- temporary uploads
- backup artifacts
- imported files where local copies are required

Storage should enforce:
- private buckets by default
- short-lived signed access
- encryption
- lifecycle rules
- access logs where practical

## Domain and TLS

Production should use:
- a dedicated HTTPS domain
- valid TLS certificate
- secure cookies
- strict transport security when stable
- redirect from HTTP to HTTPS

## Release Types

### Standard Release

Ordinary reviewed product changes.

### High-Risk Release

Includes:
- schema migration
- authentication change
- authorization change
- Restricted data
- external write capability
- deletion behavior
- secret or key rotation

### Emergency Hotfix

Narrow urgent fix for a production issue.

### Configuration-Only Release

Changes feature flags, environment settings, or provider configuration.

Configuration changes should still be audited.

## Standard Release Workflow

1. Merge reviewed code to main.
2. Run complete CI checks.
3. Deploy to staging.
4. Apply staging migrations.
5. Run automated smoke tests.
6. Run required manual validation.
7. Review security and privacy gates.
8. Create backup checkpoint if needed.
9. Approve production release.
10. Deploy application and worker.
11. Apply production migration in the correct order.
12. Run production smoke tests.
13. Monitor errors, latency, and integration health.
14. Close or roll back release.

## Release Approval

Phase 1 production release approval may be performed by Nishad as project owner.

The approval should confirm:
- tests passed
- staging behavior verified
- migration reviewed
- rollback understood
- no unresolved Critical finding exists
- current backup is valid

## Pre-Deployment Checklist

Before production deployment, verify:
- CI passed
- secret scan passed
- dependency scan reviewed
- database migration tested
- environment variables validated
- feature flags configured
- audit behavior present
- provider scopes unchanged or approved
- release notes prepared
- rollback path available

## Database Migration Order

Recommended safe order:
1. Add backward-compatible schema.
2. Deploy application code able to read old and new schema.
3. Backfill data if required.
4. Validate backfill.
5. Switch reads and writes.
6. Remove obsolete fields in a later release.

Avoid combining destructive schema removal and dependent application changes into one untested step.

## Migration Locking

High-impact migrations should:
- prevent conflicting writes when necessary
- run in bounded batches
- expose progress
- support resume from checkpoint
- have a timeout and failure policy

## Feature Flags

Use feature flags for:
- staged rollout
- experimental retrieval strategies
- new integrations
- automation activation
- emergency disablement

Each flag should define:
- owner
- purpose
- default state
- environments
- review date
- removal plan

## Canary Release

For higher-risk changes, the system may use a limited canary rollout.

Because Phase 1 is single-user, canary behavior may mean:
- feature enabled only in staging
- feature enabled only for selected sessions
- read-only mode before write mode
- dry-run automation before activation

## Blue-Green or Parallel Deployment

Advanced parallel deployment may be added later when downtime or rollback risk justifies it.

Phase 1 may rely on managed platform version rollback and backward-compatible migrations.

## Post-Deployment Smoke Tests

Verify:
- sign in
- trusted session
- canonical object read
- memory retrieval
- Chief session creation
- audit event creation
- Calendar synchronization
- background worker activity
- pending-action confirmation
- no obvious error spike

## Release Verification Window

After deployment, monitor closely for a defined window.

Suggested Phase 1:
- first 30 minutes for immediate issues
- first 24 hours for delayed jobs and integration behavior

## Release Statuses

Suggested statuses:
- Planned
- Staging
- Ready
- Deploying
- Verifying
- Successful
- Degraded
- Rolled Back
- Failed

## Rollback Triggers

Rollback or disable the release when:
- authentication fails
- authorization is weakened
- external actions execute incorrectly
- deletion or data integrity fails
- Critical error rate rises
- database migration corrupts state
- provider synchronization duplicates objects
- restricted data appears publicly

## Rollback Options

Possible rollback actions:
- revert application version
- disable feature flag
- pause worker
- pause one automation
- disconnect integration
- restore prior database state
- run compensating migration

## Rollback Decision

The system should choose between:
- application rollback
- database rollback
- roll-forward fix
- feature disablement
- full service pause

A database rollback should not occur blindly if new valid writes have occurred after migration.

## Rollback Verification

After rollback, verify:
- prior application works
- database remains consistent
- queued jobs are safe
- duplicate writes did not occur
- audit records remain intact
- revoked permissions remain revoked

## Operational Health Model

North Vector should monitor:
- Application Health
- Worker Health
- Database Health
- Integration Health
- Automation Health
- Security Health
- Backup Health
- Data Quality Health

## Service Health States

Suggested states:
- Healthy
- Degraded
- Impaired
- Unavailable
- Paused
- Recovering

## Application Monitoring

Monitor:
- request success rate
- error rate
- latency
- authentication failures
- authorization denials
- active sessions
- deployment version

## Worker Monitoring

Monitor:
- queue depth
- oldest pending job
- run success
- retry count
- dead-letter jobs
- job duration
- last successful run

## Database Monitoring

Monitor:
- connection count
- query latency
- storage use
- replication or backup status
- lock contention
- failed migrations
- long-running queries

## Integration Monitoring

For each integration, monitor:
- authentication status
- permission scope
- last sync
- sync lag
- provider errors
- rate limits
- conflict count
- stale data count

## Automation Monitoring

Monitor:
- last run
- next run
- success rate
- duplicate suppression
- retries
- uncertain outcomes
- automatic pause
- approval backlog

## Security Monitoring

Monitor:
- failed logins
- unknown devices
- session revocations
- permission changes
- secret-detection failures
- suspicious export or deletion
- audit-log gaps

## Backup Monitoring

Monitor:
- last backup
- backup status
- checksum verification
- storage location
- expiration
- last restore test
- deletion replay readiness

## Data Quality Monitoring

Monitor:
- stale critical records
- unresolved conflicts
- duplicate objects
- broken provenance
- failed deletion propagation
- orphaned relationships

## Observability Tools

Possible tooling:
- Sentry for errors
- OpenTelemetry for traces and metrics
- managed platform logs
- database-provider monitoring
- custom operational dashboard

Observability providers should receive sanitized data only.

## Structured Logging

Operational logs should include:
- timestamp
- environment
- release version
- request or run ID
- component
- action
- status
- duration
- error code

Logs should not include:
- secrets
- raw Restricted records
- full prompts
- full message bodies
- financial account numbers
- health details

## Audit Logging

Audit logs should separately record:
- permission changes
- external writes
- memory changes
- deletion
- export
- security events
- incident actions
- release and configuration changes where useful

## Alerting Principles

Alerts should be:
- actionable
- deduplicated
- severity-based
- quiet for routine success
- tied to runbooks

## Alert Severity

### Informational

No immediate action required.

### Low

Minor degradation with workaround.

### Moderate

Meaningful feature or integration impairment.

### High

Core workflow, sensitive data, or external action affected.

### Critical

Unauthorized access, data corruption, broad outage, or irreversible harm risk.

## Alert Examples

- worker has not completed a job in one hour
- Calendar token expired
- backup failed
- duplicate event creation detected
- deletion propagation failed
- authentication error spike
- database storage nearly full

## Alert Routing

Phase 1 alerts may route to:
- operations dashboard
- email
- push notification

Critical alerts should use more than one channel when practical.

## On-Call Model

Phase 1 has one owner: Nishad.

The operating model should still define:
- which alerts require immediate action
- which can wait
- where runbooks live
- how to pause dangerous behavior quickly

## Maintenance Windows

Planned maintenance should be used for:
- high-risk migrations
- provider reconfiguration
- key rotation
- backup restoration tests

Maintenance should preserve a read-only or clearly unavailable state rather than inconsistent partial behavior.

## Degraded Mode

When dependencies fail, North Vector should degrade gracefully.

Examples:
- model provider unavailable: local object views remain available
- Calendar unavailable: show last sync and stale warning
- worker unavailable: manual interaction remains available
- semantic retrieval unavailable: use exact and structured retrieval
- notification provider unavailable: dashboard notices remain

## Read-Only Safe Mode

The system should support a read-only safe mode when:
- authorization status is uncertain
- audit logging fails
- database migration is incomplete
- provider state is inconsistent
- security incident is active

## Operational Pause Controls

Nishad should be able to pause:
- all automations
- one automation
- all external writes
- one integration
- background workers
- notification delivery

Pause controls should be accessible even during partial outages.

## Incident Response Integration

Operational incidents should create incident records when:
- service outage is prolonged
- data integrity is uncertain
- external action may be duplicated
- privacy or security is affected
- recovery requires manual intervention

## Incident Communication

User-facing status should state:
- what is unavailable
- what still works
- whether data is safe
- whether actions are delayed
- what is being done

## Backup Operations

Recommended Phase 1 backup operations:
- daily encrypted database backup
- pre-migration snapshot
- periodic portable export
- backup verification after creation
- monthly selective restore
- quarterly full isolated restore

## Restore Operations

Restoration should:
1. require high-assurance authorization
2. select a trusted backup
3. restore into isolation when possible
4. replay deletion and revocation records
5. verify data and permissions
6. rebuild indexes
7. test core workflows
8. cut over deliberately

## Recovery Point Objective

Suggested initial targets:
- current operational data: less than 24 hours of potential loss
- critical commitments and Calendar writes: lower tolerance through transaction logs or frequent backups where practical
- archived historical data: higher tolerance

## Recovery Time Objective

Suggested initial target:
- restore minimum viable service within one day for major failure

As North Vector becomes more operationally important, this target should improve.

## Minimum Viable Service

During recovery, prioritize:
1. authentication
2. security and audit
3. canonical objects
4. current goals, tasks, commitments, and events
5. memory retrieval
6. Calendar read
7. external writes
8. automation

## Secret Rotation Operations

Secrets should be rotated when:
- exposed
- employee or collaborator access changes in the future
- provider recommends rotation
- incident occurs
- key age exceeds policy

Rotation should verify old secret rejection and new secret operation.

## Certificate and Domain Operations

Monitor:
- certificate expiration
- DNS configuration
- domain ownership
- secure redirect behavior

Managed certificate renewal is preferred.

## Dependency Operations

Regularly review:
- vulnerability alerts
- unsupported versions
- major provider deprecations
- API changes
- runtime support windows

## Provider Change Management

Before changing providers:
- compare permissions
- compare data handling
- test adapter
- export current state
- plan rollback
- update threat and privacy reviews

## Cost Monitoring

Monitor:
- hosting
- database
- model usage
- embeddings
- storage
- backups
- monitoring
- provider APIs

## Cost Alerts

Alert when:
- monthly spend exceeds budget threshold
- model cost spikes unexpectedly
- storage grows unusually
- background job volume increases sharply

## Capacity Planning

Phase 1 capacity planning should focus on:
- one user
- growing object count
- long audit history
- increasing embeddings
- frequent Calendar synchronization
- more automation runs

Scale only after measurement shows a real bottleneck.

## Data Retention Operations

Scheduled operations should:
- expire temporary state
- clean caches
- review candidate memory
- archive completed objects
- delete expired exports
- enforce log retention
- verify deletion propagation

## Job Scheduling

Operational jobs should define:
- schedule
- owner
- timeout
- retry policy
- idempotency
- alert threshold
- runbook

## Dead-Letter Handling

Failed jobs that exceed retry limits should enter a dead-letter state.

The dashboard should show:
- job type
- object
- last error
- attempts
- recommended action

## Queue Recovery

After outage:
- inspect queue age
- discard expired low-value jobs
- revalidate approvals
- refresh provider state
- avoid replaying stale destructive actions

## Time and Timezone Operations

Production should:
- store timestamps in UTC
- preserve original timezone where relevant
- display in user-local timezone
- test daylight-saving transitions
- ensure scheduled local-time routines remain stable

## Runbooks

Initial operational runbooks should cover:
- application deployment failure
- worker outage
- database connection failure
- migration failure
- Calendar token expiration
- Calendar duplicate event risk
- model-provider outage
- secret exposure
- backup failure
- restore procedure
- session revocation
- deletion propagation failure
- audit-log failure
- excessive cost spike

## Runbook Structure

Each runbook should contain:
- symptoms
- severity
- immediate containment
- diagnosis steps
- recovery steps
- verification
- rollback
- escalation
- follow-up work

## Operational Dashboard

The dashboard should show:
- current release
- application health
- worker health
- database health
- integration status
- automation status
- pending approvals
- backup status
- recent incidents
- cost trend
- upcoming maintenance

## Release History

Each production release should record:
- release ID
- commit SHA
- deployed_at
- deployed_by
- migrations
- feature flags
- release notes
- verification result
- rollback status

## Configuration History

Configuration changes should record:
- field changed
- old and new values or redacted summary
- actor
- reason
- timestamp
- affected environment

## Operational Testing

Regular tests should include:
- deployment smoke test
- session revocation
- integration reconnect
- backup restore
- read-only safe mode
- automation pause
- external-write disablement
- worker restart

## Disaster Recovery Exercise

Twice yearly, simulate:
- production database loss
- provider outage
- lost credentials
- restore from backup
- deletion replay
- minimum viable service restoration

## Business Continuity

North Vector should preserve access to essential information during outages through:
- recent cached low-sensitivity data
- portable exports
- provider-native access
- documented manual fallback

## Manual Fallbacks

Examples:
- Google Calendar remains directly available
- tasks may be exported to Markdown or JSON
- critical commitments may be reviewed from a recent export
- automations can be paused and work completed manually

## Operational Security

Administrative operations should require:
- high-assurance authentication
- trusted device
- least privilege
- audit logging
- restricted access to production secrets

## Production Access

Direct production database or shell access should be rare.

When used, it should be:
- authenticated
- time-bounded
- logged
- read-only where possible
- followed by verification

## Data Correction Operations

Manual production corrections should:
- use supported tools or scripts
- preserve audit history
- avoid direct untracked edits
- include before-and-after validation

## Error Budgets

Formal error budgets may be added later.

Phase 1 should still track:
- failed requests
- failed syncs
- failed automation runs
- stale critical data
- external action errors

## Service-Level Targets

Initial targets may include:
- application available during ordinary use
- Calendar sync current within one hour under normal conditions
- daily briefing generated within its scheduled window
- Critical incidents surfaced immediately
- backup created daily

These targets should be adjusted using real usage.

## Privacy Operations

Operations should verify:
- expired data is cleaned
- exports expire
- restricted logs are redacted
- disconnected integrations stop syncing
- public-mode defaults remain intact

## Security Operations

Regular security work should include:
- access review
- device review
- secret rotation review
- dependency scan
- backup verification
- incident exercise
- threat-model update

## Release Freeze Conditions

Pause releases when:
- active security incident exists
- audit integrity is uncertain
- no valid recent backup exists before high-risk migration
- Critical findings remain open
- production recovery is incomplete

## Operational Change Review

Changes to:
- backup policy
- authentication
- permissions
- provider scopes
- deletion behavior
- audit retention
- production access

should receive explicit review and documentation.

## Failure Modes

### Deploy and Hope

A release ships without post-deployment verification.

### Migration Coupling

Application and schema changes make rollback impossible.

### Alert Flood

Too many low-value alerts hide important failures.

### Silent Degradation

Provider or worker failure goes unnoticed.

### Untested Recovery

Backups exist but operational restoration has not been practiced.

### Production Drift

Manual configuration changes make production differ from documented state.

### Unsafe Replay

Queued actions execute after outage without revalidation.

### Observability Leakage

Monitoring tools collect private content unnecessarily.

### Single-Point Fragility

One provider failure makes all core functions unavailable.

### Operational Overengineering

Infrastructure complexity exceeds the needs of the single-user product.

## Phase 1 Implementation

Originally scoped, Phase 1 should establish:
- staging and production environments
- automated deployment
- separate worker deployment
- managed PostgreSQL
- environment validation
- structured logs
- error monitoring
- health checks
- release records
- daily encrypted backups
- restore testing
- feature flags
- automation and integration pause controls

**Actual status, 2026-07-03:** one production environment (no staging), manual deployment via `firebase deploy` (not automated CI/CD), no separate worker (one scheduled Cloud Function instead — see ADR-0103), Firestore instead of managed PostgreSQL (ADR-0101), no formal environment validation beyond what fails loudly at runtime, no structured logging beyond default platform logs, no error monitoring service, no health checks, no release records, no backups, no restore testing, no feature flags, no automation/integration pause controls. This is a substantial gap between plan and reality that predates and is independent of the database migration — flagged here, not fixed, since closing it is a much larger effort than a stale-reference correction.
- operational dashboard
- initial runbooks

## Success Criteria

The Deployment and Operations Plan succeeds if:
- releases move through a repeatable process
- production state is observable
- migrations are validated and recoverable
- provider failures degrade safely
- automations can be paused quickly
- backups are verified through restoration
- incidents preserve truth and control
- the system can recover without resurrecting deleted or revoked data

## Final Principle

North Vector should operate like a dependable personal system, not a perpetual prototype.

Every deployment should make the product more useful without making recovery, privacy, or control harder.