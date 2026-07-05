import { NextResponse } from "next/server";
import { createProject, getProjects } from "@/lib/project-store";

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const input = await request.json();
  const project = await createProject(input);
  return NextResponse.json({ project }, { status: 201 });
}
