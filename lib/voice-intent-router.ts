import { auth } from "./firebase";
import { createTask, type CreateTaskInput } from "./task-store";
import { summarizeUpcomingEvents } from "./calendar-summary";
import type { UpcomingEvent } from "./google-calendar-client";

const TASK_TRIGGERS = ["add task", "create task", "new task", "remind me to", "i need to"];

// Common decision-question openers. Used only to decide which engine answers
// a "should I..."-shaped question with no dedicated rule-engine match — not a
// replacement for the rule engine's own class/semester branch, which still
// runs first and wins when it matches (see routeVoiceInput below).
const DECISION_TRIGGERS = [
  "should i",
  "should we",
  "is it better to",
  "would it be better to",
  "do you think i should",
  "what should i do about",
  "which is better",
];

// On-demand only — see docs/integrations/calendar-notion-gmail-task.md
// Section 3. There is no periodic Gmail scan; this is the only trigger path.
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
const EMAIL_QUERY_WORDS = ["check", "anything", "important", "urgent", "looking for", "see", "read", "any new"];

function isLooseEmailQuery(lowerText: string): boolean {
  const hasEmailWord = EMAIL_WORDS.some((w) => lowerText.includes(w));
  const hasQueryWord = EMAIL_QUERY_WORDS.some((w) => lowerText.includes(w));
  return hasEmailWord && hasQueryWord;
}

// On-demand only — see docs/integrations/calendar-notion-gmail-task.md
// Section 6.4: this is a fresh snapshot read every time, deliberately not
// sharing the scheduled scan's alert_state dedup (a live question deserves a
// complete answer every time, not "only what you haven't already been told").
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

// On-demand only, same reasoning as Calendar above.
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

const MAX_VOICE_SENTENCES = 4;

// lib/decision-engine.ts's own literal placeholder for "no specific rule
// matched" (see its default `recommendation` value). Since the rule-based
// classifier here has no dedicated "unrecognized" bucket of its own, this
// exact string is the only signal that the decision engine didn't actually
// have an answer.
const DECISION_ENGINE_GENERIC_FALLBACK = "Use retrieved context and risks to guide decision.";

// Deliberately not importing lib/decision-engine.ts's DecisionResult type —
// that module (and its node:fs-dependent memory-retrieval chain) is
// server-only and must never be imported, even for types, from this
// client-side router. This is the shape its JSON response actually has.
export type DecisionApiResult = {
  recommendation: string;
  reasons: string[];
  risks: string[];
  confidence: "low" | "medium" | "high";
  source: "new_evaluation" | "stored_decision";
  timesAsked?: number;
};

export type VoiceIntentResult =
  | { type: "task"; responseText: string }
  | { type: "decision"; responseText: string; decision: DecisionApiResult }
  | { type: "email"; responseText: string }
  | { type: "calendar"; responseText: string }
  | { type: "notion"; responseText: string }
  | { type: "unrecognized"; responseText: string };

