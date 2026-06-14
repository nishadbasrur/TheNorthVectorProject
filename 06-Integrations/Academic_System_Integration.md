# Academic System Integration v1.0

## Purpose

This document defines how North Vector should connect to academic systems such as HuskyCT, Blackboard, course portals, registrar systems, gradebooks, assignment calendars, and university announcements.

The Academic System Integration exists to give Chief an accurate view of coursework, deadlines, grades, course materials, and academic obligations.

Its purpose is to transform scattered academic data into usable planning, risk detection, and decision support.

## Core Principle

Academic data should support preparation, not replace learning.

North Vector may organize, summarize, monitor, and plan around academic systems, but it should not complete graded work, take assessments, or bypass academic rules.

## Primary Objectives

The integration should help Chief answer:
- What assignments are due?
- What exams are coming?
- Which courses are at risk?
- What announcements matter?
- What preparation should begin now?
- Are grade trends changing?
- What administrative deadlines exist?

## Supported Systems

Possible sources include:
- HuskyCT
- Blackboard
- Canvas
- university registrar portals
- course websites
- gradebooks
- syllabus files
- academic calendars
- advising systems

## Supported Capabilities

### Read Capabilities

North Vector may read approved:
- course list
- course schedule
- assignment titles
- due dates
- assignment instructions
- grades
- announcements
- syllabus documents
- instructor information
- office hours
- exam dates
- academic holds
- registration status

### Search Capabilities

North Vector may search by:
- course
- assignment
- instructor
- deadline
- announcement
- keyword
- date range

### Planning Capabilities

North Vector may:
- generate study plans
- create preparation tasks
- create calendar blocks
- estimate workload
- detect deadline clusters
- identify prerequisite work

### Write Capabilities

Phase 1 should avoid direct submission or modification of academic records.

North Vector may create local tasks, calendar events, notes, and plans based on academic data.

## Prohibited Actions

North Vector should not:
- submit assignments autonomously
- take quizzes or exams
- answer graded questions on Nishad's behalf
- impersonate Nishad in academic systems
- alter grades
- bypass access controls
- violate course or university policies

## Permission Model

Recommended Phase 1 permissions:
- read approved academic portal data
- read course materials and announcements
- retrieve grades and deadlines
- create local tasks and calendar events
- no write access to the academic system
- no autonomous submission

## Course Normalization

Each course should be represented with:
- course_id
- external_course_id
- course_code
- title
- section
- instructor
- term
- credits
- meeting_times
- location
- office_hours
- grade_status
- risk_status
- related_goal_ids
- synchronization_status

## Assignment Normalization

Each assignment should contain:
- assignment_id
- external_assignment_id
- course_id
- title
- description
- due_at
- available_from
- submitted_status
- grade_status
- points_possible
- points_earned
- estimated_effort
- preparation_required
- related_task_ids
- source_url
- synchronization_status

## Exam Normalization

Each exam should contain:
- exam_id
- course_id
- title
- exam_date
- location
- duration
- topics
- format
- allowed_materials
- preparation_status
- risk_level
- related_goal_ids
- source

## Announcement Normalization

Announcements should contain:
- announcement_id
- course_id
- title
- body_summary
- posted_at
- importance
- action_required
- deadline
- source_url

## Academic Calendar Integration

The integration should import:
- semester start and end
- add or drop deadlines
- withdrawal deadlines
- holidays
- reading days
- finals period
- registration windows

Administrative deadlines should be treated separately from coursework deadlines.

## Deadline Detection

North Vector should detect deadlines from:
- structured assignment fields
- syllabus documents
- announcements
- instructor messages
- registrar calendars

Conflicts should be surfaced when different sources disagree.

## Syllabus Parsing

The system may extract:
- grading weights
- exam dates
- attendance policies
- office hours
- assignment schedule
- required materials
- late-work policy
- academic integrity rules

Extracted data should preserve page or section references where possible.

