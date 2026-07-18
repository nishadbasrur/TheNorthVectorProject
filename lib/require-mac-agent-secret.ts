import "server-only";
import { NextResponse } from "next/server";

// Validates the shared-secret header used by the Mac Mini local Messages
// agent (scripts/mac-messages-agent/) — mirrors
// lib/require-shortcut-secret.ts's pattern exactly, but deliberately a
// separate secret/credential: this one's read by a persistent background
// process with Full Disk Access to an entire message history, a
// meaningfully different trust boundary than a one-shot Shortcut share, so
// it gets its own narrowly-scoped secret rather than reusing
// SHORTCUT_INGEST_SECRET.
export function requireMacAgentSecret(request: Request): true | NextResponse {
  const expected = process.env.MAC_AGENT_INGEST_SECRET;

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