function matchTrigger(triggers: string[], lowerText: string): string | null {
  return triggers.find((trigger) => lowerText.startsWith(trigger)) ?? null;
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Voice_Interaction_Design.md's Brevity Rules: voice responses default to
// 1-4 sentences, longer explanations only on request.
function limitToSentences(text: string, maxSentences: number): string {
  const sentences = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  return sentences.slice(0, maxSentences).join(" ").trim();
}

async function getIdToken(): Promise<string | undefined> {
  return auth.currentUser?.getIdToken();
}

async function authorizedFetch(path: string, body: Record<string, unknown>): Promise<Response> {
  const idToken = await getIdToken();

  return fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

// Fire-and-forget branch-tracking log (see
// North_Vector_Intent_and_Capability_Awareness_Plan.md Section 11) — never
// awaited by the caller and never lets a logging failure surface as an
// unhandled rejection or add latency to the actual voice response.
function logIntent(transcript: string, type: VoiceIntentResult["type"]): void {
  authorizedFetch("/api/v1/voice/log-intent", { transcript, type }).catch((error) => {
    console.warn("[voice-intent-router] Failed to log intent:", error);
  });
}

async function askDecisionEngine(question: string): Promise<DecisionApiResult> {
  const response = await authorizedFetch("/api/v1/decisions", { question });

  if (!response.ok) {
    throw new Error("Decision engine request failed.");
  }

  return response.json();
}

// Server-only (Anthropic SDK, "server-only" guard) — must be reached via
// fetch, never imported directly, same reasoning throughout this file.
async function askVoiceFallback(text: string): Promise<string> {
  const response = await authorizedFetch("/api/v1/voice/respond", { text });

  if (!response.ok) {
    // Safe fallback if the API call fails — never leave the user without a reply.
    return "I didn't catch that clearly — mind trying again?";
  }

  const data = await response.json();
  return typeof data.responseText === "string" ? data.responseText : "I didn't catch that clearly — mind trying again?";
}

async function askVoiceJudgment(question: string): Promise<string> {
  const response = await authorizedFetch("/api/v1/voice/judgment", { question });

  if (!response.ok) {
    return "I don't have a clear take on that one — want to think it through together later?";
  }

  const data = await response.json();
  return typeof data.answer === "string" ? data.answer : "I don't have a clear take on that one — want to think it through together later?";
}

// Server-only (reads the full inbox + calls the Judgment Engine) — must be
// reached via fetch, same reasoning as the other server-side checks here.
async function checkUrgentEmails(): Promise<string> {
  const response = await authorizedFetch("/api/v1/gmail/check-urgent", {});

  if (!response.ok) {
    return "I couldn't check your email just now — try again in a bit.";
  }

  const data = await response.json();
  const urgent = Array.isArray(data.urgent) ? data.urgent : [];

  if (urgent.length === 0) {
    return "Nothing urgent in your inbox right now.";
  }

  const subjects = urgent.map((item: { subject: string }) => `"${item.subject}"`).join(", ");
  return `You have ${urgent.length} urgent email${urgent.length === 1 ? "" : "s"}: ${subjects}.`;
}

// On-demand Calendar check — see
// docs/integrations/calendar-notion-gmail-task.md Section 3 for why this is
// a separate, dedup-free path from functions/src/urgency-scan.ts's
// scheduled scan.
async function askCalendar(withinHours?: number): Promise<string> {
  const response = await authorizedFetch("/api/v1/calendar/check-upcoming", withinHours ? { withinHours } : {});

  if (!response.ok) {
    return "I couldn't check your calendar just now — try again in a bit.";
  }

  const data = await response.json();
  const events = Array.isArray(data.events) ? data.events : [];

  // Reformat using the shared summarizer rather than duplicating formatting
  // logic client-side — see lib/calendar-summary.ts. Requires parsing the
  // ISO strings back to Date objects since JSON doesn't carry Date type.
  const parsed: UpcomingEvent[] = events.map((e: { id: string; title: string; start: string; end: string | null }) => ({
    id: e.id,
    title: e.title,
    start: new Date(e.start),
    end: e.end ? new Date(e.end) : null,
  }));

  return summarizeUpcomingEvents(parsed, data.withinHours ?? withinHours ?? 48);
}

// On-demand Notion check — same dedup-free reasoning as askCalendar.
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

export async function routeVoiceInput(transcript: string): Promise<VoiceIntentResult> {
  const result = await routeVoiceInputInner(transcript);
  logIntent(transcript, result.type);
  return result;
}

async function routeVoiceInputInner(transcript: string): Promise<VoiceIntentResult> {
  const trimmed = transcript.trim();
  const lower = trimmed.toLowerCase();

  // Task first: highly specific, unambiguous phrasings ("remind me to...")
  // should always win, even if a later word in the same sentence (e.g.
  // "remind me to check my email") would otherwise loose-match a different
  // branch. See North_Vector_Intent_and_Capability_Awareness_Plan.md
  // Section 5.6.
  const taskTrigger = matchTrigger(TASK_TRIGGERS, lower);

  if (taskTrigger) {
    const title = capitalize(trimmed.slice(taskTrigger.length).trim()) || trimmed;

    const input: CreateTaskInput = {
      title,
      description: "",
      status: "scheduled",
      priority: "medium",
      energy: "medium",
      domain: "personal",
    };

    await createTask(input);

    // "Light Confirmation" per Voice_Interaction_Design.md — task creation
    // doesn't need reasoning or tradeoffs, just a terse acknowledgment.
    return { type: "task", responseText: `Added: ${title}.` };
  }

  const emailTrigger = matchTrigger(EMAIL_TRIGGERS, lower);

  if (emailTrigger || isLooseEmailQuery(lower)) {
    const responseText = await checkUrgentEmails();
    return { type: "email", responseText };
  }

  const calendarTrigger = matchTrigger(CALENDAR_TRIGGERS, lower);

  if (calendarTrigger || isLooseCalendarQuery(lower)) {
    // Simple window override: "today" narrows to 24h, "this week" widens to
    // 168h, otherwise the endpoint's own 48h default applies. Deliberately
    // not real natural-language time-range parsing — see
    // North_Vector_Intent_and_Capability_Awareness_Plan.md Section 9.3.
    const withinHours = lower.includes("today") ? 24 : lower.includes("this week") ? 24 * 7 : undefined;
    const responseText = await askCalendar(withinHours);
    return { type: "calendar", responseText };
  }

  const notionTrigger = matchTrigger(NOTION_TRIGGERS, lower);

  if (notionTrigger || isLooseNotionQuery(lower)) {
    const responseText = await askNotion();
    return { type: "notion", responseText };
  }

  const decisionTrigger = matchTrigger(DECISION_TRIGGERS, lower);

  if (decisionTrigger) {
    const decision = await askDecisionEngine(trimmed);

    if (decision.recommendation === DECISION_ENGINE_GENERIC_FALLBACK) {
      // The rule engine had no specific answer (e.g. anything outside its one
      // class/semester branch) — give it a real, honest take via the
      // Judgment Engine instead of showing the generic placeholder verbatim.
      const responseText = await askVoiceJudgment(trimmed);
      return { type: "decision", responseText, decision };
    }

    return {
      type: "decision",
      responseText: limitToSentences(decision.recommendation, MAX_VOICE_SENTENCES),
      decision,
    };
  }

  // Not a task and not decision-shaped — genuinely ambiguous input, keep the
  // lighter conversational fallback rather than the stronger advisory prompt.
  const responseText = await askVoiceFallback(trimmed);
  return { type: "unrecognized", responseText };
}
