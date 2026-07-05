import "server-only";
import { NextResponse } from "next/server";

// Validates the shared-secret header used by the iOS Shortcut ingest path.
// Separate from require-owner.ts (Firebase ID token auth) since the Shortcut
// has no Firebase session — it's a single fixed secret known only to the
// Shortcut config and the server env.
export function requireShortcutSecret(request: Request): true | NextResponse {
  const expected = process.env.SHORTCUT_INGEST_SECRET;

  if (!expected) {
    // Fail closed if the secret isn't configured — never fall back to "allow".
    return NextResponse.json({ error: "Ingest secret not configured." }, { status: 500 });
  }

  const provided = request.headers.get("x-ingest-secret");

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return true;
}
