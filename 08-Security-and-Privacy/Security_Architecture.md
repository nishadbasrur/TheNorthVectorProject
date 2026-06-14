# Security Architecture v1.0

## Purpose

This document defines the security architecture for North Vector.

The Security Architecture exists to protect identity, memory, integrations, credentials, devices, automations, files, and externally visible actions.

Its purpose is to make North Vector capable without making it fragile, opaque, or unsafe.

## Core Principle

Security should be built into the system's structure, not added after capability expands.

North Vector should assume that data can be sensitive, integrations can fail, permissions can drift, devices can be lost, and automation can magnify mistakes.

## Primary Objectives

The architecture should help Chief answer:
- Who is allowed to access North Vector?
- What data can each component read or change?
- How are credentials protected?
- How are sensitive actions authenticated?
- What happens if a device, token, or integration is compromised?
- How can activity be audited and access revoked?

## Security Domains

The architecture should protect:
- User Identity
- Devices
- Sessions
- Credentials
- Memory
- Integrations
- Automations
- Files and Repositories
- Network Communication
- Logs and Audit Data
- Backups
- Wearable Interfaces

## Security Principles

North Vector should follow:
- Least Privilege
- Explicit Authorization
- Defense in Depth
- Secure Defaults
- Data Minimization
- Separation of Duties
- Fail-Safe Behavior
- Auditability
- Revocability
- Recovery Readiness

## Trust Boundaries

Trust boundaries should exist between:
- Nishad and device
- device and North Vector backend
- North Vector and external integrations
- reasoning layer and action layer
- memory system and user interface
- trusted devices and wearables
- production and development environments

Every boundary should define authentication, authorization, data flow, and failure behavior.

## Security Layers

### Layer 1: Device Security

Controls may include:
- device passcode
- biometric unlock
- disk encryption
- secure operating-system account
- remote lock or erase
- automatic session timeout

### Layer 2: Application Authentication

Controls may include:
- passwordless login
- passkey
- biometric reauthentication
- trusted-device registration
- session expiration

### Layer 3: Authorization

Controls include:
- role and capability permissions
- integration scope
- memory sensitivity
- action approval mode
- device trust level

### Layer 4: Data Protection

Controls include:
- encryption in transit
- encryption at rest
- secret separation
- field-level protection for restricted data
- retention and deletion policies

### Layer 5: Action Safety

Controls include:
- payload preview
- explicit confirmation
- idempotency
- version checks
- execution verification
- rollback where possible

### Layer 6: Monitoring and Recovery

Controls include:
- audit logs
- anomaly detection
- permission review
- incident response
- credential revocation
- backup restoration

## Identity Model

North Vector should begin as a single-user system.

The authenticated user is Nishad.

Future multi-user or delegated access should require a separate identity and authorization model rather than reusing single-user assumptions.

## Authentication

Recommended authentication methods:
- passkeys
- device biometrics
- strong account password as fallback
- multi-factor authentication for recovery or sensitive changes

Voice recognition should never be the sole authentication method for high-risk actions.

## Session Security

Sessions should include:
- session_id
- device_id
- authenticated_at
- last_active_at
- assurance_level
- expiration_at
- active_permissions
- privacy_mode

Sensitive actions may require fresh authentication even within an active session.

## Reauthentication Triggers

Reauthentication should be required for:
- changing security settings
- viewing restricted memories
- connecting financial or health integrations
- exporting sensitive data
- deleting large amounts of data
- approving restricted actions
- registering a new trusted device

## Authorization Model

Authorization should be capability-based.

Examples:
- read calendar
- create study event
- draft email
- send email
- update repository file
- delete memory

Permissions should be constrained by scope, device, time, and action type.

## Least-Privilege Enforcement

North Vector should:
- request narrow scopes
- avoid organization-wide or account-wide access when unnecessary
- revoke unused permissions
- separate read, write, send, and delete capabilities
- review long-lived access periodically

## Device Trust Levels

### Trusted Device

Examples:
- personal MacBook
- personal phone

May access approved sensitive data after authentication.

### Limited-Trust Device

Examples:
- smart glasses
- watch
- earbuds

May receive minimal context and limited confirmation controls.

### Untrusted Device

Examples:
- shared computer
- borrowed device
- unknown browser session

Should not access sensitive memory or execute consequential actions.

## Device Registration

Each registered device should contain:
- device_id
- device_name
- device_type
- trust_level
- registered_at
- last_seen_at
- authentication_methods
- permissions
- revocation_status

