# ADR-0024: Use OpenTelemetry-Compatible Instrumentation for Future Observability

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will instrument core application workflows using OpenTelemetry-compatible concepts, naming conventions, and tracing patterns.

Phase 1 will not require a full OpenTelemetry backend, but instrumentation should be designed so telemetry can later be exported to OpenTelemetry-compatible systems without major refactoring.

## Context

North Vector includes:
- web requests
- background jobs
- AI workflows
- Calendar synchronization
- approval pipelines
- execution workflows
- database operations
- provider integrations

As the platform grows, understanding latency, failures, and workflow behavior across multiple services becomes increasingly important.

## Decision Drivers

- future portability
- vendor neutrality
- observability maturity
- trace correlation
- workflow visibility
- operational debugging
- low Phase 1 complexity

## Decision Details

Instrumentation should support:
- traces
- spans
- correlation IDs
- operation names
- duration measurement
- error attribution
- service boundaries

Phase 1 monitoring may continue to rely primarily on:
- structured logging
- Sentry
- application metrics

However, new instrumentation should avoid vendor-specific lock-in where practical.

## Trace Model

Important workflows should support correlation through:
- request ID
- run ID
- job ID
- trace ID

Examples:
- Chief conversation request
- Calendar synchronization
- approval workflow
- event execution
- memory lifecycle processing

## Privacy Rules

Telemetry must not contain:
- prompts
- memory contents
- Calendar descriptions
- export contents
- uploaded file contents
- tokens
- secrets

Identifiers and classifications should be preferred over raw content.

## Operational Benefits

OpenTelemetry-compatible instrumentation enables:
- future tracing platforms
- vendor migration flexibility
- performance analysis
- distributed workflow debugging
- correlation across logs and errors

## Consequences

### Positive

- future observability flexibility
- reduced vendor lock-in
- easier trace correlation
- improved operational diagnostics

### Negative

- additional instrumentation effort
- naming conventions require governance
- telemetry schemas require maintenance

## Implementation Notes

Suggested attributes:

```text
trace_id
span_id
request_id
run_id
service
operation
status
error_code
duration_ms
```

Instrumentation wrappers should be used rather than scattering vendor SDK calls throughout the codebase.

## Relationship to Sentry

Sentry remains the primary Phase 1 error-monitoring system.

OpenTelemetry compatibility exists to preserve future flexibility and support broader observability needs as the platform grows.

## Outcome

North Vector gains a future-proof observability foundation without introducing the complexity of a full tracing platform during the MVP stage.
