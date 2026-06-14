import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    goals: [],
    projects: [],
    tasks: [],
    reviews: []
  });
}
