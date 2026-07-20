import { calendar, auth as googleAuth, type calendar_v3 } from "@googleapis/calendar";

// Shared with Cloud Functions (see functions/src/urgency-scan.ts) — deliberately
// no "server-only" guard, mirroring lib/risk-engine.ts's precedent for modules
// that must be importable from both the Next.js app and the esbuild-bundled
// Cloud Functions runtime.

let cachedClient: calendar_v3.Calendar | null = null;

// calendar.events — widened from calendar.readonly to support
// createCalendarEvent/updateCalendarEvent/deleteCalendarEvent. See
// North_Vector_Full_Read_Write_Calendar_Gmail_Access_Plan.md.
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

// Deliberately hardcoded "none" everywhere below, not a caller-supplied
// param — per the explicit decision that North's autonomous calendar writes
// must never generate a Google notification email to other attendees as a
// side effect. Nishad still sees/hears the change through North itself;
// external attendees (e.g. a tutor sharing a session event) simply don't
// get an automatic email unless he tells them himself.
const SEND_UPDATES = "none" as const;

// Claude generates start/end as bare wall-clock ISO strings (e.g.
// "2025-07-25T19:00:00", no offset) — the Google Calendar API rejects a
// dateTime with neither a UTC offset nor an explicit timeZone ("Missing time
// zone definition for start time", the actual root cause of the repeated
// create_calendar_event failures logged 2026-07-16). Single-user app,
// Nishad's own calendar is always Eastern, so this is hardcoded rather than
// inferred per-request.
const EVENT_TIME_ZONE = "America/New_York";

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

export type BackToBackPair = {
  first: UpcomingEvent;
  second: UpcomingEvent;
  gapMinutes: number;
};

// #4 — flags consecutive events with no real transition time between them.
// Pure time-gap math over already-fetched events, deliberately not "travel
// time": that needs a genuinely new Directions/Distance-Matrix API
// integration (no such integration exists anywhere in this repo), a
// separate, larger feature. `gapMinutes` can be negative for events that
// actually overlap — both zero-gap and overlapping pairs are worth flagging
// the same way.
export function eventsBackToBack(events: UpcomingEvent[], minGapMinutes = 15): BackToBackPair[] {
  const timed = events
    .filter((event) => event.end !== null)
    .slice()
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const pairs: BackToBackPair[] = [];
  for (let i = 0; i < timed.length - 1; i++) {
    const first = timed[i];
    const second = timed[i + 1];
    const gapMinutes = Math.round((second.start.getTime() - (first.end as Date).getTime()) / 60000);
    if (gapMinutes <= minGapMinutes) {
      pairs.push({ first, second, gapMinutes });
    }
  }

  return pairs;
}

// #86's weekly retrospective needs a past week's events — getUpcomingEvents
// above is future-only (timeMin is always "now"), so this takes an explicit
// range instead.
export async function getEventsInRange(start: Date, end: Date): Promise<UpcomingEvent[]> {
  const client = getCalendarClient();

  const response = await client.events.list({
    calendarId: "primary",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const items = response.data.items ?? [];

  return items
    .filter((event): event is calendar_v3.Schema$Event & { id: string } => Boolean(event.id))
    .map((event) => mapEvent(event, start))
    .filter((event) => !Number.isNaN(event.start.getTime()));
}

function mapEvent(event: calendar_v3.Schema$Event, fallbackNow: Date): UpcomingEvent {
  const startRaw = event.start?.dateTime ?? event.start?.date;
  const endRaw = event.end?.dateTime ?? event.end?.date;

  return {
    id: event.id ?? "",
    title: event.summary ?? "(untitled event)",
    start: startRaw ? new Date(startRaw) : fallbackNow,
    end: endRaw ? new Date(endRaw) : null,
  };
}

export type CreateEventInput = {
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  attendees?: string[]; // email addresses, optional
};

// Creates a new event on the primary calendar. No confirmation step — see
// the standing autonomy decision in
// North_Vector_Full_Read_Write_Calendar_Gmail_Access_Plan.md Section 4.
export async function createCalendarEvent(input: CreateEventInput): Promise<UpcomingEvent> {
  const client = getCalendarClient();

  const response = await client.events.insert({
    calendarId: "primary",
    sendUpdates: SEND_UPDATES,
    requestBody: {
      summary: input.title,
      start: { dateTime: input.start, timeZone: EVENT_TIME_ZONE },
      end: { dateTime: input.end, timeZone: EVENT_TIME_ZONE },
      attendees: input.attendees?.map((email) => ({ email })),
    },
  });

  return mapEvent(response.data, new Date());
}

export type UpdateEventInput = {
  eventId: string;
  title?: string;
  start?: string; // ISO datetime
  end?: string; // ISO datetime
};

// Patches only the fields provided — an omitted title/start/end is left
// untouched on the existing event, not cleared.
export async function updateCalendarEvent(input: UpdateEventInput): Promise<UpcomingEvent> {
  const client = getCalendarClient();

  const requestBody: calendar_v3.Schema$Event = {};
  if (input.title !== undefined) requestBody.summary = input.title;
  if (input.start !== undefined) requestBody.start = { dateTime: input.start, timeZone: EVENT_TIME_ZONE };
  if (input.end !== undefined) requestBody.end = { dateTime: input.end, timeZone: EVENT_TIME_ZONE };

  const response = await client.events.patch({
    calendarId: "primary",
    eventId: input.eventId,
    sendUpdates: SEND_UPDATES,
    requestBody,
  });

  return mapEvent(response.data, new Date());
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const client = getCalendarClient();
  await client.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: SEND_UPDATES,
  });
}

