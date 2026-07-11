# North Vector: JARVIS Tool-Calling Migration — Replace Rule-Based Voice Routing with Real Tool Use

**Status:** Draft plan for review — not yet implemented
**Author:** Claude (planning session), for review by Nishad, for execution by Claude Code
**Date:** July 10, 2026
**Repo:** `github.com/nishadbasrur/TheNorthVectorProject`, branch `main` @ `34829d9`
**Companion docs:** `North_Vector_Intent_and_Capability_Awareness_Plan.md` (already shipped — this plan replaces its rule-based routing, not its underlying integrations), `North_Vector_Synthesis_Engine_Plan.md` (separate, unimplemented, not affected by this plan)

---

## 0. How to Use This Document

This exists because a cleanup request came in describing `lib/voice-intent-router.ts` as already deleted and replaced by real Anthropic tool-calling in `app/api/v1/voice/respond/route.ts`, with Sandbox calling that route directly using a `sessionId`. None of that has actually been built — `voice-intent-router.ts` is still the live dispatcher, Sandbox still calls it directly, and there is no `lib/tool-dispatcher.ts` anywhere in the repo. This document is the real plan for building that migration, so the downstream cleanup (deleting `judgment`/`log-intent`/`check-upcoming`/`check-urgent` routes) has something true to stand on when it's actually executed.

Sections 1–3 are the diagnosis and scoping. Sections 4 onward are the build plan, file by file. Section 13 is the flat checklist.

---

## 1. What's Actually Live Right Now (confirmed by reading the code, not assumed)

```
Sandbox (app/sandbox/page.tsx)
   → routeVoiceInput(transcript)   [lib/voice-intent-router.ts, client-side]
       ├── TASK_TRIGGERS.startsWith?          → createTask() directly (client Firestore SDK)
       ├── EMAIL_TRIGGERS / loose match?       → POST /api/v1/gmail/check-urgent
       ├── CALENDAR_TRIGGERS / loose match?    → POST /api/v1/calendar/check-upcoming
       ├── NOTION_TRIGGERS / loose match?      → POST /api/v1/notion/check-urgent
       ├── DECISION_TRIGGERS.startsWith?       → POST /api/v1/decisions
       │      └── generic placeholder result?  → POST /api/v1/voice/judgment
       └── else                                → POST /api/v1/voice/respond (askClaude, plain text,
                                                   CAPABILITY_MANIFEST injected into system prompt)
   → every branch also fires POST /api/v1/voice/log-intent (fire-and-forget, writes voice_intent_log)
```

This is the fully-shipped output of `North_Vector_Intent_and_Capability_Awareness_Plan.md` — six independent keyword-matching branches, each hand-tuned, with a documented ordering conflict already worked around once (Section 5.6 of that plan: task-trigger must be checked before email-trigger or "remind me to check my email" mis-routes). `CAPABILITY_MANIFEST` (`lib/capability-manifest.ts`) exists specifically so the one true fallback branch doesn't lie about what North can do — but it's a second, hand-maintained description of the same capabilities the trigger arrays already encode, and the Intent plan's own Section 9.1 predicted this exact pressure: *"worth reconsidering seriously once there are more than ~5-6 distinct on-demand capabilities, where hand-maintained keyword lists per capability start actively colliding with each other."* That threshold is here — five branches (Task/Email/Calendar/Notion/Decision) plus a sixth catch-all, one documented collision already, and a manifest that has to be manually kept in sync with the trigger arrays or it starts confidently lying in the opposite direction (Section 8.4 of that plan).

Tool-calling is the direct answer to that predicted pressure. This plan builds it.

---

## 2. What This Plan Actually Changes

1. **Replace the six keyword-matching branches with real Anthropic tool-calling**, in a single endpoint (`/api/v1/voice/respond`). Claude sees tool *definitions* (JSON schemas), not a prose manifest, and decides for itself whether a transcript calls for `create_task`, `check_email`, `check_calendar`, `check_notion`, `get_decision_recommendation`, none of the above, or more than one. This eliminates the ordering-conflict class of bug entirely — there's no fixed check order to get wrong, and no drift between what's documented as a capability and what's actually wired up, because the tool schema *is* the capability list.
2. **Add real multi-turn conversational continuity via a `sessionId`**, so pronoun references ("move it to eight" → "actually, make it seven") resolve correctly across separate spoken turns — something the current stateless per-utterance router structurally cannot do. This is a deliberately minimal slice of `04-Voice-Interface/Voice_Session_Manager.md` (see Section 6 for exactly how minimal, and Section 9 for what's explicitly not being built).
3. **Delete `lib/voice-intent-router.ts`** and migrate Sandbox to call `/api/v1/voice/respond` directly.
4. **Leave the actual integration clients untouched** — `lib/google-calendar-client.ts`, `lib/notion-client.ts`, `lib/gmail-client.ts`, `lib/decision-engine.ts`, `lib/task-store.ts` all keep their existing logic. This plan changes *how they get invoked*, not what they do.

---

## 3. Explicit Non-Goals

- **Not the Synthesis Engine.** Proactive cross-source reasoning (`North_Vector_Synthesis_Engine_Plan.md`) is a separate, unimplemented, unrelated piece of work. This plan doesn't touch it and doesn't need it to ship first or after.
- **Not full `Voice_Session_Manager.md` compliance.** That document specifies session types (Quick Command / Briefing / Planning / Decision / Reflection / Walking / Deep Work), topic tracking, confirmation-state tracking, device handoff, pause/resume voice commands, and a memory-promotion pipeline. This plan implements exactly enough of it — a session id, a short rolling turn history, one flat idle-expiration policy — to make pronoun continuity work. See Section 9 for the full list of what's deliberately deferred and why.
- **No write access anywhere.** Every existing hard boundary (`docs/integrations/calendar-notion-gmail-task.md` Section 2, and every integration client's own read-only comment) is unchanged. Tool-calling doesn't imply new write capability — the tools this plan defines are 1:1 wrappers around functions that already only read (or, for `create_task`, already only create app-owned Firestore data, not anything in an external service).
- **Not upgrading the model** as part of this migration. `claude-haiku-4-5-20251001` stays the default; Section 7.3 flags model choice as an open question but doesn't resolve it here.
- **Not changing STT/TTS.** `/api/v1/voice/transcribe` and `/api/v1/tts` are untouched.
- **Not deleting `judgment`/`log-intent`/`check-upcoming`/`check-urgent` as part of this plan's implementation.** This plan makes them genuinely orphaned as a side effect (Section 10), but the actual deletion is the follow-up cleanup pass that was already scoped in the original conversation — it happens after this ships and is confirmed stable, not bundled into this diff.

---

## 4. Architecture: Before and After

### Before (current, fully shipped)

See Section 1's diagram.

### After (this plan)

```
Sandbox (app/sandbox/page.tsx)
   → POST /api/v1/voice/respond { text, sessionId }
       ↓
   loadSession(sessionId)          [lib/voice-session-store.ts — Firestore-backed, see Section 6]
       ↓
   messages = [...session.turns, { role: "user", content: text }]
       ↓
   askClaudeWithTools({ systemPrompt, messages, tools: TOOL_DEFINITIONS })   [lib/anthropic-client.ts]
       ↓
   stop_reason === "tool_use"?
       ├── yes → executeTool(name, input)   [lib/tool-dispatcher.ts]
       │           → append tool_result, call askClaudeWithTools again (loop, capped)
       └── no  → final text is the response
       ↓
   saveSession(sessionId, updatedTurns)
       ↓
   ← { responseText, toolsUsed: string[] }
```

The key structural shift: **the tool schema is the single source of truth for what North can do**, read directly off `lib/tool-dispatcher.ts`'s exports. There is no second, hand-maintained prose description to keep in sync (`CAPABILITY_MANIFEST` becomes largely redundant — see Section 8.5) and no fixed check-order to get wrong (Claude decides, per-request, which tool(s) apply, including zero or more than one — e.g. "what's on my calendar and are there any urgent emails" can now call both `check_calendar` and `check_email` in the same turn, which the old router could never do since it returned on the first match).

---

## 5. Tool Definitions and Handlers: `lib/tool-dispatcher.ts`

### 5.1 Tool schema shape

Anthropic's Messages API tool format (`@anthropic-ai/sdk@^0.110.0`, already a dependency):

```ts
import "server-only";
import type Anthropic from "@anthropic-ai/sdk";

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "create_task",
    description:
      "Create a new task/reminder for Nishad. Use when the request is a direct instruction to " +
      "remember or do something later (e.g. \"add task,\" \"remind me to,\" \"I need to...\"), not " +
      "for questions or requests to check on something.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short task title, in plain sentence case." },
      },
      required: ["title"],
    },
  },
  {
    name: "check_email",
    description:
      "Check Gmail (read-only) for anything urgent or time-sensitive right now. Only call this when " +
      "explicitly asked about email/inbox status — never proactively, never to send or modify anything.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "check_calendar",
    description:
      "Check Google Calendar (read-only) for upcoming events. Defaults to the next 48 hours; pass a " +
      "narrower or wider window if the request implies one (e.g. \"today\" → 24, \"this week\" → 168).",
    input_schema: {
      type: "object",
      properties: {
        withinHours: {
          type: "number",
          description: "Lookahead window in hours. Omit to use the default (48).",
        },
      },
    },
  },
  {
    name: "check_notion",
    description: "Check the shared Notion database (read-only) for items flagged Urgent.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_decision_recommendation",
    description:
      "Get a reasoned recommendation for a \"should I...\" / \"which is better\" style decision " +
      "question, from North's decision engine (which remembers and reuses past answers to the same " +
      "question). Use for decision-shaped questions before answering from general reasoning alone — " +
      "the engine may have a specific stored rule or prior answer worth grounding the reply in.",
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The decision question, verbatim or lightly cleaned up." },
      },
      required: ["question"],
    },
  },
];
```

Every `description` here is doing the job `CAPABILITY_MANIFEST`'s prose used to do — except it's physically impossible for it to drift out of sync with what's callable, because the description lives next to the schema Claude actually invokes. This is the structural fix the Intent plan's Section 1 diagnosed as the "real root cause" but couldn't fully solve with a rule-based router (a prose manifest is still a second source of truth, just a better-maintained one).

### 5.2 Handlers — thin wrappers around existing, unchanged logic

```ts
import { createTaskAsAdmin } from "./task-store-admin"; // new, Section 5.3
import { getUpcomingEvents } from "./google-calendar-client";
import { summarizeUpcomingEvents } from "./calendar-summary";
import { getUrgentItems } from "./notion-client";
import { checkUrgentEmails } from "./gmail-urgency"; // new, Section 5.4
import { evaluateDecision } from "./decision-engine";

export type ToolResult = { toolUseId: string; content: string };

// Every handler catches its own errors and returns a describable failure
// string rather than throwing — Claude needs *something* to read back to
// the user ("I couldn't check your calendar just now"), same UX contract
// lib/voice-intent-router.ts's per-branch functions already established.
// Losing that behavior in the migration would be a regression, not a
// simplification.
async function handleCreateTask(input: { title: string }): Promise<string> {
  try {
    await createTaskAsAdmin({
      title: input.title,
      description: "",
      status: "scheduled",
      priority: "medium",
      energy: "medium",
      domain: "personal",
    });
    return `Created task: "${input.title}".`;
  } catch (error) {
    console.error("[tool-dispatcher] create_task failed:", error);
    return "Task creation failed — tell Nishad to try again.";
  }
}

async function handleCheckEmail(): Promise<string> {
  try {
    return await checkUrgentEmails();
  } catch (error) {
    console.error("[tool-dispatcher] check_email failed:", error);
    return "Email check failed — tell Nishad to try again in a bit.";
  }
}

async function handleCheckCalendar(input: { withinHours?: number }): Promise<string> {
  try {
    const withinHours = input.withinHours ?? 48;
    const events = await getUpcomingEvents(withinHours);
    return summarizeUpcomingEvents(events, withinHours);
  } catch (error) {
    console.error("[tool-dispatcher] check_calendar failed:", error);
    return "Calendar check failed — tell Nishad to try again in a bit.";
  }
}

async function handleCheckNotion(): Promise<string> {
  try {
    const items = await getUrgentItems();
    if (items.length === 0) return "Nothing flagged urgent in Notion right now.";
    const titles = items.map((i) => `"${i.title}"`).join(", ");
    return `${items.length} urgent item${items.length === 1 ? "" : "s"} in Notion: ${titles}.`;
  } catch (error) {
    console.error("[tool-dispatcher] check_notion failed:", error);
    return "Notion check failed — tell Nishad to try again in a bit.";
  }
}

// lib/decision-engine.ts's own literal placeholder for "no specific rule
// matched" — same string lib/voice-intent-router.ts used to detect this,
// moved here since this is now the only remaining caller. Returning
// `specific: false` alongside it lets Claude know to reason it through
// itself in the follow-up turn, rather than parroting the placeholder back
// verbatim — this is exactly what askVoiceJudgment used to do via a second
// HTTP call; folding it into the same tool-use turn is strictly simpler.
const DECISION_ENGINE_GENERIC_FALLBACK = "Use retrieved context and risks to guide decision.";

async function handleGetDecisionRecommendation(input: { question: string }): Promise<string> {
  try {
    const decision = await evaluateDecision(input.question);
    const specific = decision.recommendation !== DECISION_ENGINE_GENERIC_FALLBACK;
    return JSON.stringify({ ...decision, specific });
  } catch (error) {
    console.error("[tool-dispatcher] get_decision_recommendation failed:", error);
    return JSON.stringify({ specific: false, error: "Decision engine failed." });
  }
}

export async function executeTool(name: string, input: unknown): Promise<string> {
  switch (name) {
    case "create_task":
      return handleCreateTask(input as { title: string });
    case "check_email":
      return handleCheckEmail();
    case "check_calendar":
      return handleCheckCalendar(input as { withinHours?: number });
    case "check_notion":
      return handleCheckNotion();
    case "get_decision_recommendation":
      return handleGetDecisionRecommendation(input as { question: string });
    default:
      return `Unknown tool: ${name}`;
  }
}
```

### 5.3 New file: `lib/task-store-admin.ts`

`lib/task-store.ts` uses the **client** Firestore SDK (`firebase/firestore`, browser auth) — it's called today from `app/sandbox/page.tsx` (via the router), `app/tasks/page.tsx`, `app/dashboard/page.tsx`, and `app/api/v1/tasks/route.ts` directly. Once task creation happens inside the server-side tool dispatcher, there's no browser session to forward, so the client SDK hits Firestore Security Rules and fails with `permission-denied` — the exact problem `lib/decision-memory-admin.ts` already exists to solve for decisions. Mirror that precedent exactly rather than inventing a new pattern:

```ts
import "server-only";
import { adminDb } from "./firebase-admin";
import type { CreateTaskInput } from "./task-store";

// Admin SDK counterpart to lib/task-store.ts's createTask, for server-only
// callers (lib/tool-dispatcher.ts). The client-SDK version is unauthenticated
// when run from a server route — same reasoning as
// lib/decision-memory-admin.ts's relationship to lib/decision-memory.ts.
export async function createTaskAsAdmin(input: CreateTaskInput): Promise<void> {
  const now = new Date().toISOString();

  const taskData: Record<string, unknown> = {
    ...input,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  Object.keys(taskData).forEach((key) => {
    if (taskData[key] === undefined) delete taskData[key];
  });

  await adminDb.collection("tasks").add(taskData);
}
```

`lib/task-store.ts` itself is untouched — `app/tasks/page.tsx`, `app/dashboard/page.tsx`, and `app/api/v1/tasks/route.ts` keep using it exactly as they do today. This is additive, not a replacement.

### 5.4 New file: `lib/gmail-urgency.ts` — extracted from `app/api/v1/gmail/check-urgent/route.ts`

This one's different from Calendar/Notion. `getUpcomingEvents`/`getUrgentItems` are simple reads the old router called via an HTTP round-trip to itself for no real reason (Section 6 already noted this indirection). Gmail's route has **real logic that must be preserved**: the `gmail_surfaced`/24h-TTL dedup and the per-message urgency judgment call (`docs/integrations/calendar-notion-gmail-task.md` Section 3). That logic needs to become directly importable so the tool dispatcher isn't making an HTTP call to its own server:

```ts
import "server-only";
import { adminDb } from "./firebase-admin";
import { getRecentInboxMessages } from "./gmail-client";
import { askClaude } from "./anthropic-client";
import { FieldValue } from "firebase-admin/firestore";

const SURFACED_TTL_MS = 24 * 60 * 60 * 1000;

const URGENCY_SYSTEM_PROMPT = /* unchanged, moved verbatim from the route file */ "...";

type UrgencyVerdict = { urgent: boolean; reason: string };

function parseVerdict(text: string): UrgencyVerdict {
  /* unchanged, moved verbatim */
  return { urgent: false, reason: "" };
}

// Extracted from app/api/v1/gmail/check-urgent/route.ts so both the tool
// dispatcher (direct import, no HTTP round-trip) and the existing HTTP route
// (kept as a thin wrapper, see Section 10.2) share one implementation.
export async function checkUrgentEmails(): Promise<string> {
  const messages = await getRecentInboxMessages(25);
  const surfacedSnapshot = await adminDb.collection("gmail_surfaced").get();
  // ...exact existing dedup + evaluation + gmail_surfaced/alerts write logic,
  // moved verbatim from the route handler...
  // Returns the same spoken-summary string lib/voice-intent-router.ts's
  // checkUrgentEmails() used to build client-side from the JSON response —
  // now built server-side directly, no JSON round-trip needed.
}
```

`app/api/v1/gmail/check-urgent/route.ts` becomes a thin wrapper calling this function (see Section 10.2 — this route has no other known callers either, but wasn't in the original cleanup scope, so it's flagged rather than deleted here).

### 5.5 `lib/anthropic-client.ts`: add `askClaudeWithTools`

`askClaude` stays exactly as-is (still used by `lib/gmail-urgency.ts`'s per-message evaluation and `lib/preference-detector.ts` — both genuinely single-turn, no-tools calls that shouldn't pay for the extra complexity). Add a sibling function for the multi-turn, tool-aware case rather than overloading `askClaude` itself:

```ts
export async function askClaudeWithTools(params: {
  systemPrompt: string;
  messages: Anthropic.MessageParam[];
  tools: Anthropic.Tool[];
  maxTokens?: number;
}): Promise<
  | { ok: true; stopReason: string; content: Anthropic.ContentBlock[] }
  | { ok: false; error: string }
> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "ANTHROPIC_API_KEY not configured" };
  }

  if (callsToday >= SOFT_DAILY_CALL_CAP) {
    console.warn(`[anthropic-client] Soft daily call cap (${SOFT_DAILY_CALL_CAP}) reached — refusing call.`);
    return { ok: false, error: "Daily call cap reached" };
  }

  try {
    callsToday += 1;
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: params.maxTokens ?? 400,
      system: params.systemPrompt,
      messages: params.messages,
      tools: params.tools,
    });

    return { ok: true, stopReason: response.stop_reason ?? "end_turn", content: response.content };
  } catch (err) {
    console.error("[anthropic-client] Tool-use API call failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
```

Shares the same module-level `callsToday`/`SOFT_DAILY_CALL_CAP` guard as `askClaude` — see Section 7.2 for why the cap's effective headroom needs re-examining now that one voice turn can cost more than one call.

---

## 6. Session Continuity: `lib/voice-session-store.ts`

### 6.1 Why this can't be in-memory

`lib/anthropic-client.ts`'s `callsToday` counter already accepts being wiped on redeploy/restart as a documented tradeoff — fine for a soft sanity cap, not fine for conversation state. Next.js API routes on serverless hosting (Firebase App Hosting, this project's deploy target) are **not guaranteed to share memory across invocations or instances** — an in-memory session map would silently drop context on a cold start or instance rotation, which is a real, user-facing bug (North "forgets" what was just said, mid-conversation, with no warning). Session state has to be Firestore-backed, same as everything else server-side in this codebase.

### 6.2 New Firestore collection: `voice_sessions`

```ts
import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type VoiceTurn = { role: "user" | "assistant"; content: string };

const SESSION_IDLE_TTL_MS = 10 * 60 * 1000; // flat default — see Section 9 on why
                                             // this isn't the full session-type-aware
                                             // expiration policy Voice_Session_Manager.md
                                             // describes
const MAX_TURNS_KEPT = 12; // ~6 exchanges — enough for pronoun continuity within a
                            // conversation, bounded so the prompt doesn't grow unbounded

// Single-owner app (see lib/owner.ts) — no per-user partitioning needed, same
// assumption every other Firestore collection in this codebase already makes.
export async function loadSession(sessionId: string): Promise<VoiceTurn[]> {
  const doc = await adminDb.collection("voice_sessions").doc(sessionId).get();
  if (!doc.exists) return [];

  const data = doc.data();
  const updatedAtMs = data?.updatedAt?.toMillis?.() ?? 0;
  if (Date.now() - updatedAtMs > SESSION_IDLE_TTL_MS) return []; // expired — treat as fresh

  return Array.isArray(data?.turns) ? data.turns : [];
}

export async function saveSession(sessionId: string, turns: VoiceTurn[]): Promise<void> {
  const trimmed = turns.slice(-MAX_TURNS_KEPT);

  await adminDb.collection("voice_sessions").doc(sessionId).set({
    turns: trimmed,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
```

### 6.3 `firestore.rules` addition

```
// voice_sessions holds short-lived conversational turn history for
// multi-turn voice continuity (pronoun resolution across separate spoken
// utterances) — see North_Vector_JARVIS_Tool_Calling_Migration_Plan.md
// Section 6. Written only by app/api/v1/voice/respond via the Admin SDK; no
// client write path, same pattern as voice_intent_log before it.
match /voice_sessions/{document=**} {
  allow read: if isOwner();
  allow write: if false;
}
```

---

## 7. The Tool-Use Loop: `app/api/v1/voice/respond/route.ts`

### 7.1 Rewrite

```ts
import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { askClaudeWithTools } from "@/lib/anthropic-client";
import { getPreferences, formatPreferencesForPrompt } from "@/lib/preferences-store";
import { detectAndStorePreference } from "@/lib/preference-detector";
import { loadSession, saveSession, type VoiceTurn } from "@/lib/voice-session-store";
import { TOOL_DEFINITIONS, executeTool } from "@/lib/tool-dispatcher";

const MAX_TOOL_ITERATIONS = 4; // hard cap against a runaway tool-call loop —
                                // no realistic single voice turn should need
                                // more than a couple of tool calls

// Folds in the advisory framing app/api/v1/voice/judgment/route.ts used to
// provide via a separate HTTP call — decision-shaped questions now get a
// real opinion in the same tool-use turn (via get_decision_recommendation's
// `specific: false` signal) rather than a second round-trip. See
// North_Vector_JARVIS_Tool_Calling_Migration_Plan.md Section 5.2.
function buildSystemPrompt(preferences: Awaited<ReturnType<typeof getPreferences>>): string {
  return (
    "You are North, a personal chief-of-staff assistant, speaking with Nishad. Respond " +
    "conversationally in 1-4 short sentences (Voice_Interaction_Design.md's brevity rule) — this is " +
    "spoken aloud, not read. Keep the whole answer under 60 words and make sure it's a complete, " +
    "finished thought — never trail off mid-sentence.\n\n" +
    "You have tools for checking email, calendar, and Notion, creating tasks, and getting a decision " +
    "recommendation. Call a tool whenever the request genuinely needs current information or an " +
    "action you have a tool for — don't guess or answer from stale assumptions when a tool can give " +
    "a real answer. If get_decision_recommendation comes back with \"specific\": false, that means " +
    "the decision engine has no specific rule for this — give a real, honest opinion yourself rather " +
    "than deflecting; this is advisory only, you never execute actions, move money, or make " +
    "commitments on Nishad's behalf. If nothing matches and nothing needs a tool, just answer " +
    "naturally, and if something is genuinely outside what your tools can do, say so plainly rather " +
    "than guessing." +
    formatPreferencesForPrompt(preferences)
  );
}

export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body as Record<string, unknown>)?.text;
  const sessionId = (body as Record<string, unknown>)?.sessionId;
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'text' field." }, { status: 400 });
  }
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'sessionId' field." }, { status: 400 });
  }

  const [preferences, priorTurns] = await Promise.all([
    getPreferences(),
    loadSession(sessionId),
  ]);

  detectAndStorePreference(text); // fire-and-forget, unchanged from today

  const systemPrompt = buildSystemPrompt(preferences);
  const messages: Anthropic.MessageParam[] = [
    ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: text },
  ];

  const toolsUsed: string[] = [];
  let finalText: string | null = null;

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const result = await askClaudeWithTools({
      systemPrompt,
      messages,
      tools: TOOL_DEFINITIONS,
      maxTokens: 400,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    messages.push({ role: "assistant", content: result.content });

    if (result.stopReason !== "tool_use") {
      const textBlock = result.content.find((b) => b.type === "text");
      finalText = textBlock && textBlock.type === "text" ? textBlock.text : null;
      break;
    }

    const toolUseBlocks = result.content.filter((b) => b.type === "tool_use");
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        toolsUsed.push(block.name);
        const content = await executeTool(block.name, block.input);
        return { type: "tool_result" as const, tool_use_id: block.id, content };
      })
    );

    messages.push({ role: "user", content: toolResults });
  }

  const responseText = finalText ?? "I didn't catch that clearly — mind trying again?";

  await saveSession(sessionId, [
    ...priorTurns,
    { role: "user", content: text },
    { role: "assistant", content: responseText },
  ]);

  return NextResponse.json({ responseText, toolsUsed });
}
```

### 7.2 Cost consideration — read before implementing

A voice turn that needs a tool now costs **at least 2** `askClaudeWithTools` calls against the same `SOFT_DAILY_CALL_CAP` (200/day) that `askClaude` also draws from — versus the old router's cost of at most 1 (`askVoiceFallback`) or 0 (a client-side rule match had zero API cost at all). A day of moderately tool-heavy voice use could plausibly burn through the existing cap materially faster than before. This isn't a blocker, but it's a real behavior change worth deciding on deliberately rather than discovering when the cap starts firing — see Section 12's open questions.

### 7.3 Model choice — not resolved here

`claude-haiku-4-5-20251001` (the existing default) supports tool-calling natively — no forced upgrade. Whether tool-selection accuracy is good enough on Haiku for this specific use (picking the right tool among five, correctly extracting `withinHours`/`title`/`question` arguments from natural speech) versus warranting a stronger model for just this endpoint is worth checking empirically once built (Section 11.2's test table), not assumed either way up front.

---

## 8. Consequences for Existing Files

### 8.1 `lib/voice-intent-router.ts` — deleted

Every branch it implemented is now a tool (Section 5) or folded into the system prompt (decision judgment, Section 7.1). `limitToSentences`/`MAX_VOICE_SENTENCES` (the brevity-rule helper) has no remaining owner once this file is gone — the new system prompt states the brevity rule directly to Claude instead of truncating after the fact, since a tool-calling Claude that's told to be brief and then has its answer chopped mid-sentence by client-side truncation would be worse, not better (the old router's `limitToSentences` was compensating for a fallback prompt that only weakly enforced brevity in early revisions; the rewritten prompt in Section 7.1 enforces it directly with an explicit word cap, matching how `judgment/route.ts`'s prompt already did this correctly).

### 8.2 `app/sandbox/page.tsx` — migrated, not left alone

Unlike the Intent plan (which explicitly excluded Sandbox changes as out of scope), this plan's whole point is Sandbox's calling convention, so it must change:

- Remove `import { routeVoiceInput } from "@/lib/voice-intent-router"`.
- Add a `sessionIdRef = useRef(crypto.randomUUID())`, created once per mount — a full session per page visit, not per utterance. No explicit "new conversation" button in this pass (see Section 9 — deferred, matches the Synthesis plan's precedent of keeping UI changes to the minimum the backend change requires).
- `handleTranscript` calls a new small client helper (e.g. inline in the page, or a tiny `lib/voice-respond-client.ts` if reused elsewhere) that POSTs `{ text, sessionId: sessionIdRef.current }` to `/api/v1/voice/respond` with the existing bearer-token pattern, and reads back `{ responseText, toolsUsed }`.
- Update the `page-meta` copy (currently: *"Cloud Speech-to-Text → rule-based routing (task creation, decision engine, or Claude for anything unrecognized) → spoken response"*) to describe tool-calling instead of rule-based routing.
- Optional, cheap: render `toolsUsed` in the existing debug panel (next to "You said" / "North") as a lightweight substitute for what `voice_intent_log` used to provide — see Section 10.3.

### 8.3 `lib/decision-engine.ts`, `lib/task-store.ts`, `lib/google-calendar-client.ts`, `lib/notion-client.ts`, `lib/gmail-client.ts` — untouched

Every actual integration keeps its existing logic. This plan only changes what invokes them.

### 8.4 `app/api/v1/decisions/route.ts` — kept, not orphaned

Still has other callers (`lib/decision-memory-admin.ts` reads through it indirectly via `evaluateDecision`, and it's a plausible future direct-API surface); `get_decision_recommendation`'s handler calls `evaluateDecision()` directly rather than through this HTTP route, same "don't self-call over HTTP" principle as Calendar/Notion. No change needed here.

### 8.5 `lib/capability-manifest.ts` — recommend retiring, not keeping

Once tool schemas are the source of truth (Section 5.1), `CAPABILITY_MANIFEST`'s enumerated bullet list is a second description of the same five capabilities, with the exact drift risk its own Section 8.4 warned about — except now the drift is against a machine-checked schema instead of a trigger array, which makes an out-of-sync manifest actively confusing rather than just incomplete (Claude would have both a tool it could call *and* a paragraph telling it something slightly different about that same capability). Recommend deleting `lib/capability-manifest.ts` and its import from the rewritten system prompt (Section 7.1) entirely — the tool descriptions plus the "call a tool whenever the request genuinely needs current information" instruction already cover what the manifest existed for. Flagged as a recommendation, not a unilateral decision — see Section 12.

---

## 9. Considered and Deferred

### 9.1 Full `Voice_Session_Manager.md` implementation

That document specifies session *types* with different expiration policies, topic tracking, secondary-topic history, explicit context-switch detection between domains, confirmation-state tracking for pending write actions, pause/resume voice commands ("hold that thought," "resume the planning session"), device handoff, and privacy modes (Standard/Sensitive/Public/No-Memory). This plan implements exactly: a session id, a rolling turn history, one flat idle timeout. Reasons to defer the rest:
- **No write actions exist yet** anywhere in the app (Section 3), so confirmation-state tracking has nothing to track — it's speculative infrastructure for a capability that doesn't exist.
- **Session-type classification** (is this a Quick Command vs. a Planning session?) is a real, separate piece of judgment that would need its own design pass, not a one-line addition to this plan.
- **Pause/resume and device handoff** assume multi-device and background-session concepts this single-page Sandbox prototype doesn't have.

Worth a dedicated follow-up plan once there's a write-capable action (the natural trigger for needing confirmation-state) or once Sandbox becomes more than an experimental single-page prototype.

### 9.2 Type-aware session expiration (vs. this plan's flat 10-minute TTL)

`Voice_Session_Manager.md` gives different defaults per session type (quick command: immediate; planning: 30-60 min inactivity; etc.). Without session-type classification (deferred per 9.1), there's no signal to pick a different TTL per conversation. A flat 10 minutes is a reasonable default for the "quick command" shape most voice interactions here actually are; revisit once/if session typing gets built.

### 9.3 Replacing `voice_intent_log` with a tool-invocation log

The old branch-tracking log answered "is the loose-match keyword logic actually catching real phrasings." That question doesn't exist anymore — there's no keyword logic to validate. A natural-seeming replacement would be a `voice_tool_log` collection recording which tools got called per turn, for the same "is this actually working in practice" visibility. Deferred rather than built here: `toolsUsed` is already returned in the API response (Section 7.1) and can be `console.log`'d server-side for free, matching the exact "cheap `console.log`, not a persistent store" precedent the Intent plan's own Section 11 used for its first couple weeks of monitoring. Build a persistent log only if console output turns out to be insufficient in practice — don't pre-build it.

### 9.4 Parallel tool calls in one turn

Claude's tool-use API can request multiple tools in a single response (e.g., "what's on my calendar and any urgent emails" → both `check_calendar` and `check_email` in one `stop_reason: tool_use` turn). Section 7.1's loop already handles this correctly (`Promise.all` over every `tool_use` block found), so no separate work item — flagging so it's understood as already covered, not accidentally untested.

---

## 10. What Becomes Genuinely Orphaned (for the follow-up cleanup pass)

Once this plan ships and is confirmed stable, the following become dead in ways the original cleanup request predicted correctly — this section exists so that follow-up conversation has a settled reference rather than re-deriving it:

### 10.1 Confirmed dead once this ships

- **`app/api/v1/voice/judgment/route.ts`** — its advisory framing is folded into `/api/v1/voice/respond`'s system prompt (Section 7.1); `askVoiceJudgment()` no longer exists anywhere.
- **`app/api/v1/voice/log-intent/route.ts`** and the **`voice_intent_log`** collection — no branches left to log (Section 9.3).
- **`app/api/v1/calendar/check-upcoming/route.ts`** — `check_calendar`'s handler calls `getUpcomingEvents` directly (Section 5.2).
- **`app/api/v1/notion/check-urgent/route.ts`** — `check_notion`'s handler calls `getUrgentItems` directly (Section 5.2).

### 10.2 New finding, not in the original cleanup list — flag, don't act unilaterally

- **`app/api/v1/gmail/check-urgent/route.ts`** — once its logic is extracted into `lib/gmail-urgency.ts` (Section 5.4) so the tool dispatcher can call it directly, this route has the same "no remaining callers" shape as `check-upcoming`/`check-urgent` above. It wasn't in the original cleanup request, so it shouldn't be swept up automatically — but whoever runs the follow-up cleanup pass should grep for callers of this route specifically and make the same "keep for manual curl testing vs. delete" call the original request already flagged for the other two.

### 10.3 Not dead, but worth a deliberate decision

- **`lib/capability-manifest.ts`** — recommend retiring (Section 8.5), but this is a judgment call, not a mechanical dead-code finding the way 10.1's items are.

---

## 11. Testing Plan

### 11.1 Tool selection accuracy

Run every transcript from the Intent plan's Section 5.5/10.2/10.3 tables (the existing Gmail/Calendar/Notion phrasing test tables) through the new endpoint directly (not via Sandbox — faster iteration). Confirm `toolsUsed` contains the expected tool for each, including the previously-tricky cases:

| Transcript | Expected `toolsUsed` |
|---|---|
| "Just wanted to check if there's anything on my email that I should be looking for" | `["check_email"]` |
| "Remind me to check my email" | `["create_task"]` (not `check_email` — the old router needed an explicit ordering fix, Section 5.6 of the Intent plan, to get this right; tool-calling should get it right without any ordering logic at all, since Claude reasons about intent rather than matching keywords in sequence — this is the single most important regression test in this whole plan) |
| "What's on my calendar and are there any urgent emails" | `["check_calendar", "check_email"]` (both, in one turn — impossible in the old router) |
| "Should I take another class next semester" | `["get_decision_recommendation"]`, and the response should reflect the decision engine's specific stored rule (high confidence, GPA/sleep framing), not a generic answer |
| "Should I take the summer research position" | `["get_decision_recommendation"]` with `specific: false` in the tool result, and the final response should still be a real opinion (not a deflection) — this is the direct test of Section 7.1's judgment-folding |
| "What's the weather like" | `[]` — nothing matches, plain conversational answer, not a false-positive tool call |

### 11.2 Multi-turn continuity (the actual point of `sessionId`)

| Turn | Transcript | Expected behavior |
|---|---|---|
| 1 | "Move my chemistry study block to seven" | (No matching tool yet in this plan's tool set — but the response should correctly retain "chemistry study block" as `it` reference-able. If there's genuinely no calendar-write tool, this is actually still a non-goal per Section 3 — use a decision or task-creation example instead if this exact scenario isn't supported, and flag rather than force a fit.) |
| 1 | "What's on my calendar today" | Lists today's events, including e.g. "Chemistry office hours w/ Dr. Bala at 2pm" |
| 2 | "Is there anything from her in my email" | Should resolve "her" → Dr. Bala from turn 1's context and call `check_email`, not fail or ask "from who?" |

Also test: session expiration — wait past `SESSION_IDLE_TTL_MS` (10 min) between two calls with the same `sessionId`, confirm the second call gets a fresh, empty history rather than stale context from a much-earlier conversation.

### 11.3 Regression check

- Existing Gmail 24h `surfaced` dedup still works after `lib/gmail-urgency.ts`'s extraction (Section 5.4) — ask about email twice in a row, confirm the second ask doesn't re-surface the same already-evaluated messages.
- Task creation via the new admin-SDK path (`lib/task-store-admin.ts`) produces a task visible in `app/tasks/page.tsx` and `app/dashboard/page.tsx`, with the same shape as tasks created via the existing client-SDK path.
- Decision engine's stored-decision memoization (`timesAsked` incrementing) still works when the same decision question is asked twice through the new tool.

---

## 12. Open Questions for Nishad (resolve before/during implementation)

- **Daily call cap (Section 7.2):** `SOFT_DAILY_CALL_CAP = 200` was sized for the old one-call-per-fallback-turn cost. Comfortable leaving it as-is and seeing whether it actually becomes a problem in practice, or raise it preemptively now that tool-heavy turns cost 2+ calls?
- **`lib/capability-manifest.ts` (Section 8.5):** Retire it, or keep it as a lighter-weight persona/tone note even though its capability-listing job is now redundant with the tool schema?
- **Model choice (Section 7.3):** Stay on Haiku and evaluate tool-selection accuracy empirically after building, or deliberately test against a stronger model for this endpoint specifically before committing?
- **Sandbox "new conversation" affordance (Section 8.2):** Fine with session-per-page-visit and a flat 10-minute idle timeout as the only reset mechanisms for this pass, or is an explicit "start over" control worth adding now rather than as a later follow-up?
- **`app/api/v1/gmail/check-urgent/route.ts` (Section 10.2):** Once this plan ships and that route has no remaining callers either, should it be deleted alongside the other three in the follow-up cleanup pass, or deliberately kept (e.g. for manual curl testing, same rationale already raised for `check-upcoming`/`check-urgent`)?

---

## 13. Flat Implementation Checklist

1. [ ] `lib/task-store-admin.ts` — new file, `createTaskAsAdmin` (Section 5.3).
2. [ ] `lib/gmail-urgency.ts` — new file, `checkUrgentEmails` extracted verbatim from `app/api/v1/gmail/check-urgent/route.ts` (Section 5.4). Update the route to call it, confirm no behavior change via a manual curl test before moving on.
3. [ ] `lib/anthropic-client.ts` — add `askClaudeWithTools` alongside the existing `askClaude` (Section 5.5). Existing `askClaude` callers (`lib/gmail-urgency.ts`, `lib/preference-detector.ts`) unchanged.
4. [ ] `lib/tool-dispatcher.ts` — new file, `TOOL_DEFINITIONS` + `executeTool` (Section 5.1–5.2).
5. [ ] `lib/voice-session-store.ts` — new file, `loadSession`/`saveSession` (Section 6.2).
6. [ ] `firestore.rules` — add `voice_sessions` match block (Section 6.3).
7. [ ] `app/api/v1/voice/respond/route.ts` — rewrite with the tool-use loop (Section 7.1). Test directly (curl/Postman) with the Section 11.1 table before touching Sandbox.
8. [ ] `app/sandbox/page.tsx` — migrate off `routeVoiceInput`, add `sessionId`, update copy (Section 8.2).
9. [ ] `lib/voice-intent-router.ts` — delete.
10. [ ] Full regression pass: Section 11.1's tool-selection table (especially the "remind me to check my email" case), Section 11.2's multi-turn continuity table, Section 11.3's regression checklist.
11. [ ] Resolve Section 12's open questions with Nishad — at least the call-cap and capability-manifest ones before this is considered done, not just built.
12. [ ] Update `docs/integrations/calendar-notion-gmail-task.md` and `04-Voice-Interface/` docs that currently describe the rule-based router, so they reflect tool-calling as the actual current-state architecture.
13. [ ] **Do not** delete `judgment`/`log-intent`/`check-upcoming`/`check-urgent` routes as part of this checklist — that's Section 10's follow-up pass, run and confirmed separately once this is stable.
