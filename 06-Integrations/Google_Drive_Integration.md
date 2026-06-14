# Google Drive Integration v1.0

## Purpose

This document defines how North Vector should connect to Google Drive, search and retrieve files, read approved documents, create and update project materials, organize records, and preserve permission boundaries.

The Google Drive Integration exists to give Chief access to Nishad's working documents without turning the entire Drive into an indiscriminate data source.

Its purpose is to support retrieval, drafting, organization, and continuity across projects.

## Core Principle

North Vector should access only the files and folders needed for the current function.

Drive access should remain narrow, visible, and reversible.

## Primary Objectives

The integration should help Chief answer:
- Where is the relevant document?
- What does it contain?
- Which version is current?
- What should be created or updated?
- Which files relate to this goal or project?
- What access is required?
- What changed?

## Supported Capabilities

### Read Capabilities

North Vector may read approved:
- Google Docs
- Google Sheets
- Google Slides
- PDFs
- text files
- selected office documents
- folder metadata
- file metadata

### Search Capabilities

North Vector may search by:
- title
- keyword
- folder
- file type
- owner
- modified date
- project
- goal

### Create Capabilities

North Vector may create:
- documents
- project notes
- planning files
- review records
- templates
- folders within approved scope

### Update Capabilities

North Vector may update approved files when permission exists.

### Move and Organize Capabilities

North Vector may propose or perform approved actions such as:
- move file
- rename file
- add to folder
- archive document
- apply naming conventions

### Delete Capabilities

Deleting or trashing files requires explicit confirmation by default.

## Permission Model

Recommended Phase 1 permissions:
- read one approved North Vector folder
- search within approved folders
- create files in one project folder
- ask before editing existing externally shared files
- ask before moving or renaming important files
- always ask before deleting

## Drive Scope

The integration should support scope by:
- account
- folder
- shared drive
- file
- file type
- owner
- project

The default should be one dedicated North Vector folder rather than full Drive access.

## File Normalization

Drive files should be normalized into structured records.

Suggested fields:
- file_id
- external_file_id
- account_id
- title
- mime_type
- folder_ids
- owner
- created_at
- modified_at
- version
- web_url
- size
- permissions
- sharing_status
- content_summary
- related_goal_ids
- related_project_ids
- sensitivity
- synchronization_status

## File Classification

North Vector may classify files as:
- Foundation Document
- Architecture Document
- Project Document
- Academic Document
- Financial Document
- Health Document
- Relationship Document
- Review Record
- Template
- Archive

Classifications should remain editable.

## Search Flow

When Nishad asks:
`Find the North Vector Constitution.`

Chief should:
1. search approved scope
2. rank relevant files
3. show concise file cards
4. open the selected file
5. preserve the file reference for follow-up

## Read Flow

Before reading a file, Chief should:
- verify scope and permission
- identify file type
- retrieve current version
- preserve source reference
- summarize only as needed
- avoid unnecessary retention of full content

## Create Flow

Before creating a file, Chief should identify:
- title
- file type
- destination folder
- purpose
- related project or goal
- sensitivity
- whether sharing is required

The system should use consistent naming conventions.

## Update Flow

Before updating an existing file, Chief should:
- fetch the current version
- verify ownership and sharing state
- preserve the existing content
- determine whether a full replacement or targeted edit is intended
- record the change
- avoid overwriting newer edits

## Version Conflict Handling

If the file changed after retrieval:
- do not overwrite silently
- compare versions
- show the conflict
- merge when safe
- ask for clarification when necessary

## Shared File Rules

Files shared with other people require stronger caution.

Before editing, Chief should consider:
- ownership
- collaborators
- comment or suggestion mode
- externally visible changes
- notification impact

## Naming Conventions

North Vector should support consistent names such as:
- `Constitution.md`
- `Weekly_Review_2026-06-14`
- `CHEM_1127Q_Study_Plan`
- `Project_Name_Decision_Log`

Naming rules should be simple and searchable.

## Folder Organization

Suggested high-level folders:
- North Vector
- Academics
- Career
- Finance
- Health
- Projects
- Reviews
- Archive

The integration should not reorganize the entire Drive automatically.

## Project Linking

Files should be linkable to:
- goals
- projects
- decisions
- tasks
- people
- events

This allows Chief to retrieve documents by meaning, not only filename.

## Content Extraction

The integration may extract:
- deadlines
- commitments
- decisions
- action items
- names
- project status
- lessons

Extracted information should become candidate records, not unquestioned truth.

## Document Summaries

Summaries should include:
- purpose
- key points
- decisions
- open questions
- action items
- last modified date

The summary should preserve the source link.

## Google Docs Behavior

North Vector may:
- read document content
- create documents
- append sections
- replace approved content
- propose edits

Commenting and suggestion mode should be preferred for shared documents when available.

## Google Sheets Behavior

North Vector may:
- read structured data
- append rows
- update approved ranges
- summarize trends

The integration should preserve headers, formulas, and data types.

## Google Slides Behavior

North Vector may:
- read slide text and notes
- create outlines
- update approved presentations

Visual design changes should require explicit instruction.

## PDF and Uploaded File Behavior

North Vector may:
- retrieve approved PDFs
- summarize content
- extract structured information
- preserve page references

It should not silently convert or replace original files.

## Sharing and Permissions

Before changing sharing settings, Chief should show:
- current access
- proposed access
- people affected
- whether the link becomes public

Sharing changes require explicit confirmation.

## Privacy

Drive may contain highly sensitive information.

The integration should:
- exclude sensitive folders by default
- restrict health, financial, legal, and identity documents
- hide previews on public devices
- require authentication for restricted files
- avoid reading private content aloud in public

## Retention

Default policy:
- retain file references and structured summaries
- avoid duplicating full file contents into long-term memory
- preserve derived memories only when useful
- allow deletion of derived data

## Synchronization

The integration should support:
- on-demand retrieval
- scheduled indexing of approved folders
- manual refresh
- modified-time checks
- stale-data indicators

## Synchronization States

Suggested states:
- Current
- Syncing
- Delayed
- Authentication Expired
- Permission Limited
- Conflict
- Error
- Disconnected

## Error Handling

If search fails:
`Google Drive search failed. No files were changed.`

If creation fails:
`The file was not created.`

If update fails:
`The file was not updated. The existing version remains unchanged.`

If a version conflict occurs:
`The document changed after I opened it. I did not overwrite the newer version.`

## Audit Log

The integration should record:
- folder searched
- file opened
- file created
- file updated
- file moved
- file renamed
- file shared
- file trashed
- permission changed
- synchronization failed

The log should remain concise and readable.

## Phase 1 Implementation

Phase 1 should support:
- connect one approved Drive folder
- search files
- read Google Docs and PDFs
- create new documents in an approved folder
- update approved files with confirmation
- file references and summaries
- version conflict protection
- sync status and error handling

Full-Drive indexing, automatic reorganization, and broad write access should come later.

## Success Criteria

The Google Drive Integration succeeds if Chief can reliably answer:
- where the relevant file is
- what it contains
- whether it is current
- what should be created or updated
- what changed
- what access is being used

## Final Principle

Google Drive should become North Vector's document library, not an invisible source of unrestricted personal data.