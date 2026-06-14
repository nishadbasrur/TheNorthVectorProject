# ADR-0009: Use Managed Authentication with Passkey Support

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Security Owner
- Technical Lead
- Operations Owner
- Privacy Owner

## Related Documents

- `08-Security-and-Privacy/Threat_Model.md`
- `08-Security-and-Privacy/Identity_Authentication_and_Device_Trust_Model.md`
- `08-Security-and-Privacy/Incident_Response_and_Recovery_Model.md`
- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/MVP_Scope_and_Acceptance_Criteria.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0002-Use-a-Modular-Monolith-for-Phase-1.md`
- `10-Implementation/ADRs/ADR-0008-Use-Next.js-for-the-Phase-1-Web-Application.md`

## Context

North Vector will store and process highly personal information, including:
- goals
- behavioral memories
- commitments
- Calendar data
- relationship context
- future health and financial data
- permissions
- audit history
- integration tokens

Authentication is therefore not a cosmetic login feature. It is the first boundary protecting the entire personal operating system.

Phase 1 requires:
- one primary user
- secure sign-in
- session expiration
- session revocation
- trusted-device registration
- reauthentication for sensitive operations
- recovery behavior
- audit events
- future support for stronger assurance on Restricted actions

Implementing authentication directly would require the project to own password storage, credential reset, passkey registration, account recovery, session security, abuse controls, and ongoing protocol updates.

That work is security-sensitive, easy to get wrong, and not a product differentiator for North Vector.

At the same time, the authentication provider should not become the authorization system. North Vector still needs its own rules for device trust, sensitivity, approval, integration scope, and action permissions.

## Decision Drivers

- strong authentication
- passkey support
- secure recovery
- session management
- revocation
- reduced custom security code
- compatibility with Next.js and TypeScript
- provider portability
- audit integration
- one-user Phase 1 simplicity
- future multi-device support
- reauthentication for sensitive operations

## Options Considered

### Option A: Managed Authentication Provider with Passkey Support

Description:
Use a reputable managed authentication provider for primary identity, passkeys, account recovery, and session primitives. Keep North Vector authorization and device-trust policy in application logic.

Advantages:
- mature authentication security
- passkey support
- managed recovery flows
- less custom credential code
- provider-maintained protocol updates
- strong Next.js integration options
- faster Phase 1 implementation
- easier support for multiple devices

Disadvantages:
- provider dependency
- recurring cost or usage limits
- provider-specific APIs and session models
- identity metadata leaves North Vector infrastructure
- migration requires careful account mapping

Risks:
- provider outage blocks login
- recovery defaults may be weaker than desired
- session behavior may not exactly match North Vector policy
- vendor lock-in if provider-specific logic spreads

### Option B: Auth.js with Self-Managed Credentials and Passkey Components

Description:
Use Auth.js or equivalent as the main authentication framework while operating credential, session, and recovery components through North Vector infrastructure.

Advantages:
- greater control
- less dependency on one hosted identity provider
- strong Next.js ecosystem fit
- portable database-backed sessions

Disadvantages:
- more security ownership
- recovery and passkey implementation complexity
- more operational responsibility
- more testing and incident burden

Risks:
- subtle authentication flaws
- insecure recovery
- incomplete WebAuthn handling
- credential storage mistakes

### Option C: Password Authentication Built In-House

Description:
Implement email and password login, password reset, session cookies, and recovery directly.

Advantages:
- full control
- low provider cost
- minimal vendor dependence

Disadvantages:
- high security burden
- password storage and reset risks
- phishing exposure
- slower implementation
- weak alignment with passkey-first security

Risks:
- account takeover
- credential leakage
- insecure recovery
- avoidable security incidents

### Option D: Single Static Secret or Local-Only Login

Description:
Protect the application with one shared password, environment secret, device-only token, or local network access.

Advantages:
- very simple
- fast to build
- sufficient for an isolated prototype

Disadvantages:
- poor session management
- weak device-level control
- difficult revocation
- limited secure remote access
- unsuitable for sensitive production use

Risks:
- broad compromise after one secret leak
- no meaningful recovery or audit model
- difficult expansion to mobile and other devices

### Option E: Platform Identity Only

Description:
Use Apple, Google, or another social sign-in provider as the only login method.

Advantages:
- low friction
- reduced password handling
- familiar account recovery

Disadvantages:
- dependence on one external consumer account
- provider recovery may not match North Vector assurance needs
- passkey and reauthentication behavior may be indirect
- difficult separation between social identity and system security policy

Risks:
- compromise or lockout of the external account affects North Vector
- broad identity provider outage blocks access

## Decision

North Vector will use a managed authentication provider with passkey support for Phase 1.

The managed provider will own:
- primary credential registration
- passkey authentication
- core account recovery
- authentication challenge handling
- base session issuance or identity proof

North Vector will own:
- user authorization
- trusted-device records
- application session policy
- sensitivity-based access
- reauthentication requirements
- integration permissions
- approval authority
- external action authorization
- session revocation state
- audit events

The provider must support a secure integration with the Phase 1 Next.js application and must not require North Vector to expose server secrets to the client.

## Provider Selection Criteria

The selected provider should support:
- passkeys or WebAuthn
- secure session handling
- server-side session verification
- session revocation or short-lived sessions
- step-up or recent-authentication checks
- recovery controls
- Next.js and TypeScript integration
- exportable stable user identifiers
- audit or webhook support where useful
- acceptable privacy and data-processing terms
- separate staging and production configurations
- reasonable cost for one user
- documented incident and security practices

Possible providers may include:
- Clerk
- WorkOS AuthKit
- Auth0
- another reputable provider meeting the criteria

The exact provider should be selected through a separate implementation decision if not immediately obvious from prototype testing.

## Rationale

Authentication is too consequential to treat as a learning exercise inside the MVP.

North Vector should spend its custom engineering effort on the distinctive trust boundaries of the product:
- memory inspection
- permission scope
- device trust
- approval and execution
- deletion
- provenance
- context retrieval

A managed provider reduces the amount of custom cryptographic and recovery code while enabling a passkey-first user experience.

Passkeys are preferred because they reduce phishing and password-reuse risk while fitting the single-user, multi-device future of North Vector.

The provider is not permitted to become the whole authorization layer. Authentication answers who is present. North Vector must still decide what that authenticated identity may access or do in the current session, device, context, and approval state.

## Consequences

### Positive Consequences

- stronger Phase 1 authentication
- passkey support without custom WebAuthn infrastructure
- lower risk of password and recovery implementation mistakes
- faster delivery
- easier multi-device access
- provider-managed protocol and browser compatibility
- reduced credential-storage burden
- stronger foundation for reauthentication

### Negative Consequences

- external provider dependency
- possible recurring cost
- provider outage may block new login
- migration may be nontrivial
- provider recovery behavior may require extra controls
- some identity metadata is processed externally

### Operational Consequences

- separate staging and production authentication applications are required
- provider keys and webhook secrets must be managed securely
- login and provider health should be monitored
- session and recovery runbooks are required
- outages should preserve safe existing-session behavior where appropriate
- provider configuration changes should be audited

### Security and Privacy Consequences

- the authentication provider becomes a high-value dependency
- North Vector must review provider privacy and security terms
- stable provider user ID should map to an internal North Vector user ID
- application authorization must never rely only on frontend provider claims
- recovery events should trigger audit and possibly notification
- passkey registration and removal should be visible to Nishad
- provider tokens and secrets must remain server-side

### Data and Migration Consequences

- internal user identity must not depend solely on provider-specific identifiers
- a provider-to-internal-user mapping is required
- device and application sessions need separate records
- migration to another provider should preserve the internal user ID
- authentication audit events should reference internal identity and provider event IDs where useful

## Identity Model

North Vector should distinguish:
- Internal User
- Authentication Provider Identity
- Application Session
- Trusted Device
- Assurance Level
- Permission
- Approval

A valid provider session should not automatically imply:
- trusted device
- recent authentication
- access to Restricted data
- approval authority for a pending action
- permission to modify integrations

## Session Model

The application should maintain its own session metadata, including:
- session_id
- user_id
- provider_session_reference
- device_id
- created_at
- last_activity_at
- expires_at
- assurance_level
- reauthenticated_at
- revoked_at
- risk_flags
- audit_reference

The provider may issue the underlying identity session, but North Vector should enforce its own expiration, revocation, and assurance policy.

## Trusted Device Model

Device trust should be separate from authentication.

A device record may include:
- device_id
- user_id
- device label
- platform
- trust level
- first_seen_at
- last_seen_at
- registered_at
- revoked_at
- last_assurance_at
- notification capability

Trusted-device status should be revocable.

## Reauthentication Rules

Fresh authentication should be required for:
- full data export
- full account deletion
- integration connection or permission expansion
- viewing or changing critical security settings
- recovery changes
- future Restricted financial or health actions
- other high-risk operations defined by policy

A recent provider session alone may not be sufficient if North Vector's application assurance window has expired.

## Recovery Rules

Recovery should:
- use the provider's secure recovery process
- create an audit event
- revoke or review existing sessions where appropriate
- notify Nishad through an independent channel when practical
- require re-registration of trusted devices when risk warrants it
- never silently restore broad access after suspicious recovery

## Provider Abstraction Rules

Authentication-provider-specific logic should be isolated behind an adapter.

The rest of the application should depend on normalized concepts such as:
- authenticated user ID
- authentication time
- assurance level
- provider session reference
- recovery event

Provider-specific claims should not spread through domain code.

## Implementation Notes

Phase 1 should implement:
- managed authentication provider integration
- passkey registration and sign-in
- secure session cookies
- server-side session verification
- internal user mapping
- application session records
- session expiration
- session revocation
- trusted-device records
- reauthentication timestamp
- authentication audit events
- recovery-event handling where supported
- settings interface for active sessions and devices

## Security Requirements

The implementation should enforce:
- secure, HTTP-only cookies
- SameSite and CSRF protections appropriate to the framework
- TLS only
- server-side authorization
- short-lived or revocable sessions
- no provider secret in client code
- session fixation protection
- state and nonce validation for OAuth-style flows where applicable
- replay resistance
- rate limiting or provider abuse controls
- audit of passkey and recovery changes

## Availability Behavior

If the authentication provider is unavailable:
- new logins may fail safely
- existing verified sessions may continue only within their current expiration and risk policy
- sensitive reauthentication-dependent actions should remain blocked
- the application should clearly report authentication-provider degradation
- no insecure fallback login should be enabled

## Testing Requirements

Required tests include:
- unauthenticated request is rejected
- valid passkey login creates an application session
- expired application session is rejected
- revoked session loses access
- revoked device loses trusted status
- sensitive operation requires recent authentication
- frontend cannot forge assurance level
- provider user maps to stable internal user ID
- provider secret does not enter client bundle
- recovery event is audited
- authentication-provider outage fails safely
- session cookie flags are correct
- wrong account cannot access the internal user's data

## Validation Plan

The decision will be validated through:
- provider prototype in local and staging environments
- passkey registration and login
- session expiration test
- session revocation end-to-end test
- trusted-device registration
- reauthentication flow for data export or integration settings
- provider outage simulation
- security review of recovery behavior
- production smoke test

The provider choice should be considered successful when Nishad can use passkeys across trusted devices while North Vector retains clear control over authorization and session risk.

## Rollback or Exit Strategy

North Vector should preserve an internal user ID independent of the provider.

If the provider must be replaced:
1. export or map authentication identities where supported
2. configure the new provider
3. require secure re-enrollment if credential migration is impossible
4. preserve internal user data and permissions
5. revoke old provider sessions
6. update recovery and device records
7. verify account ownership
8. use a superseding ADR or provider-selection decision

The system should not store raw passkey private material. Credentials remain under the provider and user authenticator model.

## Residual Risks

- authentication provider compromise
- weak provider recovery defaults
- account lockout
- provider outage
- malicious or compromised trusted device
- session theft
- misconfigured cookies
- provider-specific lock-in
- social-engineering attacks against recovery
- user approving a suspicious passkey registration

## Assumptions

- a reputable provider supports the required passkey flow
- one-user cost remains acceptable
- the provider supports staging and production separation
- stable internal-user mapping can be maintained
- North Vector implements its own authorization and device trust
- browser support for passkeys is sufficient for the target devices
- secure recovery is available

## Review Triggers

Revisit this ADR when:
- the selected provider does not support required passkey or revocation behavior
- recovery behavior proves too weak
- provider cost becomes disproportionate
- provider outage materially harms availability
- multi-user or delegated access is introduced
- a native mobile or wearable authentication model is added
- a security incident involves authentication or recovery
- self-hosted identity becomes operationally justified

## Review Date

Before production MVP launch and again after one month of production use.

## Outcome

### Expected Outcome

Managed passkey-capable authentication should provide strong identity assurance and secure recovery without requiring North Vector to build and maintain its own credential system.

### Actual Outcome

Pending provider selection and implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Select the specific provider through prototype evaluation, while preserving this separation between managed authentication and North Vector-owned authorization.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |