import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { evaluateRisks, type RiskEvaluationTask, type RiskEvaluationGoal } from "../../lib/risk-engine";
import { resendApiKey, sendEmail, sendRiskSummaryEmail } from "./email";
import { verifyOwner } from "./require-owner";
import { runUrgencyScan } from "./urgency-scan";
import { runSynthesisScan } from "./synthesis-scan";
import { sendPushNotification } from "./push";

if (!getApps().length) {
  // No explicit credential — the deployed function runs under its own
  // service account, which provides Application Default Credentials
  // automatically. Nothing to configure here.
  initializeApp();
}

const db = getFirestore();

export const dailyRiskScan = onSchedule(
  {
    schedule: "0 6 * * *",
    timeZone: "America/New_York",
    secrets: [resendApiKey],
  },
  async () => {
    const [tasksSnapshot, goalsSnapshot] = await Promise.all([
      db.collection("tasks").get(),
      db.collection("goals").get(),
    ]);

    const tasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RiskEvaluationTask[];

    const goals = goalsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RiskEvaluationGoal[];

    const risks = evaluateRisks(tasks, goals);

    // Write first. Everything after this point is best-effort notification —
    // the risk-scan result itself must never be lost because email delivery
    // had a bad day.
    await db.collection("daily-runs").add({
      // Firestore assigns this at write-commit time on its own servers —
      // not the function instance's clock, which could in principle drift.
      timestamp: FieldValue.serverTimestamp(),
      risks,
      tasksEvaluated: tasks.length,
      goalsEvaluated: goals.length,
    });

    logger.info(
      `Daily risk scan complete: ${risks.length} risk(s) found across ${tasks.length} task(s) and ${goals.length} goal(s).`
    );

    if (risks.length > 0) {
      const sent = await sendRiskSummaryEmail(risks);

      if (!sent) {
        // sendRiskSummaryEmail already logged the underlying cause; this is
        // just the orchestration-level record that notification didn't go
        // out even though the scan data is safely stored.
        logger.warn("Risk summary email did not send; daily-runs document was still written.");
      }
    }
  }
);

// Manually-triggered test path — lets deliverability be verified right now
// instead of waiting for a real flagged risk (or 6am tomorrow). Owner-only,
// same Bearer-token check pattern as the Next.js API routes.
export const sendTestEmail = onRequest(
  { secrets: [resendApiKey] },
  async (req, res) => {
    const isOwner = await verifyOwner(req, res);
    if (!isOwner) return;

    const sent = await sendEmail(
      "North Vector: test email",
      "This is a test of dailyRiskScan's notification path. If you're reading this, delivery works.",
      "<p>This is a test of <strong>dailyRiskScan</strong>'s notification path. If you're reading this, delivery works.</p>"
    );

    if (sent) {
      res.status(200).json({ ok: true });
    } else {
      res.status(500).json({ ok: false, error: "Email send failed — check function logs." });
    }
  }
);

// Calendar/Notion urgency scan — see docs/integrations/calendar-notion-gmail-task.md.
// Gmail is deliberately NOT included here; it's on-demand only (see
// app/api/v1/gmail/check-urgent), never on a periodic schedule.
const googleCalendarClientId = defineSecret("GOOGLE_CALENDAR_CLIENT_ID");
const googleCalendarClientSecret = defineSecret("GOOGLE_CALENDAR_CLIENT_SECRET");
const googleCalendarRefreshToken = defineSecret("GOOGLE_CALENDAR_REFRESH_TOKEN");
const notionApiToken = defineSecret("NOTION_API_TOKEN");

const urgencyScanSecrets = [
  googleCalendarClientId,
  googleCalendarClientSecret,
  googleCalendarRefreshToken,
  notionApiToken,
];

export const urgencyScan = onSchedule(
  {
    schedule: "every 15 minutes",
    secrets: urgencyScanSecrets,
  },
  async () => {
    await runUrgencyScan();
  }
);

// Manually-triggered test path, same reasoning as sendTestEmail — lets push
// deliverability be verified without waiting for a real qualifying event.
export const sendTestUrgency = onRequest(
  { secrets: urgencyScanSecrets },
  async (req, res) => {
    const isOwner = await verifyOwner(req, res);
    if (!isOwner) return;

    const sent = await sendPushNotification(
      "North Vector: test alert",
      "This is a test of the urgency scan's push notification path. If you're reading this, delivery works."
    );

    if (sent) {
      res.status(200).json({ ok: true });
    } else {
      res.status(500).json({ ok: false, error: "Push send failed — check function logs, and confirm a device has enabled alerts in Settings." });
    }
  }
);

// Synthesis Engine — cross-source reasoning, see
// North_Vector_Synthesis_Engine_Plan.md. Needs every existing integration's
// credentials (Calendar, Notion, Gmail) plus the Anthropic API for the
// reasoning pass itself.
const gmailRefreshToken = defineSecret("GMAIL_REFRESH_TOKEN");
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

const synthesisScanSecrets = [
  googleCalendarClientId,
  googleCalendarClientSecret,
  googleCalendarRefreshToken,
  notionApiToken,
  gmailRefreshToken,
  anthropicApiKey,
];

// Deliberately NOT an onSchedule trigger yet — the plan's own checklist
// (Section 12, items 8 and 12) calls for manually-triggered runs first,
// inspecting synthesis_runs output by hand for a few days before enabling
// any recurring schedule. This mirrors sendTestEmail/sendTestUrgency's
// existing manual-trigger pattern rather than introducing a new one.
// Wiring an onSchedule(...) export here is the deliberate last step, once
// manual runs look sane — not something to add preemptively in this pass.
export const triggerSynthesisScan = onRequest(
  { secrets: synthesisScanSecrets, timeoutSeconds: 120 },
  async (req, res) => {
    const isOwner = await verifyOwner(req, res);
    if (!isOwner) return;

    try {
      const summary = await runSynthesisScan();
      res.status(200).json({ ok: true, ...summary });
    } catch (error) {
      logger.error("Synthesis scan failed:", error);
      res.status(500).json({ ok: false, error: "Synthesis scan failed — check function logs." });
    }
  }
);
