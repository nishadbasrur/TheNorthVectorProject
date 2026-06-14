# Release Checklist v1.0

## Purpose

This document defines the standard checklist North Vector should use before, during, and after a staging or production release.

The Release Checklist exists to ensure that code, data, permissions, migrations, integrations, backups, and rollback controls are all reviewed before a release is considered complete.

Its purpose is not to slow down delivery.

Its purpose is to prevent avoidable releases that damage trust, data integrity, privacy, or recoverability.

## Core Principle

A release is complete only after the deployed system has been verified in the target environment.

Passing CI is necessary, but not sufficient.

## Release Information

Complete this section for every release.

- Release ID:
- Release Type:
- Target Environment:
- Commit SHA:
- Branch:
- Release Owner:
- Date:
- Planned Start Time:
- Expected Duration:
- Related Pull Requests:
- Related ADRs:
- Related Migrations:
- Feature Flags:

## Release Types

Select one:
- Standard Release
- High-Risk Release
- Emergency Hotfix
- Configuration-Only Release
- Migration-Only Release
- Rollback

## Risk Classification

Select one:
- Low
- Moderate
- High
- Critical

A release should be considered High or Critical when it affects:
- authentication
- authorization
- permissions
- Restricted data
- external writes
- deletion
- schema integrity
- backups
- audit logging
- integration scopes
- encryption or secrets

## Pre-Release Gate

The release must not begin until all required pre-release items are complete.

### Scope and Readiness

- [ ] Release scope is clearly defined.
- [ ] Acceptance criteria are complete.
- [ ] All included pull requests are merged or explicitly identified.
- [ ] No unrelated work is bundled into the release.
- [ ] Known limitations are documented.
- [ ] Open technical debt introduced by the release is recorded.

### Code Quality

- [ ] Formatting checks pass.
- [ ] Lint passes.
- [ ] Type checking passes.
- [ ] Build succeeds.
- [ ] Debug code and temporary logging are removed.
- [ ] No ignored type errors remain in production paths.
- [ ] Final diff has been reviewed.

### Automated Testing

- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] End-to-end tests pass.
- [ ] Release-critical workflow tests pass.
- [ ] Regression tests for included fixes pass.
- [ ] Flaky tests are resolved or formally accepted with owner and deadline.
- [ ] Test environment failure has been ruled out.

### Critical Workflow Validation

For MVP releases:

- [ ] Chemistry-exam end-to-end workflow passes.
- [ ] Memory save, inspect, revise, and delete flow passes.
- [ ] No-Memory Mode test passes.
- [ ] Session revocation test passes.
- [ ] Approval payload mutation test passes.
- [ ] Calendar event idempotency test passes.
- [ ] Deletion propagation test passes.
- [ ] Export test passes.

### Security Review

- [ ] Secret scan passes.
- [ ] Dependency scan has been reviewed.
- [ ] No unresolved Critical security finding exists.
- [ ] Authorization tests pass.
- [ ] Authentication and session tests pass.
- [ ] Approval and execution tests pass.
- [ ] Prompt-injection tests pass for affected content sources.
- [ ] Sensitive error messages and logs have been reviewed.
- [ ] New device or session behavior has been tested.
- [ ] New production access requirements are documented.

### Privacy Review

- [ ] New data categories are documented.
- [ ] Sensitivity classifications are correct.
- [ ] Retention and deletion behavior are defined.
- [ ] No-Memory Mode remains effective.
- [ ] Public and limited-trust device views remain privacy-safe.
- [ ] Notification previews have been reviewed.
- [ ] External providers receive only necessary data.
- [ ] Disconnection and cleanup behavior are tested for changed integrations.

### Permission and Integration Review

- [ ] New permission scopes are documented.
- [ ] Existing scopes have not expanded unintentionally.
- [ ] OAuth configuration is correct for the target environment.
- [ ] Integration tokens are stored securely.
- [ ] Revocation and reconnect behavior are tested.
- [ ] Provider rate limits and current API behavior are understood.
- [ ] Source-of-truth and conflict rules remain correct.

### Data and Schema Review

- [ ] Database migration scripts are version controlled.
- [ ] Migration has been tested in staging.
- [ ] Semantic meaning is preserved.
- [ ] Stable object IDs remain intact where required.
- [ ] Relationship integrity is validated.
- [ ] Null, unknown, deleted, and withheld values remain distinguishable.
- [ ] Indexes and embeddings are updated correctly.
- [ ] Migration duration and locking behavior are acceptable.
- [ ] Rollback or roll-forward plan is documented.

