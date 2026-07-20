import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendPushNotification } from "./push-server";

// Public production URL — same hardcoded-not-sensitive treatment as
// functions/src/index.ts's own APP_URL constant. Needed here (not just
// there) because notification links must be fully-qualified for the
// service worker's clients.openWindow() to reliably resolve, per
// public/firebase-messaging-sw.js's notificationclick handler.
const APP_URL = "https://north-vector--the-north-vector-project.us-east4.hosted.app";

// Seed of a real "capability gap" workflow — North logs what it couldn't do
// and pushes a notification, instead of the request just evaporating after
// a spoken "I can't do that." Does NOT write or deploy any code itself; a
// human (Nishad, via a normal Claude Code session) reviews the log and
// decides what, if anything, to build. See
// North_Vector_Autonomous_Self_Extension_Plan.md for why the further step
// (North writing and shipping its own new tools with no review) is a
// separate, much larger decision, not implemented here.
export async function logCapabilityGap(request: string, capability: string): Promise<void> {
  await adminDb.collection("capability_gaps").add({
    request,
    capability,
    createdAt: FieldValue.serverTimestamp(),
    status: "pending_gap",
  });

  await sendPushNotification(
    "North: capability gap",
    `${capability} — asked: "${request}"`
  );
}

export type CapabilityGap = {
  // "capability" (default, undefined on older docs) = North couldn't do
  // something a human asked for (note_capability_gap). "bug_fix" = an
  // existing tool actually failed in production (functions/src/index.ts's
  // onToolError, watching lib/tool-error-log.ts's tool_errors collection) —
  // same review-gated draft/PR/approve flow, different origin and a
  // narrower, single-file scope fence in scripts/draft-bugfix.js. See
  // North_Vector_Autonomous_Self_Extension_Plan.md's bug-fix-drafting
  // section. "draft_email" (#87) = North drafted (never sent) an email it
  // noticed Nishad meant to send — reuses this same review-gated
  // propose/approve/deny shape and page, with prNumber/targetFile/diff
  // replaced by to/subject/body/reasoning/draftId below.
  kind: "capability" | "bug_fix" | "draft_email";
  request: string;
  capability: string;
  status: "pending_gap" | "pending_review" | "approved" | "denied";
  prNumber: number | null;
  prUrl: string | null;
  toolName: string | null;
  targetFile: string | null;
  summary: string | null;
  // #58 — whether this approved capability has already been announced to
  // Nishad via the conversational opener (see lib/opener-selector.ts).
  // false/undefined on every doc predating this field, which is the correct
  // default: nothing approved before #58 shipped should retroactively
  // announce itself.
  announced: boolean;
  // #87 — only set for kind "draft_email".
  to: string | null;
  subject: string | null;
  body: string | null;
  reasoning: string | null;
  draftId: string | null;
};

function parseCapabilityGap(data: FirebaseFirestore.DocumentData): CapabilityGap {
  return {
    kind: data.kind === "bug_fix" ? "bug_fix" : data.kind === "draft_email" ? "draft_email" : "capability",
    request: typeof data.request === "string" ? data.request : "",
    capability: typeof data.capability === "string" ? data.capability : "",
    status: (data.status as CapabilityGap["status"]) ?? "pending_gap",
    prNumber: typeof data.prNumber === "number" ? data.prNumber : null,
    prUrl: typeof data.prUrl === "string" ? data.prUrl : null,
    toolName: typeof data.toolName === "string" ? data.toolName : null,
    targetFile: typeof data.targetFile === "string" ? data.targetFile : null,
    summary: typeof data.summary === "string" ? data.summary : null,
    announced: data.announced === true,
    to: typeof data.to === "string" ? data.to : null,
    subject: typeof data.subject === "string" ? data.subject : null,
    body: typeof data.body === "string" ? data.body : null,
    reasoning: typeof data.reasoning === "string" ? data.reasoning : null,
    draftId: typeof data.draftId === "string" ? data.draftId : null,
  };
}

// #87 — logs a drafted-but-unsent email for review, skipping the
// "pending_gap" status entirely (there's no code-drafting step here the way
// note_capability_gap has — the draft itself already exists in Gmail by the
// time this is called). Reuses app/capability-review/[gapId] and its
// approve/deny routes via the "draft_email" kind branch.
export async function logDraftEmailGap(params: {
  to: string;
  subject: string;
  body: string;
  reasoning: string;
  draftId: string;
}): Promise<string> {
  const doc = await adminDb.collection("capability_gaps").add({
    kind: "draft_email",
    status: "pending_review",
    request: params.reasoning,
    capability: `Draft email to ${params.to}`,
    summary: params.reasoning,
    to: params.to,
    subject: params.subject,
    body: params.body,
    reasoning: params.reasoning,
    draftId: params.draftId,
    createdAt: FieldValue.serverTimestamp(),
  });

  await sendPushNotification(
    `North: drafted an email to ${params.to}`,
    params.reasoning,
    `${APP_URL}/capability-review/${doc.id}`
  );

  return doc.id;
}

// Backs app/api/v1/capability-gap/[gapId] (the in-app review page's data
// source) — read by an owner-gated route, so no Firestore rule change
// needed beyond the existing owner-read/admin-write-only capability_gaps
// rule.
export async function getCapabilityGap(gapId: string): Promise<CapabilityGap | null> {
  const doc = await adminDb.collection("capability_gaps").doc(gapId).get();
  if (!doc.exists) return null;
  return parseCapabilityGap(doc.data() ?? {});
}

export type CapabilityGapSummary = CapabilityGap & { id: string; createdAt: string | null };

// Backs the check_bug_status voice tool — "what's in the bug/capability
// pipeline" needs a list, not a single gap by id like getCapabilityGap.
// Most recent first.
export async function getRecentCapabilityGaps(maxResults = 20): Promise<CapabilityGapSummary[]> {
  const snapshot = await adminDb
    .collection("capability_gaps")
    .orderBy("createdAt", "desc")
    .limit(maxResults)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...parseCapabilityGap(data),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    };
  });
}

export async function setCapabilityGapStatus(
  gapId: string,
  status: "approved" | "denied"
): Promise<void> {
  // Approval also opens the #58 announcement window (announced: false) and
  // stamps approvedAt — nothing else reads approvedAt today, it's just a
  // debugging breadcrumb for when the announcement window opened.
  const update =
    status === "approved"
      ? { status, announced: false, approvedAt: FieldValue.serverTimestamp() }
      : { status };
  await adminDb.collection("capability_gaps").doc(gapId).set(update, { merge: true });
}

// Backs lib/opener-selector.ts's #58 candidate — an approved NEW CAPABILITY
// (kind === "capability" specifically — a "you just approved a new
// capability" announcement wouldn't make sense for an approved bug_fix or
// draft_email, which have their own delivery/framing) nobody's been told
// about yet. Three equality filters only (no orderBy), same
// no-composite-index-needed reasoning as onToolError's dedup query in
// functions/src/index.ts. Picks the most recently approved client-side if
// more than one is somehow outstanding.
export async function getUnannouncedApprovedCapability(): Promise<CapabilityGapSummary | null> {
  const snapshot = await adminDb
    .collection("capability_gaps")
    .where("kind", "==", "capability")
    .where("status", "==", "approved")
    .where("announced", "==", false)
    .get();

  if (snapshot.empty) return null;

  const candidates = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...parseCapabilityGap(data),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      };
    })
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return candidates[0];
}

export async function markCapabilityAnnounced(gapId: string): Promise<void> {
  await adminDb.collection("capability_gaps").doc(gapId).set({ announced: true }, { merge: true });
}
