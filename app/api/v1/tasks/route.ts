import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/services/task-service";

function userIdFrom(request: Request) {
  return request.headers.get("x-user-id");
}

export async function GET(request: Request) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 401 });

  const tasks = await listTasks(userId);
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 401 });

  const input = await request.json();
  const task = await createTask({ ...input, userId });
  return NextResponse.json({ task }, { status: 201 });
}