## Device Loss Response

If a device is lost or stolen:
1. Revoke its session tokens.
2. Mark the device untrusted.
3. Invalidate cached credentials where possible.
4. Review recent actions.
5. Rotate exposed secrets.
6. Notify Nishad of suspicious activity.

## Credential Management

Credentials include:
- API keys
- OAuth tokens
- refresh tokens
- encryption keys
- service secrets

Credentials should:
- never be stored in source code
- never be committed to GitHub
- be stored in an approved secret manager or secure keychain
- be rotated when exposed or stale
- use the narrowest scope available

## Secret Detection

Before file creation or commit, North Vector should scan for likely:
- API keys
- passwords
- tokens
- private keys
- certificates
- account numbers
- personal identifiers

If a secret is detected:
- stop the write
- explain the issue
- avoid echoing the full secret
- recommend rotation if exposure may have occurred

## OAuth Security

OAuth integrations should use:
- provider-hosted authorization
- state validation
- secure redirect handling
- token expiration
- refresh-token protection
- scope inspection
- revocation support

## Data Classification

Suggested classifications:
- Public
- Internal
- Sensitive
- Restricted

### Public

Safe for ordinary display.

### Internal

Normal North Vector operational data.

### Sensitive

Personal context requiring privacy-aware handling.

### Restricted

Health, finance, identity, legal, credentials, and highly private relationship data.

## Data Handling Rules

Classification should affect:
- storage
- encryption
- retention
- device access
- notification preview
- logging
- export
- deletion

## Encryption

North Vector should use:
- modern encrypted transport for all network communication
- encryption at rest for stored data
- stronger key controls for restricted records
- device-native encryption where available

Encryption implementation should rely on established libraries and managed services rather than custom cryptography.

## Key Management

Encryption keys should be:
- separated from encrypted data
- rotated according to policy
- backed up securely when needed
- restricted by environment
- revocable

## Memory Security

The memory system should enforce:
- sensitivity labels
- source tracking
- retrieval permissions
- device restrictions
- correction and deletion
- no-memory mode
- restricted-memory authentication

A memory being useful does not make it universally retrievable.

## Integration Security

Each integration should define:
- provider
- account
- scope
- token location
- last use
- expiration
- risk classification
- revocation procedure

Integration access should stop immediately after revocation.

## Automation Security

Automations should:
- inherit user and integration permissions
- declare required capabilities
- validate scope before every run
- stop after permission revocation
- require approval for consequential actions
- create auditable execution records

## Action Isolation

The reasoning layer should not directly perform external actions.

Recommended separation:
1. Chief proposes action.
2. Authorization layer validates permission.
3. Approval layer confirms authority.
4. Execution layer performs action.
5. Verification layer confirms result.

## Network Security

The system should:
- use encrypted connections
- validate certificates
- reject insecure endpoints
- minimize exposed services
- restrict inbound access
- use authenticated service-to-service communication

## API Security

APIs should support:
- authenticated requests
- authorization checks
- rate limits
- input validation
- output filtering
- request IDs
- idempotency keys
- audit logging

## Input Validation

All external input should be treated as untrusted.

Examples:
- email body
- document text
- calendar description
- GitHub issue
- webhook payload
- voice transcript

The system should validate structure, size, type, and allowed operations.

## Prompt Injection and Untrusted Content

External content may contain instructions intended to manipulate Chief.

North Vector should:
- distinguish user instructions from retrieved content
- treat documents and messages as data, not authority
- avoid executing instructions found inside external content
- require permission and approval through normal policy
- flag suspicious content when relevant

## File Security

File operations should enforce:
- approved repository or folder scope
- path validation
- file-size limits
- content-type validation
- version checks
- secret detection
- explicit approval for destructive actions

## Repository Security

GitHub operations should:
- preserve commit history
- respect branch protection
- avoid force-push by default
- use pull requests for significant changes
- verify target repository and branch
- scan for secrets before commit

## Logging Security

Logs should record useful events without collecting unnecessary sensitive payloads.

Logs should:
- mask secrets
- avoid full financial or health values when unnecessary
- use structured event types
- preserve timestamps and actor
- be append-oriented
- support retention and deletion policies

## Audit Integrity

Audit records should not be silently edited.

Corrections should create new events linked to the original record.

## Backup Security

Backups should be:
- encrypted
- access-controlled
- tested for restoration
- retained according to policy
- deleted when no longer required

