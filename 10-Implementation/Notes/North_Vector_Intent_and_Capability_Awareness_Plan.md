# North Vector: Intent Understanding & Capability Awareness Overhaul

**Status:** Draft plan for review — not yet implemented
**Author:** Claude (planning session), for review by Nishad, for execution by Claude Code
**Date:** July 10, 2026
**Repo:** `github.com/nishadbasrur/TheNorthVectorProject`, branch `main` @ `a130df8`

---

## 0. How to Use This Document

This is written to be handed directly to Claude Code as a work order. Every section that describes a code change references real file paths, real function names, and real patterns already in the codebase — nothing here is invented from scratch where an existing pattern already does the job. Where a genuinely new pattern is introduced, it's flagged explicitly and justified.

Sections 1–3 are context and diagnosis (skim if you already followed the chat). Sections 4 onward are the actual build plan. Section 12 is a flat, ordered checklist if you just want the task list without the reasoning.

---

## 1. The Two Bugs That Triggered This

### Bug A — Gmail: on-demand path exists, but the trigger matching is too brittle

`lib/voice-intent-router.ts` currently matches email intent like this:

```ts
const EMAIL_TRIGGERS = [
  "any important emails",
  "any important email",
  "any urgent emails",
  "any urgent email",
  "check my email",
  "check my emails",
  "anything important in my email",
  "anything urgent in my email",
];
```

...checked with `matchTrigger`, which requires the transcript to `.startsWith()` one of these exact strings. The actual spoken query was:

> "Just wanted to check if there's anything on my email that I should be looking for"

This doesn't start with any of the eight phrases, so it falls through task matching, falls through decision matching, and lands in `askVoiceFallback`, which calls Claude with a system prompt that has **zero knowledge that Gmail integration exists**. The model isn't wrong to say "I don't have access to your email" — it's telling the truth about what it was told, which was nothing.

### Bug B — Calendar: no on-demand path exists at all

Unlike Gmail, Calendar was **never designed** for on-demand voice queries. Per `docs/integrations/calendar-notion-gmail-task.md` Section 3, Calendar (and Notion) were built exclusively for a **scheduled 15-minute Cloud Function scan** (`functions/src/urgency-scan.ts`) that pushes a notification if something's starting soon. There is no API route, no voice trigger, nothing for "what's on my calendar" as a spoken question.

The underlying capability already exists in code — `lib/google-calendar-client.ts` exports a working `getUpcomingEvents(withinHours)` — it's just never called from anywhere reachable by a live question. Same story for Notion: `lib/notion-client.ts` exports a working `getUrgentItems()`, also only ever called from the Cloud Function.

### The real root cause, underneath both bugs

`askVoiceFallback` (backing `/api/v1/voice/respond`) is the **only** thing standing between "the rule-based router didn't recognize this" and Claude actually answering — and its system prompt describes North generically ("a personal chief-of-staff assistant") with **no manifest of what North can actually do**. Every time a query slips past the rule-based classifier — for any reason, on any topic, forever — Claude will confidently and *correctly* describe itself as unable to do things it can actually do, because it has no way to know otherwise. This isn't a one-off bug fix situation; it's a structural gap that will keep resurfacing as new integrations get added, unless it's fixed at the source.

---

## 2. What "Fixed" Actually Means Here

Three separate but related problems, and this plan solves all three:

1. **Gmail's on-demand trigger is too strict.** → Fix: broaden matching (Section 5).
2. **Calendar and Notion have no on-demand path at all.** → Fix: build the missing endpoints and wire them into the router (Sections 6–7).
3. **The fallback path is capability-blind.** → Fix: give it a real, maintained manifest of what North can do, so even a genuinely unmatched query gets an honest, useful answer instead of a false denial (Section 8).

Problem 3 is the most important of the three, long-term. Fixing 1 and 2 makes *today's* symptoms go away. Fixing 3 means the *next* integration you add doesn't produce this same conversation again in a month.

---

## 3. Explicit Non-Goals

To keep this scoped and avoid Claude Code quietly expanding it:

