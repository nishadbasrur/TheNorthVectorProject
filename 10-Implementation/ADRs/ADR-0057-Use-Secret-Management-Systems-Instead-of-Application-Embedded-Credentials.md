# ADR-0057: Use Secret Management Systems Instead of Application-Embedded Credentials

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will store and manage secrets through dedicated secret-management mechanisms rather than embedding credentials directly in source code, configuration files, repositories, deployment artifacts, or application binaries.

Secrets must be treated as sensitive operational assets with controlled access, rotation capability, and auditability.

## Context

North Vector depends on credentials including:
- API keys
- provider tokens
- database credentials
- encryption keys
- service-account credentials
- webhook secrets
- authentication secrets

Embedding secrets directly into code or configuration creates significant risks:
- accidental disclosure
- repository exposure
- credential reuse
- difficult rotation
- weak auditing
- operational fragility

Secret handling must be systematic and secure.

## Decision Drivers

- security
- auditability
- operational safety
- credential rotation
- least-privilege access
- compliance readiness

## Secret Management Principles

Secrets should be:
- centrally managed
- access controlled
- auditable
- rotatable
- environment specific

Secrets should never be treated as ordinary configuration values.

## Examples of Secrets

Examples include:

```text
API Keys
OAuth Client Secrets
Database Passwords
JWT Signing Keys
Encryption Keys
Webhook Verification Secrets
```

These values require dedicated protection.

## Prohibited Practices

Avoid:

```text
Secrets in Source Code
Secrets in Git Repositories
Secrets in Documentation
Secrets in Logs
Secrets in Error Messages
```

These practices increase exposure risk.

## Access Principles

Secret access should follow:

```text
Least Privilege
```

Systems should receive only the secrets they require.

Access should be narrowly scoped.

## Rotation Requirements

Secret-management processes should support:
- credential rotation
- key replacement
- provider migration
- incident response

Long-lived unrotated credentials increase risk.

## Environment Separation

Development, testing, staging, and production should maintain independent secrets.

Compromise of one environment should not automatically compromise another.

## Audit Requirements

Secret access should be auditable where supported.

Operators should be able to determine:
- who accessed a secret
- when access occurred
- what system requested access

## Relationship to Configuration as Code

Configuration may reference secrets.

Secret values themselves should remain outside version-controlled configuration artifacts.

Configuration and secret management are related but distinct concerns.

## Relationship to Infrastructure as Code

Infrastructure definitions may declare:
- secret dependencies
- access policies
- secret references

Secret values should remain external to infrastructure definitions.

## Logging Requirements

Secrets must never appear in:
- logs
- traces
- monitoring dashboards
- audit events
- debugging output

Redaction should be applied where necessary.

## Incident Response Benefits

Dedicated secret management enables:
- faster credential revocation
- controlled rotation
- reduced blast radius
- improved forensic investigation

## Operational Benefits

Secret management enables:
- stronger security
- safer deployments
- easier rotation
- better auditing
- reduced accidental exposure

## Consequences

### Positive

- improved security posture
- easier credential rotation
- stronger auditability
- reduced leakage risk
- better operational control

### Negative

- secret-management infrastructure required
- operational complexity
- onboarding overhead
- access-management maintenance

## Implementation Notes

Preferred pattern:

```text
Application
  -> Secret Reference
  -> Secret Management System
  -> Secret Value
```

Applications should retrieve secrets through approved mechanisms rather than embedding credentials directly.

## Testing Requirements

Tests should verify:
- secrets are not committed to repositories
- secret access remains controlled
- credential rotation procedures work correctly
- logs do not expose secret values
- environment separation is maintained
- applications fail safely when required secrets are unavailable

## Outcome

North Vector gains a secure and auditable secret-management strategy that reduces credential exposure risk while supporting rotation, least-privilege access, and long-term operational resilience.