# Integration Permission Model v1.0

## Purpose

This document defines how North Vector requests, grants, limits, reviews, and revokes access to external services.

Integrations expand what Chief can know and do.

They also expand the system's risk surface.

The Integration Permission Model exists to ensure that every connection remains understandable, narrowly scoped, and under Nishad's control.

## Core Principle

Access should be granted by capability, not by convenience.

North Vector should request the minimum permission necessary for the current function and no more.

## Primary Objectives

The model should make it possible to answer:
- What service is connected?
- What data can Chief read?
- What actions can Chief perform?
- Which actions require approval?
- How long does access last?
- How can access be revoked?
- What data remains after disconnection?

## Integration Classes

The model should support:
- Calendar
- Email
- Cloud Storage
- Contacts
- Task Systems
- Academic Systems
- Code Repositories
- Financial Systems
- Health Systems
- Device Services
- Communication Platforms

## Permission Categories

### Read Permissions

Allow North Vector to inspect information.

Examples:
- read calendar events
- read selected email labels
- read files in one folder
- read repository contents

### Create Permissions

Allow North Vector to create new objects.

Examples:
- create calendar event
- create task
- create draft
- create file

### Update Permissions

Allow North Vector to modify existing objects.

Examples:
- move flexible study block
- update a project document
- modify a draft

### Send or Publish Permissions

Allow externally visible actions.

Examples:
- send email
- post message
- publish file
- submit form

### Delete Permissions

Allow destructive actions.

Examples:
- delete event
- delete file
- remove task
- erase data

### Financial Permissions

Allow access to balances, transactions, payments, or trading.

These permissions require the strictest controls and should be disabled by default.

## Permission Levels

### Denied

The integration cannot perform the action.

### Read Only

The integration may inspect approved data but cannot change it.

### Draft Only

North Vector may prepare a proposed action but cannot execute it.

### Ask Every Time

Each action requires explicit confirmation.

### Scoped Autonomous

North Vector may perform low-risk actions within a defined boundary.

Example:
`May create study events on the Personal calendar, but may not modify work, medical, or family events.`

## Scope Dimensions

Permissions should be restrictable by:
- account
- folder
- calendar
- label
- repository
- branch
- file type
- action type
- date range
- domain
- person
- device

## Integration Permission Record

Each integration permission record should contain:
- integration_id
- provider
- account
- capability
- permission_level
- scope
- granted_at
- expires_at
- granted_by
- last_used_at
- last_reviewed_at
- risk_classification
- authentication_method
- revocation_status
- notes

## Permission Request Flow

When requesting access, North Vector should explain:
- which service is involved
- what capability is requested
- why it is needed
- what data is included
- what data is excluded
- whether actions are read-only or writable
- how long permission will last
- how to revoke it

Bad request:
`Allow full Google access.`

Better request:
`Allow North Vector to read your primary Google Calendar so it can prepare daily briefings. It will not create, edit, or delete events without separate approval.`

## Temporary Permissions

The model should support:
- one-time access
- session-only access
- 24-hour access
- time-limited access
- persistent access

Temporary access should be preferred during early testing.

## Approval Rules

Default recommendations:
- reading approved data may be persistent within narrow scope
- drafting may proceed without repeated confirmation
- external communication requires confirmation
- destructive actions require confirmation
- financial actions remain disabled
- new scopes require fresh approval

## Action Authorization

Before executing an action, Chief should verify:
- the integration is connected
- required permission exists
- the scope covers the target object
- the action is within current approval policy
- authentication is still valid
- no conflicting policy blocks the action

## Least-Privilege Rule

North Vector should never request broad access when a narrower scope would work.

Examples:
- one repository instead of all repositories
- one calendar instead of all calendars
- one email label instead of the entire inbox
- one Drive folder instead of full Drive access

## Permission Inheritance

Permissions should not silently inherit across:
- accounts
- devices
- integrations
- folders
- repositories
- projects

Each meaningful scope should be explicit.

