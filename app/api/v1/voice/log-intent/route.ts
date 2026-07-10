import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Fire-and-forget branch-tracking log, called from
// lib/voice-intent-router.ts on every voice input (never awaited by the
// caller, so a failure here never affects the actual voice response). Lets
// us see whether the loose-match keyword lists for Email/Calendar/Notion
// are actually catching real phrasings, or need adjusting — see
// North_Vector_Intent_and_Capability_Awareness_Plan.md Section 11.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const transcript = (body as Record<string, unknown>)?.transcript;
  const type = (body as Record<string, unknown>)?.type;

  if (typeof transcript !== "string" || typeof type !== "string") {
    return NextResponse.json({ error: "Missing 'transcript' or 'type' field." }, { status: 400 });
  }

  await adminDb.collection("voice_intent_log").add({
    transcript,
    type,
    loggedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
