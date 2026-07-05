import { NextResponse } from "next/server";
import { evaluateDecision } from "@/lib/decision-engine";

export async function GET() {
  return NextResponse.json({ items: [] });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const question =
      typeof body.question === "string" ? body.question : "";

    if (!question.trim()) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    const result = await evaluateDecision(question);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to evaluate decision", error);
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}