import { getUpcomingEvents, getEventsInRange, type UpcomingEvent } from "./google-calendar-client";
import { getUpcomingICloudEvents, getICloudEventsInRange } from "./icloud-calendar-client";

// Shared with Cloud Functions, same reasoning as both clients this
// combines — no "server-only" guard.
//
// The single integration seam every calendar consumer actually calls now
// (functions/src/urgency-scan.ts, class-end-scan.ts, hourly-checkin-scan.ts,
// lib/tool-dispatcher.ts's check_calendar, lib/synthesis-context.ts,
// lib/weekly-retrospective-context.ts) — each one used to call
// google-calendar-client.ts directly; this wraps both sources so none of
// them need to know or care which provider an event came from.
//
// The explicit sort below is the critical piece, not a nicety: several
// consumers silently trust the returned array is already ordered
// soonest-first — hourly-checkin-scan.ts takes index [0] as "the next
// event", lib/calendar-summary.ts's summarizeUpcomingEvents takes
// .slice(0, 3) — both true today only because Google's own API call
// specifies orderBy: "startTime". A bare concatenation of two sources
// without re-sorting would silently break both.
function mergeSorted(google: UpcomingEvent[], icloud: UpcomingEvent[]): UpcomingEvent[] {
  return [...google, ...icloud].sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function getMergedUpcomingEvents(withinHours = 48): Promise<UpcomingEvent[]> {
  const [google, icloud] = await Promise.all([getUpcomingEvents(withinHours), getUpcomingICloudEvents(withinHours)]);
  return mergeSorted(google, icloud);
}

export async function getMergedEventsInRange(start: Date, end: Date): Promise<UpcomingEvent[]> {
  const [google, icloud] = await Promise.all([getEventsInRange(start, end), getICloudEventsInRange(start, end)]);
  return mergeSorted(google, icloud);
}
