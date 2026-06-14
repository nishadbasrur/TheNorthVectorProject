# Task System Integration v1.0

## Purpose

This document defines how North Vector should connect to external task systems, import and normalize tasks, create and update approved items, synchronize completion state, and preserve the distinction between tasks, commitments, habits, milestones, and waiting items.

The Task System Integration exists to ensure that execution data can move cleanly between North Vector and whichever external task platform Nishad chooses.

Its purpose is not to duplicate every task in every system.

Its purpose is to maintain one coherent operational picture.

## Core Principle

North Vector should treat external task systems as execution surfaces, not as the source of strategic truth.

Goals, priorities, risks, and commitments remain governed by North Vector's internal models.

## Primary Objectives

The integration should help Chief answer:
- What tasks exist?
- Which system owns each task?
- What is due or overdue?
- Which tasks are commitments to other people?
- What changed externally?
- What should be created or updated?
- Which conflicts or duplicates exist?

## Supported Systems

Possible integrations include:
- Todoist
- Apple Reminders
- Microsoft To Do
- Google Tasks
- Notion
- Asana
- Trello
- Linear
- custom North Vector task database

## Supported Capabilities

### Read Capabilities

North Vector may read approved:
- tasks
- projects or lists
- due dates
- priorities
- labels
- notes
- recurrence
- completion state
- assignees
- dependencies where supported

### Create Capabilities

North Vector may create:
- tasks
- commitments
- follow-ups
- recurring habits
- project actions
- review reminders

### Update Capabilities

North Vector may update approved:
- title
- due date
- priority
- notes
- labels
- status
- recurrence

### Complete Capabilities

North Vector may mark tasks complete within approved scope.

### Delete Capabilities

Deleting tasks requires explicit confirmation by default unless a narrow low-risk rule has been approved.

## Permission Model

Recommended Phase 1 permissions:
- read one approved account or workspace
- create tasks in one approved project or list
- update low-risk personal tasks within defined scope
- ask before modifying commitments involving other people
- ask before deleting
- avoid broad workspace administration

## Task Ownership

Each task should preserve its source of truth.

Suggested ownership values:
- North Vector
- External System
- Shared

The system should avoid creating circular synchronization where both sides overwrite each other unpredictably.

## Task Normalization

Each external task should be converted into the North Vector Task and Commitment model.

Suggested fields:
- task_id
- external_task_id
- provider
- account_id
- project_or_list_id
- title
- description
- item_type
- status
- priority
- created_at
- due_at
- planned_start_at
- completed_at
- recurrence_rule
- labels
- assignees
- related_goal_ids
- related_project_ids
- related_people_ids
- postponement_count
- next_action
- source_of_truth
- synchronization_status

## Item Type Classification

External systems often treat everything as a task.

North Vector should classify items as:
- Task
- Commitment
- Follow-Up
- Milestone
- Habit
- Waiting Item
- Administrative Obligation

Classification may use:
- title
- notes
- labels
- linked people
- recurrence
- related goal

Inferred classifications should remain editable.

## Read Flow

When synchronizing tasks, Chief should:
1. fetch approved projects or lists
2. normalize tasks
3. detect creations, updates, completions, and deletions
4. classify item type
5. link tasks to goals, projects, people, and events
6. detect duplicates and conflicts
7. update short-term operational memory
8. record synchronization time

## Create Flow

Before creating a task, Chief should identify:
- title
- item type
- due date
- priority
- related goal or project
- person involved if any
- destination list
- recurrence
- next action

Low-risk personal tasks may be created automatically within approved scope.

Commitments to others should use stronger confirmation.

## Update Flow

Before updating a task, Chief should:
- verify current external state
- preserve source ownership
- determine whether the change affects another person
- detect deadline or recurrence impact
- request confirmation when required

## Completion Flow

When a task is completed:
- update the external system
- record completion evidence when useful
- update linked goals and projects
- resolve related risks when appropriate
- generate follow-up tasks if needed

Completion should synchronize in both directions when the ownership policy allows it.

## Deletion Flow

