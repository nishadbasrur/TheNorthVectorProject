import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { transcribeAudio } from "@/lib/google-stt";

// Replaces the browser's built-in Web Speech API — see app/sandbox/page.tsx.
// Expects a raw 16-bit LINEAR16 WAV body (see that file's encodeWav helper),
// not JSON, matching /api/v1/tts's symmetric raw-binary pattern.
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  const arrayBuffer = await request.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    return NextResponse.json({ error: "Audio body is required." }, { status: 400 });
  }

  try {
    const transcript = await transcribeAudio(Buffer.from(arrayBuffer));
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Failed to transcribe audio", error);
    return NextResponse.json({ error: "Failed to transcribe audio." }, { status: 500 });
  }
}
