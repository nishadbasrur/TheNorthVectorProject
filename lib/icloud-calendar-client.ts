import { DAVClient, type DAVCalendar } from "tsdav";
import ICAL from "ical.js";
import type { UpcomingEvent } from "./google-calendar-client";

// Shared with Cloud Functions (see functions/src/class-end-scan.ts and
// friends, via lib/merged-calendar-client.ts) — deliberately no
// "server-only" guard, same reasoning as lib/google-calendar-client.ts.
//
// iCloud Calendar has no OAuth/modern API — CalDAV with an app-specific
// password is the only third-party access Apple offers (generated at
// appleid.apple.com → Sign-In and Security → App-Specific Passwords, a
// manual step only Nishad can do — same category as lib/icloud-mail-client.ts's
// IMAP credential and the Google OAuth consent walkthroughs earlier in this
// project). Uses a DEDICATED app-specific password
// (ICLOUD_CALENDAR_APP_PASSWORD), not the one already provisioned for
// iCloud Mail — Apple's app-specific passwords aren't protocol-scoped, so
// the mail one would technically work too, but a dedicated one can be
// revoked independently later without touching Mail access.
const CALDAV_SERVER_URL = "https://caldav.icloud.com";

// Read-only by design, per the fix note's explicit scope — no
// createCalendarObject/updateCalendarObject/deleteCalendarObject exposed
// here. Writing to iCloud Calendar is out of scope; Google stays the only
// writable calendar (see google-calendar-client.ts's
// create/update/deleteCalendarEvent).

let cachedClient: DAVClient | null = null;
let cachedCalendars: DAVCalendar[] | null = null;

// Logs in once and caches both the authenticated client and the account's
// full calendar list (all calendars, not just one named "UConn Work" —
// confirmed preference) for the lifetime of this warm instance. CalDAV
// discovery (principal URL, then calendar-home-set, then the calendar
// list itself) is multiple round trips — worth caching the same way
// google-calendar-client.ts caches its OAuth2 client, so only the actual
// per-call event query (fetchCalendarObjects) hits the network on repeat
// calls, not the whole discovery chain every time.
async function getIcloudCalendars(): Promise<{ client: DAVClient; calendars: DAVCalendar[] } | null> {
  if (cachedClient && cachedCalendars) {
    return { client: cachedClient, calendars: cachedCalendars };
  }

  const username = process.env.ICLOUD_EMAIL_ADDRESS;
  const password = process.env.ICLOUD_CALENDAR_APP_PASSWORD;

  if (!username || !password) {
    console.warn("[icloud-calendar-client] ICLOUD_EMAIL_ADDRESS and ICLOUD_CALENDAR_APP_PASSWORD must both be set — skipping iCloud events.");
    return null;
  }

  try {
    const client = new DAVClient({
      serverUrl: CALDAV_SERVER_URL,
      credentials: { username, password },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });
    await client.login();
    const calendars = await client.fetchCalendars();

    // Explicit success log — the failure paths were already logged, but a
    // clean run produced zero output at all, which is indistinguishable
    // from "this code never ran." Logging the calendar names/count here
    // is what makes login+discovery actually verifiable from production
    // logs instead of inferred from silence.
    console.log(
      `[icloud-calendar-client] Logged in as "${username}" — discovered ${calendars.length} calendar(s): ${calendars.map((c) => c.displayName).join(", ")}`
    );

    cachedClient = client;
    cachedCalendars = calendars;
    return { client, calendars };
  } catch (error) {
    console.error("[icloud-calendar-client] Login or calendar discovery failed:", error);
    return null;
  }
}

// Parses one VEVENT's worth of raw iCalendar text (a DAVCalendarObject's
// `data` field) into zero or more UpcomingEvents — zero because a single
// .ics blob can in principle contain more than one VEVENT (e.g. a
// recurring-event override series), though the common case is exactly
// one. `icloud:` id prefix guarantees no collision with Google's own id
// space in every dedup/alert-state key that assumes id uniqueness
// (functions/src/urgency-scan.ts's alreadyAlerted + composite
// back-to-back keys, functions/src/class-end-scan.ts's per-event dedup).
function parseIcsEvents(ics: string | undefined, fallbackNow: Date): UpcomingEvent[] {
  if (!ics) return [];

  try {
    const jcalData = ICAL.parse(ics);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    return vevents
      .map((vevent) => {
        const event = new ICAL.Event(vevent);
        const start = event.startDate?.toJSDate();
        const end = event.endDate?.toJSDate();

        if (!start || Number.isNaN(start.getTime())) return null;

        return {
          id: `icloud:${event.uid || `${event.summary}-${start.toISOString()}`}`,
          title: event.summary || "(untitled event)",
          start,
          end: end && !Number.isNaN(end.getTime()) ? end : null,
        };
      })
      .filter((event): event is UpcomingEvent => event !== null);
  } catch (error) {
    console.warn("[icloud-calendar-client] Failed to parse a calendar object, skipping it:", error);
    return [];
  }
}

// Fail-soft throughout, same pattern as lib/pubchem-client.ts's
// fetchPubChemStructure and lib/wolfram-client.ts — any failure (missing
// credentials, login failure, network error, a calendar that doesn't
// parse) is caught and logged, never thrown. A broken/expired iCloud
// app-specific password must never take down calendar functionality that
// worked fine on Google alone; the caller (lib/merged-calendar-client.ts)
// just gets an empty array back for this source.
async function fetchIcloudEvents(start: Date, end: Date): Promise<UpcomingEvent[]> {
  const discovered = await getIcloudCalendars();
  if (!discovered) return [];
  const { client, calendars } = discovered;

  const timeRange = { start: start.toISOString(), end: end.toISOString() };

  const perCalendar = await Promise.all(
    calendars.map(async (calendar) => {
      try {
        const objects = await client.fetchCalendarObjects({ calendar, timeRange });
        const events = objects.flatMap((object) => parseIcsEvents(object.data, start));
        console.log(
          `[icloud-calendar-client] "${calendar.displayName}" (${timeRange.start} to ${timeRange.end}): ${objects.length} object(s) -> ${events.length} event(s)${events.length > 0 ? ": " + events.map((e) => `"${e.title}"`).join(", ") : ""}`
        );
        return events;
      } catch (error) {
        console.warn(`[icloud-calendar-client] Failed to fetch events from calendar "${calendar.displayName}":`, error);
        return [];
      }
    })
  );

  const total = perCalendar.flat();
  console.log(`[icloud-calendar-client] Total across ${calendars.length} calendar(s): ${total.length} event(s).`);
  return total;
}

export async function getUpcomingICloudEvents(withinHours = 48): Promise<UpcomingEvent[]> {
  const now = new Date();
  const timeMax = new Date(now.getTime() + withinHours * 60 * 60 * 1000);
  return fetchIcloudEvents(now, timeMax);
}

export async function getICloudEventsInRange(start: Date, end: Date): Promise<UpcomingEvent[]> {
  return fetchIcloudEvents(start, end);
}
