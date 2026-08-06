import { logger } from "firebase-functions";
import Anthropic from "@anthropic-ai/sdk";
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
// Cheap, mechanical extraction task, not reasoning — Haiku, not Sonnet
// (unlike opportunity-scan's research pass, which genuinely needs a
// stronger model for live web search + judgment calls on what's real).
const EXTRACTION_MODEL = "claude-haiku-4-5-20251001";

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

  const client = new Anthropic({ apiKey });

  // custom_id must be unique per request within a batch — each transcript's
  // own Drive file ID already is, so no separate ID scheme needed.
  const requestMap: TranscriptBatchRequestMap = {};
  const requests = transcripts.map((transcript) => {
    requestMap[transcript.fileId] = transcript.fileName;
    return {
      custom_id: transcript.fileId,
      params: {
        model: EXTRACTION_MODEL,
        max_tokens: 150,
        system: TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: "user" as const, content: transcript.content }],
      },
    };
  });

  const watermark = new Date();
  const batch = await client.messages.batches.create({ requests });

  await recordBatchSubmission(batch.id, requestMap, watermark);
  logger.log(`[transcript-batch-scan] Submitted batch ${batch.id} with ${requests.length} transcript(s).`);
}

// Checks the currently outstanding batch, if any. Same cheap-when-idle
// shape as pollOpportunityScan (one Firestore read when nothing's
// outstanding).
export async function pollTranscriptBatch(apiKey: string): Promise<void> {
  const pending = await getPendingBatch();
  if (!pending) return;

  const client = new Anthropic({ apiKey });
  const batch = await client.messages.batches.retrieve(pending.batchId);

  if (batch.processing_status !== "ended") {
    logger.log(`[transcript-batch-scan] Batch ${pending.batchId} still processing.`);
    return;
  }

  let extracted = 0;
  let skipped = 0;
  let failed = 0;

  for await (const item of await client.messages.batches.results(pending.batchId)) {
    const transcriptFileName = pending.requestMap[item.custom_id];
    if (!transcriptFileName) {
      // Shouldn't happen (every custom_id we submitted is in our own map),
      // but a batch result for an ID we don't recognize must not crash the
      // whole poll pass over every other result.
      logger.error(`[transcript-batch-scan] Unknown custom_id in batch results: ${item.custom_id}`);
      failed++;
      continue;
    }

    if (item.result.type !== "succeeded") {
      logger.error(
        `[transcript-batch-scan] Request for ${transcriptFileName} did not succeed: ${item.result.type}`
      );
      failed++;
      continue;
    }

    const textBlocks = item.result.message.content.filter(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const responseText = textBlocks.map((block) => block.text).join("\n\n");
    const extraction = parseTranscriptExtraction(responseText);

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
        // Classified in the same Haiku call above (see
        // TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT) rather than costing a
        // second Claude call inside createMemory itself.
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
