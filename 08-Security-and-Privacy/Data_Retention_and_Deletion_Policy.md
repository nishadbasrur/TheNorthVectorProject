# Data Retention and Deletion Policy v1.0

## Purpose

This document defines how North Vector should retain, archive, expire, delete, and verify the removal of personal data, system records, memories, transcripts, files, logs, and integration-derived information.

The Data Retention and Deletion Policy exists to prevent indefinite accumulation of data that no longer serves a useful purpose.

Its purpose is to make retention intentional and deletion understandable.

## Core Principle

North Vector should not keep data merely because storage is available.

Every retained item should have a purpose, a review horizon, and a clear deletion path.

## Primary Objectives

The policy should help Chief answer:
- Why is this data being kept?
- How long should it remain?
- What happens when its purpose expires?
- Should it be archived, anonymized, or deleted?
- What dependencies exist?
- What exactly is removed when Nishad requests deletion?
- How is deletion verified?

## Retention Principles

North Vector should follow:
- Purpose-Based Retention
- Minimum Necessary Retention
- Category-Specific Rules
- User Control
- Expiration by Default
- Dependency Awareness
- Verifiable Deletion
- Audit Transparency
- Safe Backup Handling
- Legal and Operational Exceptions Only When Necessary

## Retention Classes

### Ephemeral

Retained only for immediate processing.

Examples:
- raw voice audio
- one-time location
- temporary upload buffers
- transient model context

Default action:
Delete immediately after successful processing or short correction window.

### Session

Retained for the active session.

Examples:
- recent turns
- pronoun resolution context
- pending confirmation state

Default action:
Delete or summarize when the session expires.

### Short-Term

Retained for days or weeks.

Examples:
- current-week operational context
- unresolved candidate memories
- temporary energy state
- pending synchronization data

Default action:
Expire, archive, or promote based on review.

### Active

Retained while the related object remains relevant.

Examples:
- active goals
- current projects
- active risks
- current commitments
- upcoming events

Default action:
Archive or delete after completion and review.

### Long-Term

Retained for durable value.

Examples:
- confirmed preferences
- major decisions
- stable relationship context
- constitutional documents
- high-value lessons

Default action:
Review periodically and retain only while still accurate and useful.

### Archived

Preserved historically but excluded from ordinary retrieval.

Examples:
- completed courses
- former jobs
- closed projects
- superseded plans

Default action:
Retain under longer review cadence or delete on request.

## Standard Retention Record

Each retained object should contain:
- data_id
- data_type
- source
- purpose
- privacy_classification
- retention_class
- created_at
- last_used_at
- last_updated_at
- review_at
- expires_at
- archive_at
- delete_after
- deletion_status
- dependencies
- legal_or_operational_hold
- user_override

## Default Retention Rules by Data Type

### Raw Voice Audio

Default:
Delete after transcription and validation.

Optional correction window:
Short, user-configurable period.

### Voice Transcripts

Default:
Retain only when needed for correction, session continuity, or approved memory extraction.

Long-term retention:
Only by explicit user choice or strong operational value.

### Session History

Default:
Retain a compact summary for active or meaningful sessions.

Full raw session:
Shorter retention unless explicitly saved.

### Candidate Memories

Default:
Retain until confirmed, rejected, or expired.

Suggested review window:
30 to 90 days depending on category.

### Confirmed Memories

Default:
Retain while useful and accurate.

Behavioral and preference memories should have periodic review dates.

### Temporary States

Examples:
- tired today
- current mood
- short-term travel context

Default:
Expire automatically within hours or days unless promoted.

### Calendar Data

Default:
Retain active and recent events for planning.

Completed events:
Archive summaries when relevant; avoid indefinite full duplication of provider data.

### Email Data

Default:
Retain message references and structured action summaries.

Full bodies:
Avoid long-term duplication unless necessary.

### Contact Data

Default:
Retain only normalized fields needed for approved workflows.

Avoid full address-book duplication.

### Google Drive and File Data

Default:
Retain file references, summaries, and approved local copies.

