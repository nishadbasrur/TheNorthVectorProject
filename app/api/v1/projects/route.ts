import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/services/project-service";

function userIdFrom(request: Request) {
  return request.headers.get("x-user-id");
}

export async function GET(request: Request) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 401 });

  const projects = await listProjects(userId);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: "Missing user" }, { status: 401 });

  const input = await request.json();
  const project = await createProject({ ...input, userId });
  return NextResponse.json({ project }, { status: 201 });
}
