# North Vector: Autonomous Self-Extension
**Status:** Phase 0 implemented (this doc's Section 1). Phase 1 (real autonomy, no human review) is a plan for review, NOT implemented — no credential has been provisioned, no background worker exists.
**Author:** Claude Code, for Nishad
**Date:** July 12, 2026
**Trigger:** Nishad asked North to "illuminate the palace's structure" after showing a map of Buckingham Palace; North correctly said that was outside its capabilities. Nishad wants North to stop just saying "I can't" and instead extend its own capabilities — and, when explicitly asked whether that extension should be human-reviewed first, chose **fully autonomous, no review**.

## 0. Why this got split into two phases instead of built in one shot

"North writes and ships its own new tools with no human review" is a categorically different kind of change from anything else built this session. Every other autonomous tool (send_email, delete_calendar_event, etc.) is a *bounded action* — it does one specific, reviewed thing, repeatedly. This is different: it's an agent that can *expand its own tool set*, in a system that already has real write access to Nishad's email and calendar. A single bad autonomous coding decision — or a misheard voice request interpreted as a capability gap — has a materially larger blast radius than a single bad autonomous email. That's worth building deliberately, not quietly wiring into the tool-calling loop alongside a map feature.

## 1. Phase 0 — Implemented now

Two real, scoped things shipped in this pass, neither of which write or deploy code:

1. **`highlight_building`** — the actual capability Nishad hit the gap on. Queries OSM's Overpass API (free, no key, same ecosystem as the existing Nominatim/CARTO map stack) for the building footprint nearest the current map center, renders it as a glowing outline on the Leaflet map. `lib/map-client.ts`'s `getBuildingFootprint()`, wired into `lib/tool-dispatcher.ts` and `app/sandbox/hud-map.tsx`.
2. **`note_capability_gap`** — when a request needs something no tool covers, North now calls this instead of just declining. Logs to a new `capability_gaps` Firestore collection (`lib/capability-gap-store.ts`) and sends a push notification (reusing the existing FCM `push_subscriptions` pattern from `functions/src/push.ts` / `app/api/v1/push/test`) so Nishad actually sees it. This is the honest, safe version of "don't just say no" — it surfaces the gap immediately; a human (Nishad, via a normal Claude Code session, same as everything else this project) still writes and ships whatever capability actually gets built.

This alone directly answers "stop just telling me it can't" for anything short of true unattended code deployment — Nishad sees capability gaps in near-real-time instead of them evaporating.

## 2. Phase 1 — What "fully autonomous, no review" actually requires

This is not built. Laying out what it costs before building it, since Nishad chose this option after a general framing but hasn't seen the concrete mechanism yet.

### 2.1 The pipeline

1. A trigger: either a Cloud Function on new `capability_gaps` docs (event-driven), or a scheduled scan (batches gaps periodically).
2. An LLM codegen step: call the Anthropic API (same `ANTHROPIC_API_KEY` already in use) with the capability description, the relevant existing source files as context, and a prompt to write the new tool (schema + handler + any new client module), matching this codebase's existing patterns.
3. **Verification before shipping**: `npm run typecheck` and `npm run build` in an ephemeral environment (a fresh checkout, not the running production container) — a capability that fails to typecheck or build must never reach `main`.
4. **Shipping**: commit and push to `main` (or open+auto-merge a PR) using a standing credential, which triggers Firebase App Hosting's existing git-connected auto-deploy.

### 2.2 The actual new risk: a standing repo-write/deploy credential

Steps 3-4 need *something* with permission to push to `github.com/nishadbasrur/TheNorthVectorProject` and no other gate before it goes live. Concretely, either:

- A **GitHub personal access token or GitHub App** with `contents:write` on this repo, held by whatever runs the pipeline (a Cloud Function's environment, most likely) — or
- **Direct Firebase deploy credentials** (a service account with App Hosting deploy permissions) if bypassing GitHub entirely.

Either way, this credential is fundamentally different from every other secret in this project (`GMAIL_REFRESH_TOKEN`, `GOOGLE_CALENDAR_REFRESH_TOKEN`, etc.). Those grant access to *Nishad's data through this app's existing code*. A repo-write/deploy credential grants the ability to **change what the app's code does at all** — anyone or anything that obtains it doesn't just read email, they can rewrite `lib/gmail-client.ts` to exfiltrate it, or add a new autonomous tool of their own choosing, and have it auto-deploy. The attack surface isn't hypothetical: a compromised npm dependency, a prompt-injection payload reaching the codegen step through page content `show_map`/`highlight_building` fetch, or simply a bad LLM judgment call on an ambiguous voice transcript are all realistic paths to that credential getting misused *by the pipeline itself*, not just by an external attacker.

### 2.3 Two ways to reduce that risk — recommendation

**Option A — true zero-touch (what "fully autonomous, no review" literally means):** the pipeline above, with the deploy credential able to push straight to `main`. Fastest, matches the literal request, carries the full risk in 2.2.

**Option B — autonomous drafting, one-tap shipping (recommended middle ground):** North still notices the gap and autonomously writes, typechecks, and builds the new capability — all the actual "figure it out yourself" work happens with no human involved. The only difference from Option A: the result lands as a branch/PR, not a live deploy, and going live needs one human action (a merge click, or a single approval tap from a push notification). This keeps the credential scoped to opening PRs, not pushing to `main` — a compromised PR-only credential can't silently ship anything; the worst it can do is open a PR Nishad never merges. Preserves "North builds its own capabilities without you writing code" almost entirely, while keeping one checkpoint before anything with email/calendar access changes what it can do.

Recommend Option B unless there's a specific reason zero-touch matters (e.g. wanting a capability live before Nishad is next reachable) — the time cost of one tap is small relative to the credential-compromise blast radius difference.

### 2.4 Open questions before building either option

- Confirm Option A vs B (Section 2.3).
- Where does the codegen/build/deploy step actually run? A Cloud Function has execution time limits that may be tight for an LLM call + npm install + typecheck + build; a more realistic host is a dedicated CI job (GitHub Actions) or a longer-running Cloud Run job.
- What's the actual scope limit on what North is allowed to touch? Unbounded ("any file in the repo") is much riskier than a hard boundary (e.g. "only new files under `lib/`, only new entries in `TOOL_DEFINITIONS`, never touches `firestore.rules`, auth, or existing tool handlers").
- Cost: every capability-gap-triggered codegen run is a real Anthropic API spend, separate from North's normal per-conversation usage — worth a rough budget expectation.