Avoid duplicating entire file libraries.

### GitHub Data

Default:
Retain repository references, commit SHAs, and project links.

Source history remains in GitHub.

### Academic Data

Default:
Retain active-term course and assignment data.

After term completion:
Archive key outcomes and lessons; expire detailed operational records unless needed.

### Financial Data

Default:
Retain current normalized balances and selected transaction history only as needed.

Full statements and detailed raw data should have limited retention.

### Health Data

Default:
Retain only approved categories and useful trends.

Raw sensor streams should have shorter retention than summarized trends.

### Location Data

Default:
One-time location should be ephemeral.

Saved places may persist with explicit approval.

Continuous location history should not be retained by default.

### Weather Data

Default:
Short-term only.

Historical weather should not be stored unless tied to an event, decision, or incident.

### Automation Logs

Default:
Retain human-readable run summaries longer than raw technical details.

High-risk and security-relevant logs may require longer retention.

### Security Logs

Default:
Retain long enough for incident investigation, trend analysis, and audit integrity.

Sensitive payloads should be masked.

## Retention Review

Data should be reviewed when:
- review date arrives
- related goal or project ends
- source integration disconnects
- information becomes stale
- contradictory evidence appears
- user requests review
- privacy classification changes
- legal or operational hold ends

## Review Outcomes

Possible outcomes:
- Retain
- Extend Review Date
- Promote
- Archive
- Anonymize
- Delete
- Merge with Duplicate
- Mark Superseded

## Expiration

Expiration means the data should stop influencing active behavior.

Expired data may be:
- deleted
- archived
- replaced
- retained only for audit or history

The action should depend on purpose and category.

## Archive Policy

Archived data should:
- remain searchable only when explicitly requested
- not influence ordinary recommendations
- preserve source and history
- use lower retrieval priority
- remain deletable

## Deletion Types

### Soft Delete

The item is removed from active use but recoverable for a limited period.

### Hard Delete

The item is permanently removed where technically possible.

### Source Unlink

The connection to the external source is removed, but the local derived record remains.

### Derived-Data Delete

Summaries, memories, or inferences created from a source are removed.

### Full Cascade Delete

The source record and dependent derived records are removed according to policy.

## Deletion Request Scope

Nishad should be able to request deletion by:
- item
- session
- category
- source
- integration
- date range
- person
- project
- goal
- device
- full account

## Deletion Flow

1. Identify the requested scope.
2. Show affected data types.
3. Show dependencies and exceptions.
4. Confirm destructive action.
5. Stop future retrieval and processing.
6. Delete or quarantine primary records.
7. Delete or update derived records.
8. Propagate deletion to caches, indexes, and backups where applicable.
9. Verify result.
10. Provide a deletion summary.

## Dependency Handling

Deleting one object may affect others.

Example:
Deleting a relationship memory may affect:
- commitments
- email links
- event references
- decision records

The system should show these relationships before deletion.

## Cascade Rules

Cascade deletion should be conservative.

Possible options:
- Delete Only This Item
- Delete This Item and Derived Data
- Delete All Related Data
- Archive Related Records Instead

## Memory Deletion

Deleting a memory should consider:
- source record
- normalized memory
- evidence links
- behavioral inference
- usage history
- related recommendations

Past audit records may remain with redacted content where necessary for integrity.

## Session Deletion

Deleting a session may include:
- raw transcript
- normalized transcript
- session summary
- attachments
- derived memories
- pending actions

The system should ask whether derived tasks or decisions should remain.

## Integration Disconnection

Disconnecting an integration should:
- revoke future access
- stop synchronization
- invalidate tokens where possible
- identify imported data
- offer deletion of cached and derived data
- preserve only approved historical records

## Account Deletion

Full account deletion should include:
- memories
- goals
- tasks
- reviews
- sessions
- device registrations
- integration tokens
- derived data
- exports
- automations
- cached files

The system should explain any minimal records that cannot be immediately removed and why.

## Backup Deletion

Backups create delayed deletion challenges.

