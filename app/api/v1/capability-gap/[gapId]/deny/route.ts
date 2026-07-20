import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getCapabilityGap, setCapabilityGapStatus } from "@/lib/capability-gap-store";
import { closePr } from "@/lib/github-pr-client";
import { deleteDraft } from "@/lib/gmail-client";

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
      await deleteDraft(gap.draftId);
    } catch (error) {
      console.error(`[capability-gap] Deny (discard draft) failed for gap ${gapId}:`, error);
      return NextResponse.json({ error: "Discarding the draft failed — check Gmail directly." }, { status: 502 });
    }

    await setCapabilityGapStatus(gapId, "denied");
    return NextResponse.json({ ok: true });
  }

  if (!gap.prNumber) {
    return NextResponse.json({ error: "No reviewable PR found for that gap." }, { status: 404 });
  }

  try {
    await closePr(gap.prNumber);
  } catch (error) {
    console.error(`[capability-gap] Deny (close) failed for gap ${gapId}:`, error);
    return NextResponse.json({ error: "Closing the PR failed — check it on GitHub directly." }, { status: 502 });
  }

  await setCapabilityGapStatus(gapId, "denied");

  return NextResponse.json({ ok: true });
}
