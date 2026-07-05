import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      database: "not_configured",
    },
    { status: 501 },
  );
}
