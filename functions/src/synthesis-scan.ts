import { logger } from "firebase-functions";
import Anthropic from "@anthropic-ai/sdk";
import { assembleSynthesisContext, type SynthesisContext } from "../../lib/synthesis-context";
import { runSynthesis, SYNTHESIS_SYSTEM_PROMPT, serializeContextForPrompt, parseConnections } from "../../lib/synthesis-engine";
import { deliveryChannel } from "../../lib/synthesis-priority";
import { recordSynthesisRun, alreadySurfacedConnection, recordConnection } from "../../lib/synthesis-store";
import {
  recordBatchSubmission,
  getPendingBatch,
  markBatchProcessed,
  type SynthesisContextSummary,
} from "../../lib/synthesis-batch-store";
import { sendPushNotification } from "./push";

// Structurally mirrors urgency-scan.ts's runUrgencyScan (same file shape,
// same sendPushNotification reuse) but calls the context-assembly +
// synthesis + delivery-channel pipeline instead of urgency-scan.ts's
// per-source loops. Does NOT replace urgencyScan — that function's fast,
// cheap, single-source checks (event starting in 15 minutes, Notion
// checkbox) still have value as a fast path and keep running
// independently. This is an additional, slower, deeper pass. See
// North_Vector_Synthesis_Engine_Plan.md Section 7.1.
export type SynthesisScanSummary = {
  connectionsFound: number;
  delivered: number;
};

function contextSummaryOf(context: SynthesisContext): SynthesisContextSummary {
  return {
    generatedAt: context.generatedAt.toISOString(),
    calendarEvents: context.calendarEvents.length,
    inboxMessages: context.inboxMessages.length,
    notionUrgentItems: context.notionUrgentItems.length,
    activeTasks: context.activeTasks.length,
    activeGoals: context.activeGoals.length,
  };
}

// Delivery-decision loop shared in spirit (not in code — the sync and batch
// paths run in genuinely different execution contexts, one immediate, one
// two-phase) by both runSynthesisScan below and pollSynthesisScan further
// down. Kept duplicated rather than forced into one shared helper, same
// tolerance for cross-file duplication this codebase already has between
// e.g. functions/src/opportunity-scan.ts and transcript-batch-scan.ts.
async function deliverConnections(connections: ReturnType<typeof parseConnections>): Promise<string[]> {
  const delivered: string[] = [];

  for (const connection of connections) {
    const channel = deliveryChannel(connection);
    if (channel === "suppress") continue;
    if (await alreadySurfacedConnection(connection)) continue;

    // "interrupt" gets a push right now. "summary" is still recorded (and
    // available via the next on-demand check-in, plus the voice respond
    // route's conversational-opener check) but doesn't push — this is the
    // actual mechanism for "surface generously without spamming pushes":
    // more gets recorded and made available than gets pushed as urgent.
    // See Section 0.1.
    let spoken = false;

    if (channel === "interrupt") {
      const sent = await sendPushNotification(
        connection.urgency === "now" ? "Worth knowing right now" : "Worth knowing",
        `${connection.connection} ${connection.whyItMatters}`
      );

      if (!sent) {
        logger.warn(`Push did not send for synthesis connection: ${connection.connection}`);
      }

      // Spoken the instant the push is sent (even if delivery itself later
      // fails silently, same "attempted = delivered" treatment the rest of
      // this pipeline already uses) — a summary-tier connection is the only
      // kind that should still be waiting for a conversational opener.
      spoken = true;
    }

    await recordConnection(connection, spoken);
    delivered.push(connection.connection);
  }

  return delivered;
}

// OLD synchronous full pipeline — kept for triggerSynthesisScan's manual
// "verify right now" endpoint, which needs an immediate result and can't
// wait on a batch that may take up to roughly an hour to complete. The
// SCHEDULED synthesisScan below uses the Batch API instead
// (submitSynthesisScan/pollSynthesisScan) — see functions/src/
// opportunity-scan.ts for the same submit/poll split and reasoning. Stays
// on the regular (non-batch) API and SYNTHESIS_MODEL (claude-sonnet-5).
export async function runSynthesisScan(): Promise<SynthesisScanSummary> {
  const context = await assembleSynthesisContext();
  const connections = await runSynthesis(context);
  const delivered = await deliverConnections(connections);

  await recordSynthesisRun({
    generatedAt: context.generatedAt,
    sourceCounts: contextSummaryOf(context),
    allConnections: connections,
    delivered,
  });

  logger.info(
    `Synthesis scan complete: ${connections.length} connection(s) found, ${delivered.length} recorded/delivered.`
  );

  return { connectionsFound: connections.length, delivered: delivered.length };
}

// Pattern-matching across a structured context snapshot, not open-ended
// reasoning — Haiku, not Sonnet (unlike the on-demand/manual path above,
// which stays on Sonnet). See functions/src/index.ts's synthesisScan.
const SYNTHESIS_BATCH_MODEL = "claude-haiku-4-5-20251001";
const CUSTOM_ID = "synthesis-scan";

// Submits a new batch request. Deliberately does not itself check for an
// already-outstanding batch — functions/src/index.ts's synthesisScan
// trigger does that (via getPendingBatch) before calling this, same
// division of responsibility as submitOpportunityScan.
export async function submitSynthesisScan(apiKey: string): Promise<string> {
  const context = await assembleSynthesisContext();
  const client = new Anthropic({ apiKey });

  const batch = await client.messages.batches.create({
    requests: [
      {
        custom_id: CUSTOM_ID,
        params: {
          model: SYNTHESIS_BATCH_MODEL,
          max_tokens: 1500,
          system: SYNTHESIS_SYSTEM_PROMPT,
          messages: [{ role: "user", content: serializeContextForPrompt(context) }],
        },
      },
    ],
  });

  await recordBatchSubmission(batch.id, contextSummaryOf(context));
  logger.log(`[synthesisScan] Submitted batch ${batch.id}`);
  return batch.id;
}

// Checks the currently outstanding batch, if any — a single cheap
// Firestore read when nothing is outstanding, so running this often (every
// 30 minutes, see functions/src/index.ts) costs almost nothing.
export async function pollSynthesisScan(apiKey: string): Promise<void> {
  const pending = await getPendingBatch();
  if (!pending) return;

  const client = new Anthropic({ apiKey });
  const batch = await client.messages.batches.retrieve(pending.batchId);

  if (batch.processing_status !== "ended") {
    logger.log(`[synthesisScan] Batch ${pending.batchId} still processing.`);
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
      logger.error(`[synthesisScan] Batch request did not succeed: ${item.result.type}`);
    }
  }

  await markBatchProcessed();

  const connections = parseConnections(foundText);
  const delivered = await deliverConnections(connections);

  await recordSynthesisRun({
    generatedAt: new Date(pending.contextSummary.generatedAt),
    sourceCounts: pending.contextSummary,
    allConnections: connections,
    delivered,
  });

  logger.info(
    `[synthesisScan] Batch ${pending.batchId} processed: ${connections.length} connection(s) found, ${delivered.length} recorded/delivered.`
  );
}