- **No write access to Calendar, Notion, or Gmail.** All three remain strictly read-only, per the existing hard constraint in `docs/integrations/calendar-notion-gmail-task.md` Section 2. This plan adds *read* endpoints only.
- **Not replacing the rule-based router wholesale.** Task creation (`TASK_TRIGGERS`) and the decision-question routing stay rule-based — they're deterministic, fast, and working. Only the *matching logic* for existing triggers gets broadened, and *new* triggers get added for Calendar/Notion. This is not a rewrite to an LLM-only intent classifier (see Section 9 for why that was considered and deferred).
- **Not touching the scheduled Cloud Function scan.** `functions/src/urgency-scan.ts` and its 15-minute Calendar/Notion alert logic are untouched. The new on-demand endpoints are additive, separate code paths, mirroring how Gmail's on-demand path already coexists with (in Gmail's case, replaces) scheduled scanning.
- **Not changing the `alert_state` / dedup semantics of the proactive scan.** The new on-demand Calendar/Notion endpoints do not need the same "surfaced" dedup Gmail uses, because a live spoken question isn't at risk of re-notifying about the same thing repeatedly — it's a snapshot read, answered once, done. See Section 6.4 for why on-demand and proactive-scan dedup logic are intentionally different.
- **No changes to the Sandbox UI itself** (`app/sandbox`) beyond what's needed to reflect the new capabilities — this plan is about the backend/routing, not the frontend.

---

## 4. Architecture Overview — Before and After

### Before (current state)

```
User speaks
   → transcribe (Google Cloud STT / Chirp 3)
   → routeVoiceInput(transcript)
       ├── EMAIL_TRIGGERS.startsWith? → checkUrgentEmails() → Gmail on-demand (works, but brittle match)
       ├── TASK_TRIGGERS.startsWith? → createTask()
       ├── DECISION_TRIGGERS.startsWith? → askDecisionEngine() → askVoiceJudgment() if generic fallback
       └── else → askVoiceFallback()
                    → askClaude(genericSystemPrompt, transcript)
                    → Claude has ZERO knowledge of Gmail/Calendar/Notion/Tasks/Decisions existing
                    → Claude answers honestly based on nothing → false "I don't have access" denials
   ← spoken response (Google Cloud TTS / Chirp 3 HD)
```

### After (this plan)

```
User speaks
   → transcribe (unchanged)
   → routeVoiceInput(transcript)
       ├── EMAIL_TRIGGERS (broadened matching) → checkUrgentEmails() → Gmail on-demand
       ├── CALENDAR_TRIGGERS (new) → checkUpcomingCalendar() → Calendar on-demand (new)
       ├── NOTION_TRIGGERS (new) → checkUrgentNotionItems() → Notion on-demand (new)
       ├── TASK_TRIGGERS.startsWith? → createTask() (unchanged)
       ├── DECISION_TRIGGERS.startsWith? → askDecisionEngine() (unchanged)
       └── else → askVoiceFallback()
                    → askClaude(CAPABILITY-AWARE systemPrompt, transcript)
                    → Claude knows exactly what North can and can't do
                    → Either gives an honest "I can't do X, but here's what I can do" OR
                      recognizes the request actually matches a known capability and says so
                      (a soft second-chance net, not a second dispatcher — see Section 8.3)
   ← spoken response (unchanged)
```

