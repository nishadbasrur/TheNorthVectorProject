# ADR-0007: Use Database-Backed Jobs Before a Workflow Platform

## Status

Superseded — see [ADR-0103: Use Firebase Cloud Functions for Scheduled Execution](./ADR-0103-Use-Firebase-Cloud-Functions-for-Scheduled-Execution.md). PostgreSQL no longer exists, so a PostgreSQL-backed job queue is not possible as specified. Note the replacement ADR covers only scheduled Cloud Functions (one recurring job implemented so far); it is not a like-for-like replacement for the general durable job-queue model this ADR describes (retries, dead-letter, idempotency keys across many job types) — that broader need is undecided. Preserved here unmodified for historical context per the ADR process — see `10-Implementation/Architecture_Decision_Record_Template.md`.

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Technical Lead
- Operations Owner
- Automation Owner
- Data Architecture Owner

## Related Documents

- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Deployment_and_Operations_Plan.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0001-Use-PostgreSQL-as-Primary-Database.md`
- `10-Implementation/ADRs/ADR-0002-Use-a-Modular-Monolith-for-Phase-1.md`

## Context

North Vector requires background work for:
- Google Calendar synchronization
- embedding generation
- retention cleanup
- memory review scheduling
- daily briefing generation
- notification processing
- backup verification
- future automation triggers

The Phase 1 system is single-user, runs as a modular monolith, and uses PostgreSQL as its primary data store.

The project needs reliable background execution, but it does not yet require:
- complex distributed workflows
- large worker fleets
- high-throughput event streaming
- long-running multi-day orchestration
- cross-region execution
- many independently deployed services

Adding a dedicated workflow or queue platform too early would introduce new infrastructure, credentials, deployment behavior, operational dashboards, retry semantics, and failure modes before the core product workflow is proven.

At the same time, background jobs must not be handled as ad hoc timers or fire-and-forget promises. The system needs durable job state, retries, idempotency, scheduling, observability, and safe recovery after worker restart.

## Decision Drivers

- low operational overhead
- durable job state
- compatibility with PostgreSQL
- simple local development
- one-worker Phase 1 architecture
- idempotency
- retry control
- scheduling
- observability
- safe restart and resume
- straightforward backup and restore
- ability to adopt a workflow platform later

## Options Considered

### Option A: Database-Backed Job Queue

Description:
Store jobs in PostgreSQL and process them with one dedicated worker using explicit locking, status, retry, scheduling, and dead-letter fields.

Advantages:
- no additional infrastructure
- jobs and application state share one transactional system
- easy local and staging setup
- durable across worker restarts
- straightforward audit and inspection
- simple backup and restore
- sufficient for Phase 1 volume
- supports gradual migration later

Disadvantages:
- polling adds some database load
- distributed concurrency requires careful locking
- advanced workflow orchestration must be implemented manually
- long-running workflows can become awkward
- database contention may grow if job volume increases substantially

Risks:
- poorly designed locking may duplicate jobs
- retries may become inconsistent
- application tables and job tables may compete for resources
- homegrown orchestration may expand beyond intended scope

### Option B: Redis-Based Queue Such as BullMQ

Description:
Use Redis and a Node.js queue library for scheduling, retries, concurrency, and job processing.

Advantages:
- mature queue features
- good Node.js support
- low-latency job dispatch
- built-in retry and delay behavior
- dashboard tooling available

Disadvantages:
- requires another managed service
- introduces separate durability and backup concerns
- creates another credential and operational dependency
- job state may diverge from canonical database state
- local and production environments become more complex

Risks:
- Redis persistence assumptions may be misunderstood
- duplicate or lost jobs during failure
- deletion and restore behavior spans multiple systems

### Option C: Managed Workflow Platform

Description:
Use a service such as Temporal, Inngest, Trigger.dev, or another managed workflow engine.

Advantages:
- sophisticated retries and orchestration
- durable workflow state
- strong scheduling and observability
- useful for long-running multi-step workflows
- easier distributed execution later

Disadvantages:
- new provider dependency
- higher conceptual and operational complexity
- cost
- local development and testing overhead
- may shape application logic around platform-specific concepts
- unnecessary for simple Phase 1 jobs

Risks:
- provider lock-in
- infrastructure distraction
- architecture built around imagined future workflows
- one developer must learn and operate another major system

### Option D: In-Process Timers and Fire-and-Forget Work

Description:
Use application timers, cron callbacks, or detached promises without durable job records.

Advantages:
- fastest initial implementation
- no additional schema or service
- simple for trivial work

Disadvantages:
- jobs disappear on restart
- weak retry behavior
- poor observability
- unsafe for scheduled and consequential workflows
- difficult to test and audit

Risks:
- missed synchronization
- duplicate work
- silent failures
- false assumptions about completion

## Decision

North Vector will use a PostgreSQL-backed job queue for Phase 1.

The initial implementation will use:
- one durable jobs table
- one dedicated worker process
- database-backed scheduling
- bounded polling
- row-level locking or equivalent safe claiming
- idempotent job handlers
- retry state
- dead-letter state
- run history
- explicit timeout behavior
- operational pause controls

North Vector will not require Redis, Temporal, Inngest, Trigger.dev, or another dedicated workflow platform during Phase 1 unless measured implementation constraints justify a new decision.

## Required Job Record

Each job should contain:
- job_id
- job_type
- status
- priority
- payload
- payload_version
- scheduled_at
- available_at
- claimed_at
- claimed_by
- started_at
- completed_at
- failed_at
- attempt_count
- max_attempts
- next_retry_at
- timeout_at
- idempotency_key
- related_object_ids
- required_permission_scope
- approval_reference when relevant
- last_error_code
- last_error_summary
- created_at
- updated_at
- audit_reference

## Job Statuses

Suggested statuses:
- Pending
- Scheduled
- Ready
- Claimed
- Running
- Succeeded
- Failed
- Retry Scheduled
- Dead Letter
- Canceled
- Expired
- Paused

## Worker Model

Phase 1 should use one worker deployment that:
- polls for eligible jobs
- claims jobs atomically
- processes jobs by registered type
- records heartbeats or progress where needed
- handles retries
- exposes health state
- supports graceful shutdown
- releases or recovers abandoned claims

The worker may use limited internal concurrency, but correctness should not depend on a single-thread assumption.

## Claiming and Locking

Job claiming should prevent duplicate processing through PostgreSQL mechanisms such as:
- `SELECT ... FOR UPDATE SKIP LOCKED`
- atomic status update with expected current state
- lease or claim expiration

A worker crash should not leave a job permanently stuck.

## Idempotency

Every job that may be retried should be idempotent or protected by duplicate detection.

Examples:
- Calendar synchronization may safely refresh the same cursor range
- embedding generation should replace the same object-version embedding
- briefing generation should use a date and user idempotency key
- external writes should not be modeled as ordinary retryable jobs without the approval and execution safeguards in ADR-0003

## Retry Policy

Each job type should define:
- retryable error categories
- maximum attempts
- backoff strategy
- expiration
- dead-letter behavior

Do not retry automatically when:
- permission has been revoked
- approval has expired
- an external action outcome is uncertain
- target state has changed materially
- the error is permanent
- the job is no longer useful

## Scheduling

The jobs table may support:
- immediate jobs
- delayed jobs
- one-time scheduled jobs
- recurring-job expansion into individual job records

Recurring definitions should remain separate from individual executions where practical.

## Transactions

When creating a job as part of a state change, the application should use an outbox-style or transactional insert where appropriate.

Example:
- save memory update
- create embedding job
- create audit event

These records should be committed consistently so the system does not persist state without required follow-up work.

## Rationale

A database-backed queue provides enough durability and control for Phase 1 without introducing a second stateful infrastructure dependency.

North Vector's early background workloads are moderate in volume and closely tied to canonical database state. PostgreSQL can preserve job status, application data, and audit references within one recovery and backup model.

This approach also aligns with the project's broader implementation rule: complexity should be earned. A workflow platform may become useful later, but adopting one before real workflow complexity appears would increase learning and operational cost while creating another place for synchronization, privacy, and deletion problems.

The decision rejects fragile in-process timers while preserving a clean path toward a stronger queue or workflow engine if evidence later demands one.

## Consequences

### Positive Consequences

- no additional stateful service in Phase 1
- durable job state
- simple local development
- unified backup and restore
- easy operational inspection
- transactional job creation
- straightforward dead-letter and retry records
- lower infrastructure cost
- easier one-developer maintenance

### Negative Consequences

- some queue features must be implemented
- polling increases database traffic
- concurrency and leases require careful testing
- complex workflows may become cumbersome
- high job volume may affect database performance
- worker scaling remains limited initially

### Operational Consequences

- the worker becomes a required production process
- queue depth, age, failures, and last success must be monitored
- dead-letter jobs require review
- job cleanup and retention policies are needed
- worker pause and safe restart controls are required
- database health directly affects job processing

### Security and Privacy Consequences

- job payloads must minimize sensitive data
- Restricted payloads require encryption or references rather than copies
- worker authorization must be revalidated at execution time
- logs must not expose job payloads unnecessarily
- deletion should remove or invalidate queued work referencing deleted data

### Data and Migration Consequences

- job schemas require versioned migrations
- job payloads need explicit payload versions
- restoring backups requires careful handling of stale queued jobs
- migration or restore should not replay expired or revoked actions
- job tables should use indexes for status, availability, and claim state

## Implementation Notes

Phase 1 should implement:
- `jobs` table
- optional `recurring_job_definitions` table
- job-type registry
- worker loop
- atomic claiming
- claim lease expiration
- retry scheduler
- dead-letter handling
- health and queue metrics
- job inspection interface or operational dashboard
- job cancelation and pause
- payload schema validation
- job retention cleanup

Suggested worker flow:

```text
Find eligible jobs
  -> Claim atomically
  -> Validate payload version
  -> Revalidate permission and state
  -> Execute idempotent handler
  -> Record result
  -> Retry, dead-letter, or complete
