import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { askClaude } from "@/lib/anthropic-client";
import { getPreferences, formatPreferencesForPrompt } from "@/lib/preferences-store";
import { detectAndStorePreference } from "@/lib/preference-detector";
import { CAPABILITY_MANIFEST } from "@/lib/capability-manifest";

// Backs the voice pipeline's "unrecognized" fallback — called only when the
// rule-based classifier in lib/voice-intent-router.ts couldn't place the
// transcript as a task or a known decision pattern. See askClaude's
// docstring in lib/anthropic-client.ts for the shared budget/logging point.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body as Record<string, unknown>)?.text;
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'text' field." }, { status: 400 });
  }

  const preferences = await getPreferences();

  const systemPrompt =
    "You are North, a personal chief-of-staff assistant. Someone just spoke to you and your " +
    "rule-based classifier couldn't categorize it as a task, status request, or decision. " +
    "Respond in 1-2 short sentences, conversationally, matching the brevity rule in the North " +
    "voice interface spec (Phase 1: 1-4 sentences, no filler). Keep the whole answer under 40 " +
    "words and make sure it's a complete, finished thought — never trail off mid-sentence. If " +
    "it sounds like something actionable that just didn't match a known pattern, say so plainly " +
    "rather than guessing what they meant.\n\n" +
    CAPABILITY_MANIFEST +
    formatPreferencesForPrompt(preferences);

  const [result] = await Promise.all([
    askClaude({ systemPrompt, userMessage: text, maxTokens: 220 }),
    detectAndStorePreference(text),
  ]);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ responseText: result.text });
}