## Integration Trust Levels

### Trusted Integration

Well-understood, stable, and approved for meaningful access.

### Limited Integration

Approved for narrow read or draft access.

### Experimental Integration

New or unproven connection with temporary permissions only.

### Restricted Integration

High-risk service such as financial or health data.

## Sensitive Data Rules

Integrations involving:
- health
- finances
- legal records
- identity documents
- private communications

should require:
- stronger authentication
- narrower scope
- stricter retention
- limited device exposure
- clearer audit history

## Revocation

Revoking an integration should:
- stop future access immediately
- invalidate stored credentials where possible
- record the revocation
- explain what derived local data remains
- offer deletion of stored derived data

## Disconnection vs Data Deletion

The interface should distinguish:
- disconnect service
- revoke token
- delete imported data
- delete derived memories
- preserve historical records

These are separate actions.

## Expiration and Review

Permissions should support expiration and periodic review.

Suggested review cadence:
- experimental access: weekly or monthly
- sensitive access: monthly or quarterly
- stable read-only access: every six months
- unused permissions: revoke automatically after defined inactivity

## Audit Log

Every integration should maintain a readable audit log of:
- permission granted
- scope changed
- data accessed
- external action executed
- action failed
- token expired
- access revoked

The log should avoid unnecessary technical noise.

## Failure Handling

If permission is insufficient:
`I can read the event, but I do not have permission to modify it.`

If authentication expires:
`Google Calendar access expired. No calendar changes were made.`

If scope does not match:
`This repository is outside the approved GitHub scope.`

## Integration Errors

The model should distinguish:
- authentication error
- permission error
- scope error
- provider outage
- rate limit
- stale synchronization
- action failure

Each error should state what did and did not happen.

## Provider-Specific Policies

Each integration should define:
- supported capabilities
- permission scopes
- provider limitations
- data retention behavior
- retry policy
- disconnect procedure

## Phase 1 Integration Policy

Phase 1 should favor:
- read-only access
- draft creation
- explicit confirmation for writes
- one service at a time
- narrow account and folder scope
- visible audit logs

Suggested first integrations:
- Google Calendar
- Gmail drafts and search
- GitHub repository access
- Google Drive folder access

## Financial Integration Rule

Phase 1 should not allow autonomous financial actions.

Financial integrations, if added, should begin with:
- read-only balances
- read-only transaction history
- explicit local analysis

No payments, transfers, trades, or purchases should be executed without separate high-assurance design.

## Academic Integration Rule

Academic integrations may access:
- course schedules
- assignment deadlines
- grade records
- announcements

They should not submit assignments, exams, or assessments autonomously.

## Communication Integration Rule

North Vector may:
- read approved messages
- summarize conversations
- create drafts

Sending should require explicit confirmation by default.

## Repository Integration Rule

GitHub permissions should support:
- read repository
- create file
- update file
- create issue
- create branch
- open pull request

Destructive operations and broad organization access should require stronger approval.

## Failure Modes

### Scope Creep

Permissions broaden gradually without deliberate review.

### Permission Fog

The user cannot tell what access means.

### Silent Write Access

An integration changes external data without clear authority.

### Weak Revocation

Disconnecting fails to stop future access.

### Hidden Derived Data

Imported data remains after disconnection without explanation.

### Overbroad Defaults

The system requests more access than required.

### Provider Confusion

A provider limitation is mistaken for North Vector behavior.

## Phase 1 Implementation

Phase 1 should support:
- integration records
- capability-based permissions
- read, draft, write, send, and delete levels
- narrow scopes
- temporary permissions
- explicit write confirmation
- audit logging
- revocation
- permission expiration
- clear error states

## Success Criteria

The Integration Permission Model succeeds if Nishad can always understand:
- which services are connected
- what Chief can read
- what Chief can change
- which actions require approval
- how to narrow or revoke access
- what data remains after disconnection

## Final Principle

Integrations should make North Vector more capable without making Nishad less in control.