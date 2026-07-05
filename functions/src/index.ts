import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { evaluateRisks, type RiskEvaluationTask, type RiskEvaluationGoal } from "../../lib/risk-engine";
import { resendApiKey, sendEmail, sendRiskSummaryEmail } from "./email";
import { verifyOwner } from "./require-owner";

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
