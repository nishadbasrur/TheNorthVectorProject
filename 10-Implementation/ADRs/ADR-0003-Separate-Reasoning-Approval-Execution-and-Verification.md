# ADR-0003: Separate Reasoning, Approval, Execution, and Verification

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Security Owner
- AI Safety Owner
- Execution Owner
- Audit Owner

## Related Documents

- `08-Security-and-Privacy/Threat_Model.md`
- `08-Security-and-Privacy/Security_Testing_and_Audit_Plan.md`
- `10-Implementation/MVP_Scope_and_Acceptance_Criteria.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/Implementation_Decision_Log.md`
- `10-Implementation/ADRs/ADR-0002-Use-a-Modular-Monolith-for-Phase-1.md`

## Context

North Vector is intended to reason over personal goals, tasks, memories, commitments, calendars, files, messages, and future integrations.

Some of those workflows will eventually involve external actions such as:
- creating Calendar events
- drafting and sending messages
- modifying files
- creating commits or pull requests
- changing shared schedules
- deleting records
- publishing information

A language model can generate useful recommendations and action proposals, but model output is probabilistic, may be incomplete, may be influenced by untrusted content, and may misunderstand user intent.

A visual confirmation step alone is not sufficient. If the backend does not enforce approval against the exact target and payload, the interface may provide the appearance of control without the underlying security property.

External providers also introduce uncertainty. A timeout may occur after an action succeeds, or a provider may accept a write while the application fails to record the result. The system must therefore distinguish proposal, approval, attempted execution, provider result, and verified final state.

The architecture needs a durable boundary that prevents reasoning from silently becoming authority.

## Decision Drivers

- user control
- prevention of unauthorized external action
- prompt-injection resistance
- exact intent preservation
- auditability
- provider uncertainty handling
- duplicate-action prevention
- payload integrity
- revocation and expiration
- testability
- future autonomy without loss of trust

## Options Considered

### Option A: Separate Reasoning, Approval, Execution, and Verification

Description:
Use four distinct stages and records:
1. Reasoning produces a recommendation or proposed action.
2. Approval authorizes an exact target and payload for a limited time.
3. Execution performs the action through a controlled adapter.
4. Verification checks provider or system state independently.

Advantages:
- preserves a clear authority boundary
- model output cannot directly cause external action
- approval can be payload-bound and time-limited
- provider uncertainty is represented honestly
- duplicate retries can be blocked
- audit history can reconstruct the full chain
- future autonomy can be granted narrowly by stage and action type
- each stage can be tested independently

Disadvantages:
- adds state and implementation complexity
- creates extra user interaction for external writes
- requires action records and lifecycle management
- may feel slower for low-risk actions
- verification is not equally available for every provider

Risks:
- implementation may become cumbersome if every trivial local mutation uses the full pipeline
- approval records may accumulate without cleanup
- verification adapters may return incomplete evidence

### Option B: Model Directly Calls Tools After Interpreting User Intent

Description:
Allow the reasoning model to invoke external tools directly when it believes the user requested an action.

Advantages:
- fast interaction
- simpler architecture
- fewer visible confirmation steps
- natural conversational experience

Disadvantages:
- model interpretation becomes authority
- prompt injection can influence action selection
- difficult to prove exact user consent
- weak protection against payload mutation
- provider uncertainty may cause unsafe retry
- audit reconstruction becomes harder

Risks:
- unauthorized or unintended actions
- hidden scope expansion
- duplicate writes
- severe trust failure

### Option C: Frontend Confirmation Only

Description:
Display a confirmation modal, then let the client or route handler execute the latest action state.

Advantages:
- straightforward interface implementation
- user sees a confirmation step
- lower backend complexity

Disadvantages:
- approval may not be enforced server-side
- payload can change after confirmation
- client state may be tampered with or stale
- execution cannot prove which exact version was approved

Risks:
- fake approval boundary
- changed recipient, time, file, or body executes under old consent

### Option D: Session-Level or Category-Level Approval

Description:
Allow Nishad to approve a broad category such as `Calendar changes for this session` or `send messages today`.

Advantages:
- low friction
- useful for repeated routine actions
- simpler than per-action approval

Disadvantages:
- weak payload specificity
- difficult to revoke one pending action
- large blast radius
- more vulnerable to prompt injection and context confusion

Risks:
- an approval intended for one action authorizes another
- stale approval remains valid after context changes

## Decision

North Vector will separate reasoning, approval, execution, and verification as distinct system stages.

For every consequential external action:

1. **Reasoning** may create a proposed action.
2. **Approval** must authorize the exact target and payload unless a separately approved automation policy explicitly permits narrow autonomous execution.
3. **Execution** must revalidate identity, permission, approval, payload integrity, and target state before acting.
4. **Verification** must inspect the provider or system result rather than trusting execution intent alone.

The reasoning model may not directly invoke external write adapters.

The frontend may display and collect approval, but server-side services must enforce the approval boundary.

## Stage Definitions

### Reasoning

Reasoning may:
- analyze context
- recommend an action
- produce a structured proposal
- explain tradeoffs and uncertainty

Reasoning may not:
- grant permission
- approve its own proposal
- bypass action policy
- directly write to an external provider

### Approval

Approval should include:
- action ID
- action type
- target system
- target identifier
- immutable payload or payload hash
- approving identity
- assurance level
- approval time
- expiration time
- approval scope
- status

Approval should become invalid when:
- payload changes materially
- target changes
- permission changes
- integration disconnects
- approval expires
- user revokes it
- action is superseded
- security state becomes uncertain

### Execution

Execution must check:
- authenticated actor
- current session assurance
- device trust where required
- action permission
- integration scope
- approval validity
- exact payload integrity
- current provider version or target state
- idempotency key
- release or system safety state

Execution should produce a structured result:
- Not Attempted
- Attempting
- Succeeded
- Failed
- Partially Succeeded
- Uncertain

### Verification

Verification should check independent state where possible.

Examples:
- fetch the created Calendar event
- confirm the external ID and event details
- inspect the committed file and commit SHA
- confirm the sent message exists in provider state

Verification should never convert an uncertain provider response into success without evidence.

## Action Lifecycle

Suggested lifecycle:

Proposed
↓
Awaiting Approval
↓
Approved or Rejected
↓
Ready for Execution
↓
Executing
↓
Succeeded, Failed, Partially Succeeded, or Uncertain
↓
Verified, Verification Failed, or Verification Unavailable
↓
Closed, Rolled Back, or Requires Review

## Required Action Record

Each consequential action should contain:
- action_id
- action_type
- target_system
- target_object_id
- proposed_payload
- payload_hash
- proposal_source
- risk_level
- permission_requirement
- approval_status
- approval_id
- execution_status
- idempotency_key
- provider_request_reference
- provider_response_summary
- verification_status
- rollback_status
- requested_at
- approved_at
- executed_at
- verified_at
- expires_at
- audit_reference

## Approval Granularity

Phase 1 should use per-action approval for Calendar writes.

Future automation may use preapproved policies only when they define:
- exact action category
- narrow object scope
- bounded time or trigger
- maximum effect
- revocation
- monitoring
- automatic pause

A broad statement such as `manage my Calendar` is not sufficient authorization for unrestricted writes.

## Local Actions

Not every local low-risk action requires the complete external-action approval flow.

Examples that may be allowed without separate confirmation under user settings:
- create a local draft task
- create a candidate memory
- update temporary session state
- generate a plan proposal

However, local actions still require:
- authorization
- validation
- audit behavior where consequential
- clear reversibility or inspection

Deletion, Restricted-data changes, permission changes, and broad memory writes may still require explicit confirmation even when local.

## Rationale

This architecture establishes the central trust boundary for North Vector.

The reasoning layer is powerful but should not be authoritative. Approval preserves Nishad's intent. Execution enforces policy and current state. Verification establishes what actually happened.

Separating these stages directly mitigates several of the project's highest-priority risks:
- prompt injection
- payload mutation
- approval confusion
- duplicate execution
- false success reporting
- provider timeout uncertainty
- model output bypassing domain logic

The additional complexity is justified because North Vector is intended to become increasingly connected and autonomous. A weak action boundary introduced early would become difficult and dangerous to repair later.

## Consequences

### Positive Consequences

- clear user authority boundary
- model output cannot directly perform external writes
- exact payload consent
- strong audit reconstruction
- safer retry behavior
- honest uncertain-state handling
- narrow future autonomy
- easier security testing
- provider verification becomes explicit
- action history is inspectable

### Negative Consequences

- more state machines and database records
- additional interface steps
- slower interaction for simple writes
- adapters must implement verification behavior
- pending approvals require cleanup and expiration
- partial failure handling becomes more complex

### Operational Consequences

- execution and verification health must be monitored separately
- external writes may need global pause controls
- uncertain actions require operator review
- stale approvals must be canceled after outages
- runbooks must cover duplicate-risk and unknown provider state
- audit failure may require read-only safe mode

### Security and Privacy Consequences

