import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendPushNotification } from "./push-server";

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
  // section.
  kind: "capability" | "bug_fix";
  request: string;
  capability: string;
  status: "pending_gap" | "pending_review" | "approved" | "denied";
  prNumber: number | null;
  prUrl: string | null;
  toolName: string | null;
  targetFile: string | null;
  summary: string | null;
};

function parseCapabilityGap(data: FirebaseFirestore.DocumentData): CapabilityGap {
  return {
    kind: data.kind === "bug_fix" ? "bug_fix" : "capability",
    request: typeof data.request === "string" ? data.request : "",
    capability: typeof data.capability === "string" ? data.capability : "",
    status: (data.status as CapabilityGap["status"]) ?? "pending_gap",
    prNumber: typeof data.prNumber === "number" ? data.prNumber : null,
    prUrl: typeof data.prUrl === "string" ? data.prUrl : null,
    toolName: typeof data.toolName === "string" ? data.toolName : null,
    targetFile: typeof data.targetFile === "string" ? data.targetFile : null,
    summary: typeof data.summary === "string" ? data.summary : null,
  };
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
  await adminDb.collection("capability_gaps").doc(gapId).set({ status }, { merge: true });
}