### Backup and Recovery

- [ ] A recent verified backup exists.
- [ ] A pre-release snapshot is created for high-risk changes.
- [ ] Backup checksum or manifest verification passes.
- [ ] Backup encryption is confirmed.
- [ ] Restore procedure is current.
- [ ] Deletion and revocation replay is supported.
- [ ] Backup location and key access are known.

### Configuration Review

- [ ] Environment variables are valid.
- [ ] Server-only secrets are not exposed to the client.
- [ ] Feature flags have correct defaults.
- [ ] Staging and production settings are distinct.
- [ ] Logging and monitoring configuration is correct.
- [ ] Release version is included in logs and error monitoring.
- [ ] No undocumented manual configuration change is required.

### Documentation

- [ ] Release notes are prepared.
- [ ] User-visible behavior is documented.
- [ ] Setup or environment documentation is updated.
- [ ] Architecture documents remain aligned.
- [ ] Relevant ADRs are linked or updated.
- [ ] Runbooks are updated.
- [ ] Incident-response procedures cover new failure modes.

### Rollback Readiness

- [ ] Previous application version is identifiable.
- [ ] Rollback method is documented.
- [ ] Database compatibility with rollback is understood.
- [ ] Feature flags can disable risky behavior.
- [ ] Worker and automation pause controls are available.
- [ ] Integrations can be paused or disconnected.
- [ ] Release owner knows the rollback trigger conditions.

## Staging Release Checklist

### Deployment

- [ ] Staging deployment starts from the intended commit SHA.
- [ ] Staging environment variables validate successfully.
- [ ] Staging migrations complete.
- [ ] Web process is healthy.
- [ ] Worker process is healthy.
- [ ] Database is reachable.
- [ ] Error monitoring recognizes the new release.

### Staging Smoke Tests

- [ ] Sign-in works.
- [ ] Sign-out works.
- [ ] Session expiration or revocation works.
- [ ] Canonical object retrieval works.
- [ ] Object create and update produce audit events.
- [ ] Chief session can be created.
- [ ] Memory retrieval works.
- [ ] Calendar test account synchronizes.
- [ ] Proposed action appears in the approval tray.
- [ ] Approved test event is created exactly once.
- [ ] Provider result is verified.
- [ ] Test cleanup succeeds.

### Staging Data Validation

- [ ] Record counts are within expected range.
- [ ] Migration validation report passes.
- [ ] Relationships remain intact.
- [ ] Deleted test data remains absent from retrieval.
- [ ] Search indexes are current.
- [ ] No orphan records are introduced.

### Staging Security and Privacy Validation

- [ ] Unauthenticated access is denied.
- [ ] Wrong-scope actions are denied.
- [ ] Restricted data remains hidden where required.
- [ ] Logs do not contain secrets or sensitive test payloads.
- [ ] Prompt injection cannot authorize an action.
- [ ] No-Memory Mode creates no durable record.

### Staging Approval

- [ ] Staging validation is complete.
- [ ] Release owner approves production deployment.
- [ ] Any deviations are documented.

## Production Deployment Checklist

### Before Deployment

- [ ] Maintenance or risk window is acceptable.
- [ ] No active unresolved Critical incident exists.
- [ ] Current production health is recorded.
- [ ] Current production release is recorded.
- [ ] Current backup status is verified.
- [ ] Pending high-risk automations are paused if needed.
- [ ] Users or affected systems are notified if downtime is expected.

### Deployment Execution

- [ ] Production deployment uses the approved commit SHA.
- [ ] Application deployment starts successfully.
- [ ] Worker deployment starts successfully.
- [ ] Database migration runs in the approved order.
- [ ] Migration progress is monitored.
- [ ] No unexpected lock or timeout occurs.
- [ ] Feature flags remain disabled until required validation is complete.
- [ ] Deployment events are recorded.

### Immediate Production Smoke Tests

- [ ] HTTPS and domain work.
- [ ] Sign-in works.
- [ ] Current session remains secure.
- [ ] Canonical object read works.
- [ ] Chief session creation works.
- [ ] Memory retrieval works.
- [ ] Audit event creation works.
- [ ] Calendar synchronization works or clearly reports degraded state.
- [ ] Worker accepts and processes a safe test job.
- [ ] No unexpected error spike appears.

### External Write Validation

When external writes are affected:

- [ ] A low-risk test action is proposed.
- [ ] Exact payload is shown.
- [ ] Approval binds to the payload.
- [ ] Action executes once.
- [ ] Provider state confirms success.
- [ ] Audit history records proposal, approval, execution, and verification.
- [ ] Test object is cleaned up safely.

### Privacy and Deletion Validation

When memory, export, or deletion behavior is affected:

- [ ] No-Memory Mode is verified.
- [ ] Sensitive values remain hidden in public views.
- [ ] Test memory deletion propagates to retrieval.
- [ ] Deletion receipt is accurate.
- [ ] Test export requires appropriate authentication.
- [ ] Export access is short-lived and private.

### Production Monitoring Window

First 30 minutes:
- [ ] Error rate remains normal.
- [ ] Request latency remains acceptable.
- [ ] Worker queue behaves normally.
- [ ] Database health remains normal.
- [ ] No permission or authentication anomaly appears.
- [ ] No duplicate external action occurs.

First 24 hours:
- [ ] Scheduled jobs complete.
- [ ] Daily briefing or equivalent scheduled workflow runs.
- [ ] Calendar synchronization remains current.
- [ ] No unexpected cost spike occurs.
- [ ] No delayed migration or cleanup error appears.
- [ ] No user-visible regression is reported.

## Release Validation by Change Type

### Authentication or Session Change

- [ ] Login and logout tested.
- [ ] Session expiration tested.
- [ ] Session revocation tested.
- [ ] Reauthentication tested.
- [ ] Trusted and untrusted devices tested.
- [ ] Recovery path reviewed.

### Authorization or Permission Change

- [ ] Allowed action succeeds.
- [ ] Disallowed action fails server-side.
- [ ] Scope boundaries are tested.
- [ ] Revocation takes effect.
- [ ] Audit records are correct.

### Memory or Retrieval Change

- [ ] Candidate and active memory behavior tested.
- [ ] Relevant memory is retrieved.
- [ ] Unrelated memory is excluded.
- [ ] Stale and contradicted records are handled.
- [ ] Deleted memory remains absent.
- [ ] No-Memory Mode remains intact.

### Calendar Integration Change

- [ ] Authentication and scopes are correct.
- [ ] Read synchronization works.
- [ ] Timezone behavior is correct.
- [ ] Stale data is labeled.
- [ ] Version conflict is detected.
- [ ] Duplicate creation is prevented.
- [ ] Disconnection stops synchronization.

### Automation Change

- [ ] Dry run passes.
- [ ] Trigger behavior is correct.
- [ ] Deduplication works.
- [ ] Permission revocation stops execution.
- [ ] Retry and failure behavior are tested.
- [ ] Automatic pause works.
- [ ] Run summary and audit history are correct.

### Database Migration

- [ ] Dry run completed.
- [ ] Staging migration passed.
- [ ] Record counts validated.
- [ ] Semantic sample review passed.
- [ ] Relationships preserved.
- [ ] Rollback or roll-forward tested.
- [ ] Backup checkpoint verified.

### Sensitive Data Change

- [ ] Classification is correct.
- [ ] Strong authentication is enforced.
- [ ] Public surfaces hide details.
- [ ] Logging is redacted.
- [ ] Retention and deletion are tested.
- [ ] Export is protected.

## Rollback Checklist

Use when release safety or correctness is not acceptable.

### Rollback Decision

- [ ] Trigger condition is documented.
- [ ] Scope of impact is understood.
- [ ] Data writes since deployment are identified.
- [ ] Application rollback versus roll-forward is evaluated.
- [ ] Database rollback safety is evaluated.
- [ ] Incident record is created when required.

### Containment

- [ ] Risky feature flag is disabled.
- [ ] Affected automation is paused.
- [ ] External writes are paused if necessary.
- [ ] Worker is paused if necessary.
- [ ] Integration is disconnected or restricted if necessary.
- [ ] Evidence and logs are preserved.

### Rollback Execution

- [ ] Previous application version is deployed.
- [ ] Compatible database state is confirmed.
- [ ] Compensating migration is applied if needed.
- [ ] Queued jobs are reviewed before replay.
- [ ] Invalid or stale approvals are canceled.

