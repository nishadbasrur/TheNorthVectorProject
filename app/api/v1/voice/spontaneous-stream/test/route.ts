import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { enqueueSpontaneousSpeech, type SpontaneousSpeechUrgency } from "@/lib/spontaneous-speech-queue";

// Self-service test path for the spontaneous-speech channel — same
// reasoning as app/api/v1/push/test/route.ts (Nishad shouldn't need this
// triggered on his behalf every time). Exercises the exact same
// enqueueSpontaneousSpeech() path every real trigger source
// (gmail-webhook.ts, hourly-checkin-scan.ts, task-reminder-scan.ts,
// class-end-scan.ts) uses, so a successful manual test here is real
// end-to-end proof of the channel, not a simulation of it.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  let body: { text?: unknown; urgency?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" && body.text.trim() ? body.text.trim() : "This is a test of North's spontaneous speech channel.";
  const urgency: SpontaneousSpeechUrgency = body.urgency === "routine" ? "routine" : "urgent";

  const result = await enqueueSpontaneousSpeech({ text, urgency, source: "debug" });

  return NextResponse.json({ ok: true, ...result });
}
