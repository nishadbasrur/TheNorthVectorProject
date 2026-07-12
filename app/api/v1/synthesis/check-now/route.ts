import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { assembleSynthesisContext } from "@/lib/synthesis-context";
import { runSynthesis } from "@/lib/synthesis-engine";
import { deliveryChannel } from "@/lib/synthesis-priority";

// On-demand synthesis — same reasoning pipeline as the scheduled scan
// (functions/src/synthesis-scan.ts), but returned directly rather than
// pushed, and WITHOUT dedup against previously-surfaced connections — a
// live "what should I know" question deserves a complete current answer,
// same reasoning as Calendar/Notion's on-demand endpoints not sharing
// alert_state with their own scheduled scans. Per
// North_Vector_Synthesis_Engine_Plan.md Section 0.1/7.2, an on-demand ask
// gets everything that isn't outright suppressed — not just the
// "interrupt" tier a push notification would use — since asking directly
// is itself a signal you want the fuller picture, not just what would've
// pushed a notification.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const context = await assembleSynthesisContext();
  const connections = await runSynthesis(context);
  const worthMentioning = connections.filter((c) => deliveryChannel(c) !== "suppress");

  return NextResponse.json({ connections: worthMentioning });
}
