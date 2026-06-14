# Design System v1.0

## Purpose

This document defines the visual language, component standards, interaction principles, spacing, typography, color usage, iconography, and accessibility rules for North Vector.

The Design System exists to make every interface feel like part of one coherent product.

## Core Principle

North Vector should feel calm, precise, restrained, and trustworthy.

The interface should support clear judgment and action without visual noise, unnecessary decoration, or engagement-driven design.

## Brand Character

The product should feel:
- intelligent
- composed
- direct
- private
- high-trust
- modern
- quietly ambitious

It should not feel:
- gamified
- childish
- flashy
- clinical
- militaristic
- corporate
- emotionally manipulative

## Visual Direction

North Vector should use:
- navy as the primary brand family
- neutral backgrounds
- limited accent colors
- strong typographic hierarchy
- generous spacing
- restrained borders and shadows
- minimal animation

## Color System

### Primary Navy

Use for:
- brand identity
- primary actions
- selected navigation
- key headings

### Neutral Backgrounds

Use for:
- page backgrounds
- cards
- panels
- separators

### Status Colors

Use for:
- success
- caution
- risk
- critical alerts
- informational states

Color should never be the only status signal.

Every state must also include text, iconography, or shape.

## Suggested Semantic Tokens

- background-primary
- background-secondary
- surface-primary
- surface-elevated
- text-primary
- text-secondary
- text-muted
- border-default
- border-strong
- action-primary
- action-secondary
- status-success
- status-warning
- status-risk
- status-critical
- status-info

Exact color values should be selected during visual prototyping and tested for accessibility.

## Typography

The typography system should prioritize readability and hierarchy.

Suggested roles:
- Display
- Page Title
- Section Heading
- Card Title
- Body
- Secondary Body
- Label
- Caption
- Monospace Data

Guidelines:
- use one primary sans-serif family
- use monospace sparingly for IDs, code, and structured records
- avoid overly narrow typefaces
- maintain comfortable line height
- avoid all-caps for long labels

## Type Hierarchy

### Display

Use only for major landing moments.

### Page Title

Use once per page.

### Section Heading

Use for major content groups.

### Card Title

Use for compact objects.

### Body

Use for primary readable content.

### Label

Use for metadata and field names.

### Caption

Use for timestamps, sources, and secondary context.

## Spacing System

Use a consistent spacing scale.

Suggested base increments:
- 4
- 8
- 12
- 16
- 24
- 32
- 48
- 64

Spacing should create clear grouping and reduce visual density.

## Layout Grid

Desktop:
- flexible multi-column grid
- maximum readable content width
- persistent navigation where useful

Tablet:
- reduced columns
- collapsible side panels

Mobile:
- single-column priority flow
- bottom or compact navigation
- action sheets for secondary content

## Surface Levels

Suggested levels:

### Base Surface

Main page background.

### Card Surface

Standard content container.

### Elevated Surface

Modal, popover, or confirmation tray.

### Critical Surface

Used sparingly for urgent states.

Elevation should remain subtle.

## Border Radius

Use a restrained radius system.

Suggested levels:
- small for compact controls
- medium for cards
- large for sheets or major panels

Avoid excessive pill-shaped components.

## Shadows

Shadows should be subtle and used only to communicate layering.

Avoid dramatic floating-card aesthetics.

## Iconography

Icons should be:
- simple
- consistent
- geometric
- recognizable
- secondary to text

Use icons for:
- navigation
- status
- actions
- device state
- privacy indicators

Do not rely on icons alone for important meaning.

## Core Components

The Design System should define:
- Button
- Icon Button
- Text Input
- Voice Input
- Select
- Checkbox
- Toggle
- Radio Group
- Card
- Alert
- Badge
- Status Label
- Tooltip
- Modal
- Drawer
- Confirmation Tray
- Tabs
- Table
- Timeline
- Progress Indicator
- Empty State
- Error State
- Loading State
- Navigation Item
- Search Field

## Buttons

### Primary Button

Use for the single most important action in a region.

### Secondary Button

Use for supporting actions.

### Tertiary Button

Use for low-emphasis actions.

### Destructive Button

Use only for irreversible or harmful actions.

Each button should have:
- default
- hover
- focus
- active
- disabled
- loading states

## Cards

Cards should contain one coherent object or decision.

Examples:
- goal
- risk
- opportunity
- task
- event
- memory

Every actionable card should make the primary next action clear.

## Status Labels

Suggested status labels:
- On Track
- Attention Needed
- At Risk
- Critical
- Waiting
- Completed
- Deferred
- Archived

Status labels should remain consistent across the product.

## Alerts

Alert levels:
- informational
- success
- warning
- risk
- critical

Alerts should include:
- title
- concise explanation
- action when available

Critical styling should remain rare.

## Progress Indicators

Use progress indicators only when progress can be represented honestly.

Possible forms:
- percentage bar
- milestone count
- step progress
- qualitative status

Do not force qualitative goals into precise percentages.

## Tables

Tables should support:
- sorting
- filtering
- keyboard navigation
- responsive collapse
- clear row actions

Dense data should use tables only when comparison is the primary task.

## Timelines

Timelines should show:
- current time
- events
- transitions
- preparation
- status

The current point in time should remain visually obvious.

## Forms

Forms should:
- ask only necessary questions
- group related fields
- use plain language
- preserve defaults
- explain consequences
- validate inline

Long forms should use progressive disclosure.

## Navigation

Primary navigation should remain stable.

Suggested destinations:
- Today
- Goals
- Tasks
- Calendar
- Risks
- Opportunities
- Memory
- Reviews
- Chief
- Settings

Active location should always be clear.

## Search

Search should support:
- natural language
- object type filters
- recent searches
- keyboard access

Results should show object type and context.

## Motion

Motion should be:
- functional
- brief
- subtle
- interruptible

Use motion for:
- state change
- panel transition
- confirmation
- loading

Avoid:
- decorative looping animation
- excessive celebration
- fake typing effects
- attention-grabbing movement

## Loading States

Loading should communicate truthfully.

Use:
- skeletons for known layouts
- spinners for short waits
- progress text for longer tasks

Do not simulate progress inaccurately.

## Empty States

Empty states should explain:
- what the area contains
- why it is empty
- what action is available

Example:
`No active risks require attention.`

## Error States

Errors should state:
- what failed
- what was not changed
- what may be outdated
- what action is available

## Confirmation Patterns

Sensitive actions should show:
- exact action
- target
- consequence
- confirm and cancel controls

Destructive actions should not use vague labels such as `Continue`.

## Privacy Indicators

The interface should consistently show:
- microphone state
- camera state
- no-memory mode
- sensitive mode
- public mode
- trusted-device status

Privacy indicators should be recognizable across all views.

## Accessibility

The Design System should meet strong accessibility standards.

Requirements:
- sufficient contrast
- keyboard navigation
- visible focus states
- screen-reader labels
- scalable text
- reduced motion
- non-color state communication
- large enough touch targets
- logical heading structure

## Content Style

Interface language should be:
- direct
- specific
- calm
- concise
- nonjudgmental

Prefer:
`Chemistry preparation is one session behind.`

Avoid:
`You're falling behind again.`

## Voice and Tone by Context

### Standard

Calm and matter-of-fact.

### Risk

Direct and specific.

### Opportunity

Optimistic but restrained.

### Reflection

Thoughtful and nonjudgmental.

### Error

Clear and accountable.

### Confirmation

Precise and unambiguous.

## Responsive Behavior

Desktop should support:
- multi-panel workflows
- tables
- side navigation
- detail panes

Mobile should prioritize:
- next action
- quick capture
- voice
- notifications
- compact cards

Wearables should reduce to:
- glanceable information
- simple confirmation
- critical alerts

## Theming

The system should support:
- light mode
- dark mode
- high-contrast mode

All themes should preserve the North Vector identity.

## Component Governance

New components should only be created when an existing component cannot support the use case.

Each component should define:
- purpose
- variants
- states
- accessibility behavior
- responsive behavior
- usage examples
- misuse examples

## Versioning

The Design System should use versioned tokens and components.

Changes should document:
- what changed
- why
- affected views
- migration needs

## Failure Modes

### Visual Drift

Different screens feel like different products.

### Component Sprawl

Too many one-off components appear.

### Color Overload

Every category receives a different color.

### Gamification

Progress and alerts become emotionally manipulative.

### Accessibility Debt

Accessibility is postponed until later.

### Dense Interface

The system displays everything because it can.

### Inconsistent Language

The same state receives different labels across views.

## Phase 1 Implementation

Phase 1 should define:
- color tokens
- typography scale
- spacing scale
- core surfaces
- buttons
- inputs
- cards
- alerts
- status labels
- navigation
- tables
- timelines
- empty and error states
- accessibility rules
- responsive behavior

Advanced animation and custom illustration can come later.

## Success Criteria

The Design System succeeds if:
- every interface feels coherent
- important information is easy to scan
- actions are obvious
- risk does not become alarmist
- opportunity does not become hype
- accessibility is built in
- new features can reuse established patterns

## Final Principle

North Vector should look the way good judgment feels:

calm, clear, deliberate, and trustworthy.