```

## Initial Job Types

Phase 1 may include:
- Calendar Sync
- Embedding Generation
- Retrieval Index Cleanup
- Memory Review Due
- Daily Briefing Generation
- Weekly Review Preparation
- Export Generation
- Backup Verification
- Retention Cleanup
- Notification Delivery

External Calendar event creation should continue through the action and approval pipeline, even if a worker performs the final execution.

## Permission and Approval Revalidation

A job must not assume that permission remained valid since scheduling.

Before consequential execution, check:
- current user status
- integration connection
- permission scope
- approval status and expiration
- target version
- security pause state

## Job Expiration

Jobs should expire when their purpose is time-sensitive.

Examples:
- outdated notification
- missed briefing window
- stale approval execution
- superseded synchronization request

Expired jobs should not execute merely because the worker recovered later.

## Dead-Letter Handling

A job should enter Dead Letter when:
- maximum attempts are exhausted
- repeated failure indicates a permanent issue
- manual review is required
- payload version is unsupported
- provider state is uncertain

Dead-letter records should show:
- job type
- affected object
- attempts
- last error
- recommended action

## Testing Requirements

Required tests include:
- job persists through worker restart
- two workers cannot process the same claim simultaneously
- abandoned claim becomes available after lease expiration
- retryable failure schedules a retry
- permanent failure enters Dead Letter
- expired job does not execute
- revoked permission blocks execution
- invalid payload version fails safely
- idempotency prevents duplicate effect
- transactional job creation rolls back with parent mutation
- deleted object invalidates related pending job
- queue restore does not replay stale external actions

## Validation Plan

The decision will be validated through:
- Calendar synchronization jobs
- embedding generation jobs
- daily briefing scheduling
- worker crash simulation
- duplicate-worker claim tests
- backup and restore exercise
- queue-depth monitoring during one week of MVP use

The approach should be reconsidered when queue complexity or operational burden becomes measurable rather than hypothetical.

## Rollback or Exit Strategy

If database-backed jobs become insufficient, North Vector may migrate to Redis-backed queues or a workflow platform.

Migration should:
1. preserve job IDs and idempotency keys where possible
2. stop new scheduling temporarily or dual-write deliberately
3. drain or migrate pending jobs
4. preserve audit and run history
5. avoid replaying expired jobs
6. verify permission and approval state again
7. use a superseding ADR

PostgreSQL may remain the authoritative job-history store even if dispatch moves elsewhere.

## Residual Risks

- database polling may create load
- locking bugs may duplicate or stall jobs
- worker code may become a homegrown workflow engine
- long-running handlers may complicate lease management
- queue and application workloads share one failure domain
- operational dashboard may lag behind actual worker state

## Assumptions

- Phase 1 job volume is moderate
- one worker is sufficient initially
- PostgreSQL is reliably available
- most jobs complete within minutes
- complex multi-day workflows are not required
- handlers can be made idempotent
- the system can tolerate bounded polling latency

## Review Triggers

Revisit this ADR when:
- queue volume materially affects database performance
- more than one worker is routinely required
- complex long-running workflows become common
- manual retry and orchestration logic grows substantially
- delayed-job accuracy becomes insufficient
- workflow visualization or replay becomes critical
- independent scaling is required
- a managed platform materially reduces total complexity

## Review Date

After one month of MVP production use or when the first review trigger occurs.

## Outcome

### Expected Outcome

Database-backed jobs should provide reliable Phase 1 background execution without adding unnecessary infrastructure or distracting from the core product.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep through Phase 1 unless measured job complexity or database impact supports a superseding ADR.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |