import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";

// Self-service test path for the urgency-alert push pipeline, so Nishad
// doesn't need this triggered on his behalf every time. Same-origin (unlike
// the Cloud Function's sendTestUrgency HTTP endpoint, which has no CORS/
// OPTIONS handling and can't be called directly from a browser) — this
// route sends the notification itself via the Admin SDK rather than
// forwarding to that function.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const subscriptions = await adminDb.collection("push_subscriptions").get();

  if (subscriptions.empty) {
    return NextResponse.json(
      { ok: false, error: "No devices have enabled alerts yet." },
      { status: 400 }
    );
  }

  let sent = 0;
  for (const doc of subscriptions.docs) {
    const token = doc.data().token as string | undefined;
    if (!token) continue;

    try {
      await adminMessaging.send({
        token,
        notification: {
          title: "North Vector: test alert",
          body: "This is a manual test of the urgency-alert push pipeline. If you're reading this, delivery works.",
        },
      });
      sent += 1;
    } catch {
      // A single bad/expired token shouldn't fail the whole test — keep
      // trying the rest and report how many actually succeeded.
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      { ok: false, error: "Push failed for every registered device." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, sentCount: sent, totalCount: subscriptions.size });
}
