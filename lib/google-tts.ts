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
