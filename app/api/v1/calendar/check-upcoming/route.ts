import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getUpcomingEvents } from "@/lib/google-calendar-client";

// On-demand calendar check — distinct from functions/src/urgency-scan.ts's
// scheduled 15-minute scan. That scan proactively pushes a notification for
// events starting imminently; this endpoint answers a live spoken/typed
// question about what's coming up, with a wider default window, and does
// not write to Firestore at all (no alert_state, no dedup) — a snapshot
// read, nothing more. See
// docs/integrations/calendar-notion-gmail-task.md Section 3/6.4 for why
// on-demand and the scheduled scan intentionally don't share dedup state.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Optional override — defaults to 48h (Calendar's existing Phase 1
  // window), but a spoken "what's on my calendar today" vs. "this week"
  // should be able to ask for a narrower or wider window. Voice router
  // passes this through based on simple keyword detection.
  const withinHoursRaw = (body as Record<string, unknown>)?.withinHours;
  const withinHours =
    typeof withinHoursRaw === "number" && withinHoursRaw > 0 && withinHoursRaw <= 24 * 14
      ? withinHoursRaw
      : 48;

  const events = await getUpcomingEvents(withinHours);

  return NextResponse.json({
    withinHours,
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start.toISOString(),
      end: e.end?.toISOString() ?? null,
    })),
  });
}
