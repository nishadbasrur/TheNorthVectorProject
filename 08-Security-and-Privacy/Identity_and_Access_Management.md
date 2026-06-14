# Identity and Access Management v1.0

## Purpose

This document defines how North Vector should authenticate users, register devices, authorize actions, manage sessions, enforce capability boundaries, and revoke access.

The Identity and Access Management system exists to ensure that the right person, on the right device, can access the right information and perform only the right actions.

Its purpose is not to make access cumbersome.

Its purpose is to make authority explicit and verifiable.

## Core Principle

Identity answers who is acting.

Authorization answers what they may do.

North Vector should never confuse the two.

## Primary Objectives

The system should help Chief answer:
- Who is signed in?
- Which device is being used?
- How strongly was identity verified?
- What permissions are active?
- Which actions require fresh authentication?
- How can access be revoked?
- What should happen if identity or device trust becomes uncertain?

## Phase 1 Identity Model

North Vector should begin as a single-user system.

The primary authenticated user is Nishad.

Future support for collaborators, family members, clinicians, administrators, or delegated agents should require a separate multi-user authorization model.

Single-user assumptions should not be stretched into shared access.

## Identity Record

The primary identity record should contain:
- user_id
- legal_name
- preferred_name
- primary_email
- recovery_email
- phone_number
- authentication_methods
- account_status
- created_at
- last_authenticated_at
- security_review_at
- recovery_status

Sensitive identity fields should use Restricted classification.

## Authentication Methods

Recommended methods:
- Passkey
- Device Biometric
- Strong Password Fallback
- Multi-Factor Authentication
- Recovery Code

Voice recognition may be used as a convenience signal, but not as the sole authentication method for high-impact actions.

## Authentication Assurance Levels

### Level 0: Unauthenticated

No access to personal data.

May view only public application surfaces.

### Level 1: Basic Session

Authenticated through an existing trusted session.

Appropriate for ordinary low-risk interaction.

### Level 2: Verified User

Recent passkey, biometric, or strong credential verification.

Appropriate for sensitive memory and integration access.

### Level 3: High Assurance

Fresh biometric or passkey authentication on a trusted device.

Required for restricted settings, data export, and high-impact approvals.

## Reauthentication Triggers

Fresh authentication should be required for:
- viewing Restricted data
- changing security settings
- connecting health or financial integrations
- exporting sensitive data
- broad deletion requests
- registering trusted devices
- changing recovery methods
- approving restricted actions
- revoking all sessions

## Session Model

Each session should contain:
- session_id
- user_id
- device_id
- created_at
- authenticated_at
- last_active_at
- assurance_level
- expires_at
- idle_timeout_at
- privacy_mode
- active_scopes
- revoked_at

## Session Expiration

Sessions should expire based on:
- inactivity
- absolute age
- device trust
- action sensitivity
- security event

Sensitive views may require reauthentication even when the broader session remains active.

## Session Revocation

Nishad should be able to revoke:
- one session
- one device
- all sessions except the current device
- all sessions

Revocation should take effect immediately where technically possible.

## Device Identity

Each device should have a unique registered identity.

Device records should contain:
- device_id
- device_name
- device_type
- operating_system
- trust_level
- registered_at
- last_seen_at
- last_authenticated_at
- authentication_methods
- local_storage_capability
- notification_capability
- restricted_data_access
- revocation_status

## Device Trust Levels

### Trusted

Examples:
- Nishad's personal MacBook
- Nishad's personal phone

May access approved sensitive data after authentication.

### Limited Trust

Examples:
- smart glasses
- watch
- earbuds

May access only minimal context and limited controls.

### Untrusted

Examples:
- shared computer
- borrowed device
- unknown browser

Should not access sensitive memory or execute consequential actions.

## Device Registration Flow

1. Authenticate at high assurance.
2. Identify device.
3. Assign trust level.
4. Select allowed capabilities.
5. Confirm local storage behavior.
6. Register device.
7. Record audit event.

## Device Revocation Flow

1. Mark device revoked.
2. Invalidate sessions and tokens.
3. Block future synchronization.
4. Remove local access where possible.
5. Review recent activity.
6. Rotate exposed secrets if needed.

## Authorization Model

North Vector should use capability-based authorization.

Capabilities may include:
- read calendar
- create task
- read email
- draft email
- send email
- read memory
- read restricted memory
- create file
- update file
- delete file
- manage integrations
- approve automation
- export data
- delete account

## Capability Record

Each capability grant should contain:
- grant_id
- user_id
- device_id
- capability
- scope
- assurance_required
- approval_mode
- granted_at
- expires_at
- granted_by
- last_used_at
- revoked_at

## Scope Dimensions

Capabilities should be constrainable by:
- integration
- account
- calendar
- folder
- repository
- branch
- file path
- data category
- person
- project
- device
- time window

## Role Model

Phase 1 may use a minimal role model:
- Owner
- System Service
- Restricted Worker

### Owner

Nishad with full account authority.

### System Service

A bounded service identity used for internal processing.

### Restricted Worker

A component allowed to perform one narrow function.

Future collaborator roles should be designed separately.

## Service Identities

Internal services should not reuse Nishad's personal session directly.

Each service identity should have:
- service_id
- purpose
- allowed capabilities
- environment
- token expiration
- audit identity

## Separation of Duties

Where practical:
- reasoning proposes
- authorization validates
- approval confirms
- execution acts
- verification checks
- audit records

