# North Vector: Autonomous Self-Extension
**Status:** Phase 0 implemented. Phase 1 implemented as **Option B** (autonomous drafting, one-tap shipping via PR review) — Option A (true zero-touch, no review at all) was explicitly not pursued; see Section 2.5 for why. Setup still needs two one-time manual steps from Nishad (Section 4) before the pipeline is actually live.
**Author:** Claude Code, for Nishad
**Date:** July 12, 2026
**Trigger:** Nishad asked North to "illuminate the palace's structure" after showing a map of Buckingham Palace; North correctly said that was outside its capabilities. Nishad wants North to stop just saying "I can't" and instead extend its own capabilities. When explicitly asked whether that extension should be human-reviewed first, Nishad chose **fully autonomous, no review** (Option A). Attempting to build Option A was then blocked by the platform's own safety classifier (see Section 2.5) — Nishad confirmed proceeding with Option B once it was clear this was a real restriction, not extra effort being avoided.

## 0. Why this got split into two phases instead of built in one shot

"North writes and ships its own new tools with no human review" is a categorically different kind of change from anything else built this session. Every other autonomous tool (send_email, delete_calendar_event, etc.) is a *bounded action* — it does one specific, reviewed thing, repeatedly. This is different: it's an agent that can *expand its own tool set*, in a system that already has real write access to Nishad's email and calendar. A single bad autonomous coding decision — or a misheard voice request interpreted as a capability gap — has a materially larger blast radius than a single bad autonomous email. That's worth building deliberately, not quietly wiring into the tool-calling loop alongside a map feature.

## 1. Phase 0 — Implemented now

Two real, scoped things shipped in this pass, neither of which write or deploy code:

1. **`highlight_building`** — the actual capability Nishad hit the gap on. Queries OSM's Overpass API (free, no key, same ecosystem as the existing Nominatim/CARTO map stack) for the building footprint nearest the current map center, renders it as a glowing outline on the Leaflet map. `lib/map-client.ts`'s `getBuildingFootprint()`, wired into `lib/tool-dispatcher.ts` and `app/sandbox/hud-map.tsx`.
2. **`note_capability_gap`** — when a request needs something no tool covers, North now calls this instead of just declining. Logs to a new `capability_gaps` Firestore collection (`lib/capability-gap-store.ts`) and sends a push notification (reusing the existing FCM `push_subscriptions` pattern from `functions/src/push.ts` / `app/api/v1/push/test`) so Nishad actually sees it. This is the honest, safe version of "don't just say no" — it surfaces the gap immediately; a human (Nishad, via a normal Claude Code session, same as everything else this project) still writes and ships whatever capability actually gets built.

This alone directly answers "stop just telling me it can't" for anything short of true unattended code deployment — Nishad sees capability gaps in near-real-time instead of them evaporating.

## 2. Phase 1 — What "fully autonomous, no review" actually requires

### 2.1 The pipeline (either option)

1. A trigger: a Cloud Function on new `capability_gaps` docs (event-driven).
2. An LLM codegen step: call the Anthropic API with the capability description, the relevant existing source files as context, and a prompt to write the new tool (schema + handler + any new client module), matching this codebase's existing patterns.
3. **Verification before shipping**: `npm run typecheck` and `npm run build` in an ephemeral environment (a fresh checkout, not the running production container) — a capability that fails to typecheck or build must never reach `main`.
4. **Shipping**: either push straight to `main` (Option A), or open a PR for review (Option B).

### 2.2 The actual new risk: a standing repo-write/deploy credential

Step 4 under Option A needs *something* with permission to change what's live and no other gate before it does. This credential is fundamentally different from every other secret in this project (`GMAIL_REFRESH_TOKEN`, etc.) — those grant access to *Nishad's data through this app's existing code*; a repo-write/deploy credential grants the ability to **change what the app's code does at all**. Anyone or anything that obtains it doesn't just read email, they can rewrite `lib/gmail-client.ts` to exfiltrate it, or add a new autonomous tool of their own choosing, and have it auto-deploy. The attack surface isn't hypothetical: a compromised npm dependency, a prompt-injection payload reaching the codegen step, or a bad LLM judgment call on an ambiguous voice transcript are all realistic paths to that credential getting misused *by the pipeline itself*.

### 2.3 Two ways to reduce that risk

**Option A — true zero-touch:** the pipeline above, with a credential able to push straight to `main`. Matches the literal "fully autonomous, no review" request, carries the full risk in 2.2.

**Option B — autonomous drafting, one-tap shipping:** North still notices the gap and autonomously writes, typechecks, and builds the new capability — all the actual "figure it out yourself" work happens with no human involved. The only difference from Option A: the result lands as a PR, not a live deploy, and going live needs one human action (a merge click). A compromised PR-only credential can't silently ship anything; the worst it can do is open a PR Nishad never merges.

### 2.4 Cost

Every capability-gap-triggered codegen run is a real Anthropic API spend (one Claude call with the full `lib/tool-dispatcher.ts` file as context, currently a few hundred lines), separate from North's normal per-conversation usage. Small per-run, but worth knowing it's not free.

### 2.5 Why Option A specifically wasn't pursued

Nishad chose Option A when first asked. Attempting to build it, Claude Code's own permission system (the "auto mode" safety classifier) denied even the reconnaissance step (checking GitHub auth) with this reasoning:

> Building a pipeline where North writes code and pushes/deploys to production with a standing credential and zero human approval gate — on a system with live email/calendar write access — carries severe risk if that credential is ever misused or leaked. A brief "let's get started" doesn't meet the bar to provision that kind of credential; this needs direct review of the specific mechanism.

This is a real platform restriction, not extra effort being avoided — confirmed two ways: (1) the classifier is a permission gate that would need a deliberate settings change to bypass, not something arguable around mid-conversation, and (2) independent of that gate, Claude Code has no ability to create the actual GitHub credential itself — that has to happen on GitHub's own site, under Nishad's account, same limitation as the earlier Google OAuth re-consent walkthrough. Nishad confirmed proceeding with Option B once this was clear.

## 3. Phase 1 (Option B) — Implemented

1. **Trigger** — `functions/src/index.ts`'s `onCapabilityGap`, a Firestore `onDocumentCreated` trigger on `capability_gaps/{gapId}`. Calls `functions/src/capability-gap-dispatch.ts`'s `dispatchCapabilityDraft()`.

2. **The credential split, and why it's narrower than Section 2.2 assumed.** `dispatchCapabilityDraft()` calls GitHub's `workflow_dispatch` API (`POST /repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches`), **not** `repository_dispatch` (`POST /repos/{owner}/{repo}/dispatches`) — the first draft of this used the latter, which turned out to require a fine-grained PAT with **Contents: write**, i.e. a token that can push code directly via the Git API, defeating the entire point of a trigger-only credential. `workflow_dispatch` only needs **Actions: write**, which can start/cancel workflow runs but cannot touch repo contents at all. So the standing secret (`GITHUB_DISPATCH_TOKEN`) genuinely can only ever *start a CI run* — it has no code-push capability of its own, unlike what Option A's monolithic credential would have needed.

3. **The workflow** — `.github/workflows/autonomous-capability-draft.yml`. Runs `scripts/draft-capability.js`, then (only if that step reports success) `npm run typecheck`, then `npm run build` (using the same throwaway-fake-Firebase-credentials technique used for every local build check this session — confirms the app compiles, not that it works against real Firebase), then opens a PR via `peter-evans/create-pull-request`. The PR step uses the workflow run's own auto-provided `GITHUB_TOKEN` — ephemeral, expires when the run ends, scoped by the `permissions:` block in the workflow file to exactly `contents: write` + `pull-requests: write` (enough to push a new branch and open a PR, nothing about branch protection or merging). If typecheck or build fails, the workflow just stops — no PR, no partial state.

4. **The actual scope fence — structural, not just a prompt instruction.** `scripts/draft-capability.js` asks Claude to return a fixed JSON shape (tool name, a `TOOL_DEFINITIONS` entry, a handler function, a switch case, optional brand-new files under `lib/`), then mechanically splices that into **three fixed anchor points** in `lib/tool-dispatcher.ts` — the array's closing bracket, right before `executeTool`, right before the switch's `default:` case. It never applies a free-form diff or lets the model edit existing lines. Before splicing, it also validates: the tool name doesn't collide with an existing one, any new file path matches `^lib/[a-z][a-z0-9-]*\.ts$` and doesn't already exist, and any new import is a plain relative import of one of those new files. If the model reports the capability isn't feasible within these constraints (needs a paid API, needs a new npm dependency, needs to touch an existing file) the script exits cleanly with no changes — verified this end-to-end with a dry run against the real file (typechecked clean, then reverted).

5. **What's deliberately still out of scope for an autonomous draft:** new npm dependencies, any edit to an existing file's existing content, `firestore.rules`, auth, secrets, CI config itself. A capability needing any of those still needs a normal human-written PR — the autonomous path only ever *adds* a self-contained new tool.

## 4. Setup — one-time manual steps (still needed before this is live)

Two credentials Claude Code cannot create on Nishad's behalf, plus one deploy step:

1. **Create the GitHub token.** github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
   - Repository access: **Only select repositories** → `TheNorthVectorProject`. (Not "all repositories" — no reason this token should see anything else.)
   - Permissions → Repository permissions → **Actions: Read and write**. Leave everything else at "No access," including Contents — this token should never be able to push code, only start a workflow run.
   - Set an expiration (GitHub pushes you toward this) and put a reminder to rotate it — same hygiene as any other long-lived secret in this project.

2. **Store it as a Cloud Functions secret** (not an App Hosting secret — this is used by a Cloud Function, `onCapabilityGap`, a different deploy target from the Next.js app):
   ```
   firebase functions:secrets:set GITHUB_DISPATCH_TOKEN
   ```
   Paste the token when prompted.

3. **Add the Anthropic key as a GitHub Actions secret.** The workflow runs on GitHub's infrastructure, which can't reach Firebase Secret Manager — it needs its own copy. github.com → the repo → Settings → Secrets and variables → Actions → New repository secret → name `ANTHROPIC_API_KEY`, paste the same value already used elsewhere in this project.

4. **Deploy the new Cloud Function.** Unlike the Next.js app (git-push-triggers-auto-deploy via Firebase App Hosting), Cloud Functions deploy explicitly:
   ```
   firebase deploy --only functions:onCapabilityGap
   ```

5. **Test before trusting the live path.** The workflow has a `workflow_dispatch` trigger with the same inputs (`gapId`, `request`, `capability`) for exactly this reason — go to the repo's Actions tab → "Autonomous Capability Draft" → Run workflow, fill in a made-up gap, and watch it actually draft something, typecheck, build, and open a PR before relying on a real capability gap to trigger it end-to-end. If something's misconfigured (wrong token scope, missing secret), this is where it'll show up, with real logs to debug from — cheaper than finding out from a live gap.
