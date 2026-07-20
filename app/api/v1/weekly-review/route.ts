import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getMostRecentRetrospective } from "@/lib/weekly-retrospective-store";

// #86 — backs the real /weekly-review page. Returns the most recently
// generated retrospective (see getMostRecentRetrospective for why "most
// recent" rather than strictly "this week's"), or null if the scheduled
// scan hasn't run yet.
export async function GET(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const retrospective = await getMostRecentRetrospective();
  return NextResponse.json({ retrospective });
}
