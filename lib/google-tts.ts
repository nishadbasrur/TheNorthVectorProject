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

// True bidirectional streaming synthesis via streamingSynthesize, for the
// time-to-first-word pipeline (app/api/v1/voice/respond/route.ts) — a
// genuinely different RPC from synthesizeSpeech's one-shot REST call, not a
// wrapper around it. synthesizeSpeech stays exactly as-is above for every
// caller that doesn't need streaming (including whisper mode's quiet path —
// StreamingAudioConfig has no volumeGainDb field, so the quiet-volume trick
// only exists on the batch API anyway).
//
// Deliberately scoped to ONE sentence per call rather than exposing the raw
// duplex stream (Duplex, not a promise — .write()/.on('data')/.end(), a
// different programming model than every other promise-based call in this
// file) to callers: the caller still gets the pipelining win — it can open
// this call for sentence 2 while sentence 1 is still playing, rather than
// waiting for Claude's whole response — without the duplex-stream style
// leaking past this one function, or requiring the frontend to reassemble
// arbitrary byte-range fragments of one continuous audio stream (MediaSource
// Extensions would be the correct tool for true sub-sentence progressive
// playback; out of scope for this pass — see the streaming pipeline plan's
// Section 2.3).
//
// Streaming synthesis doesn't support MP3 (only PCM/ALAW/MULAW/OGG_OPUS per
// the StreamingAudioConfig proto docs) — OGG_OPUS chosen since it's directly
// playable by an <audio> element without needing a WAV header wrapped
// around raw PCM.
//
// NOT YET LIVE-VERIFIED: the StreamingSynthesizeResponse proto's own doc
// comment is internally inconsistent — "encoded as specified in the
// request" and "headerless LINEAR16 audio... 24000" in the same sentence,
// which reads like stale boilerplate from an older/default-config version
// of this API rather than a real constraint. This trusts "encoded as
// specified in the request" and requests OGG_OPUS explicitly; confirm
// against a real synthesized response during live testing before assuming
// this is right. Chirp3 HD voice parity between batch and streaming
// synthesis is similarly unverified — confirm live rather than assume.
export function streamSynthesizeSentence(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const duplex = getClient().streamingSynthesize();
    const chunks: Buffer[] = [];
    let settled = false;

    duplex.on("data", (response: protos.google.cloud.texttospeech.v1.IStreamingSynthesizeResponse) => {
      if (response.audioContent) {
        chunks.push(Buffer.from(response.audioContent));
      }
    });

    duplex.on("error", (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    });

    duplex.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });

    const configRequest: protos.google.cloud.texttospeech.v1.IStreamingSynthesizeRequest = {
      streamingConfig: {
        voice: {
          languageCode: "en-US",
          name: CHIRP_HD_VOICE,
        },
        streamingAudioConfig: {
          audioEncoding: "OGG_OPUS",
        },
      },
    };
    const inputRequest: protos.google.cloud.texttospeech.v1.IStreamingSynthesizeRequest = {
      input: { text },
    };

    duplex.write(configRequest);
    duplex.write(inputRequest);
    duplex.end();
  });
}
