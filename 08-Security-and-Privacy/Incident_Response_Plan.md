# Incident Response Plan v1.0

## Purpose

This document defines how North Vector should prepare for, detect, contain, investigate, recover from, and learn from security and privacy incidents.

The Incident Response Plan exists to ensure that failures involving access, credentials, data exposure, automation, integrations, devices, or audit integrity are handled quickly and honestly.

Its purpose is not to promise that incidents will never happen.

Its purpose is to make sure the system knows what to do when they do.

## Core Principle

North Vector should respond to incidents by preserving truth, limiting damage, restoring control, and learning from the cause.

Speed matters, but accuracy and containment matter more than appearances.

## Primary Objectives

The plan should help Chief answer:
- What happened?
- Is the incident still active?
- What data, systems, devices, or people are affected?
- What should be contained immediately?
- What remains uncertain?
- What access should be revoked?
- How should recovery proceed?
- What should Nishad be told?
- What must change afterward?

## Incident Lifecycle

Preparation
↓
Detection
↓
Triage
↓
Containment
↓
Investigation
↓
Eradication
↓
Recovery
↓
Notification
↓
Post-Incident Review
↓
Control Improvement

## Incident Categories

The plan should support:
- Unauthorized Access
- Credential Exposure
- Device Loss or Theft
- Integration Compromise
- Data Exposure
- Privacy Violation
- Malicious or Unsafe Automation
- Unauthorized External Action
- Prompt Injection or Untrusted Content Attack
- Repository or Supply Chain Compromise
- Audit Log Integrity Failure
- Backup or Recovery Failure
- Account Recovery Abuse
- Service Outage with Security Impact

## Incident Severity Levels

### Low

Limited operational impact, no sensitive data exposure, and easy recovery.

Examples:
- failed login attempts
- low-risk automation misfire caught before execution

### Moderate

Meaningful but contained impact.

Examples:
- unauthorized access to nonrestricted data
- integration token exposed but not abused
- private notification shown on the wrong trusted device

### High

Sensitive data, external action, or sustained unauthorized access may be involved.

Examples:
- restricted memory accessed without authorization
- email sent without valid approval
- private repository content exposed
- lost trusted device with active session

### Critical

Severe, active, or potentially irreversible harm.

Examples:
- credential compromise enabling broad access
- health or financial data breach
- unauthorized financial action
- large-scale deletion
- audit integrity loss
- active malicious automation across systems

## Standard Incident Record

Each incident should contain:
- incident_id
- title
- category
- severity
- status
- detected_at
- reported_by
- initial_signal
- affected_systems
- affected_accounts
- affected_devices
- affected_data_categories
- affected_people
- confirmed_impact
- suspected_impact
- uncertain_impact
- containment_actions
- credentials_revoked
- sessions_revoked
- automations_paused
- evidence_references
- recovery_actions
- notification_status
- root_cause
- corrective_actions
- closed_at
- post_incident_review_id

## Incident Statuses

Suggested statuses:
- Suspected
- Confirmed
- Containing
- Investigating
- Recovering
- Monitoring
- Resolved
- Closed

## Preparation

North Vector should maintain:
- current device inventory
- active session inventory
- integration inventory
- credential inventory
- automation inventory
- data classification map
- backup and restoration procedures
- revocation procedures
- emergency contact methods
- audit-log access

## Detection Sources

Incidents may be detected through:
- failed authentication patterns
- new-device registration
- unusual integration activity
- scope expansion
- unexpected external action
- duplicate or destructive automation
- secret scanning
- user report
- provider security alert
- unusual export or deletion
- audit-log gap
- device loss report

## Initial Triage

Triage should determine:
- whether the incident is credible
- whether it is active
- likely severity
- immediate systems at risk
- whether sensitive data is involved
- whether further action could increase damage

## Immediate Containment

Possible containment actions:
- revoke sessions
- mark devices untrusted
- revoke integration tokens
- rotate credentials
- pause automations
- block external actions
- disable affected integrations
- isolate development or production environment
- suspend account recovery changes
- lock sensitive exports
- preserve evidence

## Fail-Closed Rule

When identity, authorization, or audit integrity is uncertain, North Vector should pause sensitive capabilities rather than continue operating normally.

## Evidence Preservation

The system should preserve:
- audit events
- timestamps
- affected object IDs
- provider responses
- authentication events
- permission changes
- commit history
- workflow logs
- relevant session summaries

Evidence should be protected from alteration.

## Investigation

The investigation should establish:
- entry point
- actor or likely source
- initial time of compromise
- affected scope
- actions performed
- data accessed or exposed
- controls that failed
- controls that worked
- whether the incident is ongoing

## Known vs Uncertain Impact

Impact should be classified as:
- Confirmed
- Likely
- Possible
- Ruled Out

The system should not overstate certainty.

## Credential Exposure Response

If a credential is exposed:
1. Revoke or rotate it immediately.
2. Identify all systems that used it.
3. Review recent activity.
4. Replace dependent secrets.
5. remove the exposed value from source, logs, or history where possible.
6. Review repository and workflow history.
7. notify Nishad.

## Device Loss Response

If a trusted device is lost:
1. Revoke all device sessions.
2. Mark the device untrusted.
3. Disable local synchronization.
4. Revoke cached integration tokens where possible.
5. Review recent actions.
6. Rotate sensitive credentials if exposure is plausible.
7. use remote lock or erase if available.

## Unauthorized Access Response

If an account or session is accessed without authorization:
1. Revoke active sessions.
2. require fresh high-assurance authentication.
3. Review device and location signals cautiously.
4. inspect permissions and recent actions.
5. rotate authentication credentials.
6. restore trusted access deliberately.

## Integration Compromise Response

If an integration token or provider connection is compromised:
- revoke the token
- disconnect the integration
- stop dependent automations
- identify data accessed and actions performed
- review provider audit data
- reconnect with narrower scope only after review

## Data Exposure Response

If data is exposed:
- identify exact data categories
- identify recipients or surfaces
- stop further access
- remove or revoke access where possible
- assess sensitivity
- determine whether derived data or caches are affected
- notify Nishad clearly

## Privacy Violation Response

Examples:
- unwanted memory creation
- bystander recording
- sensitive notification preview
- precise location retained without approval

Response should include:
- stop the privacy-invasive behavior
- delete affected data
- review consent and retention settings
- identify system cause
- prevent recurrence

## Unauthorized External Action Response

Examples:
- email sent
- event modified
- file published
- repository merged

The system should:
1. verify the exact action.
2. stop related queued actions.
3. use rollback or compensating action when possible.
4. notify affected people when appropriate and approved.
5. review the approval and execution chain.

## Automation Incident Response

If an automation behaves unsafely:
- pause it immediately
- pause related workflows if necessary
- preserve the run record
- inspect trigger, permissions, payload, and verification
- determine whether duplicate or partial actions occurred
- require explicit reactivation after review

## Prompt Injection Response

If untrusted content appears to manipulate the system:
- stop following instructions from the content
- isolate the source as data
- block external actions derived from it
- preserve the suspicious text reference
- review whether any tool action occurred
- tighten content-handling rules if needed

## Repository Compromise Response

If malicious or unauthorized code enters a repository:
- stop deployments and automations using that code
- identify affected commits and branches
- revert or isolate compromised changes
- rotate exposed secrets
- inspect workflow runs
- review contributors and permissions
- restore from trusted commit history

## Audit Integrity Failure

If audit logs are missing, altered, or unavailable:
- pause high-impact automation
- preserve remaining logs
- compare provider histories
- rebuild the timeline from independent sources
- treat unresolved actions as uncertain
- restore append-only logging before resuming

## Backup or Recovery Incident

If restoration fails or reintroduces deleted or compromised data:
- stop the restore
- isolate restored environment
- identify resurrected data or credentials
- replay deletion and revocation records
- verify current state before resuming

## Eradication

Eradication may include:
- removing malicious code
- deleting compromised tokens
- patching vulnerable dependencies
- disabling unsafe workflows
- fixing permission rules
- removing unauthorized devices
- correcting data or memory state

## Recovery

Recovery should:
- restore from a trusted state
- reissue credentials deliberately
- re-enable integrations one at a time
- verify permissions
- test automations in dry-run mode
- confirm data integrity
- monitor closely after restoration

## Recovery Verification

Recovery is complete only when:
- unauthorized access is stopped
- affected credentials are rotated
- permissions are correct
- sensitive actions are verified
- data integrity is restored
- audit logging works
- high-risk automations are reviewed
- no unresolved uncertainty remains without an explicit plan

## Notification Principles

Incident communication should be:
- prompt
- factual
- specific
- proportionate
- honest about uncertainty
- clear about what Nishad must do

## Incident Notification Structure

A notification should include:
- what happened
- when it was detected
- affected systems or data
- what has been contained
- what remains uncertain
- what action Nishad should take
- when the next update will occur

## External Notification

If another person or institution is affected, North Vector should not notify them autonomously unless explicitly authorized or required by a separately defined policy.

It may prepare a draft and recommended communication plan.

## Incident Updates

For ongoing incidents, updates should occur when:
- severity changes
- containment completes
- new impact is confirmed
- recovery begins
- user action becomes necessary
- incident closes

## Post-Incident Review

Every High or Critical incident should receive a formal review.

Moderate incidents should be reviewed when recurring or instructive.

## Post-Incident Review Questions

- What happened?
- What was the root cause?
- How was it detected?
- What slowed containment?
- Which safeguards worked?
- Which safeguards failed?
- Was communication accurate?
- Was recovery trustworthy?
- What should change?

## Root Cause Categories

Suggested categories:
- Credential Handling
- Permission Design
- Authentication Weakness
- Authorization Error
- Automation Logic
- Provider Failure
- Dependency Vulnerability
- Prompt Injection
- Device Security
- Human Error
- Monitoring Gap
- Backup Failure
- Unknown

## Corrective Actions

A review may produce:
- credential rotation
- narrower permission scope
- stronger authentication
- new validation rule
- automation redesign
- dependency update
- audit improvement
- privacy-default change
- new test case
- new incident playbook

## Incident Playbooks

North Vector should maintain playbooks for:
- lost device
- exposed API key
- unauthorized email send
- compromised GitHub token
- accidental public file share
- health or financial data exposure
- automation duplicate execution
- account recovery compromise
- deleted-data restoration

## Incident Metrics

Useful metrics include:
- time to detect
- time to contain
- time to recover
- number of systems affected
- number of actions reversed
- recurrence rate
- user notification delay
- root-cause closure rate

Metrics should improve response, not disguise uncertainty.

## Testing and Exercises

The incident plan should be tested through:
- tabletop exercises
- credential exposure simulation
- lost-device drill
- provider outage simulation
- backup restoration test
- unauthorized action simulation
- audit-gap simulation

## Exercise Cadence

Suggested cadence:
- low-complexity tabletop: quarterly
- high-severity scenario: twice yearly
- backup restoration: quarterly
- device revocation test: twice yearly

## Incident Access Controls

Incident records may contain highly sensitive data.

They should:
- use Restricted classification
- require high-assurance authentication
- minimize payload content
- preserve audit integrity
- limit wearable access

## Incident Closure

An incident may close when:
- containment is complete
- recovery is verified
- required notifications are complete
- root cause is understood or explicitly unresolved
- corrective actions are assigned
- remaining risk is accepted deliberately

## Failure Modes

### Delayed Containment

The system investigates too long before stopping active harm.

### False Reassurance

The incident is declared resolved without verification.

### Evidence Loss

Logs or state disappear during cleanup.

### Over-Notification

Unconfirmed impact is presented as fact.

### Under-Notification

Meaningful harm is hidden or delayed.

### Recovery Without Trust

Systems resume before permissions, credentials, and data integrity are verified.

### No Learning

The incident closes without changing controls.

### Incident Sprawl

Response becomes chaotic because ownership and status are unclear.

## Phase 1 Implementation

Phase 1 should support:
- incident records
- severity and status
- device and session revocation
- integration token revocation
- automation pause
- evidence preservation
- containment checklists
- user notification templates
- post-incident review
- corrective-action tracking
- basic incident playbooks

Advanced automated forensics and external notification workflows can come later.

## Success Criteria

The Incident Response Plan succeeds if Nishad can always understand:
- what happened
- whether the incident is still active
- what was contained
- what data or systems may be affected
- what remains uncertain
- what action is required
- how trust was restored
- what changed afterward

## Final Principle

A trustworthy system is not one that never fails.

It is one that notices, contains, explains, recovers, and improves when failure happens.