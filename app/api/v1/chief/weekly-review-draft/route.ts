import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    summary: "Weekly review draft placeholder",
    findings: [],
    recommendations: []
  });
}
