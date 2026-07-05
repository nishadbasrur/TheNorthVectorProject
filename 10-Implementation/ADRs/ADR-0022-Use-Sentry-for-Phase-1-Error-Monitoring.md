# ADR-0022: Use Sentry for Phase 1 Error Monitoring

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Operations Owner
- Security Owner
- Privacy Owner
- Technical Lead

## Related Documents

- `10-Implementation/Deployment_and_Operations_Plan.md`
- `10-Implementation/Operational_Runbook_Template.md`
- `10-Implementation/Release_Checklist.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0008-Use-Next.js-for-the-Phase-1-Web-Application.md`
- `10-Implementation/ADRs/ADR-0011-Use-Provider-Abstractions-for-Models-and-Integrations.md`
- `10-Implementation/ADRs/ADR-0019-Use-GitHub-Actions-for-Continuous-Integration.md`

## Context

North Vector Phase 1 will run as a production web application and background worker that depend on:
- Next.js
- a primary database (originally PostgreSQL; actually Firestore, no separate worker process — see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md` and `ADR-0103-Use-Firebase-Cloud-Functions-for-Scheduled-Execution.md`)
- Google Calendar (not implemented)
- managed authentication
- language-model providers (not implemented — no AI/LLM integration exists)
- object storage
- background jobs
- approval and execution workflows

The system needs production error monitoring that can detect and diagnose failures such as:
- unhandled exceptions
- failed server requests
- worker crashes
- provider adapter failures
- synchronization errors
- job retries and dead letters
- release regressions
- browser-side failures

Ordinary application logs alone are not sufficient because they may be fragmented across hosting platforms and difficult to correlate by release, request, environment, and stack trace.

At the same time, North Vector handles highly personal and potentially Restricted data. Error monitoring must not become an uncontrolled copy of prompts, memories, Calendar descriptions, tokens, account information, or export contents.

The error-monitoring platform must therefore provide useful diagnostics while enforcing strict data minimization and redaction.

## Decision Drivers

- mature error aggregation
- Next.js support
- Node.js worker support
- release tracking
- source maps
- stack traces
- alerting
- request and trace correlation
- privacy controls
- data scrubbing
- low operational overhead
- acceptable cost for one user

## Options Considered

### Option A: Sentry

Description:
Use Sentry for application and worker error monitoring, release tracking, stack traces, performance sampling, and alerting.

Advantages:
- strong Next.js and Node.js integration
- mature error grouping
- source-map support
- release and commit tracking
- browser and server visibility
- alerting and issue workflow
- configurable data scrubbing
- broad ecosystem and documentation
- low setup burden

Disadvantages:
- another external provider
- event volume and retention depend on plan
- default integrations may collect more request context than desired
- source-map and release setup require configuration
- performance monitoring can increase data volume

Risks:
- sensitive data enters error events
- session replay or broad tracing is enabled without review
- over-alerting creates noise
- third-party outage reduces visibility

### Option B: Hosting-Platform Logs Only

Description:
Use logs supplied by the deployment providers for the web application, worker, and database.

Advantages:
- no new provider
- simple setup
- low cost
- raw application output remains close to infrastructure

Disadvantages:
- weak error grouping
- difficult release correlation
- fragmented across services
- limited browser visibility
- alerting and stack-trace analysis are less mature

Risks:
- important recurring errors remain unnoticed
- diagnosis takes too long
- delayed worker failures are missed

### Option C: Self-Hosted Sentry or Open-Source Error Platform

Description:
Operate an error-monitoring system directly.

Advantages:
- greater data control
- configurable retention
- reduced dependence on hosted monitoring

Disadvantages:
- substantial operational burden
- database, storage, upgrades, and backups required
- excessive for Phase 1
- monitoring system itself requires monitoring

Risks:
- infrastructure work replaces product implementation
- monitoring becomes unreliable

### Option D: OpenTelemetry Backend from the Start

Description:
Instrument the application with OpenTelemetry and send traces, metrics, and errors to a general observability backend.

Advantages:
- vendor-neutral standard
- unified telemetry
- future portability
- strong distributed tracing potential

Disadvantages:
- more setup and architectural decisions
- error grouping and developer workflow may require additional tools
- higher configuration overhead for a small Phase 1 system

Risks:
- observability becomes overengineered
- data collection expands without clear value

### Option E: Manual Error Reporting

Description:
Rely on visible user errors, manual logs, and issue creation.

Advantages:
- no external provider
- minimal setup
- strong data minimization

Disadvantages:
- silent failures remain hidden
- little historical evidence
- slow incident response
- no automatic release regression detection

Risks:
- trust-impacting defects persist unnoticed
- operational reliability remains unmeasured

## Decision

North Vector will use Sentry for Phase 1 error monitoring.

Sentry will initially cover:
- Next.js client-side errors
- Next.js server-side errors
- route-handler and server-action failures
- background worker exceptions
- release and commit metadata
- selected performance traces at low sampling rates
- alerting for High and Critical failure patterns

The following will remain disabled by default unless separately reviewed:
- session replay
- full request-body capture
- full response-body capture
- broad user-content breadcrumbs
- unbounded performance tracing

Sentry will supplement, not replace, structured application logs, audit records, provider run history, and health metrics.

## Rationale

Sentry provides the best balance of diagnostic value and setup effort for the Phase 1 Next.js and Node.js stack.

North Vector needs to know when production behavior fails, which release introduced the failure, and whether the same issue is recurring across browser, server, or worker paths.

Sentry can provide that visibility without requiring the project to build or operate a full observability platform.

The decision is conditioned on strict privacy configuration. Error monitoring is useful only if it does not compromise the data it is intended to help protect.

## Consequences

### Positive Consequences

- automatic error capture
- grouped recurring issues
- release correlation
- source-mapped stack traces
- browser and server coverage
- worker error visibility
- alerting
- faster diagnosis and regression identification
- low operational setup compared with self-hosting

### Negative Consequences

- another external processor
- recurring cost or event limits
- configuration and SDK maintenance
- potential telemetry noise
- risk of sensitive context collection
- partial dependency on Sentry availability

### Operational Consequences

- Sentry projects or environments should separate staging and production
- release identifiers should match application deployments
- alert thresholds and ownership must be configured
- event volume, quota, and retention should be monitored
- source maps should be uploaded securely during deployment
- runbooks should reference Sentry issue and request identifiers where useful

### Security and Privacy Consequences

- all telemetry must be treated as potentially sensitive
- request bodies and private headers should be excluded by default
- cookies, tokens, authorization headers, provider keys, and integration secrets must be scrubbed
- user identity should use an internal pseudonymous ID rather than email where possible
- prompts, memories, Calendar descriptions, file contents, and action payloads should not be attached automatically
- data-processing terms and retention should be reviewed
- session replay remains disabled by default

### Data and Migration Consequences

- Sentry events are operational telemetry, not canonical records
- audit and incident history must remain in North Vector-owned stores
- Sentry issue IDs may be referenced by incident or release records
- provider exit must not make core operational history unrecoverable

## Environment Model

Use separate environment tags for:
- local development
- test
- staging
- production

Local development should not send events by default unless explicitly enabled.

Test environments should use a disabled or dedicated configuration to prevent synthetic failures from polluting production monitoring.

## Required Event Metadata

Safe metadata may include:
- environment
- release version
- commit SHA
- application component
- request ID
- run ID
- job type
- normalized error code
- route or operation name
- provider category
- retryability
- pseudonymous internal user ID

Do not include private object titles or raw user-entered text merely for convenience.

## Data Scrubbing Rules

Scrub or remove:
- `Authorization` headers
- cookies
- OAuth tokens
- API keys
- database URLs
- session identifiers where unnecessary
- full request bodies
- full response bodies
- prompts and model responses
- Calendar descriptions
- health and financial values
- export contents
- uploaded file contents

Custom `beforeSend` or equivalent hooks should enforce these rules.

## Error Context Rules

Error context should prefer identifiers and categories over content.

Good:
- `object_id: 123`
- `action_type: calendar_event_create`
- `error_code: PROVIDER_TIMEOUT`

Poor:
- full Calendar description
- full memory text
- raw prompt
- complete provider payload

## User Identification

Sentry may receive a stable pseudonymous internal user ID for issue correlation.

It should not receive:
- full name
- email address
- phone number
- address
- sensitive profile attributes

unless a future security and privacy review explicitly approves the field.

## Browser Error Monitoring

Client monitoring should capture:
- uncaught exceptions
- failed rendering
- route-transition failures
- selected network failures with sanitized metadata

It should not capture private DOM text or form values automatically.

## Server Error Monitoring

Server monitoring should capture:
- unhandled route errors
- server-component failures
- application-service exceptions
- provider-adapter errors
- release metadata

Domain and authorization errors that are expected should not all be reported as production incidents.

## Worker Error Monitoring

The worker should report:
- crashes
- unhandled job exceptions
- repeated retry exhaustion
- dead-letter creation for important jobs
- database or provider dependency failures

Routine retryable errors should be aggregated to avoid alert floods.

## Performance Monitoring

Performance tracing may be enabled at a low sample rate for:
- slow server requests
- Chief response latency
- database-heavy views
- Calendar synchronization
- worker job duration

Tracing should:
- avoid full sensitive span attributes
- use bounded sampling
- remain disabled or reduced for Restricted workflows when appropriate
- not become a substitute for explicit domain metrics

## Alerting

Initial alerts should cover:
- new production error after release
- sharp error-rate increase
- repeated authentication failure caused by application errors
- worker crash loop
- Calendar execution or verification failure
- deletion or export errors
- database connectivity failure

Alert thresholds should avoid notifying on every expected validation failure.

## Release Tracking

Each production deployment should record:
- Sentry release identifier
- commit SHA
- environment
- deployment time

This allows regression comparison before and after a release.

## Source Maps

Source maps should be uploaded during trusted deployment workflows.

They should not be publicly exposed through the application where avoidable.

Upload tokens must remain protected and scoped minimally.

## Issue Triage

Sentry issues should be classified by:
- severity
- affected component
- release
- user impact
- security or privacy impact
- recurrence
- workaround

High or Critical issues should create or link to:
- incident record
- GitHub issue
- runbook
- regression test

## Sentry and Audit Separation

Sentry must not replace the audit store.

Audit history answers:
- who changed what
- what action was approved
- what execution occurred
- what result was verified

Sentry answers:
- where software failed
- which release and stack trace were involved
- how often the failure recurred

## Failure Behavior

If Sentry is unavailable:
- application workflows should continue when safe
- telemetry failure should not block ordinary product operations
- monitoring delivery failure should be logged locally
- audit events must still be written
- Critical security controls must not depend on Sentry availability

## Provider Abstraction

A small internal monitoring wrapper should be used for application error reporting.

Domain code should report normalized errors through the wrapper rather than importing Sentry everywhere.

This allows:
- centralized redaction
- easier testing
- provider replacement
- consistent tags

## Testing Requirements

Required tests include:
- captured error includes release and environment
- authorization header is removed
- cookies and tokens are scrubbed
- prompts and Calendar descriptions are absent
- pseudonymous user ID is used
- staging events do not appear as production
- expected validation errors are not overreported
- worker exception creates a Sentry event
- Sentry outage does not break core workflow
- source-map upload uses protected credentials
- session replay is disabled

## Validation Plan

The decision will be validated through:
- staging SDK integration
- synthetic client and server errors
- synthetic worker failure
- redaction review
- source-map verification
- release tagging
- alert test
- one month of event-volume and noise review

The setup should be considered successful when errors are diagnosable without exposing personal content or creating alert fatigue.

## Rollback or Exit Strategy

If Sentry becomes unsuitable, North Vector may migrate to another error-monitoring or OpenTelemetry-compatible platform.

Migration should:
1. preserve the internal monitoring wrapper
2. map release and environment metadata
3. reproduce redaction controls
4. verify alerts and source maps
5. retain important incident references separately
6. disable the old SDK and revoke tokens
7. use a superseding ADR

Core operational history should remain in North Vector incident, audit, release, and GitHub records rather than depending solely on Sentry retention.

## Residual Risks

- sensitive data bypasses scrubbing
- SDK defaults change after upgrades
- alert fatigue
- event quota exhaustion
- Sentry outage
- third-party account compromise
- source maps expose proprietary implementation details if mishandled
- excessive tracing increases cost and privacy exposure

## Assumptions

- Phase 1 uses Next.js and a Node.js worker
- a hosted Sentry plan is affordable
- data scrubbing can be configured effectively
- staging and production can be separated
- structured logs and audit records remain available independently
- session replay is not required for MVP

## Review Triggers

Revisit this ADR when:
- telemetry repeatedly captures sensitive data
- event cost becomes disproportionate
- alert quality remains poor
- OpenTelemetry becomes the primary observability standard in the project
- self-hosting becomes operationally justified
- Sentry's privacy or retention terms become unacceptable
- another platform materially improves reliability or control
- a monitoring-related security incident occurs

## Review Date

Before production MVP launch and again after one month of production use.

## Outcome

### Expected Outcome

Sentry should provide fast, release-aware diagnosis of browser, server, and worker errors while North Vector preserves strict control over what personal data leaves the application.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Use Sentry for Phase 1 error monitoring, with data minimization and redaction reviewed before production launch.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |