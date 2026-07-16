import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getStoredOpportunities } from "@/lib/opportunity-store";

// Backs the /opportunities browse page — every opportunity North has
// found via the bi-daily scheduled scan (see
// 03-Chief-Engine/Opportunity_Engine.md), most recently discovered first.
export async function GET(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const opportunities = await getStoredOpportunities(50);
  return NextResponse.json({ opportunities });
}
