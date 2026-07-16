import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getRecentToolErrors } from "@/lib/tool-error-log";

// Backs the /tool-errors browse page — most recent structured tool
// failures, owner-gated same as every other admin-data route.
export async function GET(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const errors = await getRecentToolErrors(50);
  return NextResponse.json({ errors });
}
