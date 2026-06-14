# Operational Runbook Template v1.0

## Purpose

This document defines the standard template North Vector should use for operational runbooks.

An operational runbook exists to provide clear, repeatable steps for diagnosing, containing, recovering from, and verifying common production failures.

Its purpose is not to replace judgment.

Its purpose is to make sure that urgent situations do not depend on memory, improvisation, or guesswork.

## Core Principle

A runbook should make the safest next action obvious.

It should help the operator understand what is happening, stop damage, restore service, and verify that recovery is real.

## When to Create a Runbook

Create a runbook for:
- recurring operational failures
- high-impact but uncommon incidents
- provider outages
- authentication or permission failures
- migration failures
- backup failures
- synchronization problems
- automation failures
- secret exposure
- deletion propagation failures
- audit-log failures
- production deployment failures

Do not create a runbook for:
- trivial bugs with obvious fixes
- one-time exploratory work
- behavior already fully covered by another current runbook

## Runbook File Naming

Recommended naming format:

```text
Runbook-[Short-Incident-Name].md
```

Examples:

```text
Runbook-Calendar-Token-Expiration.md
Runbook-Database-Migration-Failure.md
Runbook-Backup-Restore-Failure.md
Runbook-Unauthorized-External-Action.md
```

## Runbook Statuses

Suggested statuses:
- Draft
- Active
- Under Review
- Deprecated
- Retired

## Runbook Template