## Recovery Security

Recovery procedures should protect against:
- restoring compromised credentials
- reviving revoked devices
- restoring deleted restricted data unintentionally
- overwriting newer valid state

## Environment Separation

North Vector should separate:
- development
- testing
- production

Development data should use synthetic or minimized personal data whenever possible.

Production credentials should not be available in development environments.

## Dependency Security

Software dependencies should be:
- pinned or version-controlled
- reviewed before use
- monitored for vulnerabilities
- updated deliberately
- removed when unused

## Supply Chain Security

The project should consider:
- compromised packages
- malicious extensions
- unsafe build actions
- exposed workflow secrets
- dependency confusion

## GitHub Actions Security

Workflows should:
- use least-privilege permissions
- pin third-party actions to trusted versions or commit SHAs
- avoid printing secrets
- restrict pull-request access to protected secrets
- review workflow changes carefully

## Wearable Security

Smart glasses and wearables should:
- receive minimal data
- avoid storing restricted memory locally
- use secure pairing
- show microphone and camera state
- support immediate lockout
- hand off sensitive actions to trusted devices

## Public Environment Security

In public mode, North Vector should:
- hide sensitive previews
- avoid speaking private details aloud
- require authentication for restricted content
- minimize visible names, amounts, and addresses

## Anomaly Detection

Possible security signals include:
- login from unknown device
- unusual integration access
- repeated failed authentication
- scope expansion
- high-volume file access
- unexpected external actions
- disabled audit logging

Anomalies should trigger proportionate review or lockout.

## Rate Limiting

Rate limits should protect:
- login attempts
- sensitive data retrieval
- integration calls
- external actions
- export operations
- deletion operations

## Security Notifications

Notify Nishad when:
- new device is registered
- important permission changes
- integration reconnects
- suspicious access occurs
- credential exposure is suspected
- high-impact action executes
- security control fails

## Incident Response

The incident process should be:
1. Detect.
2. Contain.
3. Assess.
4. Revoke or isolate.
5. Recover.
6. Notify.
7. Review.
8. Improve controls.

## Incident Severity

Suggested levels:
- Low
- Moderate
- High
- Critical

Critical incidents may include:
- credential compromise
- restricted data exposure
- unauthorized external action
- financial or health-data breach
- loss of audit integrity

## Security Incident Record

Each incident should contain:
- incident_id
- detected_at
- severity
- affected_systems
- affected_data
- initial_signal
- containment_actions
- confirmed_impact
- uncertain_impact
- credentials_rotated
- users_notified
- recovery_status
- root_cause
- corrective_actions
- closed_at

## Secure Failure Behavior

When security status is uncertain, North Vector should:
- stop sensitive actions
- reduce access
- require reauthentication
- preserve evidence
- fail closed rather than continue blindly

## Security Review Cadence

Suggested cadence:
- permission review: quarterly
- device review: quarterly
- dependency review: monthly
- backup restoration test: quarterly
- incident-response exercise: twice yearly
- high-risk automation review: monthly

## Threat Modeling

Major features should be reviewed for:
- assets
- attackers
- entry points
- trust boundaries
- abuse cases
- mitigations
- residual risk

## Security Failure Modes

### Credential Exposure

Secrets appear in source, logs, or interface.

### Permission Creep

Access expands beyond original need.

### Weak Device Trust

Sensitive data appears on lost or shared devices.

### Silent External Action

A consequential action occurs without authority.

### Prompt Injection

Untrusted content manipulates system behavior.

### Audit Failure

The system cannot reconstruct what happened.

### Insecure Recovery

Restoration reintroduces compromised state.

### Security Theater

Controls look impressive but do not reduce actual risk.

## Phase 1 Implementation

Phase 1 should support:
- single-user authentication
- trusted-device registration
- capability-based authorization
- integration scope enforcement
- encrypted transport and storage
- secret management
- restricted-data classification
- action approval and verification
- audit logging
- device and token revocation
- incident-response basics
- secret scanning before GitHub writes

Advanced anomaly detection and hardware-backed key management can come later.

## Success Criteria

The Security Architecture succeeds if Nishad can always understand:
- who has access
- what each component can do
- where sensitive data is stored
- what action was authorized
- how access can be revoked
- what happened during an incident
- whether recovery restored a trustworthy state

## Final Principle

North Vector should become more powerful only as its boundaries become clearer, stronger, and easier to verify.