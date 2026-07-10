import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { getUrgentItems } from "@/lib/notion-client";

// On-demand Notion check — mirrors app/api/v1/calendar/check-upcoming's
// reasoning (see docs/integrations/calendar-notion-gmail-task.md Section
// 6.4): no dedup/alert_state, a fresh snapshot read every time.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const items = await getUrgentItems();

  return NextResponse.json({ items });
}
