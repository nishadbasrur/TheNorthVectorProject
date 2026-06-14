# Gmail Integration v1.0

## Purpose

This document defines how North Vector should connect to Gmail, search and summarize messages, identify commitments and opportunities, draft responses, and perform approved email actions.

The Gmail Integration exists to help Chief understand communication obligations without turning the inbox into a source of noise or surveillance.

Its purpose is to surface what matters, preserve context, and support reliable follow-through.

## Core Principle

Email access should be narrow, purposeful, and permission-aware.

North Vector should help Nishad understand and act on important messages while avoiding indiscriminate reading, over-retention, or unauthorized sending.

## Primary Objectives

The integration should help Chief answer:
- What important messages require attention?
- Which commitments exist?
- What deadlines or opportunities are hidden in email?
- What needs a reply?
- What should be drafted?
- What can be archived?
- What actions require approval?

## Supported Capabilities

### Read Capabilities

North Vector may read approved messages, threads, labels, metadata, and attachments.

Examples:
- sender
- recipients
- subject
- timestamp
- labels
- snippet
- body
- attachment metadata
- thread history

### Search Capabilities

North Vector may search using:
- sender
- recipient
- subject
- keywords
- labels
- date range
- unread status
- attachment presence

### Draft Capabilities

North Vector may create and revise email drafts without sending.

### Send Capabilities

Sending email requires explicit confirmation by default.

### Label and Archive Capabilities

North Vector may apply approved labels, archive messages, or mark read within defined scope.

### Delete Capabilities

Moving email to Trash requires explicit confirmation by default.

## Permission Model

Recommended Phase 1 permissions:
- read selected Gmail labels or search results
- read specific messages and threads
- create drafts
- ask before sending
- ask before archiving large batches
- ask before deleting
- no broad autonomous inbox management

## Gmail Sources

The integration should preserve:
- account
- message ID
- thread ID
- labels
- sender
- recipients
- timestamp
- attachment references

## Message Normalization

Gmail messages should be normalized into structured records.

Suggested fields:
- email_id
- external_message_id
- thread_id
- account_id
- sender
- recipients
- cc
- bcc
- subject
- sent_at
- received_at
- labels
- body_summary
- full_body_reference
- has_attachments
- attachment_metadata
- importance
- action_required
- response_due_at
- related_people_ids
- related_goal_ids
- related_project_ids
- synchronization_status

## Message Classification

North Vector should classify messages such as:
- Action Required
- Waiting for Reply
- Informational
- Opportunity
- Deadline
- Relationship Follow-Up
- Administrative
- Financial
- Academic
- Work
- Project
- Promotional

Classifications should remain editable.

## Importance Detection

Importance may consider:
- sender relationship
- deadline language
- direct questions
- explicit requests
- institutional source
- active goal relevance
- financial or legal consequence
- repeated follow-up

North Vector should not rely only on Gmail's existing importance labels.

## Action Extraction

The integration should detect:
- requested actions
- deadlines
- promised follow-ups
- documents to send
- meetings to schedule
- forms to complete
- replies expected

Extracted actions should become candidate tasks or commitments.

## Commitment Extraction

Examples:

Email:
`Please send the signed form by Friday.`

Candidate commitment:
- send signed form
- due Friday
- institutional obligation

Email:
`I'll follow up after orientation.`

Candidate self-commitment:
- send follow-up after orientation

The system should confirm unclear commitments before storing them.

## Opportunity Extraction

The integration may detect opportunities such as:
- research openings
- internships
- scholarships
- mentorship offers
- event invitations
- project collaborations

Opportunities should be ranked by alignment, timing, and cost.

## Thread Understanding

North Vector should read relevant thread history before drafting or replying.

The system should identify:
- current question
- prior commitments
- unresolved points
- tone
- participants
- attachments

## Drafting Flow

Before creating a draft, Chief should identify:
- purpose
- recipient
- subject
- required context
- requested tone
- attachments
- deadline

