# Contacts Integration v1.0

## Purpose

This document defines how North Vector should connect to a contact system, retrieve approved contact details, resolve names, link people to relationship memory, and support communication and scheduling workflows.

The Contacts Integration exists to help Chief identify the correct person, preserve relationship context, and avoid asking Nishad for information the system is already authorized to access.

Its purpose is not to create a social graph of everyone in Nishad's address book.

## Core Principle

Contacts are identity references, not complete relationship records.

North Vector should use contact data to locate and verify people while relying on the Relationship Memory Model for meaningful personal context.

## Primary Objectives

The integration should help Chief answer:
- Who is this person?
- What is their correct email or phone number?
- Which contact matches the name Nishad mentioned?
- Is this person already linked to relationship memory?
- What communication channel is available?
- Which actions require confirmation?

## Supported Capabilities

### Read Capabilities

North Vector may read approved contact fields such as:
- full name
- preferred name
- email address
- phone number
- organization
- job title
- postal address
- birthday
- notes
- labels or groups

### Search Capabilities

North Vector may search by:
- name
- email
- phone number
- organization
- title
- label

### Resolution Capabilities

North Vector may use contacts to resolve:
- ambiguous names
- duplicate names
- spelling variations
- nicknames
- communication channels

### Linking Capabilities

North Vector may link a contact record to:
- relationship memory
- commitments
- events
- emails
- projects
- goals

### Write Capabilities

Phase 1 should not automatically create, edit, merge, or delete contacts.

Write support may be added later with explicit confirmation.

## Permission Model

Recommended Phase 1 permissions:
- read-only access to approved contacts
- search by name or email
- retrieve contact details only when relevant
- no bulk export
- no autonomous contact creation or editing
- no deletion

## Contact Scope

Access should be restrictable by:
- account
- group or label
- selected contacts
- organization
- field type

If the provider cannot support narrow scope, North Vector should still minimize retrieval and retention.

## Contact Normalization

Each contact should be represented with:
- contact_id
- external_contact_id
- account_id
- full_name
- preferred_name
- given_name
- family_name
- email_addresses
- phone_numbers
- organization
- job_title
- postal_addresses
- birthday
- labels
- source
- last_updated_at
- related_person_id
- sensitivity
- synchronization_status

## Identity Resolution

When Nishad mentions a person, Chief should:
1. search relationship memory
2. search approved contacts if needed
3. compare name, organization, role, and communication history
4. select the most likely match
5. ask for clarification when multiple plausible matches remain

Example:
`Do you mean Daniel Aaron at UMass Memorial or Daniel Aaron in your personal contacts?`

## Duplicate Handling

The integration should detect possible duplicates using:
- identical email address
- identical phone number
- similar name and organization
- overlapping notes

Phase 1 should surface duplicate candidates but not merge them automatically.

## Relationship Memory Linking

Contacts should provide reference data.

Relationship Memory should provide:
- importance
- trust
- closeness
- commitments
- interaction history
- follow-up needs

The two systems should remain separate but linked.

## Contact Detail Retrieval

When Nishad asks:
`What's Dr. Aaron's email?`

Chief should:
1. resolve the correct person
2. return only the requested field
3. avoid exposing unrelated private details
4. preserve the contact link for immediate follow-up

## Communication Support

Contacts may support:
- email drafting
- calendar invitations
- call preparation
- address lookup
- message recipient selection

Sending or inviting should still follow the relevant integration's confirmation rules.

## Calendar Integration

Contacts may help:
- resolve attendee emails
- identify invitees
- connect event participants to relationship memory

Adding attendees creates an external commitment and should require appropriate confirmation.

## Gmail Integration

Contacts may help:
- resolve recipient identities
- disambiguate senders
- link threads to relationship memory
- identify preferred email addresses

## Phone and Messaging Integration

Future versions may support:
- phone number lookup
- call initiation
- message drafting

Calling or sending messages should require explicit confirmation.

## Contact Notes

Provider contact notes may contain sensitive or outdated information.

North Vector should:
- treat notes as low-confidence source data
- avoid promoting them into long-term memory automatically
- avoid displaying notes on public devices
- allow per-field exclusion

## Birthdays and Personal Dates

Birthdays may support reminders and relationship maintenance.

The integration should not assume every stored date should create notifications.

Reminder behavior should depend on relationship importance and user preference.

## Address Handling

Postal addresses may support:
- navigation
- event planning
- shipping
- travel estimates

Addresses should be treated as sensitive and shown only when needed.

## Privacy

Contact data may reveal private identities, addresses, and communication details.

The integration should:
- retrieve only relevant fields
- avoid bulk ingestion into long-term memory
- hide private details on public surfaces
- require authentication for restricted fields
- avoid reading phone numbers or addresses aloud in public

## Retention

Default policy:
- retain external contact references
- retain only useful normalized fields
- avoid copying the entire address book into memory
- store relationship meaning separately
- delete cached contact data after disconnection when appropriate

## Synchronization

The integration should support:
- on-demand lookup
- periodic metadata refresh
- manual refresh
- changed-contact detection
- last-sync timestamp

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
`Contacts search failed. No contact data was changed.`

If no match is found:
`I couldn't find a matching contact.`

If several matches exist:
`I found multiple contacts with that name. Which one do you mean?`

If a field is missing:
`I found the contact, but no email address is saved.`

## Audit Log

The integration should record:
- contact search
- contact opened
- field retrieved
- relationship link created
- permission changed
- synchronization failed

The log should avoid storing the actual private field value unless necessary.

## Phase 1 Implementation

Phase 1 should support:
- read-only contact search
- name and email resolution
- duplicate candidate detection
- linking contacts to relationship memory
- use in Gmail and Calendar workflows
- privacy-safe display
- sync status and error handling

Contact creation, editing, merging, and deletion should come later.

## Success Criteria

The Contacts Integration succeeds if Chief can reliably answer:
- who Nishad is referring to
- what approved contact detail is available
- which contact record matches
- how the person connects to relationship memory
- what communication action remains available

## Final Principle

The Contacts Integration should help North Vector find the right person without pretending that an address-book entry explains the relationship.