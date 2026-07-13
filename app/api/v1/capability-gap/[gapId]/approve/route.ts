import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getCapabilityGap, setCapabilityGapStatus } from "@/lib/capability-gap-store";
import { mergePr } from "@/lib/github-pr-client";

// The one action in this whole pipeline that actually ships anything —
// merging squashes the auto-drafted branch into main, which Firebase App
// Hosting then auto-deploys. Everything before this point (drafting,
// typecheck, build, opening the PR) happened with no human involved;
// this route is the human involved.
export async function POST(request: Request, { params }: { params: Promise<{ gapId: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { gapId } = await params;
  const gap = await getCapabilityGap(gapId);

  if (!gap || !gap.prNumber) {
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
