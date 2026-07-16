import { logger } from "firebase-functions";
import Anthropic from "@anthropic-ai/sdk";
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

// Bi-daily opportunity research, on Anthropic's Batch API (50% cheaper than
// synchronous calls) since nothing here is time-sensitive — an opportunity
// with a deadline weeks or months out doesn't need a same-minute answer.
// Maps to 03-Chief-Engine/Opportunity_Engine.md's design (academic,
// career, financial, learning opportunities), not scoped to any single
// topic. See functions/src/index.ts's opportunityScanSubmit/
// opportunityScanPoll and lib/opportunity-research.ts's shared prompt/
// parsing.
const OPPORTUNITY_RESEARCH_MODEL = "claude-sonnet-5";
const CUSTOM_ID = "opportunity-scan";

// Submits a new batch request. Deliberately does not itself check for an
// already-outstanding batch — functions/src/index.ts's
// opportunityScanSubmit trigger does that (via getPendingBatch) before
// calling this, so this function stays a pure "submit" action with no
// read-then-write race baked in.
export async function submitOpportunityScan(apiKey: string): Promise<string> {
  const client = new Anthropic({ apiKey });

  const batch = await client.messages.batches.create({
    requests: [
      {
        custom_id: CUSTOM_ID,
        params: {
          model: OPPORTUNITY_RESEARCH_MODEL,
          max_tokens: 2000,
          system: OPPORTUNITY_SYSTEM_PROMPT,
          messages: [{ role: "user", content: OPPORTUNITY_DEFAULT_QUERY }],
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
        },
      },
    ],
  });

  await recordBatchSubmission(batch.id);
  logger.log(`[opportunity-scan] Submitted batch ${batch.id}`);
  return batch.id;
}

// Checks the currently outstanding batch, if any — a single cheap
// Firestore read when nothing is outstanding, so running this often (every
// 30 minutes, see functions/src/index.ts) costs almost nothing. Most
// batches finish in under an hour per Anthropic's docs, but this doesn't
// assume that — it just keeps checking in until processing_status is
// "ended," however long that actually takes.
export async function pollOpportunityScan(apiKey: string): Promise<void> {
  const pending = await getPendingBatch();
  if (!pending) return;

  const client = new Anthropic({ apiKey });
  const batch = await client.messages.batches.retrieve(pending.batchId);

  if (batch.processing_status !== "ended") {
    logger.log(`[opportunity-scan] Batch ${pending.batchId} still processing.`);
    return;
  }

  let foundText = "";
  for await (const item of await client.messages.batches.results(pending.batchId)) {
    if (item.custom_id !== CUSTOM_ID) continue;

    if (item.result.type === "succeeded") {
      const textBlocks = item.result.message.content.filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      foundText = textBlocks.map((block) => block.text).join("\n\n");
    } else {
      logger.error(`[opportunity-scan] Batch request did not succeed: ${item.result.type}`);
    }
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