```markdown
# Runbook: [Incident or Failure Name]

## Status

[Draft | Active | Under Review | Deprecated | Retired]

## Owner

[Name or operational role]

## Last Reviewed

[YYYY-MM-DD]

## Next Review

[YYYY-MM-DD]

## Related Systems

- [System]
- [Integration]
- [Automation]

## Related Documents

- [Incident Response Plan]
- [Architecture document]
- [Threat model item]
- [Related ADR]
- [Related issue]

## Purpose

Describe what this runbook helps diagnose and recover from.

## Severity Guidance

### Low

[Conditions that make this incident Low severity]

### Moderate

[Conditions that make this incident Moderate severity]

### High

[Conditions that make this incident High severity]

### Critical

[Conditions that make this incident Critical severity]

## Symptoms

Possible symptoms:
- [Symptom]
- [Symptom]
- [Alert or error code]
- [User-visible behavior]

## Likely Causes

Possible causes:
- [Cause]
- [Cause]
- [Provider issue]
- [Configuration issue]
- [Permission issue]

## Immediate Safety Check

Before diagnosis, determine:
- Is sensitive data exposed?
- Is an external action still running?
- Could retries create duplicates?
- Is audit logging available?
- Is the current system state known?
- Should the system enter read-only safe mode?

## Immediate Containment

Perform only the actions that apply:

1. [Pause affected automation.]
2. [Disable external writes.]
3. [Revoke affected session or token.]
4. [Mark provider data stale.]
5. [Preserve logs and evidence.]
6. [Notify Nishad if required.]

## Do Not Do

- Do not [unsafe action].
- Do not retry if [uncertain condition].
- Do not delete evidence before investigation.
- Do not restore from backup without replaying deletions and revocations.

## Initial Diagnosis

### Step 1: Confirm the Incident

Check:
- [Health dashboard]
- [Relevant logs]
- [Provider status]
- [Audit history]
- [Recent deployment]

Expected result:
[What confirms or rules out the incident]

### Step 2: Determine Scope

Identify:
- affected users
- affected devices
- affected integrations
- affected objects
- time range
- pending or completed actions

### Step 3: Determine State Certainty

Classify actions as:
- Confirmed Succeeded
- Confirmed Failed
- Not Attempted
- Uncertain

### Step 4: Identify Recent Changes

Review:
- latest release
- configuration changes
- permission changes
- provider changes
- migration activity
- automation updates

## Diagnostic Commands or Queries

Use only approved and tested commands.

```text
[Command or query]
```

Expected output:
[Expected output]

Warning:
[Safety warning or production caveat]

## Decision Tree

### If [Condition A]

Then:
1. [Action]
2. [Action]
3. Continue to [Section]

### If [Condition B]

Then:
1. [Action]
2. [Action]
3. Continue to [Section]

### If State Is Uncertain

Then:
1. Stop automatic retries.
2. Query independent provider state.
3. Preserve current evidence.
4. Escalate before consequential action.

## Recovery Procedure

### Recovery Path A: [Name]

Use when:
[Condition]

Steps:
1. [Recovery step]
2. [Recovery step]
3. [Recovery step]

### Recovery Path B: [Name]

Use when:
[Condition]

Steps:
1. [Recovery step]
2. [Recovery step]
3. [Recovery step]

## Rollback Procedure

Use rollback when:
- [Condition]
- [Condition]

Steps:
1. [Disable or pause affected feature.]
2. [Restore prior application version.]
3. [Apply compatible data correction.]
4. [Verify current state.]

Rollback limitations:
- [Limitation]
- [Irreversible consequence]

## Data Recovery Procedure

When data integrity is affected:
1. Identify last trusted state.
2. Select verified backup or source record.
3. Restore into isolation when possible.
4. Replay deletion and revocation records.
5. Validate relationships and indexes.
6. Cut over only after verification.

## Provider Recovery Procedure

When an external provider is affected:
1. Confirm provider status.
2. Stop dependent writes.
3. Preserve queued work.
4. Refresh authentication only if needed.
5. Re-fetch current provider state.
6. Revalidate stale approvals.
7. Resume gradually.

## Credential Recovery Procedure

When a credential is exposed or invalid:
1. Revoke the credential.
2. Rotate or reissue it.
3. Update the secure secret store.
4. Restart or redeploy dependent services safely.
5. Verify old credential rejection.
6. Review recent access.

## Verification

Recovery is not complete until all required checks pass.

### Functional Verification

- [ ] Core workflow works.
- [ ] Affected integration works.
- [ ] Worker or automation resumes safely.
- [ ] No duplicate action occurred.

### Security Verification

- [ ] Unauthorized access is blocked.
- [ ] Revoked token or session no longer works.
- [ ] Secrets are not present in logs or source.
- [ ] Permission scope is correct.

### Data Verification

- [ ] Canonical state is consistent.
- [ ] Relationships are intact.
- [ ] Deleted data remains deleted.
- [ ] Search indexes are current.
- [ ] Audit history is complete or uncertainty is recorded.

### User Verification

- [ ] User-visible state is accurate.
- [ ] Stale or degraded state is labeled.
- [ ] Pending action is clear.
- [ ] Nishad has been notified when required.

## Monitoring After Recovery

Monitor for:
- error recurrence
- queue growth
- provider failures
- duplicate events or actions
- permission anomalies
- stale data
- cost spike

Recommended monitoring window:
[Duration]

## Escalation Criteria

Escalate when:
- sensitive data may be exposed
- external action outcome remains uncertain
- rollback fails
- backup restore fails
- audit integrity is incomplete
- the incident repeats
- service remains impaired beyond [time]

## Communication Template

### Initial Notice

`[System or feature] is currently [unavailable/degraded]. [Known impact]. [Containment action]. [What remains uncertain].`

### Recovery Update

`[System or feature] has been restored. [What was verified]. [Any remaining limitation].`

### Incident Closure

`The incident is closed. Root cause: [summary]. Corrective actions: [summary].`

## Evidence to Preserve

Preserve:
- request IDs
- run IDs
- timestamps
- provider responses
- audit events
- deployment version
- configuration change history
- affected object IDs
- screenshots where useful

Do not preserve unnecessary sensitive payloads.

## Incident Record Requirements

Create an incident record when:
- severity is High or Critical
- Restricted data may be affected
- external action occurred incorrectly
- audit integrity is uncertain
- recovery required manual intervention

## Root Cause Review

After recovery, answer:
- What failed?
- Why was it possible?
- How was it detected?
- Which controls worked?
- Which controls failed?
- What slowed recovery?
- What should change?

## Corrective Actions

Possible actions:
- add validation
- narrow permissions
- improve monitoring
- add retry protection
- improve rollback
- add test coverage
- update architecture
- update this runbook

## Follow-Up Work

- [ ] Create regression test.
- [ ] Update monitoring.
- [ ] Update documentation.
- [ ] Create or update ADR.
- [ ] Close related security or privacy finding.
- [ ] Review automation or permission scope.

## Runbook Test Record

### Last Exercise

[YYYY-MM-DD]

### Exercise Type

[Tabletop | Staging Simulation | Production Validation]

### Result

[Passed | Partially Passed | Failed]

### Gaps Found

- [Gap]

### Changes Made

- [Change]

## Change History

| Date | Change | Author |
|---|---|---|
| YYYY-MM-DD | Initial version | Name |
```