- greatly reduces unauthorized action risk
- limits authority granted to model reasoning
- requires secure approval records
- approval endpoints become high-value security surfaces
- Restricted actions may require stronger authentication
- action payload logs must minimize sensitive content

### Data and Migration Consequences

- proposed actions, approvals, execution attempts, and verification results require durable schemas
- action payload versions must be immutable or hash-bound
- migrations must preserve approval and action history
- expired and rejected approvals require retention and cleanup policies

## Implementation Notes

Phase 1 should implement:
- `proposed_actions` storage
- `approvals` storage
- immutable payload representation or stable canonical hash
- approval expiration
- approval rejection and revocation
- execution service
- provider adapter boundary
- execution idempotency
- verification service
- action audit events
- approval tray interface
- external-write pause control

Recommended internal flow:

```text
Chief Reasoning
  -> ProposedActionService
  -> ApprovalService
  -> ExecutionService
  -> ProviderAdapter
  -> VerificationService
  -> AuditService
```

The execution service should not accept arbitrary payloads from the client. It should load the stored approved action by ID and verify its current state.

## Payload Integrity

The payload should be represented canonically before approval.

For Calendar event creation, relevant fields may include:
- calendar ID
- title
- description
- start time
- end time
- timezone
- location
- attendees
- recurrence
- visibility

Material changes require fresh approval.

Nonmaterial display-only changes may be excluded from the payload hash only if defined explicitly.

## Idempotency

Each execution attempt should use an idempotency key tied to the action.

Before retrying, the system must:
- inspect prior execution status
- query provider state when possible
- avoid retry if outcome is uncertain and duplication is possible

## Verification Standards

Verification should compare provider state with the approved payload.

Possible results:
- Verified Exact Match
- Verified with Provider Normalization
- Verification Failed
- Verification Unavailable
- Provider State Conflicted

Provider normalization may include harmless changes such as generated IDs or canonical timezone formatting.

## Audit Requirements

The audit chain should preserve:
- proposal created
- approval requested
- approval granted, rejected, expired, or revoked
- execution started
- provider response received
- verification completed
- rollback or compensating action

The system should be able to reconstruct who authorized what exact action and what result was observed.

## Testing Requirements

Required tests include:
- model output cannot call external adapter directly
- unauthenticated approval rejected
- approval bound to exact payload
- changed target invalidates approval
- changed Calendar time invalidates approval
- expired approval rejected
- revoked permission blocks execution
- integration disconnect blocks execution
- duplicate execution prevented
- provider timeout creates Uncertain state
- uncertain action is not retried blindly
- provider state verification detects mismatch
- audit chain contains all stages
- frontend cannot bypass server-side approval

## Validation Plan

The decision will be validated through:
- Calendar event creation vertical slice
- approval mutation end-to-end test
- duplicate-action test
- prompt-injection test
- provider-timeout simulation
- audit reconstruction test
- session revocation during pending approval
- integration disconnection during pending approval

Success means the system cannot perform a consequential external action from model reasoning or client state alone.

## Rollback or Exit Strategy

This decision is intended to be durable.

Future product versions may reduce user friction through:
- approved automation policies
- reusable narrow permissions
- batch approval
- trusted local actions

Those changes should preserve the same underlying separation.

A future system may combine stages operationally for low-risk actions, but it should still maintain distinct authority, execution, and verification semantics.

Removing the separation entirely would require a superseding ADR and a complete security review.

## Residual Risks

- Nishad may approve an action without reviewing it carefully
- a compromised session may submit approval
- canonical payload generation may omit a material field
- provider verification may be incomplete
- an adapter bug may execute a different payload
- action records may expose sensitive content if poorly logged
- preapproved automation may later expand too broadly

## Assumptions

- external providers expose enough state for meaningful verification
- Phase 1 external writes are limited to Calendar event creation
- server-side action and approval storage is available
- the application can use high-assurance authentication for sensitive actions
- the worker and web application share consistent authorization logic
- model output remains untrusted until validated

## Review Triggers

Revisit this ADR when:
- North Vector introduces autonomous external actions
- Gmail sending is added
- file publishing or GitHub merge actions are added
- multi-user or delegated approval is introduced
- batch approvals are proposed
- verification is impossible for a major provider
- action latency creates significant usability failure
- a security incident reveals a weakness in the approval chain

## Review Date

Before adding the second external write integration or after one month of MVP production use, whichever occurs first.

## Outcome

### Expected Outcome

North Vector should preserve a trustworthy boundary between what Chief recommends, what Nishad authorizes, what the system attempts, and what actually occurs.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep as a durable architectural rule unless superseded by a stronger action-governance model.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |