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

// Real, log-confirmed problem this closes: a busy personal inbox generates
// near-constant new-message events from promotional/newsletter senders
// (LinkedIn, hotel chains, retailers, digests) with zero realistic chance
// of matching a watch like "UConn job application" — yet each one used to
// cost a full nano classification call regardless. These checks are
// deliberately cheap and deterministic, not exhaustive or clever — they
// only need to catch the obvious bulk-mail majority; anything that
// doesn't match one of these still goes to the real classifier exactly as
// before. Never narrows what a watch CAN match, only skips messages that
// were never going to match anything.
//
// Sender local-part patterns strongly associated with automated/bulk
// senders (no-reply, notifications, newsletters, generic marketing
// aliases) — checked against the part before "@" in the sender address.
const BULK_SENDER_LOCAL_PART_RE =
  /^(no-?reply|do-?not-?reply|notifications?|newsletter|marketing|updates?|news|info|hello|mailer-?daemon|alerts?)$/i;

// A short, non-exhaustive list of well-known bulk-mail/marketing-platform
// SENDING domains — catches a retailer/service sending through a
// third-party ESP (email service provider) subdomain rather than their
// own noreply@ address, which the local-part check above would miss.
const BULK_SENDER_DOMAIN_RE =
  /(^|\.)(mailchimp|sendgrid|constantcontact|hubspot|marketo|klaviyo|braze|customeriomail|sparkpost|amazonses|mailgun|exacttarget|campaign-archive|list-manage|salesforce)\.com$/i;

// Pulls the actual address out of a "Display Name <addr@domain.com>"
// From header — Gmail's From header is basically always this shape, but
// falls back to the raw string for the rare header that's just a bare
// address already.
function extractSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).trim().toLowerCase();
}

// Returns a short human-readable reason if `message` looks like bulk mail
// a watch was never going to match, or null if it should go to the real
// classifier. Order matters only for which reason gets logged — all three
// checks are independent, cheap, and evaluated eagerly.
function bulkMailReason(message: InboxMessage): string | null {
  const senderEmail = extractSenderEmail(message.from);
  const atIndex = senderEmail.indexOf("@");
  const localPart = atIndex >= 0 ? senderEmail.slice(0, atIndex) : senderEmail;
  const domain = atIndex >= 0 ? senderEmail.slice(atIndex + 1) : "";

  if (BULK_SENDER_LOCAL_PART_RE.test(localPart)) {
    return `sender local-part "${localPart}" matches a bulk-mail pattern`;
  }
  if (domain && BULK_SENDER_DOMAIN_RE.test(domain)) {
    return `sender domain "${domain}" is a known bulk-mail/marketing platform`;
  }
  if (message.hasListUnsubscribe) {
    return "message carries a List-Unsubscribe header";
  }
  return null;
}

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

  let skippedAsBulk = 0;
  let sentToClassifier = 0;

  // Message-outer, watch-inner (not the reverse) so the bulk-mail check —
  // a property of the message alone, not of any particular watch — runs
  // exactly once per message rather than once per (watch, message) pair,
  // and so its skip gets logged once per message instead of once per
  // active watch.
  for (const message of messages) {
    const bulkReason = bulkMailReason(message);
    if (bulkReason) {
      skippedAsBulk += watches.length;
      console.log(
        `[gmail-watch-evaluator] Skipping ${watches.length} watch check(s) for "${message.subject}" from ${message.from} — looks like bulk mail (${bulkReason}).`
      );
      continue;
    }

    for (const watch of watches) {
      const surfacedRef = db.collection("watch_surfaced").doc(`${watch.id}_${message.id}`);

      // Atomic check-and-claim — replaces the old separate get() then,
      // after classifying, a later set(). That read-then-write gap was a
      // real race: two evaluateWatches() runs overlapping during a burst
      // of pushes could both read "not yet surfaced" before either wrote,
      // each paying for its own classifier call on the same (watch,
      // message) pair. A transaction serializes conflicting reads/writes
      // on the same doc, so only one concurrent run ever proceeds past
      // this point for a given pair — the claim (surfacedAt) is written
      // immediately, before the classifier even runs, not after.
      const shouldEvaluate = await db.runTransaction(async (tx) => {
        const surfacedDoc = await tx.get(surfacedRef);
        const surfacedAtMillis = surfacedDoc.exists ? (surfacedDoc.data()?.surfacedAt?.toMillis?.() ?? 0) : undefined;

        if (surfacedAtMillis !== undefined && now - surfacedAtMillis <= WATCH_SURFACED_TTL_MS) {
          return false; // already claimed (and evaluated) recently by this or another run
        }

        tx.set(surfacedRef, {
          watchId: watch.id,
          messageId: message.id,
          surfacedAt: FieldValue.serverTimestamp(),
        });
        return true;
      });

      if (!shouldEvaluate) continue;

      sentToClassifier++;

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
    }
  }

  console.log(
    `[gmail-watch-evaluator] Run complete: ${messages.length} message(s) x ${watches.length} watch(es) considered — ` +
      `${skippedAsBulk} check(s) pre-filtered as bulk mail, ${sentToClassifier} sent to the classifier, ${matches.length} match(es).`
  );

  return matches;
}