## Grade Monitoring

North Vector may track:
- current grade
- category grades
- missing assignments
- grade trend
- impact of upcoming work

Grade estimates should clearly distinguish official grades from projections.

## Academic Risk Detection

Signals may include:
- approaching exam with little preparation
- missing assignment
- declining grade trend
- clustered deadlines
- repeated late work
- insufficient study time
- administrative hold
- registration issue

Risk analysis should incorporate known behavioral patterns.

## Workload Estimation

The system may estimate workload based on:
- assignment type
- past completion time
- course difficulty
- instructions
- remaining time
- user estimates

Estimates should include uncertainty and improve through feedback.

## Study Plan Generation

For major exams or assignments, North Vector should:
1. identify scope
2. assess current mastery or progress
3. calculate available time
4. create preparation blocks
5. add buffer
6. schedule checkpoints
7. monitor execution

## Course Priority

Course priority may consider:
- credit weight
- current grade
- difficulty
- prerequisite role
- medical school relevance
- approaching deadlines
- risk level

## Grade Projection

The system may project possible outcomes using:
- current official grade
- grading weights
- remaining assignments
- estimated performance scenarios

Projections should be labeled as estimates, not facts.

## Announcement Processing

Announcements should be classified as:
- Action Required
- Deadline Change
- Exam Information
- Course Material
- Administrative
- Informational

Low-value announcements should not clutter briefings.

## Daily Briefing Integration

Academic data may support:
- classes today
- assignments due
- exam countdown
- current academic risks
- recommended study action
- instructor updates

## Weekly Review Integration

The review should consider:
- completed assignments
- missed work
- grade changes
- study adherence
- upcoming deadline clusters
- course risk levels

## Calendar Integration

Academic events should connect to:
- class schedule
- exams
- office hours
- assignment deadlines
- study blocks
- travel time

## Gmail Integration

Academic email may supplement portal data.

When sources disagree:
- preserve both
- compare timestamps
- prefer official current source when clear
- ask for clarification if consequential

## File Integration

Course materials may be stored in Drive or local project folders.

North Vector should link:
- syllabus
- notes
- assignments
- study guides
- review sheets

to the relevant course.

## Privacy

Academic records are sensitive.

The integration should:
- restrict grade visibility
- hide course details on public devices when necessary
- avoid reading grades aloud in public
- minimize retention of full assignment content
- require authentication for restricted records

## Synchronization

The integration should support:
- scheduled refresh
- on-demand refresh
- manual correction
- last-sync timestamp
- stale-data indicator

## Synchronization States

Suggested states:
- Current
- Syncing
- Delayed
- Authentication Expired
- Permission Limited
- Source Conflict
- Error
- Disconnected

## Error Handling

If course retrieval fails:
`Academic data could not be refreshed. Existing course records may be outdated.`

If one course fails:
`CHEM 1127Q could not be updated, but other courses are current.`

If grade data is unavailable:
`The portal did not return current grades. No estimate was substituted as official data.`

## Audit Log

The integration should record:
- portal accessed
- course read
- assignment imported
- grade refreshed
- announcement processed
- syllabus parsed
- conflict detected
- permission changed
- synchronization failed

## Phase 1 Implementation

Phase 1 should support:
- read course list
- read assignment deadlines
- read announcements
- read available grades
- import syllabus files
- normalize courses and assignments
- create local tasks and calendar events
- detect deadline clusters
- generate study plans
- show synchronization status

Direct academic-system writes and submissions should not be included.

## Success Criteria

The Academic System Integration succeeds if Chief can reliably answer:
- what is due
- what is coming
- which course needs attention
- what preparation should begin
- what grade data is official
- what risk is emerging
- what action should happen next

## Final Principle

The academic portal should stop being a place Nishad has to remember to check.

North Vector should turn it into a continuously updated map of academic obligations, without crossing the line into doing the academic work for him.