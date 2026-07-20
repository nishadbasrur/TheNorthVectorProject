import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { evaluateRisks, type RiskEvaluationTask, type RiskEvaluationGoal } from "../../lib/risk-engine";
import { resendApiKey, sendEmail, sendRiskSummaryEmail } from "./email";
import { verifyOwner } from "./require-owner";
import { runUrgencyScan } from "./urgency-scan";
import { runSynthesisScan } from "./synthesis-scan";
import { runWeeklyRetrospectiveScan } from "./weekly-retrospective-scan";
import { sendPushNotification } from "./push";
import { dispatchCapabilityDraft } from "./capability-gap-dispatch";
import { verifyPipelineCallback } from "./verify-pipeline-callback";
import { submitOpportunityScan, pollOpportunityScan } from "./opportunity-scan";
import { getPendingBatch } from "../../lib/opportunity-store";
import { handleCalendarWebhook, registerOrRenewCalendarWatch } from "./calendar-webhook";
import { handleGmailPush, registerOrRenewGmailWatch } from "./gmail-webhook";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { handleNotionWebhook } from "./notion-webhook";

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

// Manually-triggered test path — runs the actual scan on demand (unlike
// sendTestUrgency above, which only sends a generic canned push), so #4's
// back-to-back detection (and anything else the scan does) can be verified
// live without waiting up to 15 minutes for the next scheduled tick. Same
// triggerSynthesisScan precedent.
export const triggerUrgencyScan = onRequest(
  { secrets: urgencyScanSecrets },
  async (req, res) => {
    const isOwner = await verifyOwner(req, res);
    if (!isOwner) return;

    try {
      const summary = await runUrgencyScan();
      res.status(200).json({ ok: true, ...summary });
    } catch (error) {
      logger.error("[triggerUrgencyScan] Urgency scan failed:", error);
      res.status(500).json({ ok: false, error: "Urgency scan failed — check function logs." });
    }
  }
);

// Real-time Calendar push notifications — converts "wait up to 15 minutes
// for the next scan" into "react within seconds of a real change." See
// functions/src/calendar-webhook.ts and
// North_Vector_Real_Time_Triggers_Plan.md Section 1.4. urgencyScan and
// sendTestUrgency above are unchanged — this triggers the exact same
// evaluation, it just adds a second, faster trigger alongside the existing
// timer.
//
// No verifyOwner here — Google Calendar calls this endpoint directly, not
// an authenticated Nishad session. Authentication is the channelToken
// check inside handleCalendarWebhook itself (a random secret only this
// app and Google's push service know, echoed back on every real call).
export const calendarWebhook = onRequest({ secrets: urgencyScanSecrets }, async (req, res) => {
  await handleCalendarWebhook(req, res);
});

// Defensive daily renewal — Google doesn't publish a fixed Calendar
// channel lifetime to plan a precise renewal margin around, so this just
// re-registers a fresh channel every day regardless of how much time the
// current one has left, rather than risk silently going stale.
export const calendarWatchRenew = onSchedule(
  { schedule: "0 3 * * *", timeZone: "America/New_York", secrets: [googleCalendarClientId, googleCalendarClientSecret, googleCalendarRefreshToken] },
  async () => {
    try {
      await registerOrRenewCalendarWatch();
    } catch (error) {
      logger.error("[calendarWatchRenew] Failed to renew watch:", error);
    }
  }
);

// Manual trigger — bootstraps the very first watch registration right
// after deploy (Cloud Scheduler doesn't fire immediately on creation, and
// waiting up to 24h for the first automatic tick isn't necessary), and
// lets renewal be re-tested on demand later. Same
// sendTestEmail/sendTestUrgency manual-trigger precedent.
export const triggerCalendarWatchRenew = onRequest(
  { secrets: [googleCalendarClientId, googleCalendarClientSecret, googleCalendarRefreshToken] },
  async (req, res) => {
    const isOwner = await verifyOwner(req, res);
    if (!isOwner) return;

    try {
      await registerOrRenewCalendarWatch();
      res.status(200).json({ ok: true });
    } catch (error) {
      logger.error("[triggerCalendarWatchRenew] Failed:", error);
      res.status(500).json({ ok: false, error: "Failed to register calendar watch — check function logs." });
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

// Manual-trigger endpoint — kept alongside the schedule below (same
// sendTestEmail/sendTestUrgency precedent) for on-demand testing without
// waiting for the next scheduled run.
//
// Operational note, not fixable in code: lib/notion-client.ts also reads
// process.env.NOTION_URGENT_DATABASE_ID directly (not via defineSecret) —
// urgencyScan already has this set as a plain runtime environment variable
// configured out-of-band through the Firebase/GCP console (not tracked
// anywhere in this repo, per docs/integrations/calendar-notion-gmail-task.md's
// own note that the database ID was deliberately kept out of source rather
// than hardcoded). A newly created function does not inherit another
// function's console-configured env vars — synthesisScan below needs this
// set on itself too, by hand, in the console, the same way it was set on
// urgencyScan and this manual endpoint.
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

// Now scheduled — the plan's own checklist (Section 12, items 8 and 12)
// called for manually-triggered runs first, inspecting synthesis_runs
// output by hand for a few days before enabling any recurring schedule;
// that validation period is done. Every 6 hours, not more often: matches
// lib/synthesis-store.ts's own resurface window (a connection already
// shown won't resurface for 6 hours regardless), so this is the natural
// cadence rather than an arbitrary pick — running more often would just
// re-evaluate the same already-suppressed connections for no benefit.
export const synthesisScan = onSchedule(
  { schedule: "0 */6 * * *", secrets: synthesisScanSecrets, timeoutSeconds: 120 },
  async () => {
    try {
      const summary = await runSynthesisScan();
      logger.log(`[synthesisScan] ${JSON.stringify(summary)}`);
    } catch (error) {
      logger.error("[synthesisScan] Synthesis scan failed:", error);
    }
  }
);

// #86 — weekly retrospective. Its own secrets list (Calendar + Anthropic
// only — no Notion/Gmail/text-message reads, unlike synthesisScanSecrets),
// since lib/weekly-retrospective-context.ts only touches tasks, goals, and
// calendar.
const weeklyRetrospectiveSecrets = [
  googleCalendarClientId,
  googleCalendarClientSecret,
  googleCalendarRefreshToken,
  anthropicApiKey,
];

// Manual-trigger endpoint, same triggerSynthesisScan/triggerUrgencyScan
// precedent — lets the retrospective be verified right now rather than
// waiting for the next Sunday 8am tick.
export const triggerWeeklyRetrospective = onRequest(
  { secrets: weeklyRetrospectiveSecrets, timeoutSeconds: 120 },
  async (req, res) => {
    const isOwner = await verifyOwner(req, res);
    if (!isOwner) return;

    try {
      const summary = await runWeeklyRetrospectiveScan();
      res.status(summary.ok ? 200 : 500).json(summary);
    } catch (error) {
      logger.error("[triggerWeeklyRetrospective] Weekly retrospective scan failed:", error);
      res.status(500).json({ ok: false, error: "Weekly retrospective scan failed — check function logs." });
    }
  }
);

// Every Sunday 8am Eastern — no weekly-cadence schedule existed anywhere in
// this codebase before this one.
export const weeklyRetrospectiveScan = onSchedule(
  { schedule: "0 8 * * 0", timeZone: "America/New_York", secrets: weeklyRetrospectiveSecrets, timeoutSeconds: 120 },
  async () => {
    try {
      const summary = await runWeeklyRetrospectiveScan();
      logger.log(`[weeklyRetrospectiveScan] ${JSON.stringify(summary)}`);
    } catch (error) {
      logger.error("[weeklyRetrospectiveScan] Weekly retrospective scan failed:", error);
    }
  }
);

// Real-time Gmail push notifications — converts "on-demand only, never
// scheduled" into "reacts within seconds of real new mail," without ever
// becoming a periodic Gmail scan (deliberately still not one — see
// docs/integrations/calendar-notion-gmail-task.md's original reasoning for
// why Gmail stayed off the urgency-scan timer). See
// functions/src/gmail-webhook.ts and
// North_Vector_Real_Time_Triggers_Plan.md Section 1.3.
//
// Topic id only (not the full "projects/.../topics/..." resource path) —
// Firebase resolves this against the current project automatically for
// trigger wiring, unlike lib/gmail-client.ts's TOPIC_NAME constant, which
// calls Gmail's watch() API directly and needs the fully-qualified form
// that specific API requires.
const gmailWatchSecrets = [googleCalendarClientId, googleCalendarClientSecret, gmailRefreshToken];

export const gmailWatch = onMessagePublished(
  { topic: "gmail-push", secrets: [...gmailWatchSecrets, anthropicApiKey] },
  async (event) => {
    await handleGmailPush(event);
  }
);

// Defensive daily renewal — Gmail's watch() genuinely does expire after a
// fixed 7 days (unlike Calendar's undocumented channel lifetime), but
// renewing daily rather than right before the 7-day mark costs nothing and
// removes any need to track the exact expiration precisely.
export const gmailWatchRenew = onSchedule(
  { schedule: "0 3 * * *", timeZone: "America/New_York", secrets: gmailWatchSecrets },
  async () => {
    try {
      await registerOrRenewGmailWatch();
    } catch (error) {
      logger.error("[gmailWatchRenew] Failed to renew watch:", error);
    }
  }
);

// Manual trigger — bootstraps the first registration right after deploy
// rather than waiting for the first scheduled tick, same
// triggerCalendarWatchRenew precedent.
export const triggerGmailWatchRenew = onRequest({ secrets: gmailWatchSecrets }, async (req, res) => {
  const isOwner = await verifyOwner(req, res);
  if (!isOwner) return;

  try {
    await registerOrRenewGmailWatch();
    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error("[triggerGmailWatchRenew] Failed:", error);
    res.status(500).json({ ok: false, error: "Failed to register Gmail watch — check function logs." });
  }
});

// Real-time Notion push notifications — the third and last real-time
// trigger source (Calendar, Gmail, now Notion). Unlike those two, there's
// no code-driven registration/renewal here — the subscription is created
// entirely through Notion's own integration dashboard (Webhooks tab), and
// Notion's webhooks need no expiry/renewal at all once verified. This
// endpoint just needs to exist and handle the one-time verification
// handshake plus ongoing HMAC signature checks — see
// functions/src/notion-webhook.ts.
export const notionWebhook = onRequest({ secrets: urgencyScanSecrets }, async (req, res) => {
  await handleNotionWebhook(req, res);
});

// Autonomous Self-Extension, Option B (see
// North_Vector_Autonomous_Self_Extension_Plan.md Section 3) — fires
// whenever North logs something it couldn't do (lib/capability-gap-store.ts's
// note_capability_gap tool writes a capability_gaps doc). This function's
// only job is triggering .github/workflows/autonomous-capability-draft.yml;
// it holds no code-push permission at all. The workflow itself drafts the
// new tool, verifies it (typecheck + build), and opens a PR for Nishad to
// review — nothing here or in that workflow can push straight to main.
const githubDispatchToken = defineSecret("GITHUB_DISPATCH_TOKEN");

export const onCapabilityGap = onDocumentCreated(
  { document: "capability_gaps/{gapId}", secrets: [githubDispatchToken] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    // Fires for every new doc in this collection regardless of who wrote
    // it — note_capability_gap (a live voice turn) and onToolError (below,
    // an existing tool actually failing) both just create a doc here and
    // let this one trigger take it from there. kind on the doc (absent =
    // "capability", the original behavior) picks which script the
    // workflow's single Draft step runs.
    const kind = data.kind === "bug_fix" ? "bug_fix" : "capability";

    const ok = await dispatchCapabilityDraft(
      githubDispatchToken.value(),
      event.params.gapId,
      kind,
      typeof data.request === "string" ? data.request : "",
      typeof data.capability === "string" ? data.capability : ""
    );

    if (!ok) {
      logger.error(`Failed to dispatch capability-draft workflow for gap ${event.params.gapId}`);
    }
  }
);

// Bug-fix drafting, the newest layer of the self-extension pipeline —
// watches lib/tool-error-log.ts's tool_errors collection (every tool
// handler's catch block writes here automatically, see
// lib/tool-dispatcher.ts) and, for a small allowlist of tools that have a
// single dedicated client file, kicks off the exact same draft/typecheck/
// build/PR/review flow already proven out for brand-new tools — just with a
// different, narrower scope fence (scripts/draft-bugfix.js may only rewrite
// that one pre-determined file, never choose its own target, never touch
// lib/tool-dispatcher.ts's routing). Real bug report requested this
// 2026-07-16 after a live create_calendar_event failure; see
// North_Vector_Autonomous_Self_Extension_Plan.md's bug-fix-drafting
// section for the full design and why it's scoped this tightly.
//
// Keep this set in sync with scripts/draft-bugfix.js's TOOL_TO_FILE map —
// this one only decides whether to attempt a fix at all (and avoids
// creating a dead-end review-page entry for a tool that has nowhere to
// route a fix); the script owns the actual file each tool maps to.
const FIXABLE_TOOLS = new Set([
  "check_email",
  "search_email",
  "send_email",
  "delete_email",
  "check_calendar",
  "create_calendar_event",
  "update_calendar_event",
  "delete_calendar_event",
  "check_notion",
  "get_decision_recommendation",
  "show_map",
  "highlight_building",
  "check_icloud_email",
  "search_icloud_email",
  "create_task",
  "research",
  "check_bug_status",
  "get_proactive_updates",
]);

export const onToolError = onDocumentCreated("tool_errors/{errorId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const toolName = typeof data.toolName === "string" ? data.toolName : "";
  const message = typeof data.message === "string" ? data.message : "";
  if (!toolName || !FIXABLE_TOOLS.has(toolName)) return;

  // Equality-only filters (no orderBy/range/in) — Firestore serves this
  // without needing a manually-created composite index. One open draft per
  // tool at a time: a tool failing repeatedly while its first fix is
  // already out for review shouldn't spawn a second competing PR.
  const existing = await db
    .collection("capability_gaps")
    .where("toolName", "==", toolName)
    .where("kind", "==", "bug_fix")
    .get();
  const alreadyOpen = existing.docs.some((doc) => {
    const status = doc.data().status;
    return status === "pending_gap" || status === "pending_review";
  });
  if (alreadyOpen) {
    logger.log(`[onToolError] Skipping ${toolName} — a bug-fix draft is already in flight.`);
    return;
  }

  await db.collection("capability_gaps").add({
    kind: "bug_fix",
    request: toolName,
    capability: message,
    toolName,
    status: "pending_gap",
    createdAt: FieldValue.serverTimestamp(),
  });

  await sendPushNotification(
    `North: found a bug in "${toolName}"`,
    "Drafting a fix now — you'll get another ping when it's ready to review."
  );

  // No direct dispatch call here — writing the doc above is enough; it's
  // picked up by the onCapabilityGap trigger the same way a live
  // note_capability_gap call is.
});

// Public production URL — hardcoded rather than read from a secret/env var
// since it's not sensitive (same treatment public/firebase-messaging-sw.js
// already gives its own Firebase project identifiers).
const APP_URL = "https://north-vector--the-north-vector-project.us-east4.hosted.app";

// Called from the last step of autonomous-capability-draft.yml once it's
// opened a PR — this is the "ping me on the phone" half of the loop
// (the workflow already ran unattended; this is just telling Nishad it's
// done). Shared-secret auth (verifyPipelineCallback), not verifyOwner —
// GitHub Actions has no Firebase user to authenticate as.
//
// Writes the PR info back onto the capability_gaps/{gapId} doc so the
// in-app review page (app/capability-review/[gapId]) has something to
// read, then sends a push notification linking to that page — not
// straight to GitHub. Tapping it lands Nishad on North's own
// approve/deny screen (which shows the real diff before either button
// does anything), not a rubber-stamp auto-merge with no review surface.
const pipelineCallbackToken = defineSecret("PIPELINE_CALLBACK_TOKEN");

export const notifyCapabilityDraftReady = onRequest(
  { secrets: [pipelineCallbackToken] },
  async (req, res) => {
    if (!verifyPipelineCallback(req, res, pipelineCallbackToken.value())) return;

    const { gapId, prUrl, toolName, summary, targetFile } = (req.body ?? {}) as {
      gapId?: unknown;
      prUrl?: unknown;
      toolName?: unknown;
      summary?: unknown;
      targetFile?: unknown;
    };

    if (typeof gapId !== "string" || !gapId || typeof prUrl !== "string" || !prUrl) {
      res.status(400).json({ ok: false, error: "Missing gapId or prUrl." });
      return;
    }

    const prNumberMatch = prUrl.match(/\/pull\/(\d+)/);
    const prNumber = prNumberMatch ? Number(prNumberMatch[1]) : null;

    await db.collection("capability_gaps").doc(gapId).set(
      {
        status: "pending_review",
        prUrl,
        prNumber,
        toolName: typeof toolName === "string" ? toolName : null,
        summary: typeof summary === "string" ? summary : null,
        targetFile: typeof targetFile === "string" && targetFile ? targetFile : null,
      },
      { merge: true }
    );

    const sent = await sendPushNotification(
      `North: "${typeof toolName === "string" ? toolName : "new capability"}" ready for review`,
      typeof summary === "string" && summary ? summary : "Tap to review and approve.",
      `${APP_URL}/capability-review/${gapId}`
    );

    res.status(200).json({ ok: sent });
  }
);

// Proactive opportunity research — see lib/opportunity-research.ts,
// lib/opportunity-store.ts, and 03-Chief-Engine/Opportunity_Engine.md (the
// design this maps to: academic, career, financial, and learning
// opportunities, not scoped to any single topic). Runs on Anthropic's
// Batch API (50% cheaper, typically finishes in under an hour) since
// nothing here is time-sensitive — an opportunity with a deadline weeks or
// months out doesn't need a same-minute answer. Split into submit (every 2
// days) + poll (every 30 min) rather than one long-running scheduled
// function, since a batch can occasionally take longer than a single Cloud
// Function invocation's timeout budget — the poll schedule just checks in
// until it's done, at negligible cost (one Firestore read) when nothing is
// outstanding.
//
// Cron day-of-month step (*/2) isn't perfectly calendar-exact across month
// boundaries — acceptable here, this only needs to be "roughly every two
// days," not precise to the hour.
export const opportunityScanSubmit = onSchedule(
  { schedule: "0 9 */2 * *", timeZone: "America/New_York", secrets: [anthropicApiKey] },
  async () => {
    const pending = await getPendingBatch();
    if (pending) {
      logger.log(`[opportunityScanSubmit] Skipping — batch ${pending.batchId} still outstanding.`);
      return;
    }

    try {
      await submitOpportunityScan(anthropicApiKey.value());
    } catch (error) {
      logger.error("[opportunityScanSubmit] Failed to submit batch:", error);
    }
  }
);

export const opportunityScanPoll = onSchedule(
  { schedule: "every 30 minutes", secrets: [anthropicApiKey] },
  async () => {
    try {
      await pollOpportunityScan(anthropicApiKey.value());
    } catch (error) {
      logger.error("[opportunityScanPoll] Failed to poll batch:", error);
    }
  }
);
