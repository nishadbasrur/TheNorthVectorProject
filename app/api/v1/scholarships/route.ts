import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getStoredScholarships } from "@/lib/scholarship-store";

// Backs the /scholarships browse page — every scholarship North has found,
// via either the on-demand research_scholarships tool or the bi-daily
// scheduled scan, most recently discovered first.
export async function GET(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const scholarships = await getStoredScholarships(50);
  return NextResponse.json({ scholarships });
}