The key structural addition is a single **capability manifest** (Section 8) that becomes the shared source of truth both for what the router tries to match *and* for what the fallback prompt tells Claude exists. Today those two things (the trigger arrays, and the fallback's self-description) are maintained completely independently and have already drifted apart, which is exactly how you got Bug A and Bug B. This plan ties them together so they can't drift again.

---

## 5. Fix: Gmail Trigger Matching

### 5.1 Diagnosis recap

Current matching is `transcript.toLowerCase().startsWith(exactPhrase)` against 8 fixed phrases. Real speech rarely starts with a canned phrase — people preface things ("just wanted to," "hey, can you," "quick question,") constantly, and Chirp 3 transcription won't normalize that away.

### 5.2 The fix

Replace `startsWith`-only matching for the email trigger with a two-tier check:
1. **Keep the existing exact-`startsWith` list as a fast path** — no regression risk, these still match instantly.
2. **Add a broader "contains" check as a second tier**, gated on the transcript containing the word "email" or "emails" *and* at least one of a small set of query-indicating words (`check`, `anything`, `important`, `urgent`, `looking for`, `see`, `read`). This catches "just wanted to check if there's anything on my email" without becoming so loose it fires on unrelated sentences that merely mention email in passing (e.g., "I emailed my professor yesterday" — no query word present, correctly doesn't fire).

### 5.3 Concrete change to `lib/voice-intent-router.ts`

```ts
const EMAIL_TRIGGERS = [
  "any important emails",
  "any important email",
  "any urgent emails",
  "any urgent email",
  "check my email",
  "check my emails",
  "anything important in my email",
  "anything urgent in my email",
];

// Second-tier, looser match for natural phrasing that doesn't start with one
// of the canned EMAIL_TRIGGERS phrases but is unambiguously an email-status
// query. Deliberately requires BOTH an email-word AND a query-word so it
// doesn't fire on sentences that merely mention email in passing (e.g. "I
// emailed my professor yesterday" has an email-word but no query-word).
const EMAIL_WORDS = ["email", "emails", "inbox"];
const EMAIL_QUERY_WORDS = [
  "check", "anything", "important", "urgent", "looking for", "see", "read", "any new",
];

function isLooseEmailQuery(lowerText: string): boolean {
  const hasEmailWord = EMAIL_WORDS.some((w) => lowerText.includes(w));
  const hasQueryWord = EMAIL_QUERY_WORDS.some((w) => lowerText.includes(w));
  return hasEmailWord && hasQueryWord;
}
```

And in `routeVoiceInput`:

```ts
const emailTrigger = matchTrigger(EMAIL_TRIGGERS, lower);

if (emailTrigger || isLooseEmailQuery(lower)) {
  const responseText = await checkUrgentEmails();
  return { type: "email", responseText };
}
```

### 5.4 Why not just make it fully fuzzy / semantic?

Considered and deliberately rejected for this specific trigger: a semantic/LLM-based classifier for every single utterance adds latency and API cost to *every* voice interaction, including the vast majority that are unambiguous ("add task," "should I..."). The two-tier keyword approach fixes the actual observed failure (natural phrasing containing the right words in a different order/context) without paying that cost on every request. If false negatives keep showing up after this fix ships, that's a signal to revisit — track it, don't pre-solve it (see Section 11, monitoring).

### 5.5 Test cases this must pass

| Transcript | Should route to Gmail? |
|---|---|
| "Check my email" | Yes (existing exact match) |
| "Any important emails?" | Yes (existing exact match) |
| "Just wanted to check if there's anything on my email that I should be looking for" | Yes (new loose match) |
| "Can you see if there's anything important in my inbox" | Yes (new loose match) |
| "Is there anything urgent I'm missing in email" | Yes (new loose match) |
| "I emailed my professor about the chem exam yesterday" | **No** — has email-word, no query-word |
| "Remind me to email Dr. Bala tomorrow" | **No** — this should hit `TASK_TRIGGERS` instead ("remind me to" is a task trigger and fires first, since task matching runs before email matching stays unchanged — confirm ordering, see 5.6) |

### 5.6 One ordering question to resolve before implementation

Currently `routeVoiceInput` checks email first, then task, then decision, then fallback. With the loose email match added, a phrase like "remind me to check my email" would now match `isLooseEmailQuery` (contains "email" + "check") **before** it reaches the task-trigger check, incorrectly treating a task-creation request as an email-check request. Two options:

- **Option A (recommended):** Move task-trigger matching *before* email matching in the router's execution order, since "remind me to," "add task," etc. are highly specific, unambiguous phrasings that should always win when present, regardless of what other words appear later in the sentence.
- **Option B:** Add a task-trigger negative check inside `isLooseEmailQuery` (i.e., only loose-match email if none of `TASK_TRIGGERS` also matched).

Recommend **Option A** — simpler, and matches the general principle that more specific/deterministic matches should be checked before broader/looser ones. Claude Code should implement Option A and flag if it surfaces any other ordering conflicts while doing so.

---

## 6. New: On-Demand Calendar Endpoint

### 6.1 What already exists (reuse, don't rebuild)

`lib/google-calendar-client.ts` already exports:
```ts
export async function getUpcomingEvents(withinHours = 48): Promise<UpcomingEvent[]>
export function eventsStartingSoon(events: UpcomingEvent[], withinMinutes = 15): UpcomingEvent[]
```
`UpcomingEvent` is `{ id: string; title: string; start: Date; end: Date | null }`. This is fully sufficient for an on-demand endpoint — no changes needed to this file.

### 6.2 New file: `app/api/v1/calendar/check-upcoming/route.ts`

Mirrors the shape of `app/api/v1/gmail/check-urgent/route.ts` structurally (owner-gated POST, calls the existing client, returns JSON), but is meaningfully simpler because there's no urgency judgment step needed — this is a factual "what's coming up" read, not an AI evaluation of ambiguous content the way Gmail urgency is.

```ts
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getUpcomingEvents } from "@/lib/google-calendar-client";

// On-demand calendar check — distinct from functions/src/urgency-scan.ts's
// scheduled 15-minute scan. That scan proactively pushes a notification for
// events starting imminently; this endpoint answers a live spoken/typed
// question about what's coming up, with a wider default window, and does
// not write to Firestore at all (no alert_state, no dedup) — a snapshot
// read, nothing more. See North_Vector_Intent_and_Capability_Awareness_Plan.md
// Section 6.4 for why on-demand and the scheduled scan don't share dedup state.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Optional override — defaults to 48h (Calendar's existing Phase 1 window,
  // see docs/integrations/calendar-notion-gmail-task.md Section 5), but a
  // spoken "what's on my calendar today" vs. "this week" should be able to
  // ask for a narrower or wider window. Voice router passes this through
  // based on simple keyword detection — see Section 7.3.
  const withinHoursRaw = (body as Record<string, unknown>)?.withinHours;
  const withinHours =
    typeof withinHoursRaw === "number" && withinHoursRaw > 0 && withinHoursRaw <= 24 * 14
      ? withinHoursRaw
      : 48;

  const events = await getUpcomingEvents(withinHours);

  return NextResponse.json({
    withinHours,
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start.toISOString(),
      end: e.end?.toISOString() ?? null,
    })),
  });
}
```

### 6.3 New file: `lib/calendar-summary.ts`

A small pure-formatting helper, kept separate from the API route so the same "turn events into a spoken sentence" logic can be reused by both the voice router's response text and (later, if wanted) a text/dashboard summary. Follows the same "brevity rule" precedent already established in `lib/voice-intent-router.ts`'s `limitToSentences`.

```ts
import type { UpcomingEvent } from "./google-calendar-client";

// Formats a list of upcoming events into a short spoken-friendly summary,
// following Voice_Interaction_Design.md's brevity rules (1-4 sentences).
// Mirrors the tone of checkUrgentEmails' formatting in
// lib/voice-intent-router.ts, kept here instead since this logic is
// calendar-specific and may be reused outside the voice path later.
export function summarizeUpcomingEvents(events: UpcomingEvent[], withinHours: number): string {
  if (events.length === 0) {
    const windowPhrase = withinHours <= 24 ? "today" : `the next ${Math.round(withinHours / 24)} days`;
    return `Nothing on your calendar for ${windowPhrase}.`;
  }

  const top = events.slice(0, 3);
  const formatted = top.map((e) => {
    const time = e.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${e.title} at ${time}`;
  });

  const remainder = events.length - top.length;
  const suffix = remainder > 0 ? `, plus ${remainder} more` : "";

  return `You have ${events.length} thing${events.length === 1 ? "" : "s"} coming up: ${formatted.join(", ")}${suffix}.`;
}
```

### 6.4 Why no dedup/alert_state for the on-demand path

The scheduled scan's `alert_state` Firestore collection exists to prevent the *same* notification firing on *every* 15-minute cycle forever. That problem doesn't exist for on-demand queries: each spoken "what's on my calendar" is a one-time question that deserves a fresh, complete answer every time, not a filtered "only tell me things I haven't already been told" response. Reusing `alert_state` here would actually create a bug — asking twice in one day would silently omit events the second time. Keep them fully separate. This mirrors Gmail's existing pattern where `surfaced`/TTL dedup exists specifically because repeated inbox scans could otherwise re-alert on the same email — a concern that also doesn't apply to a live calendar snapshot read.

### 6.5 Add `CALENDAR_TRIGGERS` to `lib/voice-intent-router.ts`

```ts
const CALENDAR_TRIGGERS = [
  "what's on my calendar",
  "what is on my calendar",
  "anything on my calendar",
  "check my calendar",
  "do i have anything",
  "what do i have coming up",
  "what's coming up",
];