## Runbook Writing Standards

A runbook should be:
- specific
- action-oriented
- safe under pressure
- understandable without deep historical context
- explicit about uncertainty
- tested periodically

## Symptom Standards

Symptoms should describe observable evidence.

Weak:
`Calendar is broken.`

Better:
`Calendar sync has not completed in two hours, the token status is expired, and Today shows stale event data.`

## Containment Standards

Containment should happen before deep diagnosis when harm may still be active.

Examples:
- pause automation
- disable external writes
- revoke token
- enter read-only mode

## Diagnostic Standards

Diagnostic steps should:
- begin with low-risk checks
- avoid destructive commands
- distinguish facts from assumptions
- preserve evidence
- identify state certainty

## Command Standards

Commands in runbooks should:
- be copyable
- identify target environment
- include expected output
- include warnings
- avoid exposing secrets

## Recovery Standards

Recovery should restore a trusted state, not merely silence the alert.

A recovery step should identify:
- what changes
- what may remain uncertain
- what must be verified afterward

## Verification Standards

Every runbook should include functional, security, data, and user-visible verification where relevant.

## Communication Standards

Incident communication should state:
- what is affected
- what still works
- whether data is safe
- what is being done
- what remains uncertain

## Review Cadence

Review runbooks:
- after every use
- after related incidents
- after major architecture changes
- after provider changes
- at least twice yearly for critical runbooks

## Runbook Exercises

Critical runbooks should be exercised through:
- tabletop review
- staging simulation
- controlled recovery test

## Initial Runbooks to Create

Phase 1 should include runbooks for:
- Application Deployment Failure
- Worker Outage
- Database Connection Failure
- Database Migration Failure
- Google Calendar Token Expiration
- Google Calendar Duplicate Event Risk
- Model Provider Outage
- Secret Exposure
- Backup Failure
- Restore Procedure
- Session Revocation
- Memory Deletion Propagation Failure
- Audit Log Failure
- Excessive Cost Spike
- Unauthorized External Action

## Runbook Index

Recommended fields:
- runbook title
- status
- owner
- severity coverage
- related system
- last reviewed
- last exercised

## Failure Modes

### Generic Instructions

The runbook says `investigate` without explaining how.

### Unsafe First Step

Diagnosis begins before active harm is contained.

### Stale Commands

Commands no longer match the current architecture.

### Recovery Without Verification

The alert stops, but the underlying state remains untrusted.

### Hidden Assumptions

The runbook assumes access, tools, or context that may not exist.

### No Uncertainty Handling

Ambiguous outcomes trigger blind retries.

### No Exercise

The runbook exists but has never been tested.

### Incident Amnesia

Lessons from real failures never update the runbook.

## Phase 1 Use

All release-critical operational failures should have an Active runbook before production launch.

At minimum, runbooks should exist for:
- deployment failure
- migration failure
- Calendar authentication failure
- unauthorized external action
- backup and restore
- deletion failure
- audit failure

## Success Criteria

The Operational Runbook Template succeeds if runbooks created from it:
- help contain active harm quickly
- make diagnosis repeatable
- preserve evidence
- distinguish known and uncertain state
- restore service safely
- verify real recovery
- improve after every incident or exercise

## Final Principle

North Vector should not rely on calm memory during stressful failures.

The runbook should carry the memory, so the operator can focus on judgment.