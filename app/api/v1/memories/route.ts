import { NextResponse } from "next/server";
import { createMemory, listMemories } from "@/services/memory-service";

function getUserId(request: Request) {
  return request.headers.get("x-user-id");
}

export async function GET(request: Request) {
  const userId = getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const memories = await listMemories(userId);
  return NextResponse.json({ memories });
}

export async function POST(request: Request) {
  const userId = getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const input = await request.json();
  const memory = await createMemory({ ...input, userId });

  return NextResponse.json({ memory }, { status: 201 });
}
