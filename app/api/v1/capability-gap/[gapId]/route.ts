import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getCapabilityGap } from "@/lib/capability-gap-store";
import { getPrDiff } from "@/lib/github-pr-client";

// Backs the in-app review page (app/capability-review/[gapId]) — the
// actual point of this endpoint is fetching the real PR diff, not just the
// gap metadata, so approve/deny is an informed decision made in the app
// rather than a blind tap.
export async function GET(request: Request, { params }: { params: Promise<{ gapId: string }> }) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const { gapId } = await params;
  const gap = await getCapabilityGap(gapId);

  if (!gap) {
    return NextResponse.json({ error: "No capability gap found for that id." }, { status: 404 });
  }

  let diff: string | null = null;
  if (gap.prNumber) {
    try {
      diff = await getPrDiff(gap.prNumber);
    } catch (error) {
      console.error(`[capability-gap] Failed to fetch diff for PR #${gap.prNumber}:`, error);
      // Still return the gap itself — the review page can show "diff
      // unavailable" rather than fail outright over a GitHub API hiccup.
    }
  }

  return NextResponse.json({ ...gap, diff });
}
