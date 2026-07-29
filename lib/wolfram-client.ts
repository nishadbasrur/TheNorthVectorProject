import "server-only";

// Tier 1 of the Sandbox's three-tier visual system (see
// app/api/v1/voice/respond/route.ts's scanner and lib/visual-scanner.ts's
// detectWolframQuery) — WOLFRAM_APP_ID never reaches the client either way:
// this always runs server-side, whether called from the voice route's
// scanner or app/api/v1/wolfram/route.ts's manual endpoint. Next.js-only,
// not shared with the Cloud Functions runtime (unlike most lib/ files in
// this codebase), so the "server-only" guard here is safe.
// v1, not v2 — v2/simple doesn't exist. v2 is the Full Results API
// (/v2/query, returns XML/JSON, input param named "input"); the
// image-based Simple API this function actually wants lives at v1/simple
// with an "i" param (confirmed against Wolfram's own Simple API docs:
// https://products.wolframalpha.com/simple-api/documentation). Hitting the
// wrong version here is what was producing the 401s.
const WOLFRAM_SIMPLE_API_URL = "https://api.wolframalpha.com/v1/simple";

// Returns a data: URL (the image bytes themselves, base64-encoded) rather
// than a Wolfram-hosted image URL — DisplayPanel's "image" type just needs
// something usable directly as an <img src>, and a data URL means the
// client never needs a second round-trip (to Wolfram, which would require
// re-exposing the query, or back to us for the bytes) — one fetch, done.
// Returns null on any failure (no interpretation, network error, missing
// key) rather than throwing — a scanner-detected "looks like math" query
// that Wolfram can't actually answer is an expected, non-exceptional
// outcome, not a bug, and must never break the voice response around it.
export async function fetchWolframImage(query: string): Promise<string | null> {
  const appId = process.env.WOLFRAM_APP_ID;
  // Presence/length only, never the value itself — confirms the secret
  // actually made it into this request's environment (e.g. after a
  // Secret Manager access grant or an apphosting.yaml change) without
  // logging anything that could leak it.
  console.log(`[wolfram-client] WOLFRAM_APP_ID present: ${!!appId}${appId ? ` (length ${appId.length})` : ""}`);
  if (!appId) {
    console.error("[wolfram-client] WOLFRAM_APP_ID not configured.");
    return null;
  }

  const url = `${WOLFRAM_SIMPLE_API_URL}?appid=${encodeURIComponent(appId)}&i=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      // Wolfram returns a real error status (commonly 501) when it has no
      // interpretation for the input — not every scanner-detected signal
      // resolves to an actual answer.
      console.warn(`[wolfram-client] Wolfram returned ${response.status} for query: "${query}"`);
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "image/gif";
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("[wolfram-client] Wolfram request failed:", error);
    return null;
  }
}
