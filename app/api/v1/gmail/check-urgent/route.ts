import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { checkUrgentEmailsRaw } from "@/lib/gmail-urgency";

// On-demand Gmail urgency check — deliberately NOT a scheduled scan. See
// docs/integrations/calendar-notion-gmail-task.md Section 3 for why: the
// gmail.readonly credential reads the entire inbox, so scans only ever
// happen when Nishad actually asks, never silently in the background.
//
// The dedup/evaluation/write-back logic itself now lives in
// lib/gmail-urgency.ts so it's directly importable by the voice tool
// dispatcher (lib/tool-dispatcher.ts) without an HTTP self-call — this route
// is a thin wrapper kept for any external/manual-curl caller. See
// North_Vector_JARVIS_Tool_Calling_Migration_Plan.md Section 5.4 and 10.2.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const result = await checkUrgentEmailsRaw();
  return NextResponse.json(result);
}
