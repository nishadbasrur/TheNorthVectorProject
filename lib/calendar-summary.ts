// Type-only import — erased at compile time, so this stays safe to import
// from client-side code (lib/voice-intent-router.ts) even though
// google-calendar-client.ts itself is a server-side module.
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
