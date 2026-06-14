# ADR-0027: Use Environment-Based Configuration with Strict Validation

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use environment-based configuration for deployment-specific settings and will validate all configuration values at application startup before accepting requests or processing jobs.

Invalid configuration must cause startup failure rather than allowing the application to run in an uncertain state.

## Context

The platform depends on:
- database connections
- authentication providers
- AI providers
- Calendar integrations
- storage systems
- monitoring services
- feature flags
- deployment environments

Configuration errors are among the most common causes of production failures.

Examples include:
- missing secrets
- malformed URLs
- incorrect environment names
- disabled integrations
- invalid timeout values
- mismatched deployment settings

Without validation, these failures often appear later during runtime and are significantly harder to diagnose.

## Decision Drivers

- reliability
- startup safety
- operational consistency
- deployment confidence
- security
- configuration correctness
- predictable behavior

## Configuration Sources

Configuration may come from:
- environment variables
- secret managers
- deployment platforms
- local development files

Configuration should not be scattered throughout the codebase.

## Validation Requirements

All configuration must be validated during startup.

Validation should confirm:
- required values exist
- values match expected types
- URLs are valid
- numeric values are within bounds
- environment names are recognized
- feature-flag settings are valid

## Fail-Fast Principle

If configuration validation fails:
- startup should fail
- readiness should fail
- operators should receive clear diagnostics

The application should not continue in a partially configured state.

## Environment Separation

Supported environments may include:
- local
- development
- test
- staging
- production

Environment-specific behavior should be explicit.

## Secrets

Sensitive configuration includes:
- API keys
- OAuth credentials
- database passwords
- encryption keys
- signing secrets

Secrets must:
- never be committed
- never appear in logs
- never appear in health checks
- never appear in error messages

## Runtime Access

Configuration should be loaded through a centralized configuration module.

Application code should avoid direct environment-variable access.

## Validation Technology

Validation should use the approved runtime validation system established elsewhere in the architecture.

Configuration types and runtime validation should remain aligned.

## Operational Benefits

Strict validation enables:
- safer deployments
- earlier failure detection
- easier troubleshooting
- consistent environments
- reduced configuration drift

## Consequences

### Positive

- fail-fast startup behavior
- fewer runtime surprises
- safer production deployments
- clearer operational diagnostics

### Negative

- stricter deployment requirements
- startup may fail more frequently during misconfiguration
- configuration schemas require maintenance

## Implementation Notes

Suggested configuration domains:

```text
Database
Authentication
AI Providers
Calendar Providers
Storage
Monitoring
Feature Flags
Application Settings
```

Configuration ownership should be centralized.

## Logging Rules

Startup logs may report:
- configuration validation success
- configuration category
- environment

Startup logs must not report:
- secret values
- tokens
- passwords
- connection strings

## Readiness Integration

Readiness probes should fail if required configuration is unavailable or invalid.

This prevents traffic from reaching an improperly configured service.

## Testing Requirements

Tests should verify:
- missing required values fail startup
- malformed URLs fail startup
- invalid numeric bounds fail startup
- production configuration validates successfully
- secrets are not exposed in diagnostics
- readiness fails when configuration is invalid

## Outcome

North Vector gains predictable and secure startup behavior by ensuring all environment-specific configuration is validated before the application becomes operational.