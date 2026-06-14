# ADR-0031: Use Optimistic Concurrency for User-Editable Records

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use optimistic concurrency control for user-editable records and other state where conflicting updates may occur.

Records that can be modified through multiple workflows should carry a version, revision, or update token. Mutations should verify the expected current version before committing changes.

## Context

North Vector records may be modified by:
- direct user edits
- Chief-generated proposals
- background jobs
- synchronization processes
- approval workflows
- deletion workflows
- future automations

Without concurrency control, one workflow may silently overwrite another.

Examples:
- a task is edited while a planning job updates it
- a memory is revised while a candidate merge runs
- a Calendar sync updates provider metadata while the user changes local classification
- an approval is granted after the proposed payload has changed

Silent overwrite is dangerous because North Vector handles personal commitments, memories, approvals, and external actions.

## Decision Drivers

- data integrity
- user trust
- conflict visibility
- safe background processing
- approval correctness
- synchronization safety
- predictable state transitions

## Versioning Model

Editable records should include one or more of:
- integer version
- updated timestamp
- provider revision
- payload hash
- state transition token

Application mutations should provide the expected version.

If the stored version differs, the mutation should fail with a conflict rather than overwriting data silently.

## Conflict Handling

When a conflict occurs, the system should:
- stop the write
- return a clear conflict error
- reload current state
- allow retry, merge, or user review when appropriate

Automated systems should not blindly retry conflicts when the meaning may have changed.

## Approval Payloads

Approval records must be tied to exact payloads and versions.

If the underlying target or proposed payload changes, the approval must become invalid or require fresh approval.

## Synchronization

Provider synchronization should preserve provider versions where available.

The system should distinguish:
- provider-owned fields
- North Vector-owned fields
- derived metadata

Provider sync should not overwrite local state without checking expected versions.

## Background Jobs

Jobs that mutate state should verify:
- target still exists
- lifecycle state still permits mutation
- expected version still matches
- permissions remain valid

Stale jobs should fail safely or reschedule with refreshed context.

## Consequences

### Positive

- prevents silent overwrites
- improves trust and auditability
- supports safe background jobs
- protects approval integrity
- makes conflicts explicit

### Negative

- additional version fields
- more conflict handling logic
- occasional user-facing retry flows
- more tests required

## Implementation Notes

A typical update should behave like:

```text
update record
where id = target_id
and version = expected_version
```

Successful updates increment the version.

Failed updates return a conflict result.

## Testing Requirements

Tests should verify:
- stale version update fails
- concurrent updates do not silently overwrite
- approval invalidates after payload change
- stale background job cannot mutate current state
- conflict errors are understandable
- retries reload current state before applying changes

## Outcome

North Vector gains safer state mutation behavior by making concurrent edits and stale workflows visible instead of allowing silent data loss or incorrect approvals.