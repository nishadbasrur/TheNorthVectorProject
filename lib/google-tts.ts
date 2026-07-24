import "server-only";
import { TextToSpeechClient, protos } from "@google-cloud/text-to-speech";

const CHIRP_HD_VOICE = "en-US-Chirp3-HD-Charon";

let cachedClient: TextToSpeechClient | null = null;

function getClient(): TextToSpeechClient {
  if (cachedClient) {
    return cachedClient;
  }

  const rawKey = process.env.GOOGLE_TTS_SERVICE_ACCOUNT_KEY;

  if (!rawKey) {
    throw new Error("GOOGLE_TTS_SERVICE_ACCOUNT_KEY must be set.");
  }

  const serviceAccount = JSON.parse(rawKey);

  cachedClient = new TextToSpeechClient({
    projectId: serviceAccount.project_id,
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
  });

  return cachedClient;
}

// Whisper support — a quiet reply for when a private listening device
// (Bluetooth today, real Core2 hardware later) is connected but the room
// still isn't one to play audio out loud in. -10dB is a starting point, same
// "expect real-world tuning" treatment as the RMS thresholds in
// app/sandbox/page.tsx.
const QUIET_VOLUME_GAIN_DB = -10;

export async function synthesizeSpeech(text: string, options?: { quiet?: boolean }): Promise<Buffer> {
  const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
    input: { text },
    voice: {
      languageCode: "en-US",
      name: CHIRP_HD_VOICE,
    },
    audioConfig: {
      audioEncoding: "MP3",
      ...(options?.quiet ? { volumeGainDb: QUIET_VOLUME_GAIN_DB } : {}),
    },
  };

  const [response] = await getClient().synthesizeSpeech(request);

  if (!response.audioContent) {
    throw new Error("Google Cloud TTS returned no audio content.");
  }

  return Buffer.from(response.audioContent);
}

// A true bidirectional streamingSynthesize-based sentence synthesizer
// (OGG_OPUS) lived here briefly for the time-to-first-word pipeline
// (app/api/v1/voice/respond/route.ts) — removed after confirming live that
// Google's streaming synthesis produces genuinely lower-fidelity ("raspy")
// audio for this Chirp3 HD voice specifically. Verified the container
// itself was valid (real "OggS" magic bytes on the response), so this was a
// real quality difference in Google's pipeline, not a bug in that code.
// That route now calls synthesizeSpeech (below) once per sentence instead —
// same pipelining win (sentence N+1 synthesizes while sentence N plays),
// known-good audio quality.
