# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single primary user: Nishad, the sole and permanent user of this product. North Vector is not built toward multi-tenant or shared-access use — every product decision can assume exactly one person, who already knows the product intimately, rather than a general public or B2B audience being onboarded for the first time.

## Product Purpose

North Vector is "North" — a personal AI chief-of-staff, voice-first, that manages Nishad's email, calendar, tasks, Notion workspace, and day-to-day decisions, and proactively surfaces what needs attention (briefings, urgent items, capability gaps) rather than only responding when asked. It also includes a self-build pipeline: North can draft its own bug fixes and capability additions as reviewable PRs, and (newest capability) run a self-directed coding agent against real repos on explicit confirmation.

## Positioning

Not a general-purpose assistant SaaS product — a deeply personal, single-user, context-aware operator. It knows Nishad's specific accounts, calendar, tasks, and ongoing projects directly (not through generic integrations a stranger could configure the same way), and it acts proactively on his behalf rather than only on demand.

## Operating Context

Primary interaction is voice, via a wake-word ("Hey North") flow with real-time streaming transcription and TTS response. A companion web UI (Sandbox, Dashboard, Weekly Review, and utility pages — activity, tasks, projects, goals, decisions, memories, opportunities, accounts, settings, tool-errors, capability-review) supports the same underlying assistant. Runs on Next.js/Firebase App Hosting with standalone Cloud Run services for streaming STT and the agent runner.

## Capabilities and Constraints

Confirmed capabilities: email (check/search/send/draft/delete, Gmail + iCloud), calendar (check/create/update/delete events), tasks, Notion check-ins, decision recommendations, proactive briefings, map/building visuals, capability-gap logging, bug-status checking, text messages, live web research, and `run_agent_task` (confirm-gated autonomous coding agent). Every tool except `run_agent_task` executes autonomously by design; `run_agent_task` is the sole exception, requiring explicit spoken confirmation before it runs, because it can read/write/run commands against a real working tree and open real PRs.

## Brand Commitments

- The product is always addressed and referred to as "North" — not a nickname, not a variant.
- Voice/personality is JARVIS-register: dry, direct, technical — a binding personality commitment carried through both the spoken voice interface and the visual design language, not merely a UI skin choice.
- Existing visual identity already exists and is deliberately chosen (cyan glow ring, dark HUD grid, JARVIS-workshop-HUD reference material) — not a placeholder awaiting a first real direction.

## Evidence on Hand

Existing Sandbox UI implementation (`app/sandbox/page.tsx` and related components) is the current, real, in-production visual system and the source of truth for existing tokens — not a mockup or draft to be discarded. No user-facing marketing copy, testimonials, or external-facing proof assets exist or are needed (single-user product, no acquisition surface).

## Product Principles

- Optimize for one expert daily user, never for a first-time-stranger conversion moment.
- Proactive and autonomous by default; the bar for requiring confirmation is real, irreversible-scale blast radius (currently only `run_agent_task` clears that bar).
- Voice is the primary surface; the web UI is a companion view onto the same assistant, not a separate product.
- Visual and vocal personality both express the same JARVIS-register identity — technical, dry, confident — consistently across every surface.

## Accessibility & Inclusion

No project-specific accessibility requirement has been established beyond ordinary web standards; single confirmed user, no known accessibility need on record.
