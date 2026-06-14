# Automation Template Library v1.0

## Purpose

This document defines a reusable library of approved automation patterns for North Vector.

The Automation Template Library exists to make useful automations easier to create without rebuilding trigger logic, permission rules, failure handling, and audit behavior from scratch.

Its purpose is not to encourage automation sprawl.

Its purpose is to provide tested starting points that remain editable, scoped, and reviewable.

## Core Principle

Templates should accelerate good automation design, not bypass judgment.

Every template should still require configuration, permission review, and validation before activation.

## Primary Objectives

The library should help Chief answer:
- Which automation pattern fits this need?
- What permissions are required?
- What risks should be expected?
- What trigger and failure policy should be used?
- What should remain manual?
- How should success be measured?

## Standard Template Record

Each template should contain:
- template_id
- title
- category
- purpose
- default_trigger
- default_conditions
- default_actions
- required_integrations
- permission_requirements
- approval_mode
- risk_level
- failure_policy
- notification_policy
- default_schedule
- configuration_fields
- success_metrics
- unsuitable_use_cases
- version
- status

## Template Categories

The library should support:
- Briefings
- Reviews
- Academic
- Communication
- Calendar
- Tasks and Commitments
- Opportunities
- Risks
- Projects
- Finance
- Health
- Travel
- Maintenance

## Template Statuses

Suggested statuses:
- Draft
- Experimental
- Approved
- Deprecated
- Retired

Only Approved templates should be recommended by default.

## Template Configuration Flow

Before activation, Chief should:
1. Select the template.
2. Identify the linked goal or use case.
3. Configure triggers and conditions.
4. Select data sources.
5. Review permission scope.
6. Preview actions.
7. Test in dry-run mode.
8. Confirm notification behavior.
9. Activate.
10. Review after initial runs.

## Template 1: Morning Briefing

### Purpose

Generate a concise operational briefing each morning.

### Default Trigger

Daily at a user-defined local time.

### Conditions

- calendar data is current
- task data is current
- user is not in quiet or travel override mode

### Actions

1. Read today's schedule.
2. Retrieve active priorities.
3. Review risks and opportunities.
4. Review commitments.
5. Generate briefing.
6. Deliver to dashboard and approved device.

### Approval Mode

Scoped Autonomous.

### Risk Level

Low.

### Failure Policy

If data is stale, refresh first. If refresh fails, generate a clearly labeled partial briefing.

## Template 2: Midday Replan

### Purpose

Rebuild the remainder of the day when execution or circumstances change.

### Trigger

Manual or scheduled midday check.

### Conditions

- at least one priority remains incomplete
- schedule has changed or work is behind

### Actions

1. Review completed work.
2. Review remaining time.
3. Preserve fixed commitments.
4. Re-rank remaining tasks.
5. Generate revised plan.
6. Ask before changing calendar events.

### Approval Mode

Manual for calendar changes.

### Risk Level

Low to Moderate.

## Template 3: Evening Shutdown

### Purpose

Close the day and prepare tomorrow.

### Trigger

Scheduled evening time or manual command.

### Actions

1. Review incomplete items.
2. Identify what should roll over, be revised, or be removed.
3. Capture one short lesson.
4. Prepare tomorrow's primary priority.
5. Suppress noncritical notifications for sleep window.

### Risk Level

Low.

## Template 4: Weekly Review

### Purpose

Generate and guide a structured weekly review.

### Trigger

Weekly at user-defined time.

### Conditions

- sufficient task, goal, risk, and calendar data exists

### Actions

1. Summarize wins and misses.
2. Review goals.
3. Review commitments.
4. Review risks and opportunities.
5. Review health and relationships.
6. Identify patterns and lessons.
7. Generate next-week priorities.

### Approval Mode

Scoped Autonomous for review generation; manual for applying strategic changes.

### Risk Level

Low.

## Template 5: Monthly Strategy Review

### Purpose

Review whether priorities and goals still make strategic sense.

### Trigger

Monthly.

### Actions

1. Aggregate weekly reviews.
2. Review resource allocation.
3. Review goal and project portfolios.
4. Identify repeated issues.
5. Propose strategic decisions.
6. Require approval before pausing or ending major goals.

### Risk Level

Moderate.

## Template 6: Assignment Intake

### Purpose

Convert a newly detected assignment into an actionable plan.

### Trigger

New assignment appears in the academic system.

### Conditions

- assignment is not already recorded
- due date is valid

### Actions

1. Normalize assignment.
2. Estimate effort.
3. Create linked task.
4. Identify latest safe start.
5. Propose calendar blocks.
6. Add risk monitoring if high stakes.

### Approval Mode

Task creation may be automatic; calendar changes require approval unless preauthorized.

### Risk Level

Low to Moderate.

## Template 7: Exam Preparation Monitor

### Purpose

Detect when exam preparation is behind and create a recovery plan.

### Trigger

Daily condition check for exams within a configured window.

### Conditions

- exam within defined number of days
- preparation below expected progress

### Actions

1. Evaluate preparation status.
2. Create or update academic risk.
3. Generate recovery plan.
4. Propose study blocks.
5. Escalate as latest safe start approaches.

### Approval Mode

Manual for calendar modifications.

### Risk Level

Moderate.

## Template 8: Deadline Cluster Detector

### Purpose

Identify periods with multiple competing deadlines.

### Trigger

Academic or task synchronization.

### Conditions

- several high-effort items fall within the same time window

### Actions

1. Group deadlines.
2. Estimate combined workload.
3. Compare available time.
4. Create compound risk if needed.
5. Recommend earlier starts and buffers.

### Risk Level

Low.

## Template 9: Mentor Follow-Up Assistant

### Purpose

Protect important relationship commitments.

### Trigger

Follow-up due within a configured window.

### Actions

1. Retrieve relationship context.
2. Read relevant thread if approved.
3. Draft message.
4. Present for review.
5. Send only after explicit confirmation.

### Approval Mode

Explicit confirmation before sending.

### Risk Level

Moderate.

## Template 10: Important Email Triage

### Purpose

Surface messages that require action without summarizing the entire inbox.

### Trigger

Scheduled Gmail scan or manual command.

### Conditions

- message is within approved scope
- importance threshold is met

### Actions

1. Classify messages.
2. Extract deadlines and commitments.
3. Create candidate tasks.
4. Surface only high-value messages.
5. Draft replies when useful.

### Approval Mode

Read and draft only by default.

### Risk Level

Moderate due to privacy.

## Template 11: Calendar Conflict Monitor

### Purpose

Detect impossible or risky schedule transitions.

### Trigger

Calendar event created or updated.

### Conditions

- overlap exists
- travel time is insufficient
- preparation window is threatened

### Actions

1. Identify conflict.
2. Calculate impact.
3. Recommend resolution.
4. Ask before modifying events.

### Risk Level

Moderate.

## Template 12: Commitment Escalation

### Purpose

Escalate neglected commitments proportionally.

### Trigger

Commitment reaches due date or repeated postponement threshold.

### Actions

1. Assess consequence.
2. Identify blocker.
3. Increase escalation level.
4. Recommend repair or renegotiation.
5. Notify only when meaningful.

### Risk Level

Low to Moderate.

## Template 13: Opportunity Deadline Watch

### Purpose

Prevent high-value opportunities from expiring unnoticed.

### Trigger

Opportunity enters configured deadline window.

### Conditions

- goal alignment is high
- opportunity remains active

### Actions

1. Review strategic value.
2. Surface required next action.
3. Create task or draft.
4. Escalate as deadline approaches.

### Risk Level

Low.

## Template 14: Project Stagnation Detector

### Purpose

Detect projects that remain active without meaningful execution.

### Trigger

Weekly project review.

### Conditions

- no artifact or milestone progress
- planning activity continues
- project remains marked active

### Actions

1. Flag possible architecture-without-execution pattern.
2. Identify first concrete artifact.
3. Recommend implementation freeze on further planning.
4. Create minimum viable next step.

### Risk Level

Low.

## Template 15: GitHub Documentation Commit

### Purpose

Create a requested architecture document and commit it to an approved repository.

### Trigger

Explicit user command.

### Conditions

- repository and path are approved
- file does not already exist
- content passes secret and scope checks

### Actions

1. Create file.
2. Use descriptive commit message.
3. Verify commit SHA.
4. Report created path and next planned file.

### Approval Mode

Explicit user command acts as approval for the stated file.

### Risk Level

Low to Moderate.

## Template 16: Financial Payment Reminder

### Purpose

Surface upcoming financial obligations without moving money.

### Trigger

Payment due within configured window.

### Conditions

- financial data is current
- obligation is confirmed

### Actions

1. Show due date and amount.
2. Check available funds if approved.
3. Create reminder.
4. Escalate if due date approaches without detected payment.

### Approval Mode

Read-only and notification only.

### Risk Level

Moderate due to sensitive data.

## Template 17: Low-Balance Risk Alert

### Purpose

Detect when an account may not cover upcoming obligations.

### Trigger

Balance or obligation data changes.

### Conditions

- projected available balance falls below configured threshold

### Actions

1. Create financial risk.
2. Show assumptions.
3. Recommend review.
4. Do not initiate transfers.

### Risk Level

High due to financial consequence, but read-only.

## Template 18: Sleep and Recovery Check

### Purpose

Protect capacity during sustained sleep loss or workload pressure.

### Trigger

Daily health-data refresh.

### Conditions

- sleep remains below threshold across several nights
- workload is elevated

### Actions

1. Create health or burnout risk candidate.
2. Adjust planning recommendations.
3. Protect recovery window.
4. Escalate cautiously if pattern persists.

### Risk Level

Moderate due to health sensitivity.

## Template 19: Appointment Preparation

### Purpose

Prepare for medical, academic, or professional appointments.

### Trigger

Configured time before appointment.

### Actions

1. Review event details.
2. Create preparation checklist.
3. Gather approved files or questions.
4. Calculate departure time.
5. Surface follow-up needs afterward.

### Risk Level

Low to Moderate.

## Template 20: Travel Day Briefing

### Purpose

Provide a travel-specific operational briefing.

### Trigger

Morning of a travel day or manual command.

### Actions

1. Review itinerary.
2. Review weather.
3. Review departure and travel time.
4. Review documents and luggage tasks.
5. Surface disruptions or risks.
6. Minimize unrelated alerts.

### Risk Level

Low.

## Template 21: Integration Health Check

### Purpose

Monitor whether critical data sources remain connected and current.

### Trigger

Scheduled daily or weekly check.

### Actions

1. Check authentication and last sync.
2. Identify stale or failed integrations.
3. Notify only when useful.
4. Pause dependent automations if safety checks cannot run.

### Risk Level

Low.

## Template 22: Stale Memory Review

### Purpose

Review memories that may no longer be accurate.

### Trigger

Monthly or quarterly.

### Conditions

- review date reached
- contradictory evidence exists
- memory has not been used recently

### Actions

1. Surface memory and evidence.
2. Ask confirm, revise, archive, or delete.
3. Update retrieval status.

### Risk Level

Low.

## Template 23: Decision Outcome Review

### Purpose

Review a major decision after the outcome becomes known.

### Trigger

Outcome event recorded or manual request.

### Actions

1. Reconstruct original context.
2. Compare expected and actual outcome.
3. Classify decision quality.
4. Capture lessons.
5. Update judgment rules.

### Risk Level

Low.

## Template 24: Notification Digest

### Purpose

Bundle low and medium-priority notices into a single review window.

### Trigger

Scheduled time or threshold count.

### Actions

1. Group related notices.
2. Remove resolved items.
3. Rank by consequence.
4. Deliver concise digest.

### Risk Level

Low.

## Template 25: Automation Health Review

### Purpose

Review whether an automation remains useful and reliable.

### Trigger

After first three runs, repeated failures, or scheduled review date.

### Actions

1. Review run history.
2. Review failures and overrides.
3. Review permission scope.
4. Recommend continue, revise, pause, or retire.

### Risk Level

Low.

## Template Selection Rules

Chief should recommend a template only when:
- the use case matches clearly
- required integrations exist
- permissions can remain narrow
- expected value exceeds setup cost
- automation does not replace necessary judgment

## Template Customization

Every template should allow editing of:
- schedule
- trigger
- conditions
- scope
- approval mode
- notification behavior
- failure policy
- linked goals

## Template Composition

Templates may be combined into workflows.

Example:

Assignment Intake
↓
Exam Preparation Monitor
↓
Calendar Conflict Monitor
↓
Weekly Review

Composition should preserve each component's permissions and failure rules.

## Template Versioning

Each template version should record:
- changes
- reason
- migration notes
- affected automations

Existing automations should not silently change when the template updates.

## Template Review

Templates should be reviewed based on:
- adoption
- success rate
- failure rate
- user overrides
- notification burden
- security concerns
- actual value

## Template Failure Modes

### Blind Template Use

A template is activated without fitting the context.

### Excessive Defaults

The template requests more access than necessary.

### Automation Sprawl

Templates make it too easy to create low-value automations.

### Hidden Assumptions

Default conditions are treated as universal.

### Version Drift

Old automations continue using outdated or unsafe patterns.

## Phase 1 Implementation

Phase 1 should include Approved templates for:
- Morning Briefing
- Weekly Review
- Assignment Intake
- Exam Preparation Monitor
- Mentor Follow-Up
- Calendar Conflict Monitor
- Opportunity Deadline Watch
- GitHub Documentation Commit
- Integration Health Check
- Automation Health Review

Templates should support preview, dry run, configuration, and versioning.

## Success Criteria

The Automation Template Library succeeds if Nishad can:
- create reliable automations faster
- understand the default behavior
- see required permissions
- customize scope and timing
- avoid rebuilding safety logic
- avoid accumulating useless automations

## Final Principle

A template should make good automation easier.

It should never make careless automation effortless.