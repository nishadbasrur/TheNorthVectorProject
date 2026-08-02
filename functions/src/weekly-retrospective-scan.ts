import { logger } from "firebase-functions";
import { submitBatch, pollBatch, MODEL_AGENTIC, MODEL_CLASSIFIER, type BatchRequestSpec } from "../../lib/openai-client";
import { assembleWeeklyRetrospectiveContext } from "../../lib/weekly-retrospective-context";
import {
  runWeeklyRetrospective,
  RETROSPECTIVE_SYSTEM_PROMPT,
  serializeContextForPrompt,
  parseRetrospective,
} from "../../lib/weekly-retrospective-engine";
import { saveRetrospective } from "../../lib/weekly-retrospective-store";
import {
  proposeMemoryPromotions,
  PROMOTION_SYSTEM_PROMPT,
  serializeEntriesForPrompt,
  parseProposals,
} from "../../lib/memory-promotion-engine";
import { loadGeneralMemoriesSince } from "../../lib/obsidian-memory-retrieval";
import { logMemoryPromotionProposal } from "../../lib/capability-gap-store";
import {
  recordBatchSubmission,
  getPendingBatch,
  markBatchProcessed,
} from "../../lib/weekly-retrospective-batch-store";
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

// OLD synchronous full pipeline — kept for triggerWeeklyRetrospective's
// manual "verify right now" endpoint, which needs an immediate result and
// can't wait on a batch that may take up to roughly an hour to complete.
// The SCHEDULED weeklyRetrospectiveScan below uses the Batch API instead
// (submitWeeklyRetrospectiveScan/pollWeeklyRetrospectiveScan) — see
// functions/src/opportunity-scan.ts for the same submit/poll split and
// reasoning. Both the retrospective (Sonnet) and the memory-promotion pass
// (Sonnet here too) stay on the regular, non-batch API and their original
// models — only the scheduled path's models changed.
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

  // Genuinely separate concern from the retrospective itself — a failure
  // here must never take down the retrospective that already saved
  // successfully above, so it's wrapped independently rather than let an
  // uncaught error here fail runWeeklyRetrospectiveScan as a whole.
  try {
    const promotions = await proposeMemoryPromotions();
    logger.info(
      `[weeklyRetrospectiveScan] Memory promotions: reviewed ${promotions.entriesReviewed} General/ entries, logged ${promotions.proposalsLogged} proposal(s).`
    );
  } catch (error) {
    logger.error("[weeklyRetrospectiveScan] Memory promotion proposal step failed:", error);
  }

  return { ok: true, weekId: retrospective.weekId };
}

const RETROSPECTIVE_CUSTOM_ID = "weekly-retrospective";
const MEMORY_PROMOTION_CUSTOM_ID = "memory-promotion";
// Matches lib/memory-promotion-engine.ts's proposeMemoryPromotions own
// "last 7 days" window exactly.
const MEMORY_PROMOTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Submits a new batch request — one item for the retrospective itself,
// plus a second item for the memory-promotion pass ONLY if there are
// General/ entries from the last week to review (proposeMemoryPromotions'
// own early-return for an empty window, applied here at submit time
// instead so an empty week doesn't waste a batch request). Deliberately
// does not itself check for an already-outstanding batch —
// functions/src/index.ts's weeklyRetrospectiveScan trigger does that (via
// getPendingBatch) before calling this, same division of responsibility
// as submitOpportunityScan/submitSynthesisScan.
export async function submitWeeklyRetrospectiveScan(apiKey: string): Promise<string> {
  const context = await assembleWeeklyRetrospectiveContext();
  const since = new Date(Date.now() - MEMORY_PROMOTION_WINDOW_MS);
  const entries = await loadGeneralMemoriesSince(since);

  const requests: BatchRequestSpec[] = [
    {
      customId: RETROSPECTIVE_CUSTOM_ID,
      systemPrompt: RETROSPECTIVE_SYSTEM_PROMPT,
      userMessage: serializeContextForPrompt(context),
      maxTokens: 800,
      model: MODEL_AGENTIC, // genuine cross-session reasoning — see this
                             // file's own module comment above
    },
    ...(entries.length > 0
      ? [
          {
            customId: MEMORY_PROMOTION_CUSTOM_ID,
            systemPrompt: PROMOTION_SYSTEM_PROMPT,
            userMessage: serializeEntriesForPrompt(entries),
            maxTokens: 1200,
            model: MODEL_CLASSIFIER, // pattern-matching across a batch of
                                      // General/ entries, not open-ended
                                      // reasoning
          },
        ]
      : []),
  ];

  const result = await submitBatch(requests, apiKey);

  if (!result.ok) {
    throw new Error(`Failed to submit weekly retrospective batch: ${result.error}`);
  }

  await recordBatchSubmission({
    batchId: result.batchId,
    weekId: context.weekId,
    includesMemoryPromotion: entries.length > 0,
  });

  logger.log(
    `[weeklyRetrospectiveScan] Submitted batch ${result.batchId} (weekId=${context.weekId}, memoryPromotion=${entries.length > 0}, entriesReviewed=${entries.length}).`
  );
  return result.batchId;
}

// Checks the currently outstanding batch, if any — a single cheap
// Firestore read when nothing is outstanding, so running this often (every
// 30 minutes, see functions/src/index.ts) costs almost nothing.
export async function pollWeeklyRetrospectiveScan(apiKey: string): Promise<void> {
  const pending = await getPendingBatch();
  if (!pending) return;

  const status = await pollBatch(pending.batchId, apiKey);

  if (!status.ok) {
    logger.error(`[weeklyRetrospectiveScan] Batch poll failed: ${status.error}`);
    return;
  }

  if (status.status === "pending") {
    logger.log(`[weeklyRetrospectiveScan] Batch ${pending.batchId} still processing.`);
    return;
  }

  let retrospectiveText = "";
  let promotionText = "";

  if (status.status === "completed") {
    const retrospectiveResult = status.results.get(RETROSPECTIVE_CUSTOM_ID);
    if (retrospectiveResult?.ok) {
      retrospectiveText = retrospectiveResult.text;
    } else if (retrospectiveResult) {
      logger.error(`[weeklyRetrospectiveScan] Batch request "${RETROSPECTIVE_CUSTOM_ID}" did not succeed: ${retrospectiveResult.error}`);
    }

    const promotionResult = status.results.get(MEMORY_PROMOTION_CUSTOM_ID);
    if (promotionResult?.ok) {
      promotionText = promotionResult.text;
    } else if (promotionResult) {
      logger.error(`[weeklyRetrospectiveScan] Batch request "${MEMORY_PROMOTION_CUSTOM_ID}" did not succeed: ${promotionResult.error}`);
    }
  } else {
    logger.error(`[weeklyRetrospectiveScan] Batch ${pending.batchId} failed: ${status.error}`);
  }

  await markBatchProcessed();

  const retrospective = retrospectiveText ? parseRetrospective(retrospectiveText, pending.weekId) : null;

  if (!retrospective) {
    logger.error("[weeklyRetrospectiveScan] Failed to generate a retrospective — nothing saved.");
  } else {
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
  }

  // Genuinely separate concern from the retrospective itself — a failure
  // here must never take down the retrospective that already saved
  // successfully above, same isolation as the old synchronous path.
  if (pending.includesMemoryPromotion) {
    try {
      const proposals = promotionText ? parseProposals(promotionText) : [];
      for (const proposal of proposals) {
        await logMemoryPromotionProposal(proposal);
      }
      logger.info(`[weeklyRetrospectiveScan] Memory promotions: logged ${proposals.length} proposal(s).`);
    } catch (error) {
      logger.error("[weeklyRetrospectiveScan] Memory promotion proposal step failed:", error);
    }
  }
}
