// EVENT_TIME_ZONE is a real (non-type) import now, not just the UpcomingEvent
// type — this file's only caller today is lib/tool-dispatcher.ts, which
// already carries its own top-level "server-only" guard, so pulling in
// google-calendar-client.ts's module (and its @googleapis/calendar
// dependency) here is fine. (The old client-side caller this used to guard
// against, lib/voice-intent-router.ts, was deleted — see
// app/api/v1/voice/respond/route.ts's own comment on replacing it.)
import { EVENT_TIME_ZONE, type UpcomingEvent } from "./google-calendar-client";

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
    // Without an explicit timeZone, toLocaleTimeString falls back to
    // whatever timezone the process is running in — the server's, which on
    // App Hosting is UTC, not Nishad's actual Eastern. That silently
    // reported every spoken time up to 4-5 hours off (depending on DST)
    // from what's really on the calendar. EVENT_TIME_ZONE is the same
    // constant the write path (create/update_calendar_event) already
    // anchors to — one source of truth for "Nishad's own timezone."
    const time = e.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: EVENT_TIME_ZONE });
    return `${e.title} at ${time}`;
  });

  const remainder = events.length - top.length;
  const suffix = remainder > 0 ? `, plus ${remainder} more` : "";

  return `You have ${events.length} thing${events.length === 1 ? "" : "s"} coming up: ${formatted.join(", ")}${suffix}.`;
}
