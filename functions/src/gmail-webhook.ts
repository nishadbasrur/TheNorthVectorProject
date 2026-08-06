import { logger } from "firebase-functions";
import type { CloudEvent } from "firebase-functions/v2";
import type { MessagePublishedData } from "firebase-functions/v2/pubsub";
import { registerGmailWatch, getGmailHistoryDelta } from "../../lib/gmail-client";
import { getGmailWatchState, saveGmailWatchState, updateGmailHistoryId } from "../../lib/gmail-watch-store";
import { checkUrgentEmailsRaw } from "../../lib/gmail-urgency";
import { sendPushNotification } from "./push";

// Real-time Gmail push notifications, replacing "on-demand only, never
// scheduled" with a real trigger — see North_Vector_Real_Time_Triggers_Plan.md
// Section 1.3. Deliberately still not a periodic scan: this only ever fires
// off a genuine Gmail change via Pub/Sub, same "converting polling to push"
// principle as the Calendar webhook (functions/src/calendar-webhook.ts).
//
// Full topic resource name, not just the topic id — Gmail's watch() API
// requires this exact "projects/{project}/topics/{topic}" format.
const TOPIC_NAME = "projects/the-north-vector-project/topics/gmail-push";

// Registers (replaces) the watch. Called by both the daily renewal
// schedule and a manual trigger endpoint, same reasoning as
// registerOrRenewCalendarWatch. Unlike Calendar, there's no separate old-
// channel cleanup step — re-calling watch() simply replaces the prior
// registration for this account.
export async function registerOrRenewGmailWatch(): Promise<void> {
  const { historyId, expiration } = await registerGmailWatch(TOPIC_NAME);
  await saveGmailWatchState({ historyId, expiration });
  logger.log(`[gmail-webhook] Registered watch, historyId=${historyId}, expires ${expiration}`);
}

type GmailPushPayload = { emailAddress?: string; historyId?: string };

// The actual Pub/Sub message handler — functions/src/index.ts's gmailWatch
// onMessagePublished export delegates here. No signature verification
// needed the way the Calendar/Notion HTTP webhooks require: this isn't an
// arbitrary internet-facing endpoint, it's invoked directly by Google's
// Pub/Sub infrastructure under Firebase's own IAM-authorized trigger
// wiring — the trust boundary is enforced before this code ever runs.
export async function handleGmailPush(event: CloudEvent<MessagePublishedData<GmailPushPayload>>): Promise<void> {
  const payload = event.data.message.json ?? {};
  const pushedHistoryId = payload.historyId;

  if (!pushedHistoryId) {
    logger.warn("[gmail-webhook] Push message had no historyId — ignoring.");
    return;
  }

  const state = await getGmailWatchState();
  const startHistoryId = state?.historyId ?? pushedHistoryId;

  try {
    const delta = await getGmailHistoryDelta(startHistoryId);

    // The historyId in the push payload is the freshest known cursor per
    // Gmail's own docs — store it regardless of what the delta fetch
    // found, so the next push starts from here.
    await updateGmailHistoryId(pushedHistoryId);

    if (!delta.hasNewMessages) {
      logger.log("[gmail-webhook] Push received, no new messages in delta — skipping evaluation.");
      return;
    }

    logger.log("[gmail-webhook] New message(s) detected — running urgency evaluation.");

    // Reuses the exact same evaluation the on-demand check_email tool
    // calls (lib/gmail-urgency.ts) — only what triggers it changed here,
    // not the logic itself. Its own gmail_surfaced dedup + 24h TTL make
    // this safe to call from a real-time trigger, not just on-demand.
    const { urgent } = await checkUrgentEmailsRaw();

    if (urgent.length > 0) {
      const subjects = urgent.map((u) => u.subject).join(", ");
      await sendPushNotification(
        `North: ${urgent.length} urgent email${urgent.length === 1 ? "" : "s"}`,
        subjects
      );
    }
  } catch (error) {
    logger.error("[gmail-webhook] Failed to process Gmail push:", error);
    // No re-throw — a processing failure here isn't something Pub/Sub
    // redelivery would fix, and the next real change (or the daily
    // renewal) naturally recovers state.
  }
}
