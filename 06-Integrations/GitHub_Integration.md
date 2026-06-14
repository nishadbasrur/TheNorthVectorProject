# GitHub Integration v1.0

## Purpose

This document defines how North Vector should connect to GitHub, read repositories, create and update files, manage issues and pull requests, inspect commits, and preserve repository safety.

The GitHub Integration exists to make North Vector capable of working directly inside approved repositories while keeping scope, history, and destructive actions under strict control.

## Core Principle

GitHub is an execution environment with permanent history.

North Vector should use it deliberately, preserve traceability, and avoid silent or destructive changes.

## Primary Objectives

The integration should help Chief answer:
- What repositories are available?
- What files and branches exist?
- What changed?
- What should be created or updated?
- Which issues or pull requests need attention?
- What actions require approval?
- How can every change be traced?

## Supported Capabilities

### Read Capabilities

North Vector may read approved:
- repositories
- files
- branches
- commits
- issues
- pull requests
- review comments
- workflow status
- repository metadata

### Create Capabilities

North Vector may create:
- files
- branches
- commits
- issues
- pull requests
- comments
- labels

### Update Capabilities

North Vector may update approved:
- files
- issues
- pull requests
- comments
- branch refs

### Review Capabilities

North Vector may:
- inspect diffs
- summarize changes
- add review comments
- approve or request changes when authorized

### Merge Capabilities

Merging pull requests requires explicit approval by default.

### Delete Capabilities

Deleting files, branches, or other repository content requires explicit confirmation and should remain rare.

## Permission Model

Recommended Phase 1 permissions:
- access one approved repository
- read repository contents
- create and update files on the default branch when explicitly requested
- create branches and pull requests within approved scope
- ask before deleting files
- ask before merging pull requests
- avoid organization-wide access

## Repository Scope

Permissions should be restrictable by:
- repository
- branch
- directory
- file path
- action type
- issue label
- pull request state

The default should be one repository rather than all repositories.

## Repository Normalization

Each repository should be represented with:
- repository_id
- full_name
- owner
- default_branch
- visibility
- description
- permissions
- last_updated_at
- active_branch
- integration_status
- related_project_ids

## File Operations

### Read File

Chief should:
1. verify repository scope
2. identify branch or ref
3. fetch the file
4. preserve the source path
5. avoid assuming the file is current if a newer commit exists

### Create File

Before creating a file, Chief should verify:
- repository
- path
- branch
- content
- commit message
- whether the path already exists

### Update File

Before updating a file, Chief should:
- fetch the current file and blob SHA
- compare the intended change
- preserve existing content
- avoid overwriting newer changes
- provide a clear commit message

### Delete File

Deleting should require:
- explicit confirmation
- current file SHA
- clear explanation
- reversible recovery path when possible

## Branching Strategy

North Vector should support:
- direct commit to default branch for simple approved documentation changes
- feature branches for code changes or larger edits
- pull requests for reviewable work

The branch strategy should depend on risk and collaboration context.

## Direct Commit Rule

Direct commits may be appropriate when:
- repository is personal
- change is low risk
- file is new or clearly isolated
- user explicitly requested creation
- no collaborator review is required

## Pull Request Rule

Use pull requests when:
- code changes are significant
- multiple files are modified
- review is valuable
- collaboration is involved
- rollback and discussion matter

## Commit Message Standards

Commit messages should be concise and descriptive.

Examples:
- `Add Voice Session Manager v1.0`
- `Update Risk Engine escalation rules`
- `Fix dashboard priority sorting`

Avoid vague messages such as:
- `Update stuff`
- `Changes`

## Issue Management

North Vector may:
- create issues
- update issues
- add labels
- assign users
- close or reopen issues
- comment on issues

Each issue should include:
- clear title
- context
- acceptance criteria
- related files or goals

## Pull Request Management

North Vector may:
- create pull requests
- inspect metadata
- fetch diffs
- comment
- request reviewers
- mark ready for review
- merge when explicitly approved

## Review Behavior

When reviewing a pull request, Chief should examine:
- correctness
- scope
- regressions
- security
- test coverage
- documentation
- architectural alignment

Review comments should be specific and actionable.

## Conflict Handling

If a file changed after retrieval:
- do not overwrite silently
- fetch the latest version
- compare changes
- merge carefully
- ask for clarification when needed

If a branch moved:
- verify the current head SHA
- avoid force updates unless explicitly approved

## Repository History

North Vector should preserve:
- commit SHA
- commit message
- author
- timestamp
- affected files
- related decision or task

This allows repository changes to connect to North Vector memory and accountability.

## Project Integration

GitHub activity should link to:
- project milestones
- tasks
- goals
- decisions
- risks
- reviews

Example:

Commit:
`Add Memory Inspector Design v1.0`

Related Project:
`North Vector Architecture`

Related Milestone:
`Complete User Interface Specification`

## Code Search

North Vector may search repositories by:
- filename
- function name
- error message
- keyword
- issue reference

Search should remain limited to approved repositories.

## Workflow and CI Integration

North Vector may inspect:
- workflow runs
- job status
- failed steps
- logs
- artifacts

It may propose reruns or fixes.

Rerunning jobs should require appropriate permission and should be explained.

## Security Rules

North Vector should never:
- expose secrets
- commit credentials
- print private tokens
- publish private repository content
- bypass branch protection
- force-push without explicit approval

## Secret Detection

Before committing, Chief should check for likely:
- API keys
- passwords
- private tokens
- certificates
- personal identifiers

If detected, stop and warn.

## Sensitive Repository Rules

Private repositories may contain sensitive code or data.

The integration should:
- minimize content retention
- restrict access by repository
- hide previews on public devices
- avoid copying code into unrelated memory
- require stronger authentication for restricted repositories

## Audit Log

The integration should record:
- repository accessed
- file read
- file created
- file updated
- file deleted
- branch created
- commit created
- issue created or modified
- pull request created or merged
- review submitted
- workflow rerun
- permission changed

## Synchronization

The integration should support:
- on-demand repository reads
- commit-aware refresh
- branch state checks
- stale reference detection
- manual refresh

## Synchronization States

Suggested states:
- Current
- Syncing
- Stale Ref
- Permission Limited
- Authentication Expired
- Conflict
- Error
- Disconnected

## Error Handling

If file creation fails:
`The file was not created. No repository changes were made.`

If update fails:
`The file was not updated. The existing version remains unchanged.`

If conflict occurs:
`The file changed after I opened it. I did not overwrite the newer version.`

If merge fails:
`The pull request was not merged.`

## Phase 1 Implementation

Phase 1 should support:
- one approved repository
- file read
- file creation
- file update
- commit creation
- issue creation
- pull request creation
- diff inspection
- explicit confirmation before deletion or merge
- audit logging
- conflict protection

Advanced code review automation and CI remediation can come later.

## Success Criteria

The GitHub Integration succeeds if Chief can reliably answer:
- what repository is active
- what files exist
- what changed
- what should be created or updated
- what commit was produced
- what action requires approval
- how the change can be traced or reversed

## Final Principle

GitHub should become North Vector's execution history, not a black box where changes simply appear.