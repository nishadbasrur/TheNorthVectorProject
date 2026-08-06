import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { createTaskAsAdmin } from "./task-store-admin";
import {
  getUpcomingEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  eventsBackToBack,
  type UpcomingEvent,
} from "./google-calendar-client";
import { summarizeUpcomingEvents } from "./calendar-summary";
import { getUrgentItems } from "./notion-client";
import { checkUrgentEmails } from "./gmail-urgency";
import { getRecentInboxMessages, searchEmails, sendEmail, trashEmail, saveDraft } from "./gmail-client";
import { evaluateDecision } from "./decision-engine";
import { assembleSynthesisContext } from "./synthesis-context";
import { runSynthesis } from "./synthesis-engine";
import { deliveryChannel } from "./synthesis-priority";
import { runStateOfEverythingBriefing } from "./briefing-engine";
import { geocodeLocation, getBuildingFootprint } from "./map-client";
import { loadVisualState, saveVisualState, savePendingEngagementCheck, type VisualState } from "./voice-session-store";
import { logCapabilityGap, getRecentCapabilityGaps, logDraftEmailGap } from "./capability-gap-store";
import { getRecentIcloudMessages, searchIcloudEmails } from "./icloud-mail-client";
import { logToolError, getRecentToolErrors } from "./tool-error-log";
import { logTechnicalError } from "./error-log-store";
import { askClaudeWithWebSearch } from "./anthropic-client";
import { getRecentTextMessages, searchTextMessages } from "./text-message-store";
import { requiresConfirmation } from "./tool-tiers";
import { detectWolframQuery, detectHologramSubject, type HologramSignal } from "./visual-scanner";
import { fetchWolframImage } from "./wolfram-client";

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
    name: "draft_email",
    description:
      "Save an email as a Gmail draft and offer it for review — never sends. Use instead of " +
      "send_email when YOU notice mid-conversation that Nishad's mentioned meaning to reply to " +
      "someone (not when he directly asks you to send something — that's still send_email). He " +
      "reviews and approves/denies it later in the app; the draft only actually sends if he approves.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address." },
        subject: { type: "string" },
        body: { type: "string" },
        reasoning: {
          type: "string",
          description: "One short sentence on why you drafted this now — shown to Nishad in the review.",
        },
      },
      required: ["to", "subject", "body", "reasoning"],
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
        start: {
          type: "string",
          description:
            "Local wall-clock datetime in Nishad's own timezone (America/New_York), formatted " +
            "\"YYYY-MM-DDTHH:MM:SS\" with NO UTC offset and NO trailing Z (e.g. \"2026-08-05T21:00:00\" " +
            "means literally 9:00 PM Eastern — do not convert to UTC first).",
        },
        end: {
          type: "string",
          description:
            "Local wall-clock datetime in Nishad's own timezone (America/New_York), formatted " +
            "\"YYYY-MM-DDTHH:MM:SS\" with NO UTC offset and NO trailing Z (e.g. \"2026-08-05T22:00:00\" " +
            "means literally 10:00 PM Eastern — do not convert to UTC first).",
        },
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
        start: {
          type: "string",
          description:
            "Local wall-clock datetime in Nishad's own timezone (America/New_York), formatted " +
            "\"YYYY-MM-DDTHH:MM:SS\" with NO UTC offset and NO trailing Z (e.g. \"2026-08-05T21:00:00\" " +
            "means literally 9:00 PM Eastern — do not convert to UTC first).",
        },
        end: {
          type: "string",
          description:
            "Local wall-clock datetime in Nishad's own timezone (America/New_York), formatted " +
            "\"YYYY-MM-DDTHH:MM:SS\" with NO UTC offset and NO trailing Z (e.g. \"2026-08-05T22:00:00\" " +
            "means literally 10:00 PM Eastern — do not convert to UTC first).",
        },
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
  {
    name: "get_full_briefing",
    description:
      "Give a full, genuinely synthesized 'state of everything' briefing — calendar, email, Notion, " +
      "texts, tasks, goals, all combined into one coherent spoken picture, not just the noteworthy " +
      "connections get_proactive_updates surfaces. Use for explicit asks for the complete picture " +
      "('give me the full rundown', 'what's my whole situation right now', 'brief me on everything') " +
      "— not for a quick check-in, which should use get_proactive_updates instead. This is allowed to " +
      "run longer than the usual brevity rule since it was explicitly requested.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "show_map",
    description:
      "Show an interactive map on screen, or adjust the map that's already showing. Use for any " +
      "request to see/view a place (\"show me a map of Boston\") — the map displays visually, don't " +
      "also try to describe the location in words. Also use this for follow-up adjustments to a map " +
      "already on screen (\"zoom in\", \"zoom in on the west side\", \"zoom out\", \"pan to downtown\") " +
      "by omitting location and setting zoomDelta/zoomLevel, or by giving a new location to recenter " +
      "on. If nothing is currently showing and no location is given, this fails — ask what place to " +
      "show first.",
    input_schema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description:
            "Place name to show or recenter on, e.g. \"Boston\", \"the west side of Chicago\". Omit " +
            "for a pure zoom/pan adjustment to the currently displayed map.",
        },
        zoomDelta: {
          type: "number",
          description: "Relative zoom change from the current view, e.g. 2 to zoom in, -1 to zoom out.",
        },
        zoomLevel: {
          type: "number",
          description: "Absolute zoom level 2-18 (higher = closer), if a specific zoom is implied.",
        },
      },
    },
  },
  {
    name: "highlight_building",
    description:
      "Outline/highlight the building or structure at the center of the map that's currently showing " +
      "— use for \"illuminate/highlight/outline the building\", \"show me its structure\", \"trace the " +
      "outline\", etc. Requires a map already on screen (call show_map first if nothing is showing). " +
      "Not every location has a distinct building footprint in the map data (parks, open areas, " +
      "natural landmarks) — if none is found, say so rather than pretending it worked.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "push_to_screen",
    description:
      "Push rich visual content to the user's screen during a response. Use this when your response " +
      "includes anything worth seeing rather than just hearing — comparisons, structured data, " +
      "schematics, step-by-step breakdowns, reference material, visualizations, code, tables, or " +
      "anything the user might want to read or refer back to while listening. Call this alongside " +
      "your voice response, not instead of it. Always pass descriptive text describing what to " +
      "show — never a raw image URL or file path, even for the \"image\" type. For example, pass " +
      "\"Caffeine molecule (C8H10N4O2) - molecular structure and properties\", not an image URL. " +
      "The system finds and renders the appropriate visual from that description itself.",
    input_schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description:
            "Descriptive text of what to display — never a raw image URL or file path. The system " +
            "resolves the actual visual (including fetching a real image where appropriate) from " +
            "this description.",
        },
        type: {
          type: "string",
          enum: ["markdown", "json", "html", "image"],
          description:
            "How to render the content — markdown (text, tables, lists, headers), json (formatted " +
            "readable structure), html (sanitized, rendered inline), or image. \"image\" still means " +
            "descriptive text in `content` (e.g. a subject to look up), not a URL — the system " +
            "resolves it to an actual image itself. Defaults to markdown if omitted.",
        },
        title: { type: "string", description: "Optional title shown at the top of the display panel." },
      },
      required: ["content"],
    },
  },
  {
    name: "note_capability_gap",
    description:
      "Log a request that's genuinely outside your current tools — instead of just declining, this " +
      "flags it for Nishad to review and build later. This is specifically for something that needs " +
      "a real new integration (a new account, API, or credential you don't have access to yet, e.g. " +
      "\"check my Spotify\" or \"order me an Uber\") — NOT for anything the research tool could " +
      "already answer (any live-lookup or informational question — weather, prices, facts, " +
      "conversions, and so on all go through research, not a new tool per topic) and not for " +
      "anything answerable from general knowledge, reasoning, or arithmetic alone. Still tell " +
      "Nishad plainly in your spoken reply that you can't do it yet and that you've flagged it — " +
      "this doesn't grant the capability immediately.",
    input_schema: {
      type: "object",
      properties: {
        request: { type: "string", description: "What was asked, verbatim or lightly cleaned up." },
        capability: {
          type: "string",
          description: "Short description of the missing capability, e.g. \"highlight a building's interior layout on the map\".",
        },
      },
      required: ["request", "capability"],
    },
  },
  {
    name: "check_bug_status",
    description:
      "Check the status of bugs North has detected and fixes currently being drafted or awaiting " +
      "review, plus any missing capabilities flagged for later — the same pipeline behind the " +
      "/tool-errors and /capability-review pages. Read-only status check, not a fix trigger — bugs " +
      "get detected and drafted automatically on their own. Use when asked about bugs, issues, fixes " +
      "in progress, or what's in the resolution pipeline.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "check_icloud_email",
    description:
      "Check Nishad's iCloud Mail inbox (separate account from Gmail — use this specifically when " +
      "asked about iCloud/Apple Mail, or when a request doesn't specify which inbox and Gmail alone " +
      "didn't answer it). With no query, returns the most recent messages. With a query, looks up " +
      "recent messages to answer that specific question. Only covers the ~25 most recent messages — " +
      "use search_icloud_email for anything further back. Read-only.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to look up (sender, subject, topic). Omit for the most recent messages.",
        },
      },
    },
  },
  {
    name: "search_icloud_email",
    description:
      "Search Nishad's iCloud Mail inbox history for something not in the most recent messages. Less " +
      "expressive than Gmail search (no from:/subject: operators) — plain keyword/phrase matching " +
      "against headers and body.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords or phrase to search for." },
      },
      required: ["query"],
    },
  },
  {
    name: "check_messages",
    description:
      "Check Nishad's recent text messages (iMessage/SMS, synced from his Mac). With no query, " +
      "returns the most recent messages. With a query, looks up recent messages to answer that " +
      "specific question. Only covers the ~25 most recent messages — use search_messages for " +
      "anything further back. Read-only; there is no tool to send a text yet.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to look up (sender, topic). Omit for the most recent messages.",
        },
      },
    },
  },
  {
    name: "search_messages",
    description:
      "Search Nishad's text message history for something not in the most recent messages — plain " +
      "keyword/phrase matching against the message text and sender.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords or phrase to search for." },
      },
      required: ["query"],
    },
  },
  {
    name: "log_technical_error",
    description:
      "Log a backend error, bug, or technical issue to a secure internal review area for later " +
      "diagnosis and repair. Use when Nishad reports something technically broken (an error, a " +
      "crash, a failure, unexpected behavior) that engineering should look at — not for a general " +
      "missing feature (use note_capability_gap) and not for a personal to-do (use create_task).",
    input_schema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Short plain-sentence summary of the error or issue, e.g. \"calendar sync throwing 500s on update\".",
        },
        details: {
          type: "string",
          description: "Any extra context — error message, when it happened, what was being done, steps to reproduce. Omit if none given.",
        },
        source: {
          type: "string",
          description: "Where the error occurred, e.g. \"calendar sync\", \"voice respond API\", \"email tool\". Omit if unclear.",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "research",
    description:
      "Look up anything needing current or external information, using live web search — weather, " +
      "currency conversion, prices, general facts, news, scholarships, or any other open-ended " +
      "question. This is the general-purpose fallback for factual/informational requests: prefer " +
      "calling this over declining or calling note_capability_gap whenever a live search could " +
      "actually answer it — don't ask for or assume a dedicated tool exists for a specific topic. " +
      "Don't use this for anything involving Nishad's own accounts/data (email, calendar, tasks, " +
      "Notion — those have their own tools) or for pure arithmetic/reasoning you can already do " +
      "directly without external information.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to look up or research, in plain language." },
      },
      required: ["query"],
    },
  },
  {
    name: "run_agent_task",
    description:
      "Spin up an autonomous coding agent (Claude Agent SDK) to carry out a real software task — " +
      "write code, fix a bug, open a PR — against a real git repo. This is a MUCH bigger action than " +
      "any other tool you have: it can read, write, and run arbitrary commands against a real " +
      "working tree and push real commits. Because of that, it requires the user's explicit, spoken " +
      "confirmation before it actually runs. The FIRST time you'd call this for a given request, call " +
      "it with confirmed left unset (or false) — this only describes the plan back and does not " +
      "start anything. Read that description to the user, and only call this again with " +
      "confirmed: true after they clearly say yes out loud in their next reply. Never set " +
      "confirmed: true on the first call.",
    input_schema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The task for the agent to carry out, in clear, complete natural language.",
        },
        targetRepo: {
          type: "string",
          description: "The GitHub repo to run against, as \"owner/repo\". Omit if no repo applies.",
        },
        confirmed: {
          type: "boolean",
          description:
            "Only true once the user has explicitly confirmed out loud, in a reply after hearing the plan. Defaults to false.",
        },
      },
      required: ["task"],
    },
  },
];

