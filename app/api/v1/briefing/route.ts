import { NextRequest, NextResponse } from "next/server";
import { retrieveLocalMemories } from "@/lib/memory-retrieval";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const query =
      typeof body.query === "string"
        ? body.query
        : "What should I focus on today?";

    const memories = retrieveLocalMemories(query, 8);

    return NextResponse.json({
      query,
      briefing: {
        summary:
          "This is a retrieval-backed briefing scaffold. Full synthesis will be added next.",
        priorities: memories.slice(0, 3).map((memory) => memory.content),
        risks: memories
          .filter((memory) => memory.domain === "risk")
          .map((memory) => memory.content),
        retrievedMemoryCount: memories.length,
      },
      retrievedMemories: memories,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}