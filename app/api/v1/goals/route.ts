import { NextResponse } from "next/server";
import { createGoal, listGoals } from "@/services/goal-service";

function getUserId(request: Request) {
  return request.headers.get("x-user-id");
}

export async function GET(request: Request) {
  const userId = getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const goals = await listGoals(userId);
  return NextResponse.json({ goals });
}

export async function POST(request: Request) {
  const userId = getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const input = await request.json();
  const goal = await createGoal({ ...input, userId });

  return NextResponse.json({ goal }, { status: 201 });
}
