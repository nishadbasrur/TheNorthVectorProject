# North Vector: Full Read-Write Calendar + Gmail Access
**Status:** Implemented
**Author:** Claude (planning session), for review by Nishad, executed by Claude Code
**Date:** July 11, 2026 (implemented July 12, 2026)
**Repo:** `github.com/nishadbasrur/TheNorthVectorProject`, branch `main` @ `0686a12`

---

## 0. Decision Log

Two scoping questions asked and answered before this plan was written, both confirmed explicitly:

1. **Destructive actions:** "Everything, including delete/modify existing items" — not limited to creating new things. Deleting emails, deleting/modifying existing calendar events are in scope.
2. **Read scope:** "Yes, full search capability" — not limited to the current 25-most-recent-messages window. Should be able to answer "find that email from 3 months ago."

**Resolved at implementation time (Section 5's open questions):**

- **`sendUpdates` default:** `"none"`. North's calendar writes never generate a Google notification email to other attendees as a side effect. Nishad still sees/hears the change through North itself; if a shared event (e.g. a tutoring session with Dr. Bala) moves or cancels, he tells the other person himself.
- **Email delete scope:** Trash only (`gmail.modify`), not permanent erase. Confirmed recommendation, no broader `mail.google.com` scope requested.
- **OAuth walkthrough:** Nishad did not have the original token-generation script — Claude Code wrote a fresh throwaway one (`scripts/oauth-widen-scopes.js`, gitignored, not committed).

---

## 1. Current State — Confirmed Against the Real Repo (pre-implementation)

Before this task, the tool set shipped only five tools, none of which write anywhere:

| Tool | Backing function | Capability |
|---|---|---|
| `check_email` | `checkUrgentEmails()` / `lookupEmails()` via `getRecentInboxMessages(25)` | Read-only, capped at 25 most recent inbox messages |
| `check_calendar` | `getUpcomingEvents(withinHours)` | Read-only, upcoming events |
| `check_notion` | `getUrgentItems()` | Read-only |
| `create_task` | `createTaskAsAdmin()` | Write — North's own internal Firestore task list, not Gmail/Calendar |
| `get_decision_recommendation` | `evaluateDecision()` | Read-only reasoning |

Both Gmail and Calendar were genuinely read-only, and per `docs/integrations/calendar-notion-gmail-task.md` (Section 2/7), that was explicitly tested and confirmed at the API level, not just assumed from the code.

---

## 2. OAuth Scope Widening

### 2.1 Why this couldn't be done by Claude Code alone

The existing `GMAIL_REFRESH_TOKEN` / `GOOGLE_CALENDAR_REFRESH_TOKEN` came from a one-time manual OAuth consent flow, in a real browser, under Nishad's real Google account. Widening scopes requires redoing that consent flow with broader scopes — Claude Code can change what the code requests, but can't make Google grant broader permissions on an existing token.

### 2.2 Actual scopes used

| Service | Old scope | New scope | Unlocks |
|---|---|---|---|
| Gmail | `gmail.readonly` | `gmail.modify` | Read, send, trash/untrash — not permanent erase |
| Calendar | `calendar.readonly` | `calendar.events` | Create, update, delete events |

Both Gmail and Calendar share the same OAuth client (`GOOGLE_CALENDAR_CLIENT_ID`/`_CLIENT_SECRET`, same Google Cloud project) — one combined consent flow produces a single refresh token valid for both scopes, written into both `GMAIL_REFRESH_TOKEN` and `GOOGLE_CALENDAR_REFRESH_TOKEN`.

### 2.3 Walkthrough

`scripts/oauth-widen-scopes.js` — one-time, gitignored, not committed. Starts a loopback HTTP server on `http://localhost:8721/oauth2callback`, prints a consent URL for the two new scopes, exchanges the resulting auth code for a refresh token, and prints `firebase apphosting:secrets:set` commands for both secrets. Run with `node --env-file=.env.local scripts/oauth-widen-scopes.js`.

This step is on Nishad, not Claude Code — write calls fail with a Google API permissions error until the new token is in place.

---

## 3. New Tool Definitions (implemented in `lib/tool-dispatcher.ts`)

- `send_email` — immediate, no confirmation. `lib/gmail-client.ts`'s `sendEmail()`, MIME-encoded, header values sanitized against CR/LF injection.
- `search_email` — Gmail's real `q=` search syntax via `messages.list`, not a client-side filter over the recent-25 window. `searchEmails()`.
- `delete_email` — `messages.trash()`, recoverable for 30 days. `trashEmail()`.
- `create_calendar_event` / `update_calendar_event` / `delete_calendar_event` — `lib/google-calendar-client.ts`'s `createCalendarEvent()`/`updateCalendarEvent()`/`deleteCalendarEvent()`, all hardcoding `sendUpdates: "none"` (not a caller-supplied param — see Section 0's resolved decision).

---

## 4. Permission Tier

Consistent with the standing decision that `create_task` and the read tools already operate autonomously: every new tool above also defaults to autonomous, no confirmation step. This plan extends that existing tier to genuinely new tools, on the same terms — it doesn't reopen the decision itself.

---

## 5. Testing Plan (code-level verification completed; live API verification pending real widened-scope tokens)

Completed during implementation (this sandbox has no real Firebase/Google credentials):
- `npm run typecheck` and `npm run typecheck:all` (Next.js app + Cloud Functions subproject) — clean.
- Full production build (`npm run build`, fake-but-well-formed credentials) — clean.
- Cloud Functions esbuild bundle (`npm --prefix functions run build`) — clean, confirms `lib/google-calendar-client.ts`'s additions don't break the shared-module-no-server-only-guard constraint.

Still pending, requires Nishad to run after completing Section 2.3's OAuth walkthrough:
- Create a test calendar event, confirm it appears in Google Calendar directly.
- Update that test event's time, confirm the change reflects in Google Calendar.
- Delete it, confirm it's actually gone.
- Send a test email to yourself, confirm receipt.
- Trash a test email, confirm it lands in Trash (not permanently gone) and is recoverable.
- Run `search_email` with a query for something further back than 25 messages, confirm it's found.
- Confirm `check_email`/`check_calendar`'s existing read behavior is unaffected.
- Confirm a shared calendar event change does NOT generate a Google notification email to the other attendee (the `sendUpdates: "none"` behavior).

---

## 6. Implementation Checklist

1. [x] Resolve Section 5 (of the original draft)'s open questions — see Section 0 above.
2. [ ] Nishad completes the OAuth re-consent walkthrough (Section 2.3) and updates the Secret Manager tokens — blocks the new tools from actually working, even though the code ships first.
3. [x] `lib/gmail-client.ts` — `sendEmail()`, `searchEmails(query)`, `trashEmail(messageId)`.
4. [x] `lib/google-calendar-client.ts` — `createCalendarEvent()`, `updateCalendarEvent()`, `deleteCalendarEvent()`, hardcoded `sendUpdates: "none"`.
5. [x] `lib/tool-dispatcher.ts` — six new tool definitions and handlers.
6. [ ] Verification step confirming the new token scopes actually work — do this before relying on the new tools live (Section 5's pending items).
7. [ ] Full regression + new-capability live test pass (Section 5).
8. [x] Update `docs/integrations/calendar-notion-gmail-task.md` — added an update banner superseding the read-only constraint for Calendar/Gmail (Notion remains read-only).
