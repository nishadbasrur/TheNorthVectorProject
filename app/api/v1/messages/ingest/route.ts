import { NextResponse } from "next/server";
import { requireShortcutSecret } from "@/lib/require-shortcut-secret";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const MAX_LENGTH = 10_000;

export async function POST(request: Request) {
  const auth = requireShortcutSecret(request);
  if (auth !== true) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body as Record<string, unknown>)?.text;

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing or empty 'text' field." }, { status: 400 });
  }

  if (text.length > MAX_LENGTH) {
    return NextResponse.json({ error: `Text exceeds ${MAX_LENGTH} character limit.` }, { status: 413 });
  }

  const docRef = await adminDb.collection("inbox").add({
    text: text.trim(),
    source: "ios-shortcut",
    receivedAt: FieldValue.serverTimestamp(),
    processed: false,
  });

  return NextResponse.json({ ok: true, id: docRef.id }, { status: 201 });
}