const CALENDAR_WORDS = ["calendar", "schedule", "meetings", "meeting"];
const CALENDAR_QUERY_WORDS = ["what's", "what is", "anything", "check", "looking for", "coming up", "see"];

function isLooseCalendarQuery(lowerText: string): boolean {
  const hasCalendarWord = CALENDAR_WORDS.some((w) => lowerText.includes(w));
  const hasQueryWord = CALENDAR_QUERY_WORDS.some((w) => lowerText.includes(w));
  return hasCalendarWord && hasQueryWord;
}
```

Same two-tier pattern as the Gmail fix (Section 5), for consistency and because the same brittleness problem would otherwise just resurface here immediately. Note this reuses the *pattern*, not shared code — see Section 9.2 for a note on whether to factor this out into a shared helper once there are three of these (email, calendar, notion) rather than duplicating the shape a third time.

### 6.6 New `askCalendar` function in `lib/voice-intent-router.ts`

```ts
async function askCalendar(withinHours?: number): Promise<string> {
  const response = await authorizedFetch("/api/v1/calendar/check-upcoming", {
    ...(withinHours ? { withinHours } : {}),
  });

  if (!response.ok) {
    return "I couldn't check your calendar just now — try again in a bit.";
  }

  const data = await response.json();
  const events = Array.isArray(data.events) ? data.events : [];

  // Reformat using the shared summarizer rather than duplicating formatting
  // logic client-side — see lib/calendar-summary.ts. Requires parsing the
  // ISO strings back to Date objects since JSON doesn't carry Date type.
  const parsed = events.map((e: { id: string; title: string; start: string; end: string | null }) => ({
    id: e.id,
    title: e.title,
    start: new Date(e.start),
    end: e.end ? new Date(e.end) : null,
  }));

  return summarizeUpcomingEvents(parsed, data.withinHours ?? withinHours ?? 48);
}
```

And in `routeVoiceInput`, added alongside the email check (respecting the ordering fix from 5.6 — Task, then Email, then Calendar, then Notion, then Decision, then fallback):

```ts
const calendarTrigger = matchTrigger(CALENDAR_TRIGGERS, lower);

