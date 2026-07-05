import { NextResponse } from "next/server";
import { createGoal, getGoals } from "@/lib/goal-store";

export async function GET() {
  const goals = await getGoals();
  return NextResponse.json({ goals });
}

export async function POST(request: Request) {
  const input = await request.json();
  const goal = await createGoal(input);
  return NextResponse.json({ goal }, { status: 201 });
}
