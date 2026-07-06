import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { adminDb } from "@/lib/firebase-admin";
import { getRecentInboxMessages } from "@/lib/gmail-client";
import { askClaude } from "@/lib/anthropic-client";
import { FieldValue } from "firebase-admin/firestore";

// On-demand Gmail urgency check — deliberately NOT a scheduled scan. See
// docs/integrations/calendar-notion-gmail-task.md Section 3 for why: the
// gmail.readonly credential reads the entire inbox, so scans only ever
// happen when Nishad actually asks, never silently in the background.
//
// Every evaluated message is marked "surfaced" (urgent or not) with a
// timestamp, and re-evaluated only after a 24h TTL — bounds the candidate
// pool per ask while still giving a message a second look if circumstances
// (or Claude's judgment) change. See Section 8 of that doc.
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

export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

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
    `[gmail-check-urgent] Evaluating ${candidates.length} message(s) (of ${messages.length} fetched, ${messages.length - candidates.length} skipped as recently surfaced).`
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

  return NextResponse.json({
    evaluatedCount: candidates.length,
    urgent: urgentResults,
  });
}
