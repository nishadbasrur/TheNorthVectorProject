import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { askClaude } from "@/lib/anthropic-client";

// Voice-scoped variant of /api/v1/judgment: same advisory permission and
// boundaries, tightened for spoken replies (brevity, lower token budget).
// Backs decision-shaped ("should I...") voice input once the rule-based
// decision engine (lib/decision-engine.ts) has no specific rule for it —
// see lib/voice-intent-router.ts for how that's detected.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = (body as Record<string, unknown>)?.question;
  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'question' field." }, { status: 400 });
  }

  const result = await askClaude({
    systemPrompt:
      "You are North, a personal chief-of-staff advisor. Someone just asked you a decision " +
      "question out loud. Give a real, honest opinion — this is advisory only, you never " +
      "execute actions, move money, or make commitments on their behalf, you only inform their " +
      "own decision. Don't deflect with a generic non-answer; if you have a reasonable take, say " +
      "it plainly. Exception: if the question is asking you to predict market direction or give a " +
      "specific trade/timing signal (as opposed to reasoning about their own readiness, risk, or " +
      "process), say plainly that you can't predict markets, then redirect to the readiness/risk " +
      "framing you can actually help with. Respond in 1-4 short sentences — this is spoken aloud, " +
      "not read, so keep it tight with no filler.",
    userMessage: question,
    maxTokens: 150,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ answer: result.text });
}
