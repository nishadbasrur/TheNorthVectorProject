import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { askClaude } from "@/lib/anthropic-client";

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
      "You are North, a personal chief-of-staff advisor. Answer the question thoughtfully and " +
      "honestly — this is advisory only. You never execute actions, move money, or make " +
      "commitments on the person's behalf; you only inform their own decision. If the question " +
      "needs information you don't have (e.g. specific facts about a person, place, or current " +
      "event), say so plainly rather than guessing.",
    userMessage: question,
    maxTokens: 500,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ answer: result.text });
}