// Every handler catches its own errors and returns a describable failure
// string rather than throwing — Claude needs *something* to read back to the
// user ("I couldn't check your calendar just now"), same UX contract
// lib/voice-intent-router.ts's per-branch functions used to provide. Losing
// that behavior in the migration would be a regression, not a simplification.

// Fire-and-forget: a Firestore write failing here must never block the
// friendly fallback string a handler already returns to Claude. Every catch
// block below calls this instead of a bare console.error, so real error
// detail lands somewhere reviewable (see lib/tool-error-log.ts and the
// /tool-errors page) instead of only in Cloud Logging, which nobody without
// gcloud IAM access can actually read.
function reportToolError(toolName: string, error: unknown, input: unknown): void {
  console.error(`[tool-dispatcher] ${toolName} failed:`, error);
  void logToolError(toolName, error, input).catch(() => {});
}

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
    reportToolError("create_task", error, input);
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
    reportToolError("check_email", error, input);
    return "Email check failed — tell Nishad to try again in a bit.";
  }
}

// #4 — reactive half of back-to-back detection (the proactive half is
// functions/src/urgency-scan.ts's scheduled push). Only worth mentioning
// within the window actually being asked about, not the scan's fixed 48h.
function backToBackNote(events: UpcomingEvent[]): string {
  const pairs = eventsBackToBack(events, 15);
  if (pairs.length === 0) return "";

  const descriptions = pairs.map((pair) =>
    pair.gapMinutes <= 0
      ? `${pair.first.title} and ${pair.second.title} overlap`
      : `${pair.first.title} and ${pair.second.title} are only ${pair.gapMinutes} minute(s) apart`
  );

  return ` Heads up: ${descriptions.join("; ")}.`;
}

async function handleCheckCalendar(input: { withinHours?: number }): Promise<string> {
  try {
    const withinHours = input.withinHours ?? 48;
    const events = await getUpcomingEvents(withinHours);
    return summarizeUpcomingEvents(events, withinHours) + backToBackNote(events);
  } catch (error) {
    reportToolError("check_calendar", error, input);
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
    reportToolError("search_email", error, input);
    return "Email search failed — tell Nishad to try again in a bit.";
  }
}

async function handleSendEmail(input: { to: string; subject: string; body: string }): Promise<string> {
  try {
    await sendEmail(input.to, input.subject, input.body);
    return `Sent email to ${input.to}: "${input.subject}".`;
  } catch (error) {
    reportToolError("send_email", error, input);
    return "Sending the email failed — tell Nishad to try again.";
  }
}

async function handleDraftEmail(input: { to: string; subject: string; body: string; reasoning: string }): Promise<string> {
  try {
    const draftId = await saveDraft(input.to, input.subject, input.body);
    await logDraftEmailGap({
      to: input.to,
      subject: input.subject,
      body: input.body,
      reasoning: input.reasoning,
      draftId,
    });
    return `Drafted (not sent) an email to ${input.to}: "${input.subject}". Waiting on Nishad to review and approve it.`;
  } catch (error) {
    reportToolError("draft_email", error, input);
    return "Drafting that email failed — tell Nishad to try again.";
  }
}

async function handleDeleteEmail(input: { messageId: string }): Promise<string> {
  try {
    await trashEmail(input.messageId);
    return "Moved that email to Trash — recoverable for 30 days.";
  } catch (error) {
    reportToolError("delete_email", error, input);
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
    reportToolError("create_calendar_event", error, input);
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
    reportToolError("update_calendar_event", error, input);
    return "Updating the calendar event failed — tell Nishad to try again.";
  }
}

async function handleDeleteCalendarEvent(input: { eventId: string }): Promise<string> {
  try {
    await deleteCalendarEvent(input.eventId);
    return "Deleted that calendar event.";
  } catch (error) {
    reportToolError("delete_calendar_event", error, input);
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
    reportToolError("check_notion", error, null);
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
    reportToolError("get_decision_recommendation", error, input);
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

async function handleGetProactiveUpdates(sessionId: string): Promise<string> {
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

    // #75 — the top connection just surfaced here is exactly as engagement-
    // trackable as an opener's; same pending-check mechanism, just set from
    // a tool call mid-turn instead of the opener's post-response after().
    void savePendingEngagementCheck(sessionId, [worthMentioning[0]]).catch(() => {});

    const formatted = worthMentioning.map((c) => `${c.connection} ${c.whyItMatters}`).join(" ");
    return formatted;
  } catch (error) {
    reportToolError("get_proactive_updates", error, null);
    return "Proactive check failed — tell Nishad to try again in a bit.";
  }
}

async function handleGetFullBriefing(): Promise<string> {
  try {
    const context = await assembleSynthesisContext();
    return await runStateOfEverythingBriefing(context);
  } catch (error) {
    reportToolError("get_full_briefing", error, null);
    return "Couldn't put the full briefing together — tell Nishad to try again in a bit.";
  }
}

const MAP_DEFAULT_ZOOM = 12;
const MAP_MIN_ZOOM = 2;
const MAP_MAX_ZOOM = 18;

// Reads/writes "current visual" state (lib/voice-session-store.ts) so a
// bare "zoom in" — no location given — can act on whatever's already
// showing, not just handle a fresh "show me X" request. The frontend reads
// the returned visual field directly off the API response (see
// app/api/v1/voice/respond/route.ts) to actually render the map; the
// stringified copy below is only what Claude itself sees to narrate the
// response.
async function handleShowMap(
  input: { location?: string; zoomDelta?: number; zoomLevel?: number },
  sessionId: string
): Promise<{ text: string; visual?: VisualState }> {
  try {
    const current = await loadVisualState(sessionId);

    let lat: number;
    let lon: number;
    let location: string;

    if (input.location && input.location.trim().length > 0) {
      const geocoded = await geocodeLocation(input.location.trim());
      if (!geocoded) {
        return { text: `Couldn't find a location called "${input.location}" — ask for a more specific place name.` };
      }
      lat = geocoded.lat;
      lon = geocoded.lon;
      location = geocoded.displayName;
    } else if (current) {
      lat = current.lat;
      lon = current.lon;
      location = current.location;
    } else {
      return { text: "No map is currently showing and no location was given — ask which place to show." };
    }

    const sameLocation = current?.location === location;

    let zoom = sameLocation ? current.zoom : MAP_DEFAULT_ZOOM;
    if (typeof input.zoomLevel === "number") zoom = input.zoomLevel;
    else if (typeof input.zoomDelta === "number") zoom = (current?.zoom ?? MAP_DEFAULT_ZOOM) + input.zoomDelta;
    zoom = Math.max(MAP_MIN_ZOOM, Math.min(MAP_MAX_ZOOM, zoom));

    // A pure zoom/pan adjustment (no new location) keeps whatever building
    // highlight_building already outlined; recentering to a genuinely new
    // place drops it — a highlight from the last location doesn't apply
    // once the map's moved on.
    const visual: VisualState = {
      type: "map",
      location,
      lat,
      lon,
      zoom,
      ...(sameLocation && current?.highlightFootprint ? { highlightFootprint: current.highlightFootprint } : {}),
    };
    await saveVisualState(sessionId, visual);

    return { text: `Showing ${location} on the map.`, visual };
  } catch (error) {
    reportToolError("show_map", error, input);
    return { text: "Showing the map failed — tell Nishad to try again." };
  }
}

async function handleHighlightBuilding(sessionId: string): Promise<{ text: string; visual?: VisualState }> {
  try {
    const current = await loadVisualState(sessionId);
    if (!current) {
      return { text: "No map is currently showing — show a map first, then ask to highlight the building." };
    }

    const footprint = await getBuildingFootprint(current.lat, current.lon);
    if (!footprint) {
      return { text: `No distinct building outline found for ${current.location} in the map data.` };
    }

    const visual: VisualState = { ...current, highlightFootprint: footprint.points };
    await saveVisualState(sessionId, visual);

    return { text: `Outlined the building at ${current.location}.`, visual };
  } catch (error) {
    reportToolError("highlight_building", error, null);
    return { text: "Highlighting the building failed — tell Nishad to try again." };
  }
}

const DISPLAY_TYPES = ["markdown", "json", "html", "image"] as const;
type DisplayContentType = (typeof DISPLAY_TYPES)[number];

// General-purpose visual canvas push_to_screen writes to — app/sandbox/
// display-panel.tsx has its own structurally-identical copy of this type
// (deliberately decoupled, not imported — that file is a client component
// and shouldn't import from this "server-only" one even for a type-only
// import, same reasoning as hud-map.tsx's MapVisual vs VisualState above).
// No Firestore persistence like VisualState has: nothing needs to read
// "what's currently displayed" back for a follow-up tool call, so there's
// nothing to load/save — the SSE "display" event (see
// app/api/v1/voice/respond/route.ts) is the only place this travels
// through.
export type DisplayContent = {
  type: DisplayContentType;
  content: string;
  title?: string;
};

function isDisplayContentType(value: unknown): value is DisplayContentType {
  return (DISPLAY_TYPES as readonly string[]).includes(value as string);
}

async function handlePushToScreen(input: {
  content?: string;
  type?: string;
  title?: string;
}): Promise<{ text: string; display?: DisplayContent; hologram?: HologramSignal }> {
  try {
    if (!input.content || input.content.trim().length === 0) {
      return { text: "No content given to display — nothing was pushed to the screen." };
    }

    const type: DisplayContentType = isDisplayContentType(input.type) ? input.type : "markdown";

    console.log(`[push_to_screen] Content received (${input.content.length} chars): ${input.content.slice(0, 200)}`);

    // Tier 2 upgrade, checked before Wolfram — a physical/visual subject
    // (molecule, product, building, card) is strictly better served by the
    // Three.js hologram takeover than by a flat Wolfram image or a markdown
    // panel, so this must win the race for any content that matches both
    // detectHologramSubject and detectWolframQuery (e.g. "molecule" also
    // satisfies the chemical-formula/atomic-weight Wolfram signals below).
    // Wolfram is left in place only for genuinely numeric/data content
    // (equations, unit conversions, nutrition, stats) that has no physical
    // form to render.
    const hologramSignal = detectHologramSubject(input.content);
    console.log(`[push_to_screen] detectHologramSubject: ${hologramSignal ? `hit (${hologramSignal.objectType})` : "miss"}`);
    if (hologramSignal) {
      return { text: "Pushed to the screen.", hologram: hologramSignal };
    }

    // Wolfram upgrade — checked at the one real call site where
    // push_to_screen's content is actually known, rather than scanning the
    // whole response after the fact (the previous approach, in
    // app/api/v1/voice/respond/route.ts, ran after the stream's "done"
    // event — always too late, since push_to_screen's own "display" event
    // fires the instant its tool call resolves, well before "done"). A
    // math/science/data push_to_screen call (equations, unit
    // conversions, nutrition, stats, chemical formulas — see
    // detectWolframQuery) gets a real Wolfram Alpha image instead of a
    // markdown panel, since that's a strictly better answer for this
    // content. Falls straight back to the original content on any
    // Wolfram miss (no interpretation, network failure, missing key) — a
    // false-positive match or a Wolfram outage should never make
    // push_to_screen fail outright.
    const wolframQuery = detectWolframQuery(input.content);
    console.log(`[push_to_screen] detectWolframQuery: ${wolframQuery ? "hit" : "miss"}`);
    if (wolframQuery) {
      console.log(`[push_to_screen] Wolfram query: ${wolframQuery}`);
      const imageDataUrl = await fetchWolframImage(wolframQuery);
      if (imageDataUrl) {
        // fetchWolframImage never throws (see lib/wolfram-client.ts) — a
        // failed lookup comes back as null, not a caught error, so there's
        // no error object to log here on the miss path below. The actual
        // reason (no interpretation, non-OK status, network failure) is
        // already logged inside fetchWolframImage itself at the moment it
        // happens.
        console.log(`[push_to_screen] fetchWolframImage succeeded — data URL length ${imageDataUrl.length}`);
        return {
          text: "Pushed to the screen.",
          display: { type: "image", content: imageDataUrl, title: "Wolfram Alpha" },
        };
      }
      console.log(
        "[push_to_screen] fetchWolframImage returned null — falling back to original content. See [wolfram-client] logs above for the reason."
      );
    }

    const display: DisplayContent = {
      type,
      content: input.content,
      ...(input.title ? { title: input.title } : {}),
    };

    return { text: "Pushed to the screen.", display };
  } catch (error) {
    reportToolError("push_to_screen", error, input);
    return { text: "Pushing that to the screen failed." };
  }
}

async function handleNoteCapabilityGap(input: { request: string; capability: string }): Promise<string> {
  try {
    await logCapabilityGap(input.request, input.capability);
    return "Flagged for Nishad to review and build later.";
  } catch (error) {
    reportToolError("note_capability_gap", error, input);
    return "Couldn't flag that just now — tell Nishad directly.";
  }
}

const GAP_STATUS_LABEL: Record<string, string> = {
  pending_gap: "detected, drafting a fix",
  pending_review: "fix drafted, awaiting Nishad's approval",
  approved: "fixed and merged",
  denied: "declined, not fixed",
};

async function handleCheckBugStatus(): Promise<string> {
  try {
    const [gaps, errors] = await Promise.all([getRecentCapabilityGaps(20), getRecentToolErrors(10)]);

    if (gaps.length === 0 && errors.length === 0) {
      return "Nothing in the pipeline right now — no bugs or flagged capabilities logged.";
    }

    const bugFixes = gaps.filter((g) => g.kind === "bug_fix");
    const capabilities = gaps.filter((g) => g.kind === "capability");

    const parts: string[] = [];

    if (bugFixes.length > 0) {
      const lines = bugFixes.map(
        (g) => `${g.toolName ?? g.request} (${GAP_STATUS_LABEL[g.status] ?? g.status})`
      );
      parts.push(`Bug fixes in the pipeline: ${lines.join("; ")}.`);
    } else {
      parts.push("No bug fixes currently in the pipeline.");
    }

    if (capabilities.length > 0) {
      const lines = capabilities.map(
        (g) => `${g.capability} (${GAP_STATUS_LABEL[g.status] ?? g.status})`
      );
      parts.push(`Flagged missing capabilities: ${lines.join("; ")}.`);
    }

    if (errors.length > 0) {
      parts.push(
        `${errors.length} recent tool failure${errors.length === 1 ? "" : "s"} logged in total — full detail at /tool-errors.`
      );
    }

    return parts.join(" ");
  } catch (error) {
    reportToolError("check_bug_status", error, null);
    return "Couldn't check the bug pipeline status just now — tell Nishad to try again in a bit.";
  }
}

// Mirrors lookupEmails' formatting exactly (same "recent inbox, most
// recent first" shape) so Claude answers iCloud lookups the same way it
// already answers Gmail ones — deliberately not deduplicated across the
// two inboxes yet; see North_Vector_Multi_Provider_Email_Plan.md for why
// that's a separate, later step.
async function lookupIcloudEmails(query: string): Promise<string> {
  const messages = await getRecentIcloudMessages(25);

  if (messages.length === 0) {
    return "iCloud inbox is empty or unreachable — nothing to look up.";
  }

  const formatted = messages
    .map((m) => `From: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\nSnippet: ${m.bodyText.slice(0, 300)}`)
    .join("\n\n---\n\n");

  return `Recent iCloud messages (most recent first), for answering "${query}":\n\n${formatted}`;
}

async function handleCheckIcloudEmail(input: { query?: string }): Promise<string> {
  try {
    const query = input.query?.trim() || "your most recent iCloud messages";
    return await lookupIcloudEmails(query);
  } catch (error) {
    reportToolError("check_icloud_email", error, input);
    return "iCloud email check failed — tell Nishad to try again in a bit.";
  }
}

async function handleSearchIcloudEmail(input: { query: string }): Promise<string> {
  try {
    const messages = await searchIcloudEmails(input.query);

    if (messages.length === 0) {
      return `No iCloud messages found for "${input.query}".`;
    }

    const formatted = messages
      .map((m) => `From: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\nSnippet: ${m.bodyText.slice(0, 300)}`)
      .join("\n\n---\n\n");

    return `iCloud search results for "${input.query}":\n\n${formatted}`;
  } catch (error) {
    reportToolError("search_icloud_email", error, input);
    return "iCloud email search failed — tell Nishad to try again in a bit.";
  }
}

// Text messages come from a genuinely different pipe than every other
// source here — no cloud API reaches iMessage/SMS, so these are forwarded
// by a local agent running on a Mac Mini with Full Disk Access to its own
// Messages database (see scripts/mac-messages-agent/ and
// app/api/v1/messages/mac-ingest/route.ts). Read-only from North's side —
// there's no send_message tool, matching the same "foundation, not full
// capability yet" scoping already used elsewhere in this project.
async function handleCheckMessages(input: { query?: string }): Promise<string> {
  try {
    const messages = await getRecentTextMessages(25);

    if (messages.length === 0) {
      return "No text messages synced yet — nothing to check.";
    }

    const formatted = messages
      .map((m) => `From: ${m.senderName ?? m.sender}\nDate: ${m.sentAt}\n${m.text.slice(0, 300)}`)
      .join("\n\n---\n\n");

    const query = input.query?.trim() || "your most recent messages";
    return `Recent text messages (most recent first), for answering "${query}":\n\n${formatted}`;
  } catch (error) {
    reportToolError("check_messages", error, input);
    return "Checking text messages failed — tell Nishad to try again in a bit.";
  }
}

async function handleSearchMessages(input: { query: string }): Promise<string> {
  try {
    const messages = await searchTextMessages(input.query);

    if (messages.length === 0) {
      return `No text messages found for "${input.query}".`;
    }

    const formatted = messages
      .map((m) => `From: ${m.senderName ?? m.sender}\nDate: ${m.sentAt}\n${m.text.slice(0, 300)}`)
      .join("\n\n---\n\n");

    return `Text message search results for "${input.query}":\n\n${formatted}`;
  } catch (error) {
    reportToolError("search_messages", error, input);
    return "Text message search failed — tell Nishad to try again in a bit.";
  }
}

async function handleLogTechnicalError(input: {
  description: string;
  details?: string;
  source?: string;
}): Promise<string> {
  try {
    await logTechnicalError({
      summary: input.description,
      details: input.details,
      source: input.source,
    });
    return "Logged that technical error to the review area for diagnosis and fixing.";
  } catch (error) {
    reportToolError("log_technical_error", error, input);
    return "Couldn't log that error just now — tell Nishad directly so it doesn't get lost.";
  }
}

// Deliberately the shared Haiku default (no model override) and a tight
// search cap — this runs inside a live voice turn with Nishad waiting on
// the other end, unlike the bi-daily opportunity scan
// (functions/src/opportunity-scan.ts), which uses Sonnet and up to 5
// searches because nothing's blocking on it. A first version of this tool
// used Sonnet + 5 searches here too and measured ~15s for a single
// exchange-rate question — most of that was the server-side agentic loop
// running multiple sequential search rounds before responding, not the
// model choice alone. One search answers the overwhelming majority of the
// short factual questions this tool is actually for.
const RESEARCH_SYSTEM_PROMPT =
  "You are answering a live question for Nishad, a pre-med undergraduate at UConn, using web search " +
  "where it actually helps — weather, currency conversion, prices, current events, scholarships, or " +
  "any other question needing up-to-date or external information. Search when the answer could be " +
  "stale or wrong without it; answer directly from general knowledge when it's a stable fact search " +
  "wouldn't change. One search is enough for almost any question like this — only search again if " +
  "the first result genuinely doesn't answer it. Give a direct, concise, spoken-style answer — this " +
  "gets read aloud, not displayed as a document.";

// Deliberately no structured storage here — this is an ephemeral live-
// lookup tool, same shape as check_calendar or check_notion, not a
// tracked-opportunity system. Findings worth persisting and monitoring
// over time (scholarships, research positions, and the rest of
// 03-Chief-Engine/Opportunity_Engine.md's categories) go through the
// separate bi-daily opportunity scan (functions/src/opportunity-scan.ts),
// which is a distinct concern from "answer this one question right now."
async function handleResearch(input: { query: string }): Promise<string> {
  try {
    const result = await askClaudeWithWebSearch({
      systemPrompt: RESEARCH_SYSTEM_PROMPT,
      userMessage: input.query,
      maxTokens: 800,
      maxSearches: 2,
    });

    if (!result.ok) {
      return "Couldn't research that just now — tell Nishad to try again in a bit.";
    }

    return result.text;
  } catch (error) {
    reportToolError("research", error, input);
    return "Couldn't research that just now — tell Nishad to try again in a bit.";
  }
}

// Cloud Run's standard service-to-service auth: ask the GCP metadata server
// (only reachable from inside a GCP compute environment — App Hosting runs
// on Cloud Run under the hood) for a Google-signed identity token scoped to
// the target service's URL as its audience. agent-runner-service is
// deployed without --allow-unauthenticated, so it only accepts requests
// bearing a token from a principal (here, App Hosting's own runtime
// service account) that's been granted roles/run.invoker on it.
async function fetchGoogleIdToken(audience: string): Promise<string> {
  const response = await fetch(
    `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(audience)}`,
    { headers: { "Metadata-Flavor": "Google" } }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch Google ID token: ${response.status}`);
  }
  return response.text();
}

// Blocks for the whole run (agent-runner-service/src/server.ts streams SSE
// over a single request/response) rather than firing-and-forgetting — there
// is no live-activity surface for a "check back later" reply to point to
// yet (that's a separate, not-yet-built piece), so the honest contract for
// now is: this tool call doesn't return until the agent run is actually
// done, however long that takes.
async function handleRunAgentTask(input: { task: string; targetRepo?: string; confirmed?: boolean }): Promise<string> {
  if (!requiresConfirmation("run_agent_task") || input.confirmed !== true) {
    const target = input.targetRepo ? ` against ${input.targetRepo}` : "";
    return (
      `Here's the plan before I start: run an autonomous coding agent${target} to do the following — ` +
      `"${input.task}". This will read, write, and run commands against a real working tree and can ` +
      `open a real PR. Say the word to confirm and I'll actually start it.`
    );
  }

  const serviceUrl = process.env.AGENT_RUNNER_SERVICE_URL;
  const sharedSecret = process.env.AGENT_RUNNER_SHARED_SECRET;
  if (!serviceUrl || !sharedSecret) {
    reportToolError("run_agent_task", new Error("AGENT_RUNNER_SERVICE_URL/AGENT_RUNNER_SHARED_SECRET not set."), input);
    return "The agent runner isn't configured yet — tell Nishad to finish setting it up.";
  }

  try {
    const idToken = await fetchGoogleIdToken(serviceUrl);

    const response = await fetch(`${serviceUrl}/run-agent-task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Layer 1: Cloud Run's own IAM (roles/run.invoker), checked by the
        // platform before this request ever reaches agent-runner-service's
        // own code — the service is deployed without --allow-unauthenticated.
        Authorization: `Bearer ${idToken}`,
        // Layer 2: app-level shared secret, in its own header so it doesn't
        // collide with the platform's own use of Authorization above.
        "X-Agent-Runner-Secret": sharedSecret,
      },
      body: JSON.stringify({ task: input.task, targetRepo: input.targetRepo }),
    });

    if (!response.ok || !response.body) {
      reportToolError("run_agent_task", new Error(`agent-runner-service returned ${response.status}`), input);
      return "Couldn't reach the agent runner just now — tell Nishad to check on it.";
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let runId: string | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const eventLine = frame.split("\n").find((line) => line.startsWith("event: "));
        const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
        if (!eventLine || !dataLine) continue;

        const event = eventLine.slice("event: ".length);
        const data = JSON.parse(dataLine.slice("data: ".length));

        if (event === "run") {
          runId = data.runId;
        } else if (event === "done") {
          return data.status === "completed"
            ? `Agent run ${runId} finished: ${data.result ?? "done, no summary returned."}`
            : `Agent run ${runId} failed: ${data.error ?? "unknown error"}.`;
        } else if (event === "error") {
          reportToolError("run_agent_task", new Error(data.error), input);
          return `The agent run hit an error: ${data.error}`;
        }
      }
    }

    return `Agent run ${runId ?? "unknown"} ended without a final result — tell Nishad to check the logs.`;
  } catch (error) {
    reportToolError("run_agent_task", error, input);
    return "Couldn't run that agent task just now — tell Nishad to try again.";
  }
}

// Returns { text, visual, display, hologram } uniformly — text is what goes
// back to Claude as the tool_result content, visual is only ever set by
// show_map/highlight_building, and display/hologram are only ever set by
// push_to_screen (mutually exclusive — see handlePushToScreen); all are
// lifted by app/api/v1/voice/respond/route.ts into what the frontend
// actually renders (visual via the final "done" event, display/hologram via
// their own SSE event fired the moment the tool call resolves — see that
// route for why these use different delivery timing than visual). sessionId
// is unused by every handler except show_map/highlight_building (the only
// ones with "current visual" state to read/write), but threading it
// through executeTool uniformly is simpler than a special case per caller.
export async function executeTool(
  name: string,
  input: unknown,
  sessionId: string
): Promise<{ text: string; visual?: VisualState; display?: DisplayContent; hologram?: HologramSignal }> {
  switch (name) {
    case "create_task":
      return { text: await handleCreateTask(input as { title: string }) };
    case "check_email":
      return { text: await handleCheckEmail(input as { query?: string }) };
    case "search_email":
      return { text: await handleSearchEmail(input as { query: string }) };
    case "send_email":
      return { text: await handleSendEmail(input as { to: string; subject: string; body: string }) };
    case "draft_email":
      return {
        text: await handleDraftEmail(input as { to: string; subject: string; body: string; reasoning: string }),
      };
    case "delete_email":
      return { text: await handleDeleteEmail(input as { messageId: string }) };
    case "check_calendar":
      return { text: await handleCheckCalendar(input as { withinHours?: number }) };
    case "create_calendar_event":
      return {
        text: await handleCreateCalendarEvent(
          input as { title: string; start: string; end: string; attendees?: string[] }
        ),
      };
    case "update_calendar_event":
      return {
        text: await handleUpdateCalendarEvent(
          input as { eventId: string; title?: string; start?: string; end?: string }
        ),
      };
    case "delete_calendar_event":
      return { text: await handleDeleteCalendarEvent(input as { eventId: string }) };
    case "check_notion":
      return { text: await handleCheckNotion() };
    case "get_decision_recommendation":
      return { text: await handleGetDecisionRecommendation(input as { question: string }) };
    case "get_proactive_updates":
      return { text: await handleGetProactiveUpdates(sessionId) };
    case "get_full_briefing":
      return { text: await handleGetFullBriefing() };
    case "show_map":
      return handleShowMap(input as { location?: string; zoomDelta?: number; zoomLevel?: number }, sessionId);
    case "highlight_building":
      return handleHighlightBuilding(sessionId);
    case "push_to_screen":
      return handlePushToScreen(input as { content?: string; type?: string; title?: string });
    case "note_capability_gap":
      return { text: await handleNoteCapabilityGap(input as { request: string; capability: string }) };
    case "check_bug_status":
      return { text: await handleCheckBugStatus() };
    case "check_icloud_email":
      return { text: await handleCheckIcloudEmail(input as { query?: string }) };
    case "search_icloud_email":
      return { text: await handleSearchIcloudEmail(input as { query: string }) };
    case "check_messages":
      return { text: await handleCheckMessages(input as { query?: string }) };
    case "search_messages":
      return { text: await handleSearchMessages(input as { query: string }) };
    case "log_technical_error":
      return {
        text: await handleLogTechnicalError(
          input as { description: string; details?: string; source?: string }
        ),
      };
    case "research":
      return { text: await handleResearch(input as { query: string }) };
    case "run_agent_task":
      return {
        text: await handleRunAgentTask(input as { task: string; targetRepo?: string; confirmed?: boolean }),
      };
    default:
      return { text: `Unknown tool: ${name}` };
  }
}
