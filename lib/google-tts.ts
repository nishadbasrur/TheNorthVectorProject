import "server-only";
import { GoogleGenAI } from "@google/genai";

// Switched from Cloud Text-to-Speech's Chirp 3 HD voices to Gemini's native
// speech generation — confirmed by direct listening comparison to sound
// noticeably more natural. Genuinely different product/auth model than
// Cloud TTS: a single API key (GEMINI_API_KEY, from Google AI Studio) in
// place of a full service account JSON.
const MODEL = "gemini-2.5-flash-preview-tts";
const VOICE_NAME = "Charon"; // same voice-name catalog as Chirp 3 HD; kept for continuity with the prior pick

// Gemini returns raw PCM, not a ready-to-play container format — these
// describe exactly what it returns (see the WAV header math below), not a
// configurable request parameter.
const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY must be set.");
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

// Prepends a canonical 44-byte WAV header to raw PCM16 data — mirrors
// app/sandbox/page.tsx's writeWavHeader exactly (same format, Buffer
// instead of DataView since this runs server-side), so the browser's
// <audio> element can play Gemini's raw output the same way it already
// plays the mic-recorded WAV blobs elsewhere in this app.
function wrapPcmAsWav(pcmData: Buffer): Buffer {
  const blockAlign = (CHANNELS * BITS_PER_SAMPLE) / 8;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataLength = pcmData.length;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmData]);
}

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: VOICE_NAME },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error("Gemini TTS returned no audio content.");
  }

  return wrapPcmAsWav(Buffer.from(base64Audio, "base64"));
}
