import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import { logger } from "firebase-functions";
import { randomBytes, randomUUID } from "crypto";
import {
  registerCalendarWatch,
  stopCalendarWatch,
  listCalendarEventsDelta,
} from "../../lib/google-calendar-client";
import {
  getCalendarWatchState,
  saveCalendarWatchState,
  updateCalendarSyncToken,
} from "../../lib/calendar-watch-store";
import { runUrgencyScan } from "./urgency-scan";

// Real-time Calendar push notifications, replacing "wait up to 15 minutes
// for the next scheduled scan" with "react within seconds of a real
// change." See North_Vector_Real_Time_Triggers_Plan.md Section 1.4.
//
// Predictable Cloud Functions v2 URL format (region-project.cloudfunctions.net/name)
// — same precedent as functions/src/index.ts's notifyCapabilityDraftReady,
// which hardcodes this same URL shape rather than the newer hash-based
// Cloud Run URL (not knowable until after first deploy).
const WEBHOOK_URL = "https://us-central1-the-north-vector-project.cloudfunctions.net/calendarWebhook";

// Registers a fresh watch channel, replacing any existing one. Called by
// both the daily renewal schedule and a manual trigger endpoint (to
// bootstrap right after deploy rather than waiting for the first scheduled
// tick). Always creates a brand-new channel rather than trying to extend
// the old one — the Calendar API has no "extend" operation, only "watch
// again," and Google doesn't publish a fixed channel lifetime to plan
// around, so this runs defensively on a fixed daily cadence regardless of
// how much time the current channel actually has left.
export async function registerOrRenewCalendarWatch(): Promise<void> {
  const existing = await getCalendarWatchState();

  const channelId = randomUUID();
  const channelToken = randomBytes(32).toString("hex");

  const { resourceId, expiration } = await registerCalendarWatch(WEBHOOK_URL, channelId, channelToken);

  await saveCalendarWatchState({
    channelId,
    resourceId,
    channelToken,
    // Fresh channel, no syncToken yet — the first real webhook call below
    // does a full resync (listCalendarEventsDelta(null)) to establish one.
    syncToken: null,
    expiration,
  });

  logger.log(`[calendar-webhook] Registered watch channel ${channelId}, expires ${expiration}`);

  if (existing) {
    try {
      await stopCalendarWatch(existing.channelId, existing.resourceId);
    } catch (error) {
      // Not fatal — an old channel that fails to stop just expires on its
      // own (e.g. it was already expired or already stopped).
      logger.warn(`[calendar-webhook] Failed to stop old channel ${existing.channelId}:`, error);
    }
  }
}

// The actual webhook receiver — functions/src/index.ts's calendarWebhook
// onRequest export just delegates here.
export async function handleCalendarWebhook(req: Request, res: Response): Promise<void> {
  const channelId = req.header("X-Goog-Channel-ID");
  const channelToken = req.header("X-Goog-Channel-Token");
  const resourceState = req.header("X-Goog-Resource-State");

  const state = await getCalendarWatchState();

  // Google doesn't sign these requests — channelToken (a random secret
  // generated at registration, never sent anywhere else) is the actual
  // authentication boundary. Matching channelId alone wouldn't be enough
  // since channel IDs are UUIDs, not secrets.
  if (!state || channelId !== state.channelId || channelToken !== state.channelToken) {
    logger.warn("[calendar-webhook] Rejected: channel/token mismatch — not a legitimate Google push.");
    res.status(403).send("Forbidden");
    return;
  }

  // "sync" is the one-time handshake message Google sends immediately
  // after a channel is registered, confirming it's live — no real change
  // to react to yet.
  if (resourceState === "sync") {
    res.status(200).send("OK");
    return;
  }

  try {
    const delta = await listCalendarEventsDelta(state.syncToken);
    await updateCalendarSyncToken(delta.nextSyncToken);

    logger.log(
      `[calendar-webhook] ${delta.events.length} event(s) in delta${delta.resyncRequired ? " (full resync)" : ""} — re-running urgency evaluation.`
    );

    // Reuses the exact same evaluation the 15-minute scheduled scan runs —
    // only what triggers it changed, not the logic itself. Its own
    // alert_state dedup makes this safe to call redundantly.
    await runUrgencyScan();

    res.status(200).send("OK");
  } catch (error) {
    logger.error("[calendar-webhook] Failed to process calendar change:", error);
    // Still 200 — a processing failure isn't something a retry fixes, and
    // the next real change (or the daily renewal) naturally recovers state.
    res.status(200).send("OK");
  }
}