if (calendarTrigger || isLooseCalendarQuery(lower)) {
  // Simple window override: "today" narrows to 24h, otherwise default 48h.
  const withinHours = lower.includes("today") ? 24 : lower.includes("this week") ? 24 * 7 : undefined;
  const responseText = await askCalendar(withinHours);
  return { type: "calendar", responseText };
}
```

`VoiceIntentResult`'s union type needs a new `{ type: "calendar"; responseText: string }` member alongside the existing `email`/`task`/`decision`/`unrecognized` members.

---

## 7. New: On-Demand Notion Endpoint

Symmetric to Calendar. `lib/notion-client.ts` already exports a working `getUrgentItems()` — same "build the missing endpoint, don't touch the client" approach.

### 7.1 New file: `app/api/v1/notion/check-urgent/route.ts`

```ts
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getUrgentItems } from "@/lib/notion-client";

// On-demand Notion check — mirrors app/api/v1/calendar/check-upcoming's
// reasoning (see North_Vector_Intent_and_Capability_Awareness_Plan.md
// Section 6.4): no dedup/alert_state, a fresh snapshot read every time.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const items = await getUrgentItems();

  return NextResponse.json({ items });
}
```

### 7.2 `askNotion` in `lib/voice-intent-router.ts`

```ts
async function askNotion(): Promise<string> {
  const response = await authorizedFetch("/api/v1/notion/check-urgent", {});

  if (!response.ok) {
    return "I couldn't check Notion just now — try again in a bit.";
  }

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  if (items.length === 0) {
    return "Nothing flagged urgent in Notion right now.";
  }

  const titles = items.map((i: { title: string }) => `"${i.title}"`).join(", ");
  return `You have ${items.length} urgent item${items.length === 1 ? "" : "s"} in Notion: ${titles}.`;
}
```

### 7.3 `NOTION_TRIGGERS`

```ts
const NOTION_TRIGGERS = [
  "anything urgent in notion",
  "check notion",
  "what's flagged in notion",
  "any urgent notion items",
];

const NOTION_WORDS = ["notion"];
const NOTION_QUERY_WORDS = ["check", "anything", "urgent", "flagged", "looking for"];

function isLooseNotionQuery(lowerText: string): boolean {
  const hasNotionWord = NOTION_WORDS.some((w) => lowerText.includes(w));
  const hasQueryWord = NOTION_QUERY_WORDS.some((w) => lowerText.includes(w));
  return hasNotionWord && hasQueryWord;
}
```

Honest scoping note: Notion is lower-priority to get right than Calendar or Gmail — check with Nishad whether the Notion urgent-items database is even actively populated day-to-day before spending implementation time polishing this one. If it's not actively used, still worth building (it's cheap, mirrors the other two, and closes the same structural gap), but not worth over-investing in phrasing coverage the way Section 5 does for Gmail specifically.

---

## 8. The Real Fix: Capability-Aware Fallback

This is the section that matters most for *not having this exact conversation again* the next time an integration gets added and someone asks about it in a phrasing the router doesn't catch.

### 8.1 The core idea: a single capability manifest, one source of truth

Create a new file, `lib/capability-manifest.ts`, that describes — in plain English, meant to be dropped into a system prompt — everything North can currently do. This is **not** a duplicate of the trigger arrays (those are for fast deterministic routing); it's a human/model-readable description of the *underlying capabilities*, used only by the fallback path so Claude never again has to guess what exists.

```ts
// Single source of truth for what North can currently do, in plain English,
// meant for injection into system prompts (currently just the voice
// fallback, see app/api/v1/voice/respond/route.ts). Keep this updated
// whenever a new integration or capability ships — this is the fix for the
// class of bug where the fallback path confidently denies doing something
// it can actually do, because nothing ever told it otherwise. See
// North_Vector_Intent_and_Capability_Awareness_Plan.md Section 8 for the
// full reasoning and the incident that prompted this file's existence.