### Rollback Verification

- [ ] Sign-in works.
- [ ] Core object retrieval works.
- [ ] Audit logging works.
- [ ] Provider synchronization is safe.
- [ ] Duplicate external actions did not occur.
- [ ] Deleted and revoked state remains deleted and revoked.
- [ ] Production health returns to acceptable state.

### Rollback Communication

- [ ] Current system state is documented.
- [ ] Affected functionality is explained.
- [ ] Remaining uncertainty is stated.
- [ ] Follow-up fix is recorded.

## Post-Release Checklist

### Release Closure

- [ ] Production smoke tests pass.
- [ ] Monitoring window is complete or formally handed off.
- [ ] Release status is marked Successful, Degraded, Failed, or Rolled Back.
- [ ] Release record includes final commit and migration status.
- [ ] Feature flags are documented.
- [ ] Temporary deployment permissions are removed.

### Documentation and Follow-Up

- [ ] Release notes are published internally.
- [ ] New known issues are recorded.
- [ ] Technical debt is recorded.
- [ ] Runbooks are corrected using actual deployment behavior.
- [ ] Architecture documents are updated if assumptions changed.
- [ ] ADR outcome sections are updated when relevant.

### Outcome Review

For significant releases:

- [ ] Expected outcome is recorded.
- [ ] Actual outcome is reviewed.
- [ ] User workflow value is assessed.
- [ ] Error and correction rates are reviewed.
- [ ] Privacy or trust concerns are reviewed.
- [ ] Follow-up decisions are recorded.

## Release Stop Conditions

Stop or block a release immediately when:
- secrets are detected
- Critical tests fail
- authentication or authorization is unreliable
- an external action can bypass approval
- deletion does not propagate
- migration integrity is uncertain
- no valid backup exists for a high-risk change
- audit logging fails
- Restricted data appears on an unauthorized surface
- provider state is uncertain and duplicate action is possible
- rollback is required but not understood

## Release Exception Process

An exception may be approved only when:
- the unmet item is noncritical
- risk is explicitly documented
- compensating controls exist
- an owner and deadline are assigned
- the exception does not weaken authentication, authorization, deletion, audit, or data integrity

## Release Record Template

```markdown
# Release [ID]

## Summary

[What changed and why]

## Environment

[Staging or Production]

## Commit

[Commit SHA]

## Release Type

[Standard, High-Risk, Hotfix, Configuration, Migration, Rollback]

## Risk

[Low, Moderate, High, Critical]

## Included Changes

- [Change]
- [Change]

## Migrations

- [Migration]

## Feature Flags

- [Flag and state]

## Validation

- [Tests]
- [Smoke tests]
- [Security and privacy checks]

## Backup

[Backup or snapshot reference]

## Rollback Plan

[Rollback approach]

## Deployment Result

[Successful, Degraded, Failed, Rolled Back]

## Issues Observed

- [Issue]

## Follow-Up Work

- [Action]

## Released By

[Name]

## Released At

[Timestamp]
```

## Failure Modes

### Checklist Theater

Boxes are checked without evidence.

### CI Equals Release

Passing automation is mistaken for successful production deployment.

### Migration Optimism

Schema changes are deployed without semantic validation or recovery.

### Backup Assumption

A backup is treated as valid without restore evidence.

### Permission Drift

New provider or application scopes expand unnoticed.

### Rollback Fiction

Rollback is listed but impossible after the database changes.

### Smoke-Test Neglect

The release is not verified in the real environment.

### Monitoring Abandonment

The deployment finishes and nobody watches delayed behavior.

### Exception Abuse

Release exceptions become routine shortcuts.

## Phase 1 Use

Every Phase 1 staging and production release should use this checklist.

High-risk sections are mandatory for changes involving:
- authentication
- approval and execution
- Calendar writes
- memory lifecycle
- deletion
- export
- database migrations
- backups

## Success Criteria

The Release Checklist succeeds if:
- releases are repeatable
- critical controls are validated before deployment
- the production system is tested after deployment
- rollback and recovery remain realistic
- data and permissions do not drift silently
- release history explains what happened and why

## Final Principle

North Vector should never call a release successful merely because the deployment command finished.

A release is successful when the intended behavior works, the controls still hold, and the system remains recoverable.