The draft should remain editable and reviewable.

## Reply Flow

For replies, North Vector should:
1. read the relevant message or thread
2. identify requested action
3. preserve recipients and thread context
4. draft the response
5. present it for review
6. require explicit approval before sending

## Send Flow

Before sending, Chief should show:
- recipients
- subject
- full draft or concise preview
- attachments
- whether it is a new message or reply

The confirmation should be exact.

Example:
`Send this reply to Professor Smith now?`

## Attachment Handling

North Vector may inspect approved attachments when relevant.

Supported behaviors may include:
- summarize document
- extract deadline
- identify required signature
- draft response based on attachment

Sensitive attachments should use stricter retention and authentication rules.

## Labeling and Organization

North Vector may use labels such as:
- Action Required
- Waiting
- Academic
- Research
- Work
- Financial
- North Vector

Automatic labeling should remain narrow and reversible.

## Archive Rules

Archiving may be appropriate when:
- no action remains
- the message is informational
- the thread is resolved
- the user approves a bulk rule

Archiving should not delete the message.

## Delete Rules

Deleting should be conservative.

Valid cases:
- user request
- obvious spam within approved policy
- duplicate or irrelevant test messages

Bulk deletion should require explicit confirmation.

## Daily Briefing Integration

Email signals may support:
- important unread messages
- overdue replies
- pending commitments
- expiring opportunities
- administrative deadlines

The briefing should not become an inbox digest.

## Relationship Memory Integration

Relevant messages may update:
- last interaction
- commitment history
- follow-up date
- communication preference
- relationship status

Private relationship interpretations should remain conservative.

## Risk Engine Integration

Email may reveal risks such as:
- missed deadline
- unanswered important message
- work schedule change
- application issue
- billing problem
- administrative hold

## Opportunity Engine Integration

Email may reveal:
- research openings
- internship invitations
- scholarship announcements
- mentor introductions
- project opportunities

## Search Flow

When Nishad asks:
`Find the email about orientation.`

Chief should:
1. search approved scope
2. rank relevant results
3. show concise message cards
4. open the selected message or thread

## Privacy

Email contains highly sensitive information.

The integration should:
- minimize retained message bodies
- avoid exposing content on public devices
- restrict financial, health, and legal messages
- avoid reading private content aloud in public
- support per-label and per-sender exclusion

## Retention

Default policy:
- store structured meaning, not full copies of every email
- retain message references for retrieval
- preserve full body only when needed
- allow derived memory deletion
- respect source deletion and disconnection

## Synchronization

The integration should support:
- on-demand search
- scheduled sync for approved labels
- manual refresh
- last-sync timestamp
- stale-data indicator

## Synchronization States

Suggested states:
- Current
- Syncing
- Delayed
- Authentication Expired
- Permission Limited
- Error
- Disconnected

## Error Handling

If search fails:
`Gmail search failed. No messages were changed.`

If draft creation fails:
`The draft was not saved.`

If sending fails:
`The email was not sent. The draft remains available for review.`

If attachment access fails:
`I could read the message but not the attachment.`

## Audit Log

The integration should record:
- message searched
- message opened
- attachment read
- draft created
- draft updated
- email sent
- label applied
- message archived
- message moved to Trash
- permission changed

The log should remain concise and user-readable.

## Phase 1 Implementation

Phase 1 should support:
- search approved Gmail scope
- read messages and threads
- summarize important messages
- extract tasks, commitments, deadlines, and opportunities
- create drafts
- revise drafts
- explicit confirmation before sending
- basic labeling and archiving
- sync status and error handling

Automatic bulk inbox management should come later.

## Success Criteria

The Gmail Integration succeeds if Chief can reliably answer:
- what important email needs attention
- what commitment or deadline exists
- what reply is required
- what opportunity is present
- what draft should be created
- what action requires approval

## Final Principle

Email should become a source of structured obligations and opportunities, not an endless stream Chief merely summarizes.