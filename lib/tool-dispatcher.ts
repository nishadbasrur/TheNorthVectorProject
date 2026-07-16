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
import { geocodeLocation, getBuildingFootprint } from "./map-client";
import { loadVisualState, saveVisualState, type VisualState } from "./voice-session-store";
import { logCapabilityGap } from "./capability-gap-store";
import { getRecentIcloudMessages, searchIcloudEmails } from "./icloud-mail-client";
import { logToolError } from "./tool-error-log";

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
    name: "note_capability_gap",
    description:
      "Log a request that's genuinely outside your current tools — instead of just declining, this " +
      "flags it for Nishad to review and build later. Call this whenever a request needs a real " +
      "action or capability you don't have a tool for (not a question answerable from general " +
      "knowledge or reasoning alone). Still tell Nishad plainly in your spoken reply that you can't " +
      "do it yet and that you've flagged it — this doesn't grant the capability immediately.",
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
    name: "split_bill_with_tip",
    description:
      "Calculate a tip and split a bill evenly among a number of people. Use for requests like " +
      "\"split $84 three ways with 20% tip\" or \"what's a 18 percent tip on $50 split two ways\". " +
      "Pure arithmetic — no external data needed.",
    input_schema: {
      type: "object",
      properties: {
        billAmount: { type: "number", description: "Pre-tip bill total in dollars, e.g. 84." },
        tipPercent: { type: "number", description: "Tip percentage, e.g. 20 for 20%." },
        numPeople: { type: "number", description: "Number of people splitting the bill, e.g. 3." },
      },
      required: ["billAmount", "tipPercent", "numPeople"],
    },
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

async function handleCheckCalendar(input: { withinHours?: number }): Promise<string> {
  try {
    const withinHours = input.withinHours ?? 48;
    const events = await getUpcomingEvents(withinHours);
    return summarizeUpcomingEvents(events, withinHours);
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
    reportToolError("get_proactive_updates", error, null);
    return "Proactive check failed — tell Nishad to try again in a bit.";
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

async function handleNoteCapabilityGap(input: { request: string; capability: string }): Promise<string> {
  try {
    await logCapabilityGap(input.request, input.capability);
    return "Flagged for Nishad to review and build later.";
  } catch (error) {
    reportToolError("note_capability_gap", error, input);
    return "Couldn't flag that just now — tell Nishad directly.";
  }
}

async function handleSplitBillWithTip(input: {
  billAmount: number;
  tipPercent: number;
  numPeople: number;
}): Promise<string> {
  try {
    const { billAmount, tipPercent, numPeople } = input;

    if (!Number.isFinite(billAmount) || billAmount <= 0) {
      return "That bill amount doesn't look valid — tell me the pre-tip total in dollars.";
    }
    if (!Number.isFinite(tipPercent) || tipPercent < 0) {
      return "That tip percentage doesn't look valid — give me a percentage like 20 for 20%.";
    }
    if (!Number.isFinite(numPeople) || numPeople <= 0 || !Number.isInteger(numPeople)) {
      return "That number of people doesn't look valid — give me a whole number of people to split among.";
    }

    const tipAmount = billAmount * (tipPercent / 100);
    const total = billAmount + tipAmount;
    const perPerson = total / numPeople;

    const fmt = (n: number) => n.toFixed(2);

    return (
      `Bill: ${fmt(billAmount)}, tip ${tipPercent}%: ${fmt(tipAmount)}, ` +
      `total: ${fmt(total)}. Split ${numPeople} ways: ${fmt(perPerson)} per person.`
    );
  } catch (error) {
    reportToolError("split_bill_with_tip", error, input);
    return "Couldn't calculate that split — tell Nishad to try again.";
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

// Returns { text, visual } uniformly — text is what goes back to Claude as
// the tool_result content, visual is only ever set by show_map and is what
// app/api/v1/voice/respond/route.ts lifts into the API response for the
// frontend to actually render. sessionId is unused by every handler except
// show_map (it's the only one with "current visual" state to read/write),
// but threading it through executeTool uniformly is simpler than a
// show_map-only special case at the call site.
export async function executeTool(
  name: string,
  input: unknown,
  sessionId: string
): Promise<{ text: string; visual?: VisualState }> {
  switch (name) {
    case "create_task":
      return { text: await handleCreateTask(input as { title: string }) };
    case "check_email":
      return { text: await handleCheckEmail(input as { query?: string }) };
    case "search_email":
      return { text: await handleSearchEmail(input as { query: string }) };
    case "send_email":
      return { text: await handleSendEmail(input as { to: string; subject: string; body: string }) };
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
      return { text: await handleGetProactiveUpdates() };
    case "show_map":
      return handleShowMap(input as { location?: string; zoomDelta?: number; zoomLevel?: number }, sessionId);
    case "highlight_building":
      return handleHighlightBuilding(sessionId);
    case "note_capability_gap":
      return { text: await handleNoteCapabilityGap(input as { request: string; capability: string }) };
    case "split_bill_with_tip":
      return {
        text: await handleSplitBillWithTip(
          input as { billAmount: number; tipPercent: number; numPeople: number }
        ),
      };
    case "check_icloud_email":
      return { text: await handleCheckIcloudEmail(input as { query?: string }) };
    case "search_icloud_email":
      return { text: await handleSearchIcloudEmail(input as { query: string }) };
    default:
      return { text: `Unknown tool: ${name}` };
  }
}
