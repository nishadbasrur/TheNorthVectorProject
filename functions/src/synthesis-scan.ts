import { logger } from "firebase-functions";
import { assembleSynthesisContext } from "../../lib/synthesis-context";
import { runSynthesis } from "../../lib/synthesis-engine";
import { deliveryChannel } from "../../lib/synthesis-priority";
import { recordSynthesisRun, alreadySurfacedConnection, recordConnection } from "../../lib/synthesis-store";
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

export async function runSynthesisScan(): Promise<SynthesisScanSummary> {
  const context = await assembleSynthesisContext();
  const connections = await runSynthesis(context);

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

  await recordSynthesisRun({ context, allConnections: connections, delivered });

  logger.info(
    `Synthesis scan complete: ${connections.length} connection(s) found, ${delivered.length} recorded/delivered.`
  );

  return { connectionsFound: connections.length, delivered: delivered.length };
}