// Real-time push notifications — see functions/src/calendar-webhook.ts.
// Registers a new webhook channel; Google POSTs to `webhookUrl` on every
// primary-calendar change until the channel expires (Google doesn't
// publish a fixed expiration for Calendar channels the way Gmail's watch
// does, so the caller renews defensively on a fixed schedule rather than
// computing a precise remaining-time margin). `channelToken` is echoed
// back on every webhook call as the X-Goog-Channel-Token header — Google
// doesn't sign these requests, so this token (generated by the caller, a
// random secret) is the actual authentication boundary, not the channel
// ID alone.
export async function registerCalendarWatch(
  webhookUrl: string,
  channelId: string,
  channelToken: string
): Promise<{ resourceId: string; expiration: string }> {
  const client = getCalendarClient();

  const response = await client.events.watch({
    calendarId: "primary",
    requestBody: {
      id: channelId,
      type: "web_hook",
      address: webhookUrl,
      token: channelToken,
    },
  });

  return {
    resourceId: response.data.resourceId ?? "",
    expiration: response.data.expiration ?? "",
  };
}

// Best-effort cleanup of a channel being replaced by a fresh one — not
// calling this wouldn't break anything (old channels just expire on their
// own), it just avoids leaving stale-but-technically-still-valid channels
// registered with Google indefinitely.
export async function stopCalendarWatch(channelId: string, resourceId: string): Promise<void> {
  const client = getCalendarClient();
  await client.channels.stop({
    requestBody: { id: channelId, resourceId },
  });
}

export type CalendarDelta = {
  events: UpcomingEvent[];
  nextSyncToken: string;
  // true if the stored syncToken had expired/gone invalid (Google's
  // documented 410 Gone signal) and this required a full resync instead of
  // an incremental one — the caller got a complete event list back, not
  // just what changed, and should treat this as a fresh baseline.
  resyncRequired: boolean;
};

// Fetches just what changed since `syncToken` (or, with no token, a full
// snapshot that also yields a fresh token to start incremental syncing
// from). A webhook push carries no change details itself — this is the
// required follow-up call, same "notification is just a signal" shape as
// Gmail's history.list.
export async function listCalendarEventsDelta(syncToken: string | null): Promise<CalendarDelta> {
  const client = getCalendarClient();

  try {
    const response = await client.events.list({
      calendarId: "primary",
      syncToken: syncToken ?? undefined,
      singleEvents: true,
    });

    const items = response.data.items ?? [];
    const now = new Date();

    return {
      events: items
        .filter((event): event is calendar_v3.Schema$Event & { id: string } => Boolean(event.id))
        .map((event) => mapEvent(event, now)),
      nextSyncToken: response.data.nextSyncToken ?? "",
      resyncRequired: false,
    };
  } catch (error) {
    const status =
      (error as { code?: number }).code ?? (error as { response?: { status?: number } }).response?.status;

    if (status !== 410) throw error;

    // Expired/invalid syncToken — Google's documented signal to drop it and
    // do a full resync to get a new one, not a real error condition.
    const response = await client.events.list({ calendarId: "primary", singleEvents: true });
    const items = response.data.items ?? [];
    const now = new Date();

    return {
      events: items
        .filter((event): event is calendar_v3.Schema$Event & { id: string } => Boolean(event.id))
        .map((event) => mapEvent(event, now)),
      nextSyncToken: response.data.nextSyncToken ?? "",
      resyncRequired: true,
    };
  }
}