No single component should silently control the full chain for high-impact actions.

## Integration Tokens

Integration credentials should be bound to:
- provider
- account
- scope
- user
- environment
- expiration

Tokens should not grant broader authority than the connected integration requires.

## Delegated Access

Future delegated access may support:
- read-only family access
- clinician-shared records
- project collaborator access
- emergency contact access

Delegation should define:
- exact data
- allowed actions
- expiration
- revocation
- audit visibility

Delegated access should not exist in Phase 1.

## Emergency Access

Any future emergency-access system should require a separate policy.

It should define:
- emergency condition
- data scope
- verification
- notification
- expiration
- audit

Emergency access should never become a hidden bypass.

## Approval Binding

An approval should be bound to:
- authenticated identity
- device
- action
- target
- payload
- time window

Approval should expire if any of these materially change.

## Contextual Access

Access may depend on context such as:
- trusted device
- private mode
- location security
- active session assurance
- data classification

Example:
A wearable may display a generic reminder but not a financial balance.

## Public Mode Access

In Public Mode:
- sensitive fields remain hidden
- restricted memories require reauthentication
- notification previews are minimized
- spoken output avoids private details

## No-Memory Mode Access

No-Memory Mode should not reduce authentication requirements.

It changes retention behavior, not authority.

## Account Recovery

Recovery methods may include:
- recovery email
- verified phone
- recovery codes
- trusted device

Recovery should use strong verification and create a security event.

## Recovery Risks

The system should protect against:
- stolen recovery email
- SIM swap
- reused recovery code
- social engineering
- compromised trusted device

## Credential Changes

Changing authentication or recovery methods should:
- require high-assurance authentication
- notify existing trusted devices
- revoke old recovery artifacts when appropriate
- create an audit event

## Failed Authentication

The system should monitor:
- repeated failed attempts
- unknown devices
- impossible travel patterns where reliable
- suspicious recovery attempts

Responses may include:
- temporary rate limit
- stronger verification
- session lockout
- notification

## Rate Limiting

Apply rate limits to:
- login attempts
- recovery attempts
- passcode attempts
- sensitive exports
- broad deletion actions
- token issuance

## Lockout Policy

Lockout should be proportionate.

The system should avoid permanent denial from ordinary mistakes while still resisting brute force.

## Access Review

Nishad should periodically review:
- trusted devices
- active sessions
- connected integrations
- long-lived capabilities
- recovery methods
- service identities

## Access Dashboard

The dashboard should show:
- current session
- active devices
- recent sign-ins
- capability grants
- pending approvals
- connected accounts
- revoked access
- suspicious events

## Audit Events

Identity and access audit events should include:
- login succeeded
- login failed
- passkey added
- device registered
- device revoked
- session created
- session revoked
- permission granted
- permission changed
- permission revoked
- recovery initiated
- restricted action approved

## Privacy

Identity data should be minimized.

The system should avoid retaining:
- unnecessary device fingerprints
- precise location history for authentication
- biometric templates outside secure platform mechanisms

## Security

IAM components should:
- use secure platform authentication
- protect session tokens
- rotate secrets
- enforce token expiration
- validate issuer and audience
- prevent token replay
- log consequential events

## Offline Access

Offline access should be limited.

Possible offline capabilities:
- view cached low-sensitivity data
- create local notes
- queue tasks

Restricted data and high-impact actions should require online verification or secure local authentication.

## Wearable Access

Wearables should:
- use limited-trust profiles
- store minimal data
- require paired trusted devices
- avoid direct access to Restricted memory
- hand off high-impact approvals

## Multi-Environment Separation

Development, testing, and production should use separate:
- users
- credentials
- service identities
- tokens
- databases

Production identity data should not be copied into development unnecessarily.

## Failure Handling

If identity cannot be verified:
`I can't verify your identity strongly enough for that action.`

If permission is missing:
`You are signed in, but this device is not authorized to view Restricted financial data.`

If the session expires:
`Your session expired. Sign in again to continue.`

## Security Incident Response

If unauthorized access is suspected:
1. Revoke affected sessions.
2. Mark device untrusted.
3. Revoke integration tokens where needed.
4. Notify Nishad.
5. Review audit history.
6. Rotate credentials.
7. Restore access deliberately.

## Failure Modes

### Authentication Without Authorization

A signed-in user receives more access than intended.

### Authorization Without Context

A capability ignores device or data sensitivity.

### Session Sprawl

Old sessions remain active indefinitely.

### Device Trust Inflation

Wearables or shared devices gain excessive authority.

### Approval Reuse

One approval is reused for a different action.

### Recovery Weakness

Account recovery becomes the easiest attack path.

### Service Identity Overreach

Internal components receive broad permissions.

### Hidden Delegation

Another person gains access without clear visibility.

## Phase 1 Implementation

Phase 1 should support:
- single-user identity
- passkey or strong login
- trusted-device registration
- session expiration and revocation
- authentication assurance levels
- capability-based authorization
- scoped integration tokens
- restricted-data reauthentication
- approval binding
- access dashboard
- audit logging
- account recovery

Delegated access and multi-user roles should come later.

## Success Criteria

The Identity and Access Management system succeeds if Nishad can always understand:
- who is signed in
- which device is trusted
- what that session can access
- which actions require fresh authentication
- where permissions came from
- how to revoke access immediately

## Final Principle

North Vector should know not only what may be done, but exactly who is authorized to do it, from which device, and under what conditions.