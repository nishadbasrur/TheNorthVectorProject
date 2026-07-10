# North Vector: The Synthesis Engine — Proactive Cross-Source Reasoning

**Status:** Draft plan for review — not yet implemented
**Author:** Claude (planning session), for review by Nishad, for execution by Claude Code
**Date:** July 10, 2026
**Repo:** `github.com/nishadbasrur/TheNorthVectorProject`, branch `main` @ `a130df8`
**Companion doc:** `North_Vector_Intent_and_Capability_Awareness_Plan.md` (reactive on-demand fixes — a prerequisite, not a substitute, for this document)

---

## 0. What This Document Is, and Why It Exists

The previous plan fixed North so that when you ask a direct question, it answers correctly instead of falsely denying a capability it has. That plan is necessary but it is not the point of North Vector. The point, stated plainly, is: **North should notice things and tell you, before you know to ask.** You shouldn't have to say "check my email" — North should already know a meeting is coming up, that there's a relevant unread email about it, and say so unprompted.

This gap isn't a bug. It's an entire layer of the system that was **fully designed and never built**. `03-Chief-Engine/Daily_Briefing_Engine.md`, `Priority_Engine.md`, `Opportunity_Engine.md`, and `Chief_Orchestration.md` all describe exactly this — a Chief that assembles context across every source, reasons about what matters, and surfaces it proactively. None of that reasoning exists in code today. What exists (`functions/src/urgency-scan.ts`) checks Calendar and Notion **independently of each other**, each against its own single-source condition ("is this event starting soon," "is this Notion item checked urgent") — it never once asks "does this calendar event relate to that email" or "does this task deadline conflict with that meeting." That cross-referencing step is the entire missing piece, and it's what this document builds.

This is a genuinely larger, harder, more expensive (in API cost and engineering judgment) piece of work than the reactive fixes. It deserves to be scoped and built as its own real subsystem, not bolted onto the existing scan function. This document treats it that way.

---

## 1. What "Connecting the Dots" Actually Means, Concretely

Vague on purpose in the design docs ("notice things"), so let's make it concrete with real examples using data already in your system, so Claude Code has an unambiguous target:

- **Example 1 — Meeting + Email correlation:** A calendar event "Chemistry office hours w/ Dr. Bala" starts in 40 minutes. Separately, there's an unread email from Dr. Bala sent this morning. North should connect these — the email is very likely about the meeting — and surface both together: "Your office hours with Dr. Bala start in 40 minutes, and she emailed this morning — worth reading before you go."
- **Example 2 — Task + Deadline conflict:** A task "Finish chem problem set 3" has a due date tomorrow. The calendar shows back-to-back commitments tomorrow with no open block before the due time. North should flag the conflict *before* tomorrow arrives, not after it's already a crisis — this is explicitly what `Risk_Engine.md`'s severity model and `Priority_Engine.md`'s constitutional hierarchy (academic performance ranks above convenience) already reason about *offline*, in the design doc — this system needs to actually run that reasoning.
- **Example 3 — Goal drift silently building:** No single email, event, or task is individually alarming, but three small things this week (a skipped tutoring session, a lower problem-set score than usual, a rescheduled office-hours) together suggest chemistry prep is falling behind. No single-source check (Section 6's per-source scan) would ever catch this — it only emerges from looking at the pattern across sources over time, which is exactly the "behavioral patterns" input `Daily_Briefing_Engine.md` lists but nothing currently computes.
- **Example 4 — Genuine opportunity, not just risk:** An email arrives about a UMass Chan Summer Research Program info session, and it's noticed that this aligns with a stored goal/memory about the March 2027 application deadline already in the system. `Opportunity_Engine.md`'s entire purpose — "a good Chief also sees doors before they close" — is exactly this kind of cross-referencing between an incoming signal (the email) and existing stored context (the goal/memory), not a rule-based match.

The common thread: **every one of these requires holding multiple sources in view at once and reasoning about the relationship between them** — not evaluating each source against its own isolated threshold, which is all the current scan does.

---

## 2. Why the Current Architecture Structurally Cannot Do This

Worth being explicit about this, because it explains why "just add more triggers" (the previous plan's approach) can never get you here, no matter how many are added.

`functions/src/urgency-scan.ts`'s loop structure:
```
for each calendar event: check ONE condition (starting within 15 min) → maybe alert
for each notion item: check ONE condition (urgent checkbox) → maybe alert
```

Each source is fetched, evaluated, and alerted **in complete isolation** from every other source. There is no point in this code where a calendar event and an email are ever in the same variable, the same function call, or the same Claude prompt together. You cannot "connect dots" that are never in the same place to begin with. This isn't a matter of the conditions being too narrow (that's what the reactive plan's loose-matching fixes) — it's that the *shape* of the computation itself never brings sources into contact with each other.

The fix is architectural, not incremental: a new process that fetches from **all** sources into one combined context, then makes **one** reasoning pass across all of them together (or a small number of targeted cross-source passes — see Section 5.3), rather than N independent single-source passes.

---

## 3. Proposed Architecture: The Synthesis Engine

### 3.1 High-level shape

```
Trigger (scheduled, or on-demand "what should I know right now")
   ↓
CONTEXT ASSEMBLY — pull from every source into one unified snapshot:
   - Calendar: getUpcomingEvents() [already exists, lib/google-calendar-client.ts]
   - Gmail: getRecentInboxMessages() [already exists, lib/gmail-client.ts]
   - Notion: getUrgentItems() [already exists, lib/notion-client.ts]
   - Tasks: active tasks from Firestore [lib/task-store.ts]
   - Goals: active goals from Firestore [lib/goal-store.ts]
   - Memory: relevant recent/long-term memories [lib/memory-retrieval.ts]
   - Preferences: standing instructions [lib/preferences-store.ts]
   ↓
SYNTHESIS — a single structured Claude call given ALL of the above together,
   prompted specifically to find CONNECTIONS between sources, not evaluate
   each in isolation. This is the actual new capability. See Section 5.
   ↓
FILTERING — Priority Engine-style scoring (constitutional hierarchy from
   Priority_Engine.md) on whatever the synthesis pass surfaces, so genuinely
   minor connections don't create notification noise. See Section 6.
   ↓
DELIVERY — push notification (existing pattern, functions/src/push.ts) for
   anything that clears the bar, PLUS available on-demand via a new
   "what should I know right now" voice/API entry point that runs the same
   synthesis pass live instead of waiting for the schedule. See Section 7.
   ↓
MEMORY WRITE-BACK — whatever was surfaced (and, importantly, HOW it was
   received/acted on) gets written back into the memory system, so North's
   sense of "what actually mattered to Nishad" improves over time rather
   than re-deriving from scratch every run. See Section 8.
```

### 3.2 New Firestore collections needed

- **`synthesis_runs`** — one doc per synthesis pass: timestamp, which sources were included, raw connections found (before filtering), what cleared the priority bar, what was actually delivered. This is your audit trail and your debugging tool when the engine surfaces something wrong or misses something it should have caught.
- **`synthesis_connections`** — one doc per *distinct connection* found (not per run) — e.g. "Dr. Bala email ↔ office hours event" — with a dedup key so the same connection isn't re-surfaced identically on every run once already delivered, but re-evaluated if the underlying sources change (e.g., a new email arrives that changes the relevance). This is structurally different from `alert_state`'s simple "already alerted, never again" — a connection can become *more* relevant (meeting moved closer) or *less* relevant (meeting happened already) between runs, and needs its own lifecycle, not a one-shot flag.

### 3.3 New files (overview — full detail in Section 5–8)

| File | Purpose |
|---|---|
| `lib/synthesis-context.ts` | Assembles the unified cross-source context snapshot |
| `lib/synthesis-engine.ts` | The core reasoning pass — prompts Claude across all sources together |
| `lib/synthesis-priority.ts` | Filters/scores raw connections against the constitutional hierarchy |
| `functions/src/synthesis-scan.ts` | Scheduled Cloud Function, mirrors `urgency-scan.ts`'s existing pattern |
| `app/api/v1/synthesis/check-now/route.ts` | On-demand endpoint ("what should I know right now") |
| `lib/voice-intent-router.ts` (extended) | New trigger for "what should I know," "anything I should know about," etc. |

---

## 4. Context Assembly: `lib/synthesis-context.ts`

This is the part that actually brings sources into the same place — the fix for Section 2's structural gap.

```ts
import "server-only";
import { getUpcomingEvents, type UpcomingEvent } from "./google-calendar-client";
import { getRecentInboxMessages, type InboxMessage } from "./gmail-client";
import { getUrgentItems, type UrgentNotionItem } from "./notion-client";
import { getActiveTasks, type TaskRecord } from "./task-store"; // adapt to actual export shape
import { getActiveGoals, type GoalRecord } from "./goal-store"; // adapt to actual export shape
import { retrieveRelevantMemories } from "./memory-retrieval"; // adapt to actual export shape
import { getPreferences, type StoredPreference } from "./preferences-store";

export type SynthesisContext = {
  generatedAt: Date;
  calendarEvents: UpcomingEvent[];
  inboxMessages: InboxMessage[];
  notionUrgentItems: UrgentNotionItem[];
  activeTasks: TaskRecord[];
  activeGoals: GoalRecord[];
  relevantMemories: string[]; // formatted, not raw objects — memory retrieval already does this shaping
  preferences: StoredPreference[];
};

// Pulls from every source in parallel — this function's entire reason for
// existing is to put everything in one place at the same time, which is the
// structural gap urgency-scan.ts has (see
// North_Vector_Synthesis_Engine_Plan.md Section 2). Read-only across every
// source, same hard constraint as every existing integration.
export async function assembleSynthesisContext(): Promise<SynthesisContext> {
  const [calendarEvents, inboxMessages, notionUrgentItems, activeTasks, activeGoals, preferences] =
    await Promise.all([
      getUpcomingEvents(72), // wider window than the 48h on-demand default — synthesis
                              // is looking for developing patterns, not just imminent events
      getRecentInboxMessages(25), // same fetch size as the existing Gmail on-demand check
      getUrgentItems(),
      getActiveTasks(),
      getActiveGoals(),
      getPreferences(),
    ]);

  // Memory retrieval needs a query to search against — for a synthesis pass
  // (not a specific question), retrieve broadly around active goals/tasks
  // rather than a single query string. Exact call shape depends on
  // lib/memory-retrieval.ts's real signature — flagged for Claude Code to
  // confirm/adapt rather than guessed here, see Section 4.1.
  const relevantMemories = await retrieveRelevantMemories({
    context: [...activeGoals.map((g) => g.title), ...activeTasks.map((t) => t.title)].join(" "),
    limit: 15,
  });

  return {
    generatedAt: new Date(),
    calendarEvents,
    inboxMessages,
    notionUrgentItems,
    activeTasks,
    activeGoals,
    relevantMemories,
    preferences,
  };
}
```

### 4.1 Flag for Claude Code: confirm real export shapes before implementing

This plan references `getActiveTasks`, `getActiveGoals`, and `retrieveRelevantMemories` by inferred name/shape based on file naming conventions (`lib/task-store.ts`, `lib/goal-store.ts`, `lib/memory-retrieval.ts` all exist) but their exact exported function signatures weren't pulled during this planning pass the way the Calendar/Gmail/Notion clients were in the companion reactive-fixes doc. **Before writing `synthesis-context.ts`, actually read these three files and adapt the import/call shapes to what's really exported** — don't assume the names above are exactly right. This is a deliberate, flagged gap, not an oversight.

### 4.2 Cost/size consideration

25 emails + 72h of calendar events + all active tasks/goals + 15 memories, all serialized into one prompt, is a genuinely large context — this is not a cheap call like the reactive endpoints. Section 5.4 addresses cost management directly; don't skip it when implementing.

---

## 5. The Synthesis Reasoning Pass: `lib/synthesis-engine.ts`

This is the actual new capability — everything before this section is plumbing to get here, everything after is what to do with the output.

### 5.1 Why this needs to be a single well-designed prompt, not N small ones

It's tempting to loop — "for each calendar event, ask Claude if any email relates to it" — but that's O(events × emails) calls, expensive, and worse, it structurally *cannot* catch Section 1's Example 3 (goal drift across multiple small signals over time), which requires the model to see everything at once and reason about the aggregate pattern, not pairwise relationships. One well-structured call with the full context is both cheaper and more capable than many small ones here — this is the opposite tradeoff from the reactive plan's Gmail urgency check, which is correctly per-message because each email's urgency genuinely is independent of the others.

### 5.2 System prompt design

```ts
const SYNTHESIS_SYSTEM_PROMPT = `
You are North's synthesis reasoning pass. You will be given a snapshot of everything currently active across Nishad's calendar, inbox, Notion urgent items, tasks, goals, and relevant stored memories.

Your job is NOT to summarize each source individually — a separate part of the system already does that. Your job is to find CONNECTIONS: places where two or more sources relate to each other in a way that matters, or where a pattern across multiple items (not any single one) suggests something worth knowing.

Concrete examples of what counts as a connection worth surfacing:
- A calendar event and an email that are clearly about the same meeting/person/topic.
- A task deadline that conflicts with the calendar (no realistic time to do the work before it's due).
- An incoming opportunity (email, Notion item) that relates to an existing stated goal.
- Several small individually-unremarkable signals that together suggest a developing risk (e.g. a pattern of missed or rescheduled commitments related to the same goal).

What does NOT count as a connection worth surfacing:
- A single event, email, or task with nothing else to relate it to — that's just a normal item, not a synthesis finding, and the on-demand/reactive checks already handle "what's on my calendar" style questions for those.
- Vague thematic similarity that isn't a genuine actionable relationship (e.g. two unrelated emails both happening to mention "meeting" is not a connection).

Constitutional priority hierarchy to weigh relevance against, highest first: physical safety, physical health, mental health, legal obligations, academic performance, medical school competitiveness, career development, future optionality, financial stability, professional reputation, family relationships, important friendships, mentorship relationships, personal projects, entrepreneurship, exploration, entertainment, convenience, short-term pleasure.

For each connection found, respond with a JSON object with these fields: "sources" (array of source identifiers involved), "connection" (one clear sentence describing the relationship), "why_it_matters" (one sentence, framed against the priority hierarchy above), "urgency" ("now" | "today" | "this_week" | "fyi"), "confidence" ("high" | "medium" | "low").

Respond with a JSON array of these objects, or an empty array if genuinely nothing meets the bar. Err toward fewer, higher-confidence connections rather than many speculative ones — false positives here erode trust in the whole system fast, same principle already established for Gmail urgency evaluation.
`.trim();
```

### 5.3 The actual function

```ts
import "server-only";
import { askClaude } from "./anthropic-client";
import type { SynthesisContext } from "./synthesis-context";

export type SynthesisConnection = {
  sources: string[];
  connection: string;
  whyItMatters: string;
  urgency: "now" | "today" | "this_week" | "fyi";
  confidence: "high" | "medium" | "low";
};

function serializeContextForPrompt(context: SynthesisContext): string {
  // Deliberately compact, structured serialization — not raw JSON.stringify
  // of full objects (Gmail bodies especially need trimming, same 4000-char
  // slice precedent already used in app/api/v1/gmail/check-urgent/route.ts).
  const calendarBlock = context.calendarEvents
    .map((e) => `- [calendar:${e.id}] "${e.title}" starts ${e.start.toISOString()}`)
    .join("\n");

  const emailBlock = context.inboxMessages
    .map((m) => `- [email:${m.id}] "${m.subject}" — ${m.bodyText.slice(0, 500)}`)
    .join("\n");

  const notionBlock = context.notionUrgentItems
    .map((i) => `- [notion:${i.id}] "${i.title}"`)
    .join("\n");

  const taskBlock = context.activeTasks
    .map((t) => `- [task:${t.id}] "${t.title}" (${t.status}, priority: ${t.priority})`)
    .join("\n");

  const goalBlock = context.activeGoals
    .map((g) => `- [goal:${g.id}] "${g.title}" (${g.horizon}, ${g.progress}% progress)`)
    .join("\n");

  const memoryBlock = context.relevantMemories.map((m) => `- ${m}`).join("\n");

  return [
    `CALENDAR (next 72h):\n${calendarBlock || "(none)"}`,
    `INBOX (recent):\n${emailBlock || "(none)"}`,
    `NOTION URGENT ITEMS:\n${notionBlock || "(none)"}`,
    `ACTIVE TASKS:\n${taskBlock || "(none)"}`,
    `ACTIVE GOALS:\n${goalBlock || "(none)"}`,
    `RELEVANT MEMORIES:\n${memoryBlock || "(none)"}`,
  ].join("\n\n");
}

function parseConnections(text: string): SynthesisConnection[] {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    // Minimal shape validation — reject anything malformed rather than
    // trusting it blindly, same "fail conservative" precedent as
    // app/api/v1/gmail/check-urgent/route.ts's parseVerdict.
    return parsed.filter(
      (c): c is SynthesisConnection =>
        Array.isArray(c.sources) &&
        typeof c.connection === "string" &&
        typeof c.whyItMatters === "string" &&
        ["now", "today", "this_week", "fyi"].includes(c.urgency) &&
        ["high", "medium", "low"].includes(c.confidence)
    );
  } catch {
    return [];
  }
}

export async function runSynthesis(context: SynthesisContext): Promise<SynthesisConnection[]> {
  const result = await askClaude({
    systemPrompt: SYNTHESIS_SYSTEM_PROMPT,
    userMessage: serializeContextForPrompt(context),
    maxTokens: 1500, // meaningfully larger than any existing askClaude call in
                      // the codebase — this is doing real cross-source reasoning,
                      // not a one-line verdict. See Section 5.4 for cost handling.
  });

  if (!result.ok) return [];
  return parseConnections(result.text);
}
```

### 5.4 Cost and model considerations — read this before implementing

`lib/anthropic-client.ts` defaults to `claude-haiku-4-5-20251001` and has a soft daily cap of 200 calls, with no distinction today between a cheap one-line urgency verdict and this much larger cross-source reasoning call. Two things to decide before shipping this:

- **Model choice:** a reasoning task this open-ended (finding non-obvious connections across heterogeneous sources) may genuinely benefit from a stronger model than Haiku for this specific call, even if Haiku stays the default elsewhere. Recommend `askClaude` gain an optional `model` override parameter, and this call explicitly request a stronger model, rather than silently inheriting whatever the global default is. This is a real quality-vs-cost tradeoff to make deliberately, not by default.
- **Frequency vs. cost:** running this full-context pass every 15 minutes (matching the existing scan cadence) is a much bigger cost than the existing scan, which only does cheap structural checks (a time comparison, a checkbox read) except for Gmail's per-message urgency call which only happens on-demand. Recommend the scheduled synthesis pass run **hourly**, not every 15 minutes, with the on-demand "what should I know right now" endpoint (Section 7) available for anyone who wants a fresher check between scheduled runs. This is a real design decision, not a default to accept unreviewed — flagged in Section 10's open questions.

---

## 6. Priority Filtering: `lib/synthesis-priority.ts`

Raw connections from Section 5 shouldn't all become push notifications — that's exactly the "pile of competing engines" `Chief_Orchestration.md` explicitly warns against, and the fastest way to make Nishad start ignoring North's alerts entirely.

```ts
import type { SynthesisConnection } from "./synthesis-engine";

// Mirrors Priority_Engine.md's constitutional hierarchy — deliberately kept
// as a simple ordered list here (not re-deriving the full hierarchy logic)
// since the synthesis prompt already asked Claude to weigh against it when
// assigning urgency/confidence; this is a second, cheap, local gate on top,
// not a re-implementation of the same judgment.
export function shouldDeliver(connection: SynthesisConnection): boolean {
  // Low-confidence findings never interrupt, regardless of stated urgency —
  // same "err conservative" principle as Gmail's urgency evaluation.
  if (connection.confidence === "low") return false;

  // "fyi" urgency connections are worth keeping (Section 8's memory
  // write-back) but shouldn't trigger a push notification — they're for
  // the next on-demand check-in or daily briefing, not an interruption.
  if (connection.urgency === "fyi") return false;

  return true;
}
```

This is intentionally simple for v1 — a real, tunable priority *scoring* system (weighing constitutional tier, not just a binary gate) is a natural v2 once there's real usage data on what's actually worth interrupting for. Don't over-build this before it's been observed in practice; see Section 10.

---

## 7. Delivery: Scheduled Scan + On-Demand Endpoint

### 7.1 `functions/src/synthesis-scan.ts` — scheduled version

Structurally mirrors `urgency-scan.ts` (same file, same deployment pattern, same `sendPushNotification` reuse) but calls the new context-assembly + synthesis + filtering pipeline instead of the old per-source loops. Does **not** replace `urgency-scan.ts` — that function's fast, cheap, single-source checks (event starting in 15 minutes, Notion checkbox) still have value as a fast path and should keep running independently. This is an additional, slower, deeper pass, not a replacement.

```ts
import { logger } from "firebase-functions";
import { assembleSynthesisContext } from "../../lib/synthesis-context";
import { runSynthesis } from "../../lib/synthesis-engine";
import { shouldDeliver } from "../../lib/synthesis-priority";
import { recordSynthesisRun, alreadySurfacedConnection, recordConnection } from "../../lib/synthesis-store"; // new, see Section 8
import { sendPushNotification } from "./push";

export async function runSynthesisScan(): Promise<void> {
  const context = await assembleSynthesisContext();
  const connections = await runSynthesis(context);

  const delivered: string[] = [];

  for (const connection of connections) {
    if (!shouldDeliver(connection)) continue;
    if (await alreadySurfacedConnection(connection)) continue;

    const sent = await sendPushNotification(
      connection.urgency === "now" ? "Worth knowing right now" : "Worth knowing",
      `${connection.connection} ${connection.whyItMatters}`
    );

    if (!sent) {
      logger.warn(`Push did not send for synthesis connection: ${connection.connection}`);
    }

    await recordConnection(connection);
    delivered.push(connection.connection);
  }

  await recordSynthesisRun({ context, allConnections: connections, delivered });

  logger.info(
    `Synthesis scan complete: ${connections.length} connection(s) found, ${delivered.length} delivered.`
  );
}
```

### 7.2 `app/api/v1/synthesis/check-now/route.ts` — on-demand version

Same underlying pipeline, invoked live instead of on a schedule — this is what makes "hey North, what should I know right now" or "anything I should know about" (from the earlier conversation) actually work as a spoken question, not just a passive background alert.

```ts
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { assembleSynthesisContext } from "@/lib/synthesis-context";
import { runSynthesis } from "@/lib/synthesis-engine";
import { shouldDeliver } from "@/lib/synthesis-priority";

// On-demand synthesis — same reasoning pipeline as the scheduled scan
// (functions/src/synthesis-scan.ts), but returned directly rather than
// pushed, and WITHOUT dedup against previously-surfaced connections — a
// live "what should I know" question deserves a complete current answer,
// same reasoning as Calendar/Notion's on-demand endpoints not sharing
// alert_state with their own scheduled scans (see the companion reactive
// plan, Section 6.4).
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const context = await assembleSynthesisContext();
  const connections = await runSynthesis(context);
  const worthMentioning = connections.filter(shouldDeliver);

  return NextResponse.json({ connections: worthMentioning });
}
```

### 7.3 Voice trigger

Add to `lib/voice-intent-router.ts`, following the same pattern established in the companion reactive plan:

```ts
const SYNTHESIS_TRIGGERS = [
  "what should i know",
  "anything i should know about",
  "what's going on",
  "catch me up",
  "anything on my radar",
];
```

Response formatting should reuse the brevity-rule precedent (`limitToSentences`) — with potentially multiple connections returned, cap to the top 2-3 by urgency for a spoken response, same "top 3 plus N more" pattern already used in the companion plan's `summarizeUpcomingEvents`.

---

## 8. Memory Write-Back: `lib/synthesis-store.ts`

Without this, the engine re-derives everything from scratch every single run and never gets better at knowing what actually matters to Nishad specifically — it stays a generic pattern-matcher forever instead of becoming genuinely personalized, which is the whole differentiator `Memory_Philosophy.md` and the rest of `02-Memory-System` describe as core to the project.

```ts
import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { SynthesisConnection } from "./synthesis-engine";
import type { SynthesisContext } from "./synthesis-context";

// Dedup key: same source-pair combination, not exact string match — a
// connection between the same calendar event and email shouldn't re-surface
// identically every hour just because wording differs slightly between runs.
function connectionKey(connection: SynthesisConnection): string {
  return [...connection.sources].sort().join("|");
}

export async function alreadySurfacedConnection(connection: SynthesisConnection): Promise<boolean> {
  const doc = await adminDb.collection("synthesis_connections").doc(connectionKey(connection)).get();
  if (!doc.exists) return false;

  // Re-surface if the underlying sources have materially changed since last
  // surfaced (e.g. a new email arrived), not just because time passed — see
  // Section 3.2's note on why this differs from alert_state's one-shot flag.
  // Simple v1 approach: re-surface after 6 hours regardless, and let
  // Section 6's confidence/urgency filtering catch anything genuinely stale.
  // A more precise "did the actual sources change" check is a reasonable v2
  // once this is observed in practice — flagged, not built now.
  const surfacedAt = doc.data()?.surfacedAt?.toMillis?.() ?? 0;
  return Date.now() - surfacedAt < 6 * 60 * 60 * 1000;
}

export async function recordConnection(connection: SynthesisConnection): Promise<void> {
  await adminDb.collection("synthesis_connections").doc(connectionKey(connection)).set({
    ...connection,
    surfacedAt: FieldValue.serverTimestamp(),
  });
}

export async function recordSynthesisRun(params: {
  context: SynthesisContext;
  allConnections: SynthesisConnection[];
  delivered: string[];
}): Promise<void> {
  // Store counts/summaries, not raw source content — same "no raw email
  // body persisted" boundary already established in
  // docs/integrations/calendar-notion-gmail-task.md Section 3 for Gmail,
  // applied here across every source, not just Gmail.
  await adminDb.collection("synthesis_runs").add({
    generatedAt: params.context.generatedAt,
    sourceCounts: {
      calendarEvents: params.context.calendarEvents.length,
      inboxMessages: params.context.inboxMessages.length,
      notionUrgentItems: params.context.notionUrgentItems.length,
      activeTasks: params.context.activeTasks.length,
      activeGoals: params.context.activeGoals.length,
    },
    connectionsFound: params.allConnections.length,
    connectionsDelivered: params.delivered,
    runAt: FieldValue.serverTimestamp(),
  });
}
```

A genuinely deeper version of memory write-back — feeding back *whether Nishad actually acted on* a surfaced connection (did he read the email, did he reschedule) to improve future confidence scoring — is explicitly out of scope for v1. That requires closing a feedback loop this plan doesn't build (there's no current mechanism to know if a push notification was acted on). Worth naming as the natural v2, not silently ignoring it.

---

## 9. Privacy and Safety — Read Before Implementing

This pipeline reads **more sensitive data in one place, at once, than anything currently in the codebase** — full inbox content, full calendar, all tasks/goals, and retrieved memories, all serialized into a single prompt sent to the Anthropic API. The existing Gmail integration already accepted this tradeoff for *email alone* (`docs/integrations/calendar-notion-gmail-task.md` Section 3 explicitly documents that "real email text... is sent to the Anthropic API... whenever he asks"), but this plan extends that same tradeoff to calendar, tasks, goals, and memory simultaneously, on a recurring schedule rather than only on-demand. This deserves explicit, renewed sign-off, not an assumption that the existing Gmail consent covers it. Concretely:

- **Still strictly read-only** across every source — this plan adds zero write capability anywhere, consistent with every existing integration's hard constraint.
- **No raw source content persisted** — `synthesis_runs` and `synthesis_connections` store counts, summaries, and Claude's own generated one-sentence descriptions, never raw email bodies, full event details, or full task/goal text. Same boundary Gmail already enforces, applied consistently here.
- **Scheduled, not just on-demand** — this is the meaningful escalation from the existing Gmail design. Section 5.4 already recommends hourly rather than every-15-minutes partly for cost, but the privacy angle is a second, independent reason to not run this more frequently than genuinely useful — every run is another full read of the inbox plus everything else, whether or not anything interesting is found.
- **Explicit go/no-go before shipping:** confirm you're comfortable with full inbox + calendar + tasks + goals + memory being combined into a single Anthropic API call on an hourly recurring basis before this goes to implementation — this is a materially different privacy posture than the existing on-demand-only Gmail design, and deserves a clear yes rather than inheriting consent from a narrower prior decision.

---

## 10. Open Questions for Nishad

- **Scheduled frequency (Section 5.4, 9):** Hourly recommended as the starting point, balancing cost, staleness, and privacy exposure. Fine to start there and adjust based on real usage, or do you want a different starting cadence?
- **Model choice for the synthesis call (Section 5.4):** Worth explicitly using a stronger model than the Haiku default for this specific reasoning task? This is a real quality/cost tradeoff, not a default to inherit silently.
- **Delivery channel:** Push notification is the existing pattern and what this plan defaults to. Given the Core2/earpiece hardware work in progress elsewhere, do you want synthesis connections eligible for spoken delivery through Core2 once that pipeline exists, in addition to or instead of push? Flagging so it's a deliberate decision, not an afterthought bolted on later.
- **Priority filtering strictness (Section 6):** The v1 `shouldDeliver` gate is deliberately simple (confidence + urgency only). Comfortable starting simple and tuning based on real false-positive/false-negative experience, or do you want the full constitutional-hierarchy weighting built into the filter from day one rather than left to the synthesis prompt alone?
- **Explicit privacy go/no-go (Section 9):** **Resolved — approved by Nishad, July 10, 2026.** Confirmed comfortable with full inbox + calendar + tasks + goals + memory combined into recurring hourly Anthropic API calls, per the terms in Section 9 (strictly read-only, no raw source content persisted, hourly cadence as the starting frequency). Claude Code should proceed on this basis and does not need to re-confirm before implementing.

---

## 11. Relationship to the Companion Reactive Plan

Build order matters here. The reactive plan (`North_Vector_Intent_and_Capability_Awareness_Plan.md`) should ship first, for two concrete reasons:

1. **Shared plumbing.** `getUpcomingEvents`, `getUrgentItems`, and Gmail's inbox-reading pattern are all reused directly by `assembleSynthesisContext()` (Section 4) — nothing here requires the reactive plan's *new* endpoints specifically, but the underlying client functions and patterns this plan leans on are the same ones that plan documents thoroughly.
2. **The capability manifest matters more, not less, once this ships.** Once North can proactively surface things unprompted, it becomes even more important that the reactive fallback (companion plan, Section 8) never contradicts what the synthesis engine already knows — imagine North proactively telling you about an email connection via push notification, then denying Gmail access exists when you ask about it directly five minutes later because the fallback's manifest wasn't kept current. Section 8.4 of the companion plan's warning about manifest honesty becomes materially more important once there's a second system (this one) that's also reasoning over the same capabilities.

Recommend implementing and shipping the companion plan's Section 12 checklist in full first, confirming it's stable, and only then starting on this document's Section 3 architecture.

---

## 12. Flat Implementation Checklist

1. [x] Resolve Section 10's open questions with Nishad — privacy go/no-go **approved July 10, 2026** (see Section 10). Remaining open questions (frequency, model choice, delivery channel, filtering strictness) are lower-stakes defaults noted in the plan — Claude Code can proceed with the recommended defaults (hourly, stronger model for synthesis calls, push-only for now, simple confidence/urgency gate) and flag if any warrant a check-in before implementing, rather than blocking on all of them.
2. [ ] Confirm companion reactive plan has shipped and is stable (Section 11).
3. [ ] Read `lib/task-store.ts`, `lib/goal-store.ts`, `lib/memory-retrieval.ts` in full to confirm real export shapes (Section 4.1) before writing `lib/synthesis-context.ts`.
4. [ ] `lib/synthesis-context.ts` — context assembly (Section 4).
5. [ ] `lib/synthesis-engine.ts` — the core reasoning pass, including prompt design (Section 5). Test in isolation with a hand-constructed `SynthesisContext` fixture before wiring into any live scheduled/on-demand path — this is the highest-risk new logic in the whole plan and deserves standalone testing first.
6. [ ] `lib/synthesis-priority.ts` — filtering (Section 6).
7. [ ] `lib/synthesis-store.ts` — Firestore write-back (Section 8).
8. [ ] `functions/src/synthesis-scan.ts` — scheduled version (Section 7.1). Deploy with a manual trigger first, not the schedule, and inspect `synthesis_runs` output by hand before enabling the recurring schedule.
9. [ ] `app/api/v1/synthesis/check-now/route.ts` — on-demand version (Section 7.2).
10. [ ] `lib/voice-intent-router.ts` — `SYNTHESIS_TRIGGERS` and wiring (Section 7.3).
11. [ ] Update `03-Chief-Engine/Daily_Briefing_Engine.md` and `Chief_Orchestration.md` to reflect what's actually implemented versus what remains aspirational — these docs currently read as fully current-state descriptions of a system that didn't exist; once this ships, they should accurately describe the real implementation, and continue to flag clearly whatever's still not built (see Section 8's note on feedback-loop write-back as an explicit remaining gap).
12. [ ] Enable the scheduled run only after at least a few days of manually-triggered runs show sensible, non-noisy output.

---

## 13. What This Document Deliberately Does Not Solve

Naming these so they're understood as known, bounded gaps rather than things this plan quietly failed to cover:

- **Feedback loop on whether surfaced connections were actually useful** (Section 8) — the engine will not get smarter about what Nishad cares about specifically until this exists, and it doesn't yet.
- **Natural-language time-range reasoning** beyond what's already flagged in the companion plan (Section 9.3 there) — synthesis uses the same simple 72h window, not true calendar-aware reasoning about "this week" vs "before my exam."
- **Any write action** — North can now notice a conflict between a task deadline and calendar load (Example 2, Section 1), but cannot reschedule anything, create a calendar block, or take any action beyond telling you. That's a deliberate, hard boundary carried over from every existing integration, not an oversight.
- **Voice delivery through Core2** — flagged as an open question (Section 10), not built in this pass, since the hardware/firmware side of that isn't ready yet.
