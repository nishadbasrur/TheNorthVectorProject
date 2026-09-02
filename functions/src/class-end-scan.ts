import { logger } from "firebase-functions";
import { eventsRecentlyEnded, CLASS_EVENT_TITLE_PATTERN } from "../../lib/google-calendar-client";
import { getMergedEventsInRange } from "../../lib/merged-calendar-client";
import { alreadyAlerted, recordAlert } from "./alert-state";
import { enqueueSpontaneousSpeech } from "../../lib/spontaneous-speech-queue";

// How far back to look for class events — must comfortably cover this
// scan's own schedule interval (every 10 minutes, see index.ts) plus
// eventsRecentlyEnded's own withinMinutes window below, so a class ending
// right at a scan-tick boundary is never missed. 20 minutes gives real
// margin without risking a stale double-fire (alert-state dedup handles
// that regardless, but there's no reason to rely on it more than needed).
const LOOKBACK_MINUTES = 20;
const RECENTLY_ENDED_WITHIN_MINUTES = 10;

export type ClassEndScanResult = { eventsChecked: number; nudgesSent: number };

// Trigger source #4 of always-on spontaneous speech (see
// app/api/v1/voice/spontaneous-stream/route.ts). Class detection is a
// title-pattern match (CLASS_EVENT_TITLE_PATTERN, confirmed against real
// examples from the calendar this runs against) — no calendar-side tagging
// needed. Spoken text is templated, not model-generated: the nudge itself
// is simple/deterministic enough not to need an LLM call for it.
export async function runClassEndScan(): Promise<ClassEndScanResult> {
  const now = new Date();
  const rangeStart = new Date(now.getTime() - LOOKBACK_MINUTES * 60 * 1000);

  const events = await getMergedEventsInRange(rangeStart, now);
  const classEvents = events.filter((event) => CLASS_EVENT_TITLE_PATTERN.test(event.title));
  const endedClasses = eventsRecentlyEnded(classEvents, RECENTLY_ENDED_WITHIN_MINUTES);

  let nudgesSent = 0;

  for (const event of endedClasses) {
    if (await alreadyAlerted("class-end", event.id)) continue;

    const courseCodeMatch = event.title.match(CLASS_EVENT_TITLE_PATTERN);
    const courseCode = courseCodeMatch ? courseCodeMatch[0].trim() : event.title;

    const text = `${courseCode} just wrapped up, sir — good time to file your notes away.`;

    await enqueueSpontaneousSpeech({ text, urgency: "routine", source: "class-end" });
    await recordAlert("class-end", event.id, event.title);
    nudgesSent += 1;
  }

  logger.info(`[class-end-scan] Checked ${classEvents.length} class event(s), sent ${nudgesSent} nudge(s).`);
  return { eventsChecked: classEvents.length, nudgesSent };
}
