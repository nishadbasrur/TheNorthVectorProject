# ADR-0058: Use Key Rotation and Credential Lifecycle Management for Security Resilience

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will maintain formal credential lifecycle management practices, including key rotation, credential replacement, expiration management, revocation procedures, and ownership tracking.

Secrets and credentials must not be treated as permanent assets.

All credentials should have a defined lifecycle.

## Context

North Vector relies on credentials including:
- API keys
- provider tokens
- database credentials
- encryption keys
- service-account credentials
- webhook secrets
- signing keys

Credentials can become compromised through:
- accidental exposure
- provider breaches
- employee error
- infrastructure compromise
- software vulnerabilities

Long-lived credentials increase the blast radius of security incidents.

## Decision Drivers

- security
- resilience
- incident response
- operational maturity
- compliance readiness
- risk reduction

## Credential Lifecycle Principles

Every credential should have:
- an owner
- a purpose
- a creation date
- a rotation strategy
- a retirement process

Credentials should be managed throughout their entire lifecycle.

## Lifecycle Stages

Typical lifecycle:

```text
Created
-> Active
-> Rotated
-> Deprecated
-> Revoked
-> Destroyed
```

Lifecycle transitions should be deliberate and auditable.

## Rotation Principles

Credential rotation should occur:
- on schedule
- after suspected compromise
- after personnel changes where appropriate
- after security incidents
- when providers require rotation

Rotation capability should be designed into systems from the beginning.

## Ownership Requirements

Every credential should have a responsible owner.

Ownership should answer:

```text
Who is responsible for this credential?
```

Anonymous credentials create operational risk.

## Expiration Management

Where supported, credentials should use:
- expiration dates
- limited validity windows
- renewable access patterns

Shorter-lived credentials reduce exposure.

## Revocation Procedures

The platform should support rapid credential revocation.

Examples:
- compromised API keys
- leaked tokens
- unauthorized access events

Revocation procedures should be documented and tested.

## Relationship to Secret Management

Secret management systems store credentials.

Credential lifecycle management governs:
- rotation
- ownership
- expiration
- retirement

The practices are complementary.

## Encryption Key Management

Encryption keys require special consideration.

Key rotation strategies should account for:
- existing encrypted data
- compatibility windows
- re-encryption requirements

Rotation must not cause data loss.

## Audit Requirements

Credential-management activities should be auditable.

Examples:
- credential creation
- credential rotation
- credential revocation
- ownership changes

Security-sensitive operations should remain traceable.

## Incident Response Benefits

Credential lifecycle management enables:
- faster containment
- reduced blast radius
- easier recovery
- stronger forensic investigation

## Operational Benefits

Lifecycle management enables:
- stronger security posture
- reduced credential risk
- better accountability
- improved resilience
- safer long-term operations

## Consequences

### Positive

- reduced exposure from credential compromise
- improved security maturity
- better incident response readiness
- stronger auditability
- clearer ownership responsibilities

### Negative

- operational maintenance effort
- rotation planning requirements
- credential-management overhead
- additional automation needs

## Implementation Notes

Preferred model:

```text
Credential
  -> Owner
  -> Rotation Policy
  -> Expiration Policy
  -> Revocation Procedure
```

Credential lifecycle metadata should remain discoverable.

## Testing Requirements

Tests should verify:
- credential rotation procedures work correctly
- revocation processes function as expected
- expired credentials fail safely
- ownership records remain accurate
- systems tolerate credential replacement without disruption
- audit trails capture lifecycle events

## Outcome

North Vector gains a resilient credential-management strategy that reduces security risk, supports incident response, and ensures that secrets and keys are actively managed throughout their lifecycle rather than treated as permanent infrastructure assets.