import { logger } from "firebase-functions";
import { submitBatch, pollBatch, MODEL_CLASSIFIER, type BatchRequestSpec } from "../../lib/openai-client";
import { listTranscriptsSince } from "../../lib/transcript-store";
import { createMemory, extractTags } from "../../lib/obsidian-memory-store";
import { embedText, storeEmbedding } from "../../lib/memory-embeddings";
import {
  getLastRunAt,
  getPendingBatch,
  recordBatchSubmission,
  markBatchProcessed,
  type TranscriptBatchRequestMap,
} from "../../lib/transcript-batch-store";
import { TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT, parseTranscriptExtraction } from "../../lib/transcript-batch-prompt";

// Nightly Tier 1 → Tier 2 filter: Transcripts/ (raw voice capture, no AI —
// see lib/transcript-store.ts and app/api/v1/voice/respond/route.ts) into
// General/ (filtered signal — opinions, decisions, commitments, actions,
// values). Structurally mirrors functions/src/opportunity-scan.ts's
// submit/poll Batch API pattern exactly — same split for the same reason
// (a batch can take longer than one Cloud Function invocation's timeout
// budget; poll just checks in until it's done). The one real structural
// difference: opportunity-scan submits exactly one request per batch:
// this submits ONE REQUEST PER TRANSCRIPT (however many accumulated since
// the last run), each with its own custom_id, so poll can map each result
// back to its source transcript. See
// North_Vector_Three_Tier_Memory_Pipeline_Plan.md.
//
// Submits a new batch request — one message per transcript captured since
// the last run. Deliberately does not itself check for an already-
// outstanding batch — functions/src/index.ts's transcriptBatchSubmit
// trigger does that (via getPendingBatch) before calling this, same
// division of responsibility as submitOpportunityScan.
export async function submitTranscriptBatch(apiKey: string): Promise<void> {
  const since = await getLastRunAt();
  const transcripts = await listTranscriptsSince(since);

  if (transcripts.length === 0) {
    logger.log(`[transcript-batch-scan] No new transcripts since ${since.toISOString()}.`);
    return;
  }

  // custom_id must be unique per request within a batch — each transcript's
  // own Drive file ID already is, so no separate ID scheme needed.
  const requestMap: TranscriptBatchRequestMap = {};
  const requests: BatchRequestSpec[] = transcripts.map((transcript) => {
    requestMap[transcript.fileId] = transcript.fileName;
    return {
      customId: transcript.fileId,
      systemPrompt: TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT,
      userMessage: transcript.content,
      maxTokens: 150,
      model: MODEL_CLASSIFIER, // cheap, mechanical extraction task, not
                                // reasoning
    };
  });

  const watermark = new Date();
  const result = await submitBatch(requests, apiKey);

  if (!result.ok) {
    throw new Error(`Failed to submit transcript batch: ${result.error}`);
  }

  await recordBatchSubmission(result.batchId, requestMap, watermark);
  logger.log(`[transcript-batch-scan] Submitted batch ${result.batchId} with ${requests.length} transcript(s).`);
}

// Checks the currently outstanding batch, if any. Same cheap-when-idle
// shape as pollOpportunityScan (one Firestore read when nothing's
// outstanding).
export async function pollTranscriptBatch(apiKey: string): Promise<void> {
  const pending = await getPendingBatch();
  if (!pending) return;

  const status = await pollBatch(pending.batchId, apiKey);

  if (!status.ok) {
    logger.error(`[transcript-batch-scan] Batch poll failed: ${status.error}`);
    return;
  }

  if (status.status === "pending") {
    logger.log(`[transcript-batch-scan] Batch ${pending.batchId} still processing.`);
    return;
  }

  let extracted = 0;
  let skipped = 0;
  let failed = 0;

  if (status.status !== "completed") {
    logger.error(`[transcript-batch-scan] Batch ${pending.batchId} failed: ${status.error}`);
    await markBatchProcessed();
    return;
  }

  for (const [customId, transcriptFileName] of Object.entries(pending.requestMap)) {
    const result = status.results.get(customId);
    if (!result) {
      // Shouldn't happen (every custom_id we submitted is in our own map),
      // but a missing batch result for an ID we submitted must not crash
      // the whole poll pass over every other result.
      logger.error(`[transcript-batch-scan] No batch result for custom_id: ${customId}`);
      failed++;
      continue;
    }

    if (!result.ok) {
      logger.error(`[transcript-batch-scan] Request for ${transcriptFileName} did not succeed: ${result.error}`);
      failed++;
      continue;
    }

    const extraction = parseTranscriptExtraction(result.text);

    if (extraction === null) {
      skipped++;
      continue;
    }

    const { category, paraphrase } = extraction;

    try {
      const tags = await extractTags(paraphrase);
      const { fileId } = await createMemory({
        content: paraphrase,
        domain: "general",
        type: "transcript-extract",
        tier: "general",
        tags,
        // Classified in the same classifier-tier call above (see
        // TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT) rather than costing a
        // second call inside createMemory itself.
        category,
        extraFrontmatter: {
          source: "transcript-batch",
          "original-transcript": transcriptFileName,
        },
      });

      // Same embedding treatment every other General note gets (see
      // app/api/v1/memories/create/route.ts) — no special handling, per
      // the plan's explicit instruction.
      const vector = await embedText(paraphrase, "document");
      await storeEmbedding(fileId, vector, tags);

      extracted++;
    } catch (error) {
      logger.error(`[transcript-batch-scan] Failed to write General note for ${transcriptFileName}:`, error);
      failed++;
    }
  }

  await markBatchProcessed();

  logger.log(
    `[transcript-batch-scan] Batch ${pending.batchId} processed: ${extracted} extracted, ${skipped} nothing-worth-capturing, ${failed} failed.`
  );
}
