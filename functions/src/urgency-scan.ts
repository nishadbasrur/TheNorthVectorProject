import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { getUpcomingEvents, eventsStartingSoon, eventsBackToBack } from "../../lib/google-calendar-client";
import { getUrgentItems } from "../../lib/notion-client";
import { sendPushNotification } from "./push";

type AlertSource = "calendar" | "notion" | "back_to_back";

// alert_state doc ids are namespaced by source so a Calendar event id and a
// Notion page id can never collide.
function alertStateId(source: AlertSource, externalId: string): string {
  return `${source}-${externalId}`;
}

async function alreadyAlerted(source: AlertSource, externalId: string): Promise<boolean> {
  const db = getFirestore();
  const doc = await db.collection("alert_state").doc(alertStateId(source, externalId)).get();
  return doc.exists;
}

async function recordAlert(
  source: AlertSource,
  externalId: string,
  summary: string
): Promise<void> {
  const db = getFirestore();

  await db.collection("alert_state").doc(alertStateId(source, externalId)).set({
    source,
    externalId,
    alertedAt: FieldValue.serverTimestamp(),
  });

  // Audit log — summary only, never raw source content (matters most for
  // Gmail, but kept consistent here too).
  await db.collection("alerts").add({
    source,
    summary,
    sentAt: FieldValue.serverTimestamp(),
  });
}

export type UrgencyScanSummary = {
  calendarEventsChecked: number;
  calendarAlertsSent: number;
  notionItemsChecked: number;
  notionAlertsSent: number;
  backToBackPairsFound: number;
  backToBackAlertsSent: number;
};

// Calendar + Notion only — Gmail is deliberately NOT part of this scheduled
// scan (on-demand only, see app/api/v1/gmail/check-urgent). See
// docs/integrations/calendar-notion-gmail-task.md for the full rationale.
export async function runUrgencyScan(): Promise<UrgencyScanSummary> {
  const summary: UrgencyScanSummary = {
    calendarEventsChecked: 0,
    calendarAlertsSent: 0,
    notionItemsChecked: 0,
    notionAlertsSent: 0,
    backToBackPairsFound: 0,
    backToBackAlertsSent: 0,
  };

  const upcomingEvents = await getUpcomingEvents(48);
  const soonEvents = eventsStartingSoon(upcomingEvents, 15);
  summary.calendarEventsChecked = soonEvents.length;

  for (const event of soonEvents) {
    if (await alreadyAlerted("calendar", event.id)) continue;

    const minutesUntil = Math.round((event.start.getTime() - Date.now()) / 60000);
    const sent = await sendPushNotification(
      `Upcoming: ${event.title}`,
      `Starts in about ${minutesUntil} minute${minutesUntil === 1 ? "" : "s"}.`
    );

    if (!sent) {
      logger.warn(`Push did not send for calendar event ${event.id}; alert_state was still recorded.`);
    }

    await recordAlert("calendar", event.id, event.title);
    summary.calendarAlertsSent += 1;
  }

  // #4 — flag back-to-back events with no real transition time. Runs over
  // the same 48h fetch already pulled above for eventsStartingSoon, no
  // second calendar call needed.
  const backToBackPairs = eventsBackToBack(upcomingEvents, 15);
  summary.backToBackPairsFound = backToBackPairs.length;

  for (const pair of backToBackPairs) {
    const externalId = `${pair.first.id}-${pair.second.id}`;
    if (await alreadyAlerted("back_to_back", externalId)) continue;

    const gapDescription =
      pair.gapMinutes <= 0 ? "They actually overlap." : `Only ${pair.gapMinutes} minute(s) between them.`;

    const sent = await sendPushNotification(
      `Back-to-back: ${pair.first.title} → ${pair.second.title}`,
      gapDescription
    );

    if (!sent) {
      logger.warn(`Push did not send for back-to-back pair ${externalId}; alert_state was still recorded.`);
    }

    await recordAlert("back_to_back", externalId, `${pair.first.title} -> ${pair.second.title}`);
    summary.backToBackAlertsSent += 1;
  }

  const urgentItems = await getUrgentItems();
  summary.notionItemsChecked = urgentItems.length;

  for (const item of urgentItems) {
    if (await alreadyAlerted("notion", item.id)) continue;

    const sent = await sendPushNotification("Marked urgent in Notion", item.title);

    if (!sent) {
      logger.warn(`Push did not send for Notion item ${item.id}; alert_state was still recorded.`);
    }

    await recordAlert("notion", item.id, item.title);
    summary.notionAlertsSent += 1;
  }

  logger.info(
    `Urgency scan complete: ${summary.calendarAlertsSent} calendar alert(s) from ${summary.calendarEventsChecked} event(s) checked, ${summary.notionAlertsSent} Notion alert(s) from ${summary.notionItemsChecked} item(s) checked, ${summary.backToBackAlertsSent} back-to-back alert(s) from ${summary.backToBackPairsFound} pair(s) found.`
  );

  return summary;
}
