import { NextResponse } from "next/server";
import { getUserById, updateUser } from "@/services/user-service";

function getUserId(request: Request) {
  return request.headers.get("x-user-id");
}

export async function GET(request: Request) {
  const userId = getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const user = await getUserById(userId);
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const userId = getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const input = await request.json();
  const user = await updateUser(userId, input);

  return NextResponse.json({ user });
}
