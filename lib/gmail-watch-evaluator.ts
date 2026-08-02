// Deliberately no "server-only" guard, cross-runtime — this is what
// functions/src/gmail-webhook.ts's real-time Gmail push handler calls to
// run active watches against new mail, same sharing reasoning as
// lib/gmail-urgency.ts (which this file deliberately mirrors the shape
// of, rather than reusing its gmail_surfaced dedup — see WATCH_SURFACED
// note below for why that has to be a separate collection).
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "./ensure-firebase-app";
import { getRecentInboxMessages, type InboxMessage } from "./gmail-client";
import { listWatchesAsAdmin, type WatchRecord } from "./watch-store-admin";
import { askOpenAI, MODEL_CLASSIFIER } from "./openai-client";

// Keyed per (watch, message) pair in its own `watch_surfaced` collection
// — deliberately NOT lib/gmail-urgency.ts's `gmail_surfaced` (which marks
// a message surfaced regardless of which check ran, or whether it
// matched). A message already marked surfaced for the standing urgency
// check says nothing about whether THIS watch has evaluated it, and a
// watch created after a message already exists still needs its own
// first look at that message. Same 24h TTL as gmail_surfaced, for the
// same "bound the candidate pool, still get a second look eventually"
// reasoning.
const WATCH_SURFACED_TTL_MS = 24 * 60 * 60 * 1000;

const WATCH_MATCH_SYSTEM_PROMPT =
  "You are evaluating whether a single email matches a specific watch a user set up, using real " +
  "understanding of the email's content and intent — not keyword presence. An email that merely " +
  "mentions a name/company/topic in passing, or uses similar words in an unrelated context, should " +
  "NOT match; only judge it a match if the email is genuinely about what the watch describes. " +
  "Respond with EXACTLY one line in this format, nothing else:\n" +
  "MATCH: yes|no | REASON: <one short sentence>";

type WatchMatchVerdict = { matched: boolean; reason: string };

function parseWatchVerdict(text: string): WatchMatchVerdict {
  const match = text.match(/MATCH:\s*(yes|no)\s*\|\s*REASON:\s*(.+)/i);

  if (!match) {
    // Fail conservative — same reasoning as lib/gmail-urgency.ts's own
    // parseVerdict: an unparseable response shouldn't fire a false-alarm
    // push.
    return { matched: false, reason: "Could not parse match verdict." };
  }

  return { matched: match[1].toLowerCase() === "yes", reason: match[2].trim() };
}

export type WatchMatch = { watch: WatchRecord; message: InboxMessage; reason: string };

// Runs every active watch against every recent candidate email. Cheap to
// call unconditionally from the real-time Gmail push handler — returns
// immediately with no Gmail/Claude calls at all when there are no active
// watches, which is the common case until create_watch is actually used.
export async function evaluateWatches(): Promise<WatchMatch[]> {
  const watches = await listWatchesAsAdmin();
  if (watches.length === 0) return [];

  const messages = await getRecentInboxMessages(25);
  if (messages.length === 0) return [];

  ensureFirebaseApp();
  const db = getFirestore();
  const matches: WatchMatch[] = [];
  const now = Date.now();

  for (const watch of watches) {
    for (const message of messages) {
      const surfacedRef = db.collection("watch_surfaced").doc(`${watch.id}_${message.id}`);
      const surfacedDoc = await surfacedRef.get();
      const surfacedAtMillis = surfacedDoc.exists
        ? (surfacedDoc.data()?.surfacedAt?.toMillis?.() ?? 0)
        : undefined;

      if (surfacedAtMillis !== undefined && now - surfacedAtMillis <= WATCH_SURFACED_TTL_MS) {
        continue; // already evaluated this exact (watch, message) pair recently
      }

      const result = await askOpenAI({
        systemPrompt: WATCH_MATCH_SYSTEM_PROMPT,
        userMessage:
          `Watch criteria: ${watch.criteria}\n\n` +
          `Email —\nSubject: ${message.subject}\nFrom: ${message.from}\n\nBody:\n${message.bodyText.slice(0, 4000)}`,
        maxTokens: 60,
        model: MODEL_CLASSIFIER,
      });

      const verdict = result.ok ? parseWatchVerdict(result.text) : { matched: false, reason: "Evaluation failed." };

      if (verdict.matched) {
        matches.push({ watch, message, reason: verdict.reason });
      }

      await surfacedRef.set({
        watchId: watch.id,
        messageId: message.id,
        surfacedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  return matches;
}
