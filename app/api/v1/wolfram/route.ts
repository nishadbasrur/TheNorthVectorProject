import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { fetchWolframImage } from "@/lib/wolfram-client";

// Thin, directly-callable wrapper around lib/wolfram-client.ts — mainly for
// manual testing. The live trigger path is app/api/v1/voice/respond/route.ts's
// own scanner, which calls fetchWolframImage directly (no self-HTTP round
// trip) once per assembled response. WOLFRAM_APP_ID never reaches the
// client either way — it's read from env inside fetchWolframImage, which
// only ever runs server-side.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = (body as Record<string, unknown>)?.query;
  if (typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'query' field." }, { status: 400 });
  }

  const imageDataUrl = await fetchWolframImage(query.trim());
  if (!imageDataUrl) {
    return NextResponse.json({ error: "Wolfram Alpha had no result for that query." }, { status: 502 });
  }

  return NextResponse.json({ imageDataUrl });
}
