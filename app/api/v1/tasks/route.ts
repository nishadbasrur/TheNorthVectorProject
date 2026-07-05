import { NextResponse } from "next/server";
import { createTask, getTasks } from "@/lib/task-store";

export async function GET() {
  const tasks = await getTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const input = await request.json();
  const task = await createTask(input);
  return NextResponse.json({ task }, { status: 201 });
}