export const CAPABILITY_MANIFEST = `
North currently has these capabilities, all read-only unless noted:

- TASKS: Can create tasks when asked directly ("add task," "remind me to," "I need to...").
- DECISIONS: Can give a reasoned recommendation for "should I..." / "which is better" style questions, using a rule-based decision engine with a Judgment Engine fallback for anything outside its known rules.
- EMAIL (Gmail, read-only): Can check the inbox on request for anything urgent/time-sensitive. Does NOT do this automatically or on a schedule — only when asked. Does not read, mark, archive, or reply to anything.
- CALENDAR (Google Calendar, read-only): Can check upcoming events on request, default lookahead 48 hours (or narrower/wider if asked, e.g. "today" or "this week"). Does not create, modify, or delete events.
- NOTION (read-only): Can check a shared database for items flagged "Urgent" on request. Does not create, modify, or delete items.

If a request seems to be asking about one of these — even if the phrasing doesn't exactly match a canned trigger — say so plainly rather than denying the capability exists. If a request is for something genuinely outside this list (e.g. sending an email, creating a calendar event, anything requiring write access, anything with no matching capability above), say clearly that it's not something North can do yet, rather than guessing or pretending.
`.trim();
```

### 8.2 Wire it into the fallback's system prompt

Change in `app/api/v1/voice/respond/route.ts`:

```ts
import { CAPABILITY_MANIFEST } from "@/lib/capability-manifest";

// ...

const systemPrompt =
  "You are North, a personal chief-of-staff assistant. Someone just spoke to you and your " +
  "rule-based classifier couldn't categorize it as a task, status request, or decision. " +
  "Respond in 1-2 short sentences, conversationally, matching the brevity rule in the North " +
  "voice interface spec (Phase 1: 1-4 sentences, no filler). Keep the whole answer under 40 " +
  "words and make sure it's a complete, finished thought — never trail off mid-sentence. If " +
  "it sounds like something actionable that just didn't match a known pattern, say so plainly " +
  "rather than guessing what they meant.\n\n" +
  CAPABILITY_MANIFEST +
  formatPreferencesForPrompt(preferences);
