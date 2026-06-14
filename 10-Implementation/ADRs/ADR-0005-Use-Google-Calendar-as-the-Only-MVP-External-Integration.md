# ADR-0005: Use Google Calendar as the Only MVP External Integration

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Integration Owner
- Security Owner
- Privacy Owner
- Product Owner

## Related Documents

- `10-Implementation/Implementation_Roadmap.md`
- `10-Implementation/MVP_Scope_and_Acceptance_Criteria.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/Implementation_Decision_Log.md`
- `10-Implementation/ADRs/ADR-0003-Separate-Reasoning-Approval-Execution-and-Verification.md`
- `09-Data-and-Memory/Data_Synchronization_and_Conflict_Resolution.md`

## Context

The full North Vector vision includes many external systems, including:
- Google Calendar
- Gmail
- Contacts
- academic portals
- Google Drive
- GitHub
- financial providers
- health platforms
- weather
- location
- voice and wearable interfaces

Each integration adds:
- authentication and token handling
- permission scope
- source-of-truth rules
- synchronization behavior
- conflict handling
- provider-specific failures
- data-retention questions
- privacy and security risk
- testing and operational burden

Phase 1 must prove that North Vector can connect reasoning and planning to real external state without allowing provider complexity to overwhelm the MVP.

Calendar provides the clearest operational value for the first integration because it constrains time, reveals scheduling conflicts, supports daily briefing and replanning, and allows one narrow external write: creating an approved event.

The project does not yet need multiple integrations to validate its core architecture.

## Decision Drivers

- MVP scope control
- immediate user value
- schedule-aware planning
- narrow permission surface
- manageable implementation complexity
- strong end-to-end testability
- low provider count
- clear source-of-truth behavior
- support for the chemistry-exam vertical slice
- minimal privacy exposure
- simple deployment and operations

## Options Considered

### Option A: Google Calendar Only

Description:
Use Google Calendar as the sole required external integration for the MVP. Support read synchronization and approval-gated event creation.

Advantages:
- directly improves daily planning
- supports fixed-time constraints and availability
- enables the chemistry-exam workflow
- limits OAuth, token, and provider complexity
- provides a clear test case for synchronization and conflict handling
- keeps Gmail, academic data, finance, health, and files out of the initial privacy scope

Disadvantages:
- Chief cannot yet inspect email or assignments directly
- some planning data must be entered manually
- the MVP may feel less connected than the eventual vision
- Google-specific behavior still requires careful handling

Risks:
- Calendar API complexity may still delay the MVP
- recurrence and shared events may introduce edge cases
- one provider outage may reduce planning freshness

### Option B: Google Calendar and Gmail

Description:
Include Calendar plus Gmail search, thread reading, task extraction, drafting, and possibly sending.

Advantages:
- more useful relationship and commitment context
- stronger Chief-of-Staff experience
- broader real-world data

Disadvantages:
- much larger privacy surface
- more complex OAuth scopes
- prompt injection through email content
- external send actions require additional approval and verification logic
- inbox volume and prioritization create major product complexity

Risks:
- MVP scope inflation
- unsafe email actions
- delayed release
- excessive personal data ingestion

### Option C: Google Calendar and Academic Portal

Description:
Include Calendar and coursework data such as assignments, announcements, and grades.

Advantages:
- strong immediate academic value
- better study planning
- fewer manual deadlines

Disadvantages:
- provider access may be unofficial or unstable
- data normalization is complex
- syllabus, announcement, and portal conflicts require more source logic
- may depend on scraping or brittle browser automation

Risks:
- implementation stalls on portal constraints
- official and inferred academic data become confused
- terms-of-service or reliability concerns

### Option D: Local-Only MVP

Description:
Ship the MVP without any external integrations.

Advantages:
- lowest security and privacy risk
- fastest implementation
- no OAuth or provider dependencies
- easier testing and deployment

Disadvantages:
- planning remains disconnected from real schedule
- daily briefing requires manual event entry
- the most important integration architecture remains unproven
- weaker demonstration of approval-gated external action

Risks:
- the MVP may feel like a sophisticated local task manager rather than a connected operating system

### Option E: Several Read-Only Integrations at Once

Description:
Connect Calendar, Gmail, Contacts, Drive, academic systems, finance, and health in read-only mode.

Advantages:
- rich context
- broad demonstration of the vision
- no external writes for most systems

Disadvantages:
- many OAuth and provider adapters
- large data and privacy footprint
- complex synchronization and provenance
- difficult testing
- read-only does not eliminate exposure risk

Risks:
- integration sprawl
- unstable MVP
- excessive context ingestion
- weak deletion and disconnection behavior

## Decision

Google Calendar will be the only required external product integration for the North Vector MVP.

The MVP Calendar scope will include:
- connecting one Google account
- reading approved calendars
- synchronizing events
- preserving event IDs, versions, timezones, and freshness
- identifying fixed and flexible events
- detecting direct scheduling conflicts
- using Calendar state in Today, daily briefing, and planning
- proposing creation of a new Calendar event
- requiring exact server-side approval before event creation
- verifying the created event in provider state
- disconnecting the account and stopping synchronization

The MVP will not require:
- Gmail
- Contacts
- academic portal access
- Drive
- GitHub integration
- finance
- health
- weather
- location
- voice
- wearables

## Scope Constraints

Phase 1 should initially support:
- simple event reads
- one approved target calendar for writes
- single event creation
- ordinary timezone handling
- visible last-sync status
- clear authentication-expired state

The following may be deferred if they threaten the MVP timeline:
- complex recurring-event edits
- shared-event modification
- attendee management
- event deletion
- moving existing events
- multi-calendar write policies
- advanced travel-time calculations

## Rationale

Google Calendar is the smallest integration that proves North Vector can operate against real external state.

It connects the system's internal planning model to actual time constraints, which is essential for a Chief-of-Staff product. It also exercises the most important technical and safety boundaries:
- OAuth and scoped permissions
- synchronization
- provider freshness
- source-of-truth rules
- conflict handling
- external action proposal
- payload-bound approval
- idempotent execution
- provider verification
- audit history

Adding Gmail or academic systems during Phase 1 would multiply the data, privacy, prompt-injection, and operational surface before the Calendar path is stable.

A local-only MVP would be simpler, but it would leave too many important architectural assumptions untested.

Google Calendar therefore provides the strongest value-to-complexity ratio for the first external integration.

## Consequences

### Positive Consequences

- tighter MVP scope
- real schedule-aware planning
- one OAuth provider to secure and monitor
- one synchronization adapter to build well
- lower privacy and deletion complexity
- simpler integration testing
- clear end-to-end release workflow
- easier operational monitoring
- reduced risk of provider sprawl

### Negative Consequences

- email and academic obligations require manual entry
- relationship and file context remain local-only
- the MVP demonstrates a narrower version of the long-term vision
- Calendar downtime affects schedule freshness
- Google-specific implementation work still requires care

### Operational Consequences

- one integration health model is required
- one OAuth client is needed per environment
- one provider-specific runbook should cover token expiration and sync failure
- Calendar sync freshness should be visible
- provider outages should degrade to stale read-only state
- external writes need a global pause control

### Security and Privacy Consequences

- the initial OAuth and token surface remains narrow
- Calendar descriptions are untrusted external content and require prompt-injection protection
- only approved calendars should be synchronized
- tokens must be encrypted at rest
- disconnection must revoke or remove access and stop background jobs
- sensitive event details should be protected in public and limited-trust views

### Data and Migration Consequences

- Event objects must preserve provider ID, calendar ID, version, timezone, and sync status
- source-of-truth rules must distinguish provider-owned fields from North Vector metadata
- disconnection and deletion behavior must be explicit
- later integrations should reuse the adapter and provenance patterns proven here

## Implementation Notes

Phase 1 should implement:
- Google OAuth configuration per environment
- narrow Calendar scopes
- encrypted token storage
- integration connection record
- approved-calendar scope
- Calendar adapter
- incremental or timestamp-based synchronization
- event normalization
- timezone preservation
- provider revision tracking
- stale-data state
- event proposal object
- approval-bound write path
- idempotency key
- provider verification
- disconnect and cleanup flow
- Calendar-specific audit events

Recommended sequence:
1. Connect test account.
2. Read one test calendar.
3. Normalize events.
4. Show freshness and conflicts.
5. Use events in planning.
6. Propose one event creation.
7. Approve exact payload.
8. Create once.
9. Verify provider state.
10. Disconnect and confirm sync stops.

## Permission Model

The system should request only the minimum scopes needed for the active feature set.

Read access should be introduced before write access.

Write scope should not be enabled in production until:
- approval and execution services are implemented
- payload mutation tests pass
- idempotency is verified
- provider verification works
- audit history is complete

## Source of Truth Rules

For Calendar events:
- event start and end time: Google Calendar
- event attendees: Google Calendar
- provider event status: Google Calendar
- strategic relevance: North Vector
- linked goal or task: North Vector
- flexibility classification: North Vector unless explicitly provider-owned
- planning recommendation: North Vector

## Synchronization Rules

The adapter should:
- preserve provider event IDs
- track provider versions or update timestamps
- show last successful sync
- avoid overwriting newer provider state
- mark stale data clearly
- stop after token revocation or disconnection
- handle deleted and canceled events explicitly

## Write Rules

Calendar event creation should require:
- authenticated user
- current permission scope
- approved target calendar
- exact stored payload
- valid unexpired approval
- idempotency key
- provider availability
- verification after creation

Existing event modification and deletion may remain out of MVP scope.

## Testing Requirements

Required tests include:
- OAuth connection and disconnection
- only approved calendars are read
- token is not exposed in logs or client code
- event timezone is preserved
- last-sync state is visible
- stale data is labeled
- expired authentication is handled
- Calendar description prompt injection cannot authorize action
- event proposal is payload-bound
- changed time invalidates approval
- duplicate event creation is prevented
- provider timeout creates an Uncertain result
- provider state verifies exact event creation
- disconnect stops synchronization
- cached provider data follows cleanup policy

## Validation Plan

The decision will be validated through:
- the chemistry-exam vertical slice
- dedicated Google test account and calendar
- synchronization contract tests
- token expiration simulation
- event creation and verification test
- duplicate-action test
- prompt-injection test using Calendar description content
- one week of real MVP usage

The integration should be considered successful when it improves planning without creating confusion about freshness, authority, or what the system changed.

## Rollback or Exit Strategy

If Google Calendar integration blocks or destabilizes the MVP:
- release local planning first
- keep Calendar read-only
- disable write scope
- allow manual event entry
- preserve the integration behind a feature flag

If Google Calendar is later replaced or supplemented:
- retain canonical Event objects
- preserve provider adapters
- migrate source references deliberately
- keep provider-specific metadata outside domain logic
- create a new ADR for any additional required MVP-level integration

## Residual Risks

- Google API or OAuth policy changes
- recurrence edge cases
- event duplication after uncertain provider response
- stale event data
- shared-event semantics
- provider rate limits
- sensitive descriptions entering model context
- user may grant broader account access than intended

## Assumptions

- Google Calendar remains available through supported APIs
- one account and limited calendars are sufficient for MVP
- the user can create a dedicated test calendar
- simple event creation provides enough proof for the external-write architecture
- academic and email obligations can be entered manually during MVP
- Calendar freshness within roughly one hour is sufficient for ordinary planning

## Review Triggers

Revisit this ADR when:
- the MVP completes one stable week of use
- Gmail or academic integration is proposed
- Calendar API constraints materially block the roadmap
- provider scopes need to expand
- event modification or deletion is added
- multi-user access is introduced
- another provider offers a better schedule source
- privacy review identifies unacceptable Calendar exposure

## Review Date

At the post-MVP expansion review or when the first review trigger occurs.

## Outcome

### Expected Outcome

Google Calendar should provide enough real-world connection to validate North Vector's planning, synchronization, approval, execution, and verification architecture without causing integration sprawl.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep through MVP. Evaluate the next integration only after Calendar synchronization, privacy, deletion, and write controls are trusted.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |