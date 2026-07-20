import { logger } from "firebase-functions";
import { assembleWeeklyRetrospectiveContext } from "../../lib/weekly-retrospective-context";
import { runWeeklyRetrospective } from "../../lib/weekly-retrospective-engine";
import { saveRetrospective } from "../../lib/weekly-retrospective-store";
import { sendPushNotification } from "./push";

// #86 — Sunday-morning weekly retrospective. Structurally mirrors
// synthesis-scan.ts's runSynthesisScan (assemble context, reason, persist,
// notify) but with its own context/engine/store, since this is a genuinely
// different reasoning shape (one structured retrospective, not a list of
// connections) on a genuinely different cadence (weekly, not every 6h).
const APP_URL = "https://north-vector--the-north-vector-project.us-east4.hosted.app";

export type WeeklyRetrospectiveScanSummary = {
  ok: boolean;
  weekId?: string;
};

export async function runWeeklyRetrospectiveScan(): Promise<WeeklyRetrospectiveScanSummary> {
  const context = await assembleWeeklyRetrospectiveContext();
  const retrospective = await runWeeklyRetrospective(context);

  if (!retrospective) {
    logger.error("[weeklyRetrospectiveScan] Failed to generate a retrospective — nothing saved.");
    return { ok: false };
  }

  await saveRetrospective(retrospective);

  const sent = await sendPushNotification(
    "North: your weekly retrospective is ready",
    retrospective.summary,
    `${APP_URL}/weekly-review`
  );

  if (!sent) {
    logger.warn("[weeklyRetrospectiveScan] Push did not send; retrospective was still saved.");
  }

  logger.info(`[weeklyRetrospectiveScan] Retrospective saved for week ${retrospective.weekId}.`);
  return { ok: true, weekId: retrospective.weekId };
}