```

### 8.3 Important boundary: this is a safety net, not a second dispatcher

With the manifest in place, it's tempting to have the fallback path actually *call* the Gmail/Calendar/Notion endpoints itself when it recognizes a match the router missed — effectively making Claude a second-tier router. **Don't do this in this pass.** Reasons:

- It would mean two different code paths can both end up hitting Gmail/Calendar/Notion, which complicates reasoning about the `surfaced`/dedup semantics in Section 6.4 and the existing Gmail TTL logic.
- It turns a fast, cheap fallback response into a multi-step tool-calling flow, adding latency and cost to what should be the rare/degraded path, not a new primary path.
- The two-tier trigger matching in Sections 5–7 is specifically meant to make the router catch the vast majority of real phrasings, so the fallback's job stays narrow: *when the router genuinely doesn't have a matching capability, or a phrasing gap slips through anyway, be honest about what North can and can't do* — not "quietly fix it by doing the router's job over again."

If, after this ships, real usage shows the router is *still* missing a meaningful fraction of legitimate Calendar/Email/Notion questions even with the loose matching from Sections 5–7, that's the signal to reconsider a proper LLM-based intent classification layer as a deliberate follow-up project — not something to bolt onto the fallback path as a workaround. See Section 9.1.

### 8.4 Keep the manifest honest, not aspirational

One failure mode worth naming explicitly: it will be tempting, next time a new integration is *half-built* (credentials set up, client written, but no route/trigger yet — exactly the state Calendar was in before this plan), to add it to `CAPABILITY_MANIFEST` early. Don't. The manifest should describe what's actually reachable end-to-end right now, not what's in progress — an inaccurate manifest that claims a capability that isn't actually wired up yet is the same bug in the opposite direction (Claude confidently claiming it CAN do something it can't, instead of confidently denying something it can). Update this file as the very last step of shipping each new integration, not the first.

---

## 9. Considered and Deferred

Documenting these so they don't get silently reconsidered or silently forgotten.

### 9.1 Full LLM-based intent classification instead of rule-based triggers

Considered: replace the entire `startsWith`/keyword trigger system with a single Claude call per voice input that classifies intent (task / email / calendar / notion / decision / unrecognized) and extracts parameters, instead of maintaining growing trigger-word lists by hand.

Deferred, not rejected. Reasons to defer for now:
- Adds an API call (cost + latency) to every single voice interaction, including the large fraction that are simple/unambiguous and currently resolve instantly and for free via string matching.
- The two-tier keyword approach in this plan directly fixes the actual observed failures without that cost.
- If phrasing-gap issues keep recurring after this ships (tracked per Section 11), that's real evidence for revisiting this — but it should be evidence-driven, not preemptive.

Worth reconsidering seriously once there are more than ~5-6 distinct on-demand capabilities, where hand-maintained keyword lists per capability start actively colliding with each other (as already surfaced once in Section 5.6's task-vs-email ordering conflict) — that's the point where a real classifier starts paying for its cost in reduced maintenance burden.

### 9.2 Extracting the repeated "loose match" pattern into a shared helper

Sections 5, 6, and 7 each define their own `WORDS` / `QUERY_WORDS` / `isLoose*Query` trio. This is duplication that will get worse with a fourth or fifth integration. Deferred rather than done now because:
- Three instances isn't yet enough duplication to justify the abstraction (premature generalization risk — the right shared shape isn't fully clear yet with only 3 data points).
- Doing it now, in the same change as fixing the actual bug, would make the diff harder to review.

Recommended as a small, separate follow-up cleanup task once this plan ships and settles: a generic `looseKeywordMatch(text, { anyOf: string[], andAnyOf: string[] })` helper, with the three call sites refactored to use it.

### 9.3 Should Calendar's on-demand default window be smarter (e.g. "rest of today" vs. flat 48h)?

The plan as written uses a simple keyword check (`"today"` → 24h, `"this week"` → 168h, else 48h default) rather than actually parsing "the rest of today" vs "tomorrow morning" vs other natural time expressions. This is a deliberate simplification — proper natural-language time-range parsing is a real feature in its own right (timezone handling, "this weekend," "next Tuesday," etc.) and shouldn't be scoped into a bug-fix plan. Flagging so it's a known, intentional gap rather than something that looks like an oversight later.

---

## 10. Testing Plan

### 10.1 Gmail (broadened matching)

Run every phrase in the table in Section 5.5 through the Sandbox voice UI (or a scripted test against `routeVoiceInput` directly, preferred — faster iteration than speaking each one aloud). Confirm the `type` field of the result matches the expected column exactly, and confirm the "no" cases really do fall through to `task`/`unrecognized` as appropriate rather than silently becoming email matches.

### 10.2 Calendar (new)

| Transcript | Expected `type` | Expected `withinHours` |
|---|---|---|
| "What's on my calendar" | `calendar` | 48 (default) |
| "What's on my calendar today" | `calendar` | 24 |
| "Anything on my calendar this week" | `calendar` | 168 |
| "Do I have anything coming up" | `calendar` | 48 (default) |
| "Can you see my calendar, is there anything I should be looking for there" | `calendar` | 48 (default, loose match) |
| "I have a meeting with my advisor tomorrow" | **not** `calendar` — this is a statement, not a query; should fall to `unrecognized`/fallback, and the fallback (with the manifest) should offer to check the calendar rather than denying it exists |

Also test with a real calendar that has 0 events, 1 event, and 4+ events in the window, to confirm `summarizeUpcomingEvents`'s pluralization and "plus N more" logic both read naturally out loud.

### 10.3 Notion (new)

Same shape as 10.2, using the `NOTION_TRIGGERS` table. Test with the actual Notion urgent-items database in both an empty state and a populated state.

### 10.4 Fallback capability-awareness (the most important test)

Deliberately ask something that the router will **not** match (pick something obscure enough that none of the trigger/loose-match logic fires — e.g. "hey, anything I should know about today" — vague enough to plausibly miss the calendar loose-match if "know about" isn't in `CALENDAR_QUERY_WORDS`). Confirm the fallback response, now that it has the capability manifest, either:
(a) recognizes it as plausibly calendar/email-related and says so honestly ("I can check your calendar or email if you'd like — just ask directly"), rather than
(b) flatly denying North has any relevant capability.

Also test a request for something genuinely **not** supported (e.g. "send an email to my professor") and confirm the fallback correctly and honestly says that's not something it can do yet — the manifest needs to produce accurate negatives, not just accurate positives. This is the direct test of the 8.4 concern (manifest honesty in both directions).

### 10.5 Regression check

Confirm the existing, already-working paths are untouched:
- Exact-phrase Gmail triggers still work (Section 5.3's first tier).
- Task creation still works, including with the ordering fix from 5.6 — specifically retest "remind me to check my email" and confirm it creates a task titled "Check my email," not a Gmail check.
- Decision-engine routing (`"should i..."` etc.) still works and is unaffected by any of the new trigger arrays.

---

## 11. Monitoring After Ship

Not asking for a full analytics system — just enough visibility to know whether this actually worked in practice:

- Add a `console.log` line in `routeVoiceInput` (or wherever is cheapest) logging which branch was taken for every voice input — `email` / `calendar` / `notion` / `task` / `decision` / `unrecognized` — for at least the first couple weeks after this ships. This is the cheapest possible way to answer "is the loose matching actually catching real phrasings, or do the keyword lists need adjusting" without guessing.
- If `unrecognized` shows up disproportionately for things that sound like they should've been Calendar/Email/Notion questions, that's the trigger for expanding the `*_QUERY_WORDS` / `*_WORDS` lists — not a sign this plan failed, just normal iteration on real usage data.
- If the fallback's capability-aware responses show up recognizing a lot of genuinely-should-have-been-routed queries (i.e., the safety net from Section 8 is catching things constantly rather than rarely), that's a concrete, evidence-based signal to revisit Section 9.1 (LLM-based classification) rather than continuing to hand-tune keyword lists indefinitely.

---

## 12. Flat Implementation Checklist

For Claude Code, in recommended order (each step is independently testable before moving to the next):

1. [ ] `lib/voice-intent-router.ts`: Reorder trigger checks so Task is checked before Email (Section 5.6, Option A). Re-run existing task tests to confirm no regression.
2. [ ] `lib/voice-intent-router.ts`: Add the two-tier loose-match logic for Email (Section 5.2–5.3). Test against Section 5.5's table.
3. [ ] `lib/calendar-summary.ts`: New file, `summarizeUpcomingEvents` (Section 6.3).
4. [ ] `app/api/v1/calendar/check-upcoming/route.ts`: New file (Section 6.2). Test directly with `curl`/Postman against a real owner-authenticated request before wiring into voice.
5. [ ] `lib/voice-intent-router.ts`: Add `CALENDAR_TRIGGERS`, `isLooseCalendarQuery`, `askCalendar`, and the corresponding branch in `routeVoiceInput` (Sections 6.5–6.6). Extend `VoiceIntentResult` union type. Test against Section 10.2's table.
6. [ ] `app/api/v1/notion/check-urgent/route.ts`: New file (Section 7.1). Test directly before wiring into voice.
7. [ ] `lib/voice-intent-router.ts`: Add `NOTION_TRIGGERS`, `isLooseNotionQuery`, `askNotion`, and the corresponding branch (Sections 7.2–7.3). Test against Section 10.3.
8. [ ] `lib/capability-manifest.ts`: New file, `CAPABILITY_MANIFEST` (Section 8.1).
9. [ ] `app/api/v1/voice/respond/route.ts`: Import and inject `CAPABILITY_MANIFEST` into the system prompt (Section 8.2).
10. [ ] Full regression pass: Section 10.5's checklist, plus a manual pass through the Sandbox UI with a mix of easy and edge-case phrasings from all the tables in this doc.
11. [ ] Add the `console.log` branch-tracking line from Section 11.
12. [ ] Update `docs/integrations/calendar-notion-gmail-task.md` — it currently states Calendar/Notion are scan-only with no on-demand path (Section 3); that's no longer true after this ships and the doc should say so, including a short note on why on-demand and the scheduled scan intentionally don't share dedup state (Section 6.4), so a future reader doesn't "fix" that apparent inconsistency by mistake.
13. [ ] **Do not** implement Section 9.1 (LLM classification) or 9.2 (shared loose-match helper) as part of this pass — flag them as follow-ups if they come up, per Section 9's reasoning.

---

## 13. Open Questions for Nishad (resolve before/during implementation)

- **Notion usage reality check (Section 7.3):** Is the Notion urgent-items database actively populated day-to-day right now, or mostly dormant? Affects how much phrasing-coverage effort is worth investing there versus treating it as "built and correct, revisit polish later."
- **Calendar default window (Section 9.3):** Is 48h the right default for a spoken "what's on my calendar" with no qualifier, or would you rather it default to "today" and require an explicit "this week"/"next few days" to widen it? Current plan keeps the existing 48h Phase-1 default for consistency with the proactive scan's window, but a voice *question* might reasonably want a different default than a background *scan* does.
- **Monitoring retention (Section 11):** Fine with plain `console.log` output for the first couple weeks, or do you want this routed somewhere more durable (a Firestore collection, similar to `gmail_surfaced`) from day one so it's not lost on redeploy? Plan currently assumes console logging is sufficient for a short diagnostic window, consistent with the existing precedent in `app/api/v1/gmail/check-urgent/route.ts`'s own console logging.
