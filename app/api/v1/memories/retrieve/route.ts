import { NextRequest, NextResponse } from "next/server";
import { retrieveLocalMemories } from "@/lib/memory-retrieval";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const query = typeof body.query === "string" ? body.query : "";
    const limit = typeof body.limit === "number" ? body.limit : 10;

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Query is required." },
        { status: 400 }
      );
    }

    const memories = retrieveLocalMemories(query, limit);

    return NextResponse.json({
      query,
      count: memories.length,
      records: memories,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
