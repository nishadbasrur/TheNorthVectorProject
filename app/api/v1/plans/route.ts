import { NextResponse } from "next/server";
import { createPlan, listPlans } from "@/services/plan-service";

function userIdFrom(request: Request) {
  return request.headers.get("x-user-id");
}

export async function GET(request: Request) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 401 });

  const plans = await listPlans(userId);
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 401 });

  const input = await request.json();
  const plan = await createPlan({ ...input, userId });
  return NextResponse.json({ plan }, { status: 201 });
}
