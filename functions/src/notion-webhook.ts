import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import { logger } from "firebase-functions";
import { createHmac, timingSafeEqual } from "crypto";
import { getNotionWebhookToken, saveNotionWebhookToken } from "../../lib/notion-webhook-store";
import { runUrgencyScan } from "./urgency-scan";

// Real-time Notion push notifications — see North_Vector_Real_Time_Triggers_Plan.md
// Section 1.5. Unlike Calendar/Gmail, there's no code-driven registration
// step: the subscription is created through Notion's own integration
// dashboard (Webhooks tab), the one manual step only Nishad can do — this
// endpoint just needs to exist and handle the verification handshake
// correctly when he does it.

function verifySignature(rawBody: Buffer, secret: string, signatureHeader: string): boolean {
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const expectedBuf = Buffer.from(expected);
  const headerBuf = Buffer.from(signatureHeader);
  // Different lengths would throw inside timingSafeEqual rather than
  // safely return false — checked explicitly first.
  if (expectedBuf.length !== headerBuf.length) return false;
  return timingSafeEqual(expectedBuf, headerBuf);
}

export async function handleNotionWebhook(req: Request, res: Response): Promise<void> {
  const body = req.body as { verification_token?: string; type?: string };

  // One-time verification handshake — Notion POSTs exactly this once, when
  // the subscription is first created in the dashboard. The token doubles
  // as the HMAC secret for every future event, so it's stored, not just
  // acknowledged — and logged clearly, since completing setup requires
  // pasting it back into Notion's "Verify subscription" dialog, a step
  // only Nishad can do.
  if (body?.verification_token) {
    await saveNotionWebhookToken(body.verification_token);
    logger.log(
      `[notion-webhook] Verification token (paste into Notion's Verify subscription dialog): ${body.verification_token}`
    );
    res.status(200).send("OK");
    return;
  }

  const token = await getNotionWebhookToken();
  const signature = req.header("X-Notion-Signature");

  if (!token) {
    logger.warn("[notion-webhook] Rejected: no verification token on file — subscription not yet verified.");
    res.status(403).send("Forbidden");
    return;
  }

  if (!signature || !verifySignature(req.rawBody, token, signature)) {
    logger.warn("[notion-webhook] Rejected: missing or invalid X-Notion-Signature.");
    res.status(403).send("Forbidden");
    return;
  }

  logger.log(`[notion-webhook] Verified event: ${body?.type ?? "unknown"} — re-running urgency evaluation.`);

  try {
    // Reuses the exact same evaluation the 15-minute scheduled scan and
    // the Calendar webhook both already trigger — only what kicks it off
    // differs. No page-detail fetch needed here: runUrgencyScan does its
    // own fresh getUrgentItems() query regardless of which specific page
    // changed, same "notification is just a signal to re-check" shape as
    // the other two sources.
    await runUrgencyScan();
  } catch (error) {
    logger.error("[notion-webhook] Failed to process event:", error);
  }

  res.status(200).send("OK");
}
