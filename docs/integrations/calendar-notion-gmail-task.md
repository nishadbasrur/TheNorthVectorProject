# Calendar + Notion + Gmail (Read-Only) with Proactive Urgency Alerts

## 1. Context

Extends North Vector toward the "JARVIS" vision: North should notice something urgent (an upcoming meeting, a flagged Notion item, an important email) and proactively surface it, not just answer when asked. Physical hardware (North Band/Puck) doesn't exist yet, so the alert delivery mechanism for now is a push notification to Nishad's phone — the role haptic/audio will eventually play once hardware exists.

## 2. Hard Constraint: Read-Only

All three integrations are READ-ONLY. Never create, modify, delete, or send/reply to anything in Calendar, Notion, or Gmail. A future feature that needs to write to any of these is a separate, explicitly-approved task — not this one.

## 3. Source-by-Source Design — Read Carefully, These Differ

### Calendar and Notion: simple, explainable flags, periodic scan — plus an on-demand path

No AI judgment involved in detecting these — a scheduled Cloud Function (every 15 minutes) checks the flag directly:

- **Calendar:** events starting within 15 minutes, not already alerted.
- **Notion:** items where the "Urgent" checkbox property is true, not already alerted.

De-duplication: a Firestore `alert_state` doc per event/item (keyed by source + external ID), written once alerted, checked before re-alerting on every 15-minute cycle.

**Update:** Calendar and Notion also each got an **on-demand** path, added when it became clear a spoken "what's on my calendar" had nowhere to go — the proactive scan only ever pushes a notification, it never answers a live question. This on-demand path is a separate code path from the scheduled scan and **does not** use `alert_state` or any dedup — each ask is a fresh snapshot read, since a live question deserves a complete answer every time, not a filtered "only what you haven't already been told." Reusing the scan's dedup state here would actually be a bug (asking twice in one day would silently omit events the second time). See `North_Vector_Intent_and_Capability_Awareness_Plan.md` Section 6.4 for the full reasoning — this is intentional, not an inconsistency to "fix" later.

**Update 2 (JARVIS tool-calling migration):** the on-demand path is no longer reached via a rule-based voice router with hand-maintained trigger phrases (`CALENDAR_TRIGGERS`/`NOTION_TRIGGERS` in the now-deleted `lib/voice-intent-router.ts`). Voice input goes through real Anthropic tool-calling (`app/api/v1/voice/respond`, tool definitions in `lib/tool-dispatcher.ts`) — Claude decides whether a transcript needs the `check_calendar`/`check_notion` tool, rather than matching against a fixed keyword list. The tool handlers call `getUpcomingEvents`/`getUrgentItems` directly (no HTTP round-trip); `app/api/v1/calendar/check-upcoming` and `app/api/v1/notion/check-urgent` are kept as thin HTTP wrappers with no remaining internal callers. See `North_Vector_JARVIS_Tool_Calling_Migration_Plan.md` for the full design.

### Gmail: on-demand only, AI judgment, no periodic scan

**Corrected design (supersedes any earlier "every 15 minutes" framing for Gmail specifically):**

- Gmail is **not** on the periodic scheduled scan. It is evaluated **on-demand**, triggered when Nishad actually asks (e.g. "any important emails?" via the Judgment Engine or voice).
- There is **no time window** (not "last 24h", not "unread only"). Instead: track a `surfaced: true` flag per email (keyed by Gmail message ID) in Firestore.
- Each time Nishad asks: fetch candidate inbox messages, skip any already marked `surfaced` regardless of age, evaluate the new ones for urgency via the Judgment Engine (`askClaude`) with a narrow, conservative system prompt ("is this email time-sensitive/urgent enough to interrupt someone right now"), present whatever qualifies, then mark those messages `surfaced: true` so they're never re-presented.
- Err toward NOT alerting/surfacing on ambiguous emails — false alarms erode trust in the whole system fast.

**Gmail credential scope, still applies regardless of on-demand vs. scheduled:** `gmail.readonly` grants read access to the ENTIRE inbox, not a subset — this was explicitly chosen over narrowing to a label/folder. Nishad understands this means real email text (financial, medical, personal) is sent to the Anthropic API for urgency evaluation whenever he asks. Firm boundaries:
- Only ever read email metadata + body text for evaluation — never take any action on an email (no marking read/unread, no archiving, no labeling, no replying).
- Log clearly (to console, not to any persistent store) whenever a Gmail evaluation happens and how many messages were evaluated — an audit trail of when inbox content was actually processed.
- Do not persist full email body content into Firestore. If an email is judged urgent enough to surface, store only a short summary/subject line, not the raw email text.

## 4. Phase 0 — Credentials (completed)

`GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN`, `GMAIL_REFRESH_TOKEN` (reuses the same Calendar Client ID/Secret — same Google Cloud project), and `NOTION_API_TOKEN` are set in `.env.local` and Firebase Secret Manager (confirmed present via `firebase apphosting:secrets:describe`, metadata-only). All three sensitive values were rotated once during this task after an accidental transcript exposure during verification.

## 5. Phase 1 — Read Access

- `lib/google-calendar-client.ts`: fetch upcoming events (next 24-48h) using `calendar.readonly`.
- `lib/notion-client.ts`: fetch items from the shared database, checking the boolean "Urgent" property. Database ID and exact property name/type to be confirmed with Nishad before hardcoding either (in progress — database not yet set up as of this writing).
- `lib/gmail-client.ts`: fetch inbox messages (full inbox, not label-scoped) using `gmail.readonly`, extract subject + body text for on-demand evaluation.

## 6. Phase 2 — Urgency Evaluation

Extends the `dailyRiskScan` Cloud Function scaffolding (`functions/src/index.ts`).

**New scheduled Cloud Function (every 15 minutes) — Calendar + Notion only:**
- Calendar check: events starting within 15 minutes, not already in `alert_state`.
- Notion check: items with "Urgent" checked, not already in `alert_state`.
- If something qualifies, send a push notification via Firebase Cloud Messaging (Web Push).
- Write an `alert_state` doc so nothing re-notifies on the next 15-minute cycle.

**Gmail path — separate, on-demand, not part of the scheduled function:**
- Core dedup/evaluation logic lives in `lib/gmail-urgency.ts` (`checkUrgentEmailsRaw`), invoked directly by the voice tool dispatcher's `check_email` tool (`lib/tool-dispatcher.ts`) when Claude decides a transcript needs it — see `North_Vector_JARVIS_Tool_Calling_Migration_Plan.md` Section 5.4. `app/api/v1/gmail/check-urgent` remains as a thin wrapper around the same function for any external/manual caller.
- Fetch inbox candidates, filter out anything already `surfaced: true`.
- Pass new candidates' subject+body through `askClaude` with the narrow/conservative urgency prompt.
- Present whatever qualifies as the response; mark evaluated messages `surfaced: true` regardless of whether they qualified (so ambiguous-but-rejected mail isn't re-evaluated forever either — open question, see Section 8).

## 7. Phase 3 — Verification

- Confirm read-only scopes are enforced for all three (attempt a write call in a local test for each; confirm rejected by the API itself).
- Test with a real calendar event ~20 minutes out → confirm push notification arrives.
- Test with a real Notion item with "Urgent" checked → confirm push notification arrives.
- Test the Gmail on-demand path with a genuinely non-urgent email and confirm it is NOT surfaced.
- Confirm no duplicate alerts fire on repeated 15-minute scans for Calendar/Notion, and no duplicate surfacing on repeated on-demand Gmail asks for the same message.
- Confirm no raw email body content ends up stored in Firestore — check actual alert/surfaced records written during testing.

## 8. Resolved: Surfaced-Tracking Semantics

Decided: every evaluated message (urgent or not) is marked surfaced with a **timestamp**, not a plain boolean — `surfacedAt: <ISO timestamp>`. On each on-demand ask, a message is treated as a fresh candidate if it has no `surfacedAt`, or if its `surfacedAt` is older than a **24-hour TTL**. This bounds the candidate pool per ask while still giving a message a second look once a day in case circumstances (or Claude's judgment) changed. Adjust the TTL constant if 24h turns out to be too short/long in practice.

## 9. Notion Setup

Resolved: database created and shared with the `NOTION_API_TOKEN` integration. Property confirmed as exactly `Urgent` (Checkbox type). `NOTION_URGENT_DATABASE_ID` is read from env (`functions/.env` for the Cloud Function, `.env.local` for local dev) rather than hardcoded. One gotcha hit and resolved during setup: the ID initially provided was the *containing page's* ID, not the database's own ID — Notion's newer API models a database as a `data_sources` child of a page, and the two IDs are different. Resolved by walking the page's block children for the `child_database` block and using its ID instead.

## 10. Explicitly Out of Scope

- Any write/modify/delete/send/reply actions on Calendar, Notion, or Gmail.
- Haptic delivery (no Band/Puck hardware yet — push notification is the stand-in).
- Narrowing Gmail access via labels (explicitly declined — full inbox read is intentional).
- A periodic/scheduled Gmail scan (superseded by the on-demand design in Section 3).
