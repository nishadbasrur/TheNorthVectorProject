import { Resend } from "resend";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import type { RiskRecord } from "../../lib/risk-engine";

export const resendApiKey = defineSecret("RESEND_API_KEY");

const FROM_ADDRESS = "North Vector <onboarding@resend.dev>";

// Deliberately separate from lib/owner.ts's OWNER_EMAIL (which governs app
// sign-in and Firestore ownership, nishadbasrur@gmail.com). This is the
// dedicated notification inbox — also the Resend account's own verified
// address, so onboarding@resend.dev can deliver to it without domain
// verification. Revisit once notifications need to reach other recipients.
const NOTIFICATION_RECIPIENT_EMAIL = "thenorthvector@gmail.com";

export async function sendEmail(subject: string, text: string, html: string): Promise<boolean> {
  try {
    const resend = new Resend(resendApiKey.value());

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: NOTIFICATION_RECIPIENT_EMAIL,
      subject,
      text,
      html,
    });

    if (error) {
      logger.error("Resend API returned an error sending email", error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Failed to send email via Resend", error);
    return false;
  }
}

function buildRiskSummaryEmail(risks: RiskRecord[]) {
  const subject = `North Vector: ${risks.length} risk${risks.length === 1 ? "" : "s"} flagged today`;

  const text = [
    `Today's risk scan flagged ${risks.length} item(s):`,
    "",
    ...risks.map((risk) => `[${risk.severity.toUpperCase()}] ${risk.title}\n${risk.note}`),
  ].join("\n\n");

  const html = `
    <h2>Today's Risk Scan</h2>
    <p>${risks.length} item(s) flagged:</p>
    <ul>
      ${risks
        .map(
          (risk) =>
            `<li><strong>[${risk.severity.toUpperCase()}]</strong> ${risk.title}<br/><span style="color:#666">${risk.note}</span></li>`
        )
        .join("")}
    </ul>
  `;

  return { subject, text, html };
}

export async function sendRiskSummaryEmail(risks: RiskRecord[]): Promise<boolean> {
  const { subject, text, html } = buildRiskSummaryEmail(risks);
  return sendEmail(subject, text, html);
}
