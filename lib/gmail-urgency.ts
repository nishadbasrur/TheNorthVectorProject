import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getRecentInboxMessages } from "./gmail-client";
import { askClaude } from "./anthropic-client";

// Deliberately no "server-only" guard, lazy admin-app init instead of
// importing lib/firebase-admin.ts's adminDb — shared cross-runtime, same
// reasoning as lib/google-calendar-client.ts. Originally Next.js-only
// (extracted from app/api/v1/gmail/check-urgent/route.ts so both the tool
// dispatcher and that HTTP route share one implementation), widened so
// functions/src/gmail-webhook.ts can call the exact same evaluation
// real-time push notifications trigger, not a duplicate copy of it. See
// North_Vector_JARVIS_Tool_Calling_Migration_Plan.md Section 5.4.
function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}
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
  ensureAdminApp();
  const db = getFirestore();
  const messages = await getRecentInboxMessages(25);

  const surfacedSnapshot = await db.collection("gmail_surfaced").get();
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
    await db
      .collection("gmail_surfaced")
      .doc(message.id)
      .set({ subject: message.subject, surfacedAt: FieldValue.serverTimestamp() });
  }

  if (urgentResults.length > 0) {
    await db.collection("alerts").add({
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
