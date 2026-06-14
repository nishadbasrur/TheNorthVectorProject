# ADR-0023: Use Structured JSON Logging Across Web and Worker

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use structured JSON logging as the default logging format across the web application, background worker, integrations, and operational services.

Human-readable console logs may be used in local development, but production log events must be emitted as structured JSON records.

## Context

The system includes:
- Next.js web services
- background workers
- PostgreSQL operations
- provider integrations
- AI workflows
- synchronization jobs
- approval and execution pipelines

As the application grows, free-form text logs become difficult to:
- search
- aggregate
- correlate
- alert on
- analyze across services

Operational events need consistent machine-readable metadata.

## Logging Requirements

Every log event should support:
- timestamp
- severity
- environment
- service name
- operation name
- request ID
- run ID when applicable
- user identifier (pseudonymous when possible)
- error code
- duration where relevant

## Required Levels

Supported levels:
- trace
- debug
- info
- warn
- error
- fatal

Production defaults should suppress trace and most debug events.

## Privacy Rules

Logs must not contain:
- passwords
- access tokens
- API keys
- OAuth credentials
- full prompts
- memory contents
- Calendar descriptions
- exported user data
- uploaded file contents

Identifiers should be preferred over raw content.

## Correlation

Logs should support correlation across:
- request lifecycle
- worker jobs
- approval flows
- execution runs
- provider interactions

Request IDs and run IDs should propagate through major workflows.

## Error Handling

Exceptions should log:
- error category
- normalized error code
- stack trace where appropriate
- request metadata

Error logs should complement Sentry rather than duplicate entire payloads.

## Operational Benefits

Structured logging enables:
- searchability
- alerting
- aggregation
- incident investigation
- release comparison
- audit-adjacent operational tracing

## Consequences

### Positive

- consistent operational visibility
- easier debugging
- better observability foundation
- machine-readable events
- easier future log aggregation

### Negative

- slightly more implementation discipline
- log schemas require maintenance
- developers must avoid ad hoc logging patterns

## Implementation Notes

Recommended fields:

```json
{
  "timestamp":"2026-06-14T12:00:00Z",
  "level":"info",
  "service":"worker",
  "operation":"calendar_sync",
  "request_id":"req_123",
  "duration_ms":152
}
```

A centralized logging wrapper should be used rather than direct console usage throughout the codebase.

## Outcome

Structured JSON logging provides a consistent operational record across web and worker processes while supporting privacy, observability, and future monitoring requirements.