Deleting a task should distinguish between:
- delete externally
- archive in North Vector
- remove local link
- cancel the commitment

These actions are not equivalent.

## Duplicate Detection

Possible duplicates may be identified through:
- similar title
- same due date
- same project
- same linked person
- matching external and local references

The system should surface duplicates but avoid automatic merging unless confidence is high and the action is reversible.

## Conflict Handling

Conflicts may occur when:
- due date changes in both systems
- one side marks complete while the other reopens
- title or notes diverge
- recurrence differs
- the external task was deleted

Conflict resolution should:
- preserve both versions temporarily
- compare timestamps
- respect source of truth
- ask for clarification when consequential

## Recurring Tasks

Recurring tasks require careful normalization.

The integration should distinguish:
- recurring template
- current occurrence
- completion-generated next occurrence
- skipped occurrence

North Vector should not accidentally create duplicate recurrences.

## Priority Mapping

External priority schemes should map into North Vector's levels:
- Critical
- High
- Medium
- Low

Mapping rules should be provider-specific and editable.

## Label Mapping

External labels may map to:
- domain
- project
- goal
- person
- task type
- context

The system should avoid turning every label into permanent memory.

## Waiting Items

Tasks marked as waiting should include:
- dependency
- person or resource awaited
- last follow-up date
- next follow-up date
- fallback option

## Commitment Detection

A task should be treated as a commitment when:
- another person or institution is relying on completion
- a promise was explicitly made
- failure affects trust, reputation, or compliance

Commitments should receive stronger accountability treatment than ordinary tasks.

## Goal Linking

Tasks should link to active goals whenever possible.

Unlinked tasks may be flagged for review if they repeatedly consume meaningful time.

## Planning Engine Integration

The Planning Engine should use task data to:
- select next actions
- schedule work
- estimate workload
- detect overload
- replan unfinished work

## Accountability Engine Integration

The Accountability Engine should use:
- due dates
- postponement count
- completion history
- commitment type
- recurrence adherence

## Risk Engine Integration

Task signals may create risks such as:
- overdue commitment
- repeated rollover
- blocked milestone
- missed preparation task
- excessive workload

## Daily Briefing Integration

The briefing should surface:
- top tasks
- overdue commitments
- blocked items
- tasks due soon
- next action

It should not list the entire task inventory.

## Synchronization

The integration should support:
- scheduled sync
- on-demand refresh
- event-driven updates where available
- last-sync timestamp
- stale-data indicator

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

## Offline Behavior

When offline, North Vector may:
- create local tasks
- mark local completion
- queue updates
- synchronize later

The interface should clearly show pending synchronization.

## Privacy

Task systems may contain sensitive personal information.

The integration should:
- restrict projects or lists by scope
- hide sensitive details on public devices
- avoid reading private task notes aloud in public
- minimize retention of unnecessary notes
- support per-project exclusion

## Audit Log

The integration should record:
- task imported
- task created
- task updated
- task completed
- task reopened
- task deleted
- conflict detected
- permission changed
- synchronization failed

## Error Handling

If reading fails:
`Task data could not be refreshed. Existing items may be outdated.`

If creation fails:
`The task was not created.`

If completion fails:
`The task remains incomplete in the external system.`

If a conflict occurs:
`This task changed in both systems. I did not overwrite either version.`

## Provider-Specific Adapters

Each provider should define:
- supported fields
- priority mapping
- recurrence behavior
- project or list structure
- rate limits
- completion semantics
- deletion behavior

## Phase 1 Implementation

Phase 1 should support:
- one approved task provider
- task read and normalization
- create tasks in one approved list
- update due date, priority, and status
- completion synchronization
- duplicate detection
- conflict protection
- goal and project linking
- sync status and error handling

Bulk cleanup, complex recurrence reconciliation, and multi-provider synchronization can come later.

## Success Criteria

The Task System Integration succeeds if Chief can reliably answer:
- what tasks exist
- which ones matter
- what is overdue
- which items are commitments
- what changed externally
- what action should happen next
- whether synchronization is current

## Final Principle

External task systems should help North Vector execute the plan.

They should not become competing versions of reality.