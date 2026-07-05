# ADR-0102: Use Firebase Auth for Identity

## Status

Accepted

## Date

2026-07-03

## Decision Owner

Nishad

## Reviewers

- Project Owner

## Related Documents

- `10-Implementation/ADRs/ADR-0009-Use-Managed-Authentication-with-Passkey-Support.md` (superseded in part by this ADR)
- `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`
- `firestore.rules`
- `lib/owner.ts`
- `lib/require-owner.ts`
- `components/auth/auth-gate.tsx`

## Context

This ADR is written retroactively, after Firebase Auth (email/password) was implemented and deployed as the identity layer gating the entire application and its API routes.

The immediate trigger was Firestore Security Rules: rules can only condition access on `request.auth`, so restricting Firestore access to a single owner required an actual authentication mechanism to exist first. There was none at the time — the app had no login flow at all, and Firestore had briefly been left with fully open read/write access to two collections as a result (discovered and corrected earlier in this same reconciliation arc).

ADR-0009 had already decided this category of problem in principle: use a managed authentication provider, with passkey support specifically named as a requirement, candidate providers being Clerk, WorkOS AuthKit, or Auth0. That decision was never implemented. When authentication was actually built, under time pressure to close the open-Firestore-rules gap, it used Firebase Auth with email/password — not one of ADR-0009's named candidates, and not passkeys.

## Decision Drivers

- had to exist before Firestore Security Rules could restrict access at all (see ADR-0101)
- already part of the Firebase project in use for Firestore, Hosting, and Functions — zero new provider integration
- needed to work immediately, since the app was live with open Firestore rules until this was in place
- single-user product; the sign-up flow could be restricted to one specific email address at the application layer
- Cloud Functions and Next.js API routes both needed a way to verify "is this request really from the owner," via Firebase Admin Auth's `verifyIdToken`

## Options Considered

### Option A: Firebase Auth (Email/Password)

Description:
Use Firebase Authentication's email/password provider. A client-side `AuthGate` component wraps the whole app, blocking access until signed in. Sign-up is restricted client-side to one hardcoded owner email. Server-side routes and Cloud Functions verify the caller's ID token via Firebase Admin Auth and check the decoded email against the same owner constant.

Advantages:
- already part of the existing Firebase project — no new account, no new SDK, no new billing relationship
- directly usable from Firestore Security Rules via `request.auth.token.email`, which was the actual immediate need
- Admin SDK (`firebase-admin/auth`) provides server-side token verification, reusable from both Next.js API routes and Cloud Functions
- fast to implement — unblocked the open-Firestore-rules problem same-day

Disadvantages:
- email/password, not passkeys — does not meet ADR-0009's explicit requirement
- not one of ADR-0009's named candidate providers (Clerk, WorkOS AuthKit, Auth0), though ADR-0009 did allow "another reputable provider meeting the criteria"
- sign-up restriction to one owner email is enforced client-side in `components/auth/auth-gate.tsx`, which is a UX guard, not a security boundary — Firestore Security Rules (checking email, not merely presence of auth) are what actually prevent a different Firebase Auth account from reading data
- no passkey, WebAuthn, or multi-factor support implemented

Risks:
- if the client-side sign-up restriction were ever mistaken for the real security boundary, that would be a meaningful misunderstanding — the actual boundary is the Firestore rules' email check and the `requireOwner`/`verifyOwner` server-side checks, not the sign-up form

### Option B: Implement ADR-0009 as Originally Decided (Clerk, WorkOS, or Auth0 with Passkeys)

Description:
Follow ADR-0009 as written — integrate one of the named managed providers with passkey support.

Advantages:
- would have honored the existing accepted ADR rather than superseding it
- passkeys are genuinely stronger authentication than email/password
- purpose-built auth providers offer more session/device management surface than Firebase Auth's baseline

Disadvantages:
- a new provider, new credentials, new integration work, at the exact moment the open-Firestore-rules gap needed closing same-day
- would not have been natively usable from Firestore Security Rules without a token-exchange step (Firestore rules only understand Firebase Auth tokens directly)
- higher implementation cost than the problem's urgency justified

Risks:
- delaying the Firestore lockdown fix while integrating a new provider would have left the open-rules window open longer

### Option C: No Authentication, Rely on Obscurity or a Shared Secret

Description:
Keep Firestore open, or gate it with a single static shared secret rather than real per-user authentication.

Advantages:
- zero implementation time

Disadvantages:
- this was the exact state that had already been identified as a problem (fully open Firestore collections found and flagged earlier)
- a static secret provides no real identity, no revocation, no audit trail

Risks:
- unacceptable for a system that was about to store encrypted bank-connection data (Plaid)

## Decision

North Vector will use Firebase Auth (email/password provider) for identity.

- `components/auth/auth-gate.tsx` wraps the entire app; unauthenticated users see a sign-in/sign-up form and nothing else
- sign-up is restricted, client-side, to one hardcoded owner email constant (`lib/owner.ts`)
- Firestore Security Rules independently enforce the real authorization boundary: `request.auth != null && request.auth.token.email == "<owner email>"`, for every collection except those explicitly denied to all client access (see ADR-0101)
- server-side routes (`lib/require-owner.ts`) and Cloud Functions (`functions/src/require-owner.ts`) verify the caller's Firebase ID token via Admin Auth's `verifyIdToken` and check the decoded email, independent of and in addition to Firestore rules

This decision explicitly does not implement passkeys, WebAuthn, or multi-factor authentication. ADR-0009's passkey requirement is not met.

## Rationale

This ADR is retroactive. Firebase Auth was chosen under real time pressure to close an actual open-access gap in Firestore, not selected from a calm comparative evaluation of ADR-0009's candidate list.

Given the constraint that Firestore Security Rules only understand Firebase Auth tokens natively, and given that the Firebase project was already in use for Firestore and Functions (see ADR-0101), Firebase Auth was the option that could plug directly into the specific mechanism that needed fixing that day, with no new provider onboarding. A purpose-built provider with passkeys (Clerk, WorkOS, Auth0) remains a legitimate stronger option in the abstract, but was not what got built, and this ADR's job is to record what was actually built, not what should have been.

## Consequences

### Positive Consequences

- closed the actual open-Firestore-rules gap same-day
- one Firebase project for auth, data, and functions
- server-side token verification (`verifyIdToken`) works identically from Next.js API routes and Cloud Functions, since both use the Admin SDK

### Negative Consequences

- no passkey or WebAuthn support; ADR-0009's stated security goal (phishing- and credential-reuse-resistant authentication) is not met
- no multi-factor authentication
- no device trust, session revocation UI, or reauthentication-for-sensitive-actions model — ADR-0009 specified all of these; none exist
- password reset flow was not built as part of this work (not exercised or verified)

### Operational Consequences

- the owner email constant (`lib/owner.ts`) is duplicated conceptually across Firestore rules (hardcoded string), `lib/require-owner.ts`, and `functions/src/require-owner.ts` (a separate file, since Cloud Functions is a distinct runtime from the Next.js app) — changing the owner's email requires updating all of these consistently
- there is no session/device management interface; the only control available is Firebase's own sign-out

### Security and Privacy Consequences

- the real security boundary is the combination of Firestore Security Rules' email check and the server-side `verifyOwner`/`requireOwner` checks — not the client-side sign-up gate, which is a convenience restriction only
- a leaked Firebase ID token is valid for its lifetime (approximately one hour) and grants whatever the owner-email check allows; this was directly observed during manual testing this session, when tokens were briefly visible in terminal output and chat — acceptable given their short lifetime, but worth naming as a real exposure that occurred
- no reauthentication-for-sensitive-action model exists; a stolen valid session token can perform any owner-permitted action for the remainder of its lifetime

### Data and Migration Consequences

- the Firebase Auth UID is the identity referenced by `ownerUid` fields written into Firestore (for example, `plaid_items` documents record the UID of the authenticated caller at write time)
- migrating away from Firebase Auth would require re-establishing this UID mapping for any future auth provider

## Implementation Notes

Already implemented and live:
- `lib/firebase.ts` exports `auth` (client SDK)
- `components/auth/auth-gate.tsx` — sign-in/sign-up UI, session state via `onAuthStateChanged`, sign-up restricted to the owner email
- `lib/owner.ts` — shared owner email constant for the Next.js app
- `lib/require-owner.ts` — server-side Bearer-token verification for Next.js API routes, using `firebase-admin/auth`
- `functions/src/require-owner.ts` — equivalent verification for Cloud Functions (separate implementation, same pattern, since Functions is a distinct Node project from the Next.js app)
- `firestore.rules` — the actual enforced authorization boundary

## Validation Plan

Already validated through real use:
- signed up as the owner email via the deployed app; confirmed sign-up with any other email is rejected client-side before any Firebase call is made
- confirmed unauthenticated Firestore access is denied (verified empirically against the live database, not just in rules syntax)
- confirmed `requireOwner`/`verifyOwner` reject requests with a missing, malformed, or non-owner-email token (observed directly during manual testing, including several real mistakes — a placeholder token, a token with literal angle brackets included — that were correctly rejected)

## Rollback or Exit Strategy

If Firebase Auth is replaced by a passkey-capable provider (fulfilling ADR-0009 as originally intended, or a new decision):
1. preserve the Firebase Auth UID-to-data mapping (`ownerUid` fields already written) or plan a one-time remap
2. stand up the new provider behind the existing `requireOwner`/`verifyOwner` boundary shape, so calling code does not need to change
3. update Firestore Security Rules to check whatever claim the new provider's tokens carry (rules are presently hardcoded to Firebase-Auth-specific token shape)
4. update `AuthGate` and any client-side token-fetching code
5. use a superseding ADR

## Residual Risks

- ADR-0009's security goals (passkeys, MFA, device trust, reauthentication-for-sensitive-actions) remain unmet
- owner-email constant duplicated across three locations with no single source of truth enforced at build time
- no password reset flow has been built or tested
- ID tokens were exposed in terminal/chat output during development; low risk given short token lifetime, but a reminder that this identity model has no revocation mechanism faster than token expiry

## Assumptions

- North Vector remains single-user through the period this ADR governs
- Firebase remains the platform for data and functions (see ADR-0101, ADR-0103), making Firebase Auth the lowest-friction identity choice
- the owner is willing to accept password-based auth (not passkeys) for the current phase

## Review Triggers

Revisit this ADR when:
- multi-user support is introduced (the hardcoded-owner-email model does not extend to multiple users)
- ADR-0009's passkey/MFA/device-trust requirements become a priority again
- a credential-leakage incident occurs
- password reset is actually needed and must be built and tested

## Review Date

Not scheduled — revisit on trigger.

## Outcome

### Expected Outcome

Unblock Firestore Security Rules enforcement quickly, using infrastructure already in place.

### Actual Outcome

Live in production. Firestore access is now genuinely restricted to the owner, verified empirically. Passkey/MFA/device-trust goals from ADR-0009 remain unimplemented.

### Lessons

- authentication was built reactively, to close a discovered security gap, rather than proactively per ADR-0009 — worth noting as a pattern: security-boundary infrastructure (auth) should arguably be sequenced before the data layer it's meant to protect goes live, not after
- three separate owner-email constants (Firestore rules, Next.js, Cloud Functions) is a real maintenance risk; a shared source of truth would be worth building before this decision is revisited

### Follow-Up Decision

Keep for the current single-user phase. Treat ADR-0009's passkey/MFA requirements as still open and unaddressed, not resolved.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-07-03 | Initial ADR, written retroactively after implementation | Nishad |
