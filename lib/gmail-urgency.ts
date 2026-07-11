import "server-only";
import { adminDb } from "./firebase-admin";
import { getRecentInboxMessages } from "./gmail-client";
import { askClaude } from "./anthropic-client";
import { FieldValue } from "firebase-admin/firestore";

// Extracted from app/api/v1/gmail/check-urgent/route.ts so both the tool
// dispatcher (direct import, no HTTP round-trip) and the existing HTTP route
// (kept as a thin wrapper) share one implementation. See
// North_Vector_JARVIS_Tool_Calling_Migration_Plan.md Section 5.4.
//
// Every evaluated message is marked "surfaced" (urgent or not) with a
// timestamp, and re-evaluated only after a 24h TTL — bounds the candidate
// pool per ask while still giving a message a second look if circumstances
// (or Claude's judgment) change. See
// docs/integrations/calendar-notion-gmail-task.md Section 8.
const SURFACED_TTL_MS = 24 * 60 * 60 * 1000;

const URGENCY_SYSTEM_PROMPT =
  "You are evaluating a single email for whether it is time-sensitive/urgent enough to interrupt " +
  "someone right now (via a phone push notification), as opposed to something that can wait until " +
  "they next check email normally. Be conservative: most email is NOT urgent in this sense, even if " +
  "it's important-sounding or from someone significant. Only judge it urgent if there's a real, " +
  "near-term deadline, an active problem needing a response, or something time-critical happening " +
  "very soon. Respond with EXACTLY one line in this format, nothing else:\n" +
  "URGENT: yes|no | REASON: <one short sentence>";

type UrgencyVerdict = { urgent: boolean; reason: string };

function parseVerdict(text: string): UrgencyVerdict {
  const match = text.match(/URGENT:\s*(yes|no)\s*\|\s*REASON:\s*(.+)/i);

  if (!match) {
    // Fail conservative — an unparseable response is treated as "not urgent"
    // rather than risk a false alarm.
    return { urgent: false, reason: "Could not parse urgency verdict." };
  }

  return { urgent: match[1].toLowerCase() === "yes", reason: match[2].trim() };
}

export type UrgentEmailResult = {
  id: string;
  subject: string;
  reason: string;
};

export type UrgentEmailCheck = {
  evaluatedCount: number;
  urgent: UrgentEmailResult[];
};

// Core Gmail on-demand urgency check — full dedup + evaluation + Firestore
// write-back logic, unchanged from its original home in
// app/api/v1/gmail/check-urgent/route.ts.
export async function checkUrgentEmailsRaw(): Promise<UrgentEmailCheck> {
  const messages = await getRecentInboxMessages(25);

  const surfacedSnapshot = await adminDb.collection("gmail_surfaced").get();
  const surfacedAtByMessageId = new Map<string, number>();

  for (const doc of surfacedSnapshot.docs) {
    const surfacedAt = doc.data().surfacedAt;
    const millis = typeof surfacedAt?.toMillis === "function" ? surfacedAt.toMillis() : 0;
    surfacedAtByMessageId.set(doc.id, millis);
  }

  const now = Date.now();
  const candidates = messages.filter((message) => {
    const surfacedAt = surfacedAtByMessageId.get(message.id);
    return surfacedAt === undefined || now - surfacedAt > SURFACED_TTL_MS;
  });

  console.log(
    `[gmail-urgency] Evaluating ${candidates.length} message(s) (of ${messages.length} fetched, ${messages.length - candidates.length} skipped as recently surfaced).`
  );

  const urgentResults: UrgentEmailResult[] = [];

  for (const message of candidates) {
    const result = await askClaude({
      systemPrompt: URGENCY_SYSTEM_PROMPT,
      userMessage: `Subject: ${message.subject}\n\nBody:\n${message.bodyText.slice(0, 4000)}`,
      maxTokens: 60,
    });

    const verdict = result.ok
      ? parseVerdict(result.text)
      : { urgent: false, reason: "Evaluation failed." };

    if (verdict.urgent) {
      urgentResults.push({ id: message.id, subject: message.subject, reason: verdict.reason });
    }

    // Mark surfaced regardless of verdict — see the TTL note above.
    await adminDb
      .collection("gmail_surfaced")
      .doc(message.id)
      .set({ subject: message.subject, surfacedAt: FieldValue.serverTimestamp() });
  }

  if (urgentResults.length > 0) {
    await adminDb.collection("alerts").add({
      source: "gmail",
      summary: urgentResults.map((r) => r.subject).join("; "),
      sentAt: FieldValue.serverTimestamp(),
    });
  }

  return { evaluatedCount: candidates.length, urgent: urgentResults };
}

// Spoken-summary wrapper for the tool dispatcher — mirrors the formatting
// lib/voice-intent-router.ts's checkUrgentEmails() used to build client-side
// from the JSON response, now built server-side directly with no HTTP round
// trip needed.
export async function checkUrgentEmails(): Promise<string> {
  const { urgent } = await checkUrgentEmailsRaw();

  if (urgent.length === 0) {
    return "Nothing urgent in your inbox right now.";
  }

  const subjects = urgent.map((item) => `"${item.subject}"`).join(", ");
  return `You have ${urgent.length} urgent email${urgent.length === 1 ? "" : "s"}: ${subjects}.`;
}
