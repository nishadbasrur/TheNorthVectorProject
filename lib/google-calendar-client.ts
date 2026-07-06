import { calendar, auth as googleAuth, type calendar_v3 } from "@googleapis/calendar";

// Shared with Cloud Functions (see functions/src/urgency-scan.ts) — deliberately
// no "server-only" guard, mirroring lib/risk-engine.ts's precedent for modules
// that must be importable from both the Next.js app and the esbuild-bundled
// Cloud Functions runtime.

let cachedClient: calendar_v3.Calendar | null = null;

// calendar.readonly only — this integration must never create, modify, or
// delete calendar events. If a future feature needs write access, that's a
// separate, explicitly-approved task.
function getCalendarClient(): calendar_v3.Calendar {
  if (cachedClient) {
    return cachedClient;
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REFRESH_TOKEN must all be set."
    );
  }

  const oauth2Client = new googleAuth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  cachedClient = calendar({ version: "v3", auth: oauth2Client });
  return cachedClient;
}

export type UpcomingEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date | null;
};

// Fetches events on the primary calendar starting within the next
// `withinHours` hours (default 48h, per the task's Phase 1 window).
export async function getUpcomingEvents(withinHours = 48): Promise<UpcomingEvent[]> {
  const client = getCalendarClient();
  const now = new Date();
  const timeMax = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

  const response = await client.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const items = response.data.items ?? [];

  return items
    .filter((event): event is calendar_v3.Schema$Event & { id: string } => Boolean(event.id))
    .map((event) => {
      const startRaw = event.start?.dateTime ?? event.start?.date;
      const endRaw = event.end?.dateTime ?? event.end?.date;

      return {
        id: event.id,
        title: event.summary ?? "(untitled event)",
        start: startRaw ? new Date(startRaw) : now,
        end: endRaw ? new Date(endRaw) : null,
      };
    })
    .filter((event) => !Number.isNaN(event.start.getTime()));
}

// Events starting within `withinMinutes` from now (and not already started) —
// the actual alert-trigger condition used by the urgency scan, distinct from
// getUpcomingEvents' broader fetch window.
export function eventsStartingSoon(events: UpcomingEvent[], withinMinutes = 15): UpcomingEvent[] {
  const now = Date.now();
  const cutoff = now + withinMinutes * 60 * 1000;

  return events.filter((event) => {
    const startMs = event.start.getTime();
    return startMs >= now && startMs <= cutoff;
  });
}