The policy should define:
- backup retention window
- backup expiration
- restore-time deletion replay
- restricted access to backups

Deleted data should not silently reappear after restoration.

## Cache and Index Deletion

Deletion should propagate to:
- search indexes
- embeddings
- retrieval caches
- local device caches
- notification previews
- temporary files
- queued jobs

## Derived Data and Inferences

Deleting a source should trigger review of derived data.

Examples:
- behavioral patterns inferred from deleted sessions
- summaries generated from deleted emails
- risk records based on removed data

Derived data should be deleted, revised, or marked unsupported.

## Audit Log Handling

Audit logs may need to preserve evidence that a deletion occurred.

They should:
- record deletion event
- avoid retaining deleted content unnecessarily
- use redacted identifiers where possible
- preserve integrity

## Legal and Operational Holds

If a record cannot be deleted immediately because of a valid hold:
- explain the reason
- identify exact scope
- restrict ordinary use
- set a review date
- delete when the hold ends

North Vector should not invent holds for convenience.

## Deletion Verification

Deletion should be verified through:
- primary database check
- cache check
- index check
- file-system check
- integration token revocation
- backup policy confirmation

The system should not claim deletion if only active retrieval was disabled.

## Deletion Receipt

After significant deletion, provide:
- what was deleted
- what was archived
- what remains
- why anything remains
- whether backup expiration is pending
- completion timestamp

## Retention Overrides

Nishad may override defaults by:
- saving a session permanently
- shortening retention
- extending review date
- disabling a category
- requiring manual review before deletion

Overrides should remain inspectable and reversible.

## Automatic Cleanup

North Vector may automatically clean:
- expired temporary state
- raw voice audio
- stale candidate memories
- old caches
- failed upload remnants
- obsolete synchronization payloads

Automatic cleanup rules should be visible.

## Retention Dashboard

The dashboard should show:
- data by category
- retention class
- upcoming expirations
- stale data
- candidate memories
- archived records
- pending deletion
- backup deletion status

## Notifications

Notify Nishad when:
- sensitive data is due for review
- an integration disconnect leaves derived data
- deletion cannot fully complete
- backup expiration is pending
- a hold prevents removal

Routine automatic cleanup may remain silent.

## Error Handling

If deletion fails:
`The primary record was removed, but one cached copy could not be deleted yet. Retrieval is blocked, and cleanup will retry.`

If scope is unclear:
`Do you want to delete only this memory, or also the transcript and related behavioral inference?`

If an external provider retains data:
`North Vector removed its local copy and revoked access, but the source provider may still retain the original record.`

## Security

Deletion actions should require:
- appropriate authentication
- explicit confirmation for broad scope
- audit logging
- rate limits
- protection against accidental mass deletion

## Privacy

Deletion controls should be easy to find and use.

The system should not use dark patterns, hidden menus, or unnecessary friction to discourage deletion.

## Failure Modes

### Indefinite Retention

Data accumulates without purpose or review.

### Deletion Theater

Data disappears from the interface but remains retrievable elsewhere.

### Cascade Confusion

Related data is removed unexpectedly.

### Backup Resurrection

Deleted data returns after restoration.

### Unsupported Inference

Derived patterns remain after source deletion.

### Hidden Holds

Deletion is blocked without clear justification.

### Over-Deletion

Useful records are erased without dependency review.

### Retention Sprawl

Different systems use inconsistent rules.

## Phase 1 Implementation

Phase 1 should support:
- retention classes
- category-specific defaults
- review and expiration dates
- archive
- soft and hard delete
- item and source deletion
- integration-disconnect cleanup
- derived-data review
- cache and index cleanup
- deletion receipts
- backup-aware deletion policy
- retention dashboard

Advanced automated data mapping and legal-hold workflows can come later.

## Success Criteria

The Data Retention and Deletion Policy succeeds if Nishad can always understand:
- why data is being kept
- when it will be reviewed or removed
- what deletion will affect
- what was actually deleted
- what remains and why
- whether deleted data can return

## Final Principle

North Vector should remember deliberately and forget reliably.