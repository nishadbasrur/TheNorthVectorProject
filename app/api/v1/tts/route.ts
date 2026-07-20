import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { synthesizeSpeech } from "@/lib/google-tts";

export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "text is required." }, { status: 400 });
  }

  try {
    const audio = await synthesizeSpeech(text);

    return new Response(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(audio.length),
      },
    });
  } catch (error) {
    console.error("Failed to synthesize speech", error);
    return NextResponse.json({ error: "Failed to synthesize speech." }, { status: 500 });
  }
}
