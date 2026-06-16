import { NextResponse } from "next/server";
import { loadLocalMemories } from "@/lib/local-memory-loader";

export async function GET() {
  const memories = loadLocalMemories();

  return NextResponse.json({
    records: memories,
    count: memories.length,
  });
}