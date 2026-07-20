import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getActionsForDay, dayKey } from "@/lib/action-log-store";
import { getRecentEngagementSummary } from "@/lib/synthesis-store";

// Backs the /activity browse page — #65's "what did you do today without
// me asking" plus #75's engagement readout — today's actions only
// (Nishad's home timezone, see dayKey), owner-gated same as every other
// admin-data route.
export async function GET(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const [actions, engagement] = await Promise.all([
    getActionsForDay(dayKey()),
    getRecentEngagementSummary(20),
  ]);
  return NextResponse.json({ actions, engagement });
}
