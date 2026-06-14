import { NextResponse } from "next/server";
import { createExecution, listExecutions } from "@/services/execution-service";

function userIdFrom(request: Request) {
  return request.headers.get("x-user-id");
}

export async function GET(request: Request) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 401 });

  const executions = await listExecutions(userId);
  return NextResponse.json({ executions });
}

export async function POST(request: Request) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 401 });

  const input = await request.json();
  const execution = await createExecution({ ...input, userId });
  return NextResponse.json({ execution }, { status: 201 });
}
