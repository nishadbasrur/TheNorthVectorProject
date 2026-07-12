import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { createTaskAsAdmin } from "./task-store-admin";
import {
  getUpcomingEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "./google-calendar-client";
import { summarizeUpcomingEvents } from "./calendar-summary";
import { getUrgentItems } from "./notion-client";
import { checkUrgentEmails } from "./gmail-urgency";
import { getRecentInboxMessages, searchEmails, sendEmail, trashEmail } from "./gmail-client";
import { evaluateDecision } from "./decision-engine";
import { assembleSynthesisContext } from "./synthesis-context";
import { runSynthesis } from "./synthesis-engine";
import { deliveryChannel } from "./synthesis-priority";

// Single source of truth for what North can do via voice — read directly by
// Claude as tool schemas, not maintained separately as prose (that
// duplication, and the drift risk it created, is what
// lib/capability-manifest.ts used to paper over). See
// North_Vector_JARVIS_Tool_Calling_Migration_Plan.md Section 5.1.
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
      "Check Gmail. With no query, checks for anything urgent or time-sensitive right now. With a " +
      "query (e.g. \"anything from Dr. Bala\", \"what was my last email\"), looks up recent messages " +
      "to answer that specific lookup question instead of judging urgency. Only covers the ~25 most " +
      "recent inbox messages — use search_email instead for anything further back. Read-only; use " +
      "send_email/delete_email to act on the inbox.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "What to look up in the inbox (sender, subject, topic). Omit for a general urgency check.",
        },
      },
    },
  },
  {
    name: "search_email",
    description:
      "Search the full inbox history using Gmail's own search syntax — not limited to recent " +
      "messages. Use for anything asking about an email that isn't necessarily recent (e.g. \"find " +
      "that email from a few months ago\", \"emails from GradGuard\"). Supports Gmail operators like " +
      "from:, subject:, older_than:3m, newer_than:1y, has:attachment.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Gmail search query syntax." },
      },
      required: ["query"],
    },
  },
  {
    name: "send_email",
    description:
      "Draft and send an email on Nishad's behalf. Executes immediately once you decide it's the " +
      "right action — no confirmation step. Use good judgment on tone and content since this sends " +
      "as Nishad, to a real recipient, with no review before it goes out.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address." },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "delete_email",
    description:
      "Move an email to Trash (recoverable for 30 days, not a permanent erase). Requires the " +
      "specific message id — use check_email or search_email first to find it.",
    input_schema: {
      type: "object",
      properties: { messageId: { type: "string" } },
      required: ["messageId"],
    },
  },
  {
    name: "check_calendar",
    description:
      "Check Google Calendar for upcoming events. Defaults to the next 48 hours; pass a narrower or " +
      "wider window if the request implies one (e.g. \"today\" -> 24, \"this week\" -> 168). " +
      "Read-only; use create_calendar_event/update_calendar_event/delete_calendar_event to act on " +
      "the calendar.",
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
    name: "create_calendar_event",
    description:
      "Create a new calendar event on the primary calendar. Executes immediately, no confirmation. " +
      "Other attendees are NOT notified by Google of this change (silent by design) — tell Nishad " +
      "explicitly if anyone else needs to know.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        start: { type: "string", description: "ISO datetime." },
        end: { type: "string", description: "ISO datetime." },
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "Attendee email addresses, optional.",
        },
      },
      required: ["title", "start", "end"],
    },
  },
  {
    name: "update_calendar_event",
    description:
      "Modify an existing calendar event's time or title. Requires the event id from check_calendar. " +
      "Other attendees are NOT notified by Google of this change (silent by design) — tell Nishad " +
      "explicitly if anyone else needs to know, e.g. a shared tutoring session that just moved.",
    input_schema: {
      type: "object",
      properties: {
        eventId: { type: "string" },
        title: { type: "string" },
        start: { type: "string", description: "ISO datetime." },
        end: { type: "string", description: "ISO datetime." },
      },
      required: ["eventId"],
    },
  },
  {
    name: "delete_calendar_event",
    description:
      "Delete an existing calendar event. Requires the event id from check_calendar. Other attendees " +
      "are NOT notified by Google of this cancellation (silent by design) — tell Nishad explicitly if " +
      "anyone else needs to know.",
    input_schema: {
      type: "object",
      properties: { eventId: { type: "string" } },
      required: ["eventId"],
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
  {
    name: "get_proactive_updates",
    description:
      "Check for anything worth knowing that's been surfaced by cross-source reasoning — " +
      "connections between calendar, email, tasks, goals, and Notion that aren't answerable by " +
      "checking a single source alone. Call this for open-ended asks like 'what should I know', " +
      "'anything I should know about', 'catch me up', or 'what's going on' — not for specific " +
      "single-source questions, which have their own tools.",
    input_schema: { type: "object", properties: {} },
  },
];

// Every handler catches its own errors and returns a describable failure
// string rather than throwing — Claude needs *something* to read back to the
// user ("I couldn't check your calendar just now"), same UX contract
// lib/voice-intent-router.ts's per-branch functions used to provide. Losing
// that behavior in the migration would be a regression, not a simplification.

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

// Bypasses the urgency-triage pipeline entirely (no Claude judgment call, no
// gmail_surfaced dedup — that machinery only makes sense for "is this worth
// interrupting someone for," not a lookup question). Hands back the raw
// recent inbox so Claude itself can answer the actual question from real
// sender/subject/date/snippet data. Only covers the most recent messages —
// same limit checkUrgentEmails has always had, not real Gmail search.
async function lookupEmails(query: string): Promise<string> {
  const messages = await getRecentInboxMessages(25);

  if (messages.length === 0) {
    return "Inbox is empty or unreachable — nothing to look up.";
  }

  const formatted = messages
    .map((m) => `From: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\nSnippet: ${m.bodyText.slice(0, 300)}`)
    .join("\n\n---\n\n");

  return `Recent inbox messages (most recent first), for answering "${query}":\n\n${formatted}`;
}

async function handleCheckEmail(input: { query?: string }): Promise<string> {
  try {
    if (input.query && input.query.trim().length > 0) {
      return await lookupEmails(input.query.trim());
    }
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

async function handleSearchEmail(input: { query: string }): Promise<string> {
  try {
    const messages = await searchEmails(input.query);

    if (messages.length === 0) {
      return `No messages found for "${input.query}".`;
    }

    const formatted = messages
      .map((m) => `From: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\nSnippet: ${m.bodyText.slice(0, 300)}`)
      .join("\n\n---\n\n");

    return `Search results for "${input.query}":\n\n${formatted}`;
  } catch (error) {
    console.error("[tool-dispatcher] search_email failed:", error);
    return "Email search failed — tell Nishad to try again in a bit.";
  }
}

async function handleSendEmail(input: { to: string; subject: string; body: string }): Promise<string> {
  try {
    await sendEmail(input.to, input.subject, input.body);
    return `Sent email to ${input.to}: "${input.subject}".`;
  } catch (error) {
    console.error("[tool-dispatcher] send_email failed:", error);
    return "Sending the email failed — tell Nishad to try again.";
  }
}

async function handleDeleteEmail(input: { messageId: string }): Promise<string> {
  try {
    await trashEmail(input.messageId);
    return "Moved that email to Trash — recoverable for 30 days.";
  } catch (error) {
    console.error("[tool-dispatcher] delete_email failed:", error);
    return "Deleting the email failed — tell Nishad to try again.";
  }
}

async function handleCreateCalendarEvent(input: {
  title: string;
  start: string;
  end: string;
  attendees?: string[];
}): Promise<string> {
  try {
    const event = await createCalendarEvent(input);
    return `Created "${event.title}" on the calendar (${input.start} to ${input.end}).`;
  } catch (error) {
    console.error("[tool-dispatcher] create_calendar_event failed:", error);
    return "Creating the calendar event failed — tell Nishad to try again.";
  }
}

async function handleUpdateCalendarEvent(input: {
  eventId: string;
  title?: string;
  start?: string;
  end?: string;
}): Promise<string> {
  try {
    const event = await updateCalendarEvent(input);
    return `Updated "${event.title}" on the calendar.`;
  } catch (error) {
    console.error("[tool-dispatcher] update_calendar_event failed:", error);
    return "Updating the calendar event failed — tell Nishad to try again.";
  }
}

async function handleDeleteCalendarEvent(input: { eventId: string }): Promise<string> {
  try {
    await deleteCalendarEvent(input.eventId);
    return "Deleted that calendar event.";
  } catch (error) {
    console.error("[tool-dispatcher] delete_calendar_event failed:", error);
    return "Deleting the calendar event failed — tell Nishad to try again.";
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
// itself in the same turn, rather than parroting the placeholder back
// verbatim — this replaces the old askVoiceJudgment second-HTTP-call flow.
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

// Reuses the same pipeline as app/api/v1/synthesis/check-now/route.ts and
// functions/src/synthesis-scan.ts directly rather than an internal HTTP
// call — same "don't self-call over HTTP" precedent already established
// for Calendar/Notion. Caps to the top 2-3 connections by urgency for a
// spoken answer; the persona's existing 60-word/1-4-sentence brevity rule
// (baked into the system prompt directly) governs the final spoken output,
// not a separate truncation step here.
const URGENCY_RANK: Record<string, number> = { now: 0, today: 1, this_week: 2, fyi: 3 };

async function handleGetProactiveUpdates(): Promise<string> {
  try {
    const context = await assembleSynthesisContext();
    const connections = await runSynthesis(context);
    const worthMentioning = connections
      .filter((c) => deliveryChannel(c) !== "suppress")
      .sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency])
      .slice(0, 3);

    if (worthMentioning.length === 0) {
      return "Nothing worth flagging right now — nothing unusual connecting across your calendar, email, tasks, goals, or Notion.";
    }

    const formatted = worthMentioning.map((c) => `${c.connection} ${c.whyItMatters}`).join(" ");
    return formatted;
  } catch (error) {
    console.error("[tool-dispatcher] get_proactive_updates failed:", error);
    return "Proactive check failed — tell Nishad to try again in a bit.";
  }
}

export async function executeTool(name: string, input: unknown): Promise<string> {
  switch (name) {
    case "create_task":
      return handleCreateTask(input as { title: string });
    case "check_email":
      return handleCheckEmail(input as { query?: string });
    case "search_email":
      return handleSearchEmail(input as { query: string });
    case "send_email":
      return handleSendEmail(input as { to: string; subject: string; body: string });
    case "delete_email":
      return handleDeleteEmail(input as { messageId: string });
    case "check_calendar":
      return handleCheckCalendar(input as { withinHours?: number });
    case "create_calendar_event":
      return handleCreateCalendarEvent(
        input as { title: string; start: string; end: string; attendees?: string[] }
      );
    case "update_calendar_event":
      return handleUpdateCalendarEvent(
        input as { eventId: string; title?: string; start?: string; end?: string }
      );
    case "delete_calendar_event":
      return handleDeleteCalendarEvent(input as { eventId: string });
    case "check_notion":
      return handleCheckNotion();
    case "get_decision_recommendation":
      return handleGetDecisionRecommendation(input as { question: string });
    case "get_proactive_updates":
      return handleGetProactiveUpdates();
    default:
      return `Unknown tool: ${name}`;
  }
}
