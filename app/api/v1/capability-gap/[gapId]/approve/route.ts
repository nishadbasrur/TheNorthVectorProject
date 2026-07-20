import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getCapabilityGap, setCapabilityGapStatus } from "@/lib/capability-gap-store";
import { mergePr } from "@/lib/github-pr-client";
import { sendExistingDraft } from "@/lib/gmail-client";

// The one action in this whole pipeline that actually ships/sends anything.
// Branches by kind: "capability"/"bug_fix" merge a PR (everything before
// this point — drafting, typecheck, build, opening the PR — happened with
// no human involved; this route is the human involved). #87's "draft_email"
// has no PR at all — approving it just sends the Gmail draft that already
// exists.
export async function POST(request: Request, { params }: { params: Promise<{ gapId: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { gapId } = await params;
  const gap = await getCapabilityGap(gapId);

  if (!gap) {
    return NextResponse.json({ error: "No gap found for that id." }, { status: 404 });
  }

  if (gap.kind === "draft_email") {
    if (!gap.draftId) {
      return NextResponse.json({ error: "No draft found for that gap." }, { status: 404 });
    }

    try {
      await sendExistingDraft(gap.draftId);
    } catch (error) {
      console.error(`[capability-gap] Approve (send draft) failed for gap ${gapId}:`, error);
      return NextResponse.json({ error: "Sending the draft failed — check Gmail directly." }, { status: 502 });
    }

    await setCapabilityGapStatus(gapId, "approved");
    return NextResponse.json({ ok: true });
  }

  if (!gap.prNumber) {
    return NextResponse.json({ error: "No reviewable PR found for that gap." }, { status: 404 });
  }

  try {
    await mergePr(gap.prNumber);
  } catch (error) {
    console.error(`[capability-gap] Approve (merge) failed for gap ${gapId}:`, error);
    return NextResponse.json({ error: "Merge failed — check the PR on GitHub directly." }, { status: 502 });
  }

  await setCapabilityGapStatus(gapId, "approved");

  return NextResponse.json({ ok: true });
}
