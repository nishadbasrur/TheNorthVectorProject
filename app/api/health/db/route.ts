import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    await db.execute("select 1");

    return NextResponse.json({
      ok: true,
      database: "connected",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        database: "unavailable",
      },
      { status: 500 },
    );
  }
}
