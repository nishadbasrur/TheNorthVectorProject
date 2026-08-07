import { logger } from "firebase-functions";
import { submitBatch, pollBatch, MODEL_AGENTIC } from "../../lib/openai-client";
import {
  filterNewOpportunities,
  saveOpportunities,
  recordBatchSubmission,
  getPendingBatch,
  markBatchProcessed,
} from "../../lib/opportunity-store";
import {
  OPPORTUNITY_SYSTEM_PROMPT,
  OPPORTUNITY_DEFAULT_QUERY,
  parseOpportunityCandidates,
} from "../../lib/opportunity-research";
import { sendPushNotification } from "./push";

// Bi-daily opportunity research, on the Batch API (cheaper than synchronous
// calls) since nothing here is time-sensitive — an opportunity with a
// deadline weeks or months out doesn't need a same-minute answer. Maps to
// 03-Chief-Engine/Opportunity_Engine.md's design (academic, career,
// financial, learning opportunities), not scoped to any single topic. See
// functions/src/index.ts's opportunityScanSubmit/opportunityScanPoll and
// lib/opportunity-research.ts's shared prompt/parsing.
const CUSTOM_ID = "opportunity-scan";

// Submits a new batch request. Deliberately does not itself check for an
// already-outstanding batch — functions/src/index.ts's
// opportunityScanSubmit trigger does that (via getPendingBatch) before
// calling this, so this function stays a pure "submit" action with no
// read-then-write race baked in.
export async function submitOpportunityScan(apiKey: string): Promise<string> {
  const result = await submitBatch(
    [
      {
        customId: CUSTOM_ID,
        systemPrompt: OPPORTUNITY_SYSTEM_PROMPT,
        userMessage: OPPORTUNITY_DEFAULT_QUERY,
        maxTokens: 2000,
        model: MODEL_AGENTIC,
        webSearch: true,
      },
    ],
    apiKey
  );

  if (!result.ok) {
    throw new Error(`Failed to submit opportunity batch: ${result.error}`);
  }

  await recordBatchSubmission(result.batchId);
  logger.log(`[opportunity-scan] Submitted batch ${result.batchId}`);
  return result.batchId;
}

// Checks the currently outstanding batch, if any — a single cheap
// Firestore read when nothing is outstanding, so running this often (every
// 30 minutes, see functions/src/index.ts) costs almost nothing. Most
// batches finish well within the 24h window, but this doesn't assume
// that — it just keeps checking in until the batch is done, however long
// that actually takes.
export async function pollOpportunityScan(apiKey: string): Promise<void> {
  const pending = await getPendingBatch();
  if (!pending) return;

  const status = await pollBatch(pending.batchId, apiKey);

  if (!status.ok) {
    logger.error(`[opportunity-scan] Batch poll failed: ${status.error}`);
    return;
  }

  if (status.status === "pending") {
    logger.log(`[opportunity-scan] Batch ${pending.batchId} still processing.`);
    return;
  }

  let foundText = "";
  if (status.status === "completed") {
    const result = status.results.get(CUSTOM_ID);
    if (result?.ok) {
      foundText = result.text;
    } else {
      logger.error(`[opportunity-scan] Batch request did not succeed: ${result?.error ?? "no result"}`);
    }
  } else {
    logger.error(`[opportunity-scan] Batch ${pending.batchId} failed: ${status.error}`);
  }

  await markBatchProcessed();

  const candidates = parseOpportunityCandidates(foundText);
  if (candidates.length === 0) {
    logger.log("[opportunity-scan] No candidates parsed from batch result.");
    return;
  }

  // Silent when there's nothing new — a scan re-finding the same handful
  // of opportunities every couple of days shouldn't ping Nishad's phone
  // each time. Only a genuinely new finding is worth a notification.
  const newOnes = await filterNewOpportunities(candidates);
  if (newOnes.length === 0) {
    logger.log("[opportunity-scan] Nothing new — staying quiet.");
    return;
  }

  await saveOpportunities(newOnes);

  const titles = newOnes.map((o) => o.title).join(", ");
  await sendPushNotification(
    `North: found ${newOnes.length} new opportunit${newOnes.length === 1 ? "y" : "ies"}`,
    titles
  );
}
