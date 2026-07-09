import "server-only";
import { v2, protos } from "@google-cloud/speech";
import { PHRASE_HINTS, PHRASE_HINT_BOOST } from "@/lib/speech-phrase-hints";

const { SpeechClient } = v2;

// Chirp 3 is v2-API-only, GA in the "us" multi-region only (as of this
// writing) — a regional endpoint host is required, the default global
// speech.googleapis.com host does not serve this model.
const LOCATION = "us";
const MODEL = "chirp_3";

let cachedClient: InstanceType<typeof SpeechClient> | null = null;
let cachedProjectId: string | null = null;

function getClient(): { client: InstanceType<typeof SpeechClient>; projectId: string } {
  if (cachedClient && cachedProjectId) {
    return { client: cachedClient, projectId: cachedProjectId };
  }

  const rawKey = process.env.GOOGLE_STT_SERVICE_ACCOUNT_KEY;

  if (!rawKey) {
    throw new Error("GOOGLE_STT_SERVICE_ACCOUNT_KEY must be set.");
  }

  const serviceAccount = JSON.parse(rawKey);
  const projectId: string = serviceAccount.project_id;

  cachedClient = new SpeechClient({
    projectId,
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    apiEndpoint: `${LOCATION}-speech.googleapis.com`,
  });
  cachedProjectId = projectId;

  return { client: cachedClient, projectId };
}

// Transcribes a 16-bit LINEAR16 WAV buffer (see app/sandbox/page.tsx's
// encodeWav — chosen over browser-native MediaRecorder output specifically
// because encoding support for that varies by browser, most notably Safari,
// where relying on a single universally-supported raw format sidesteps the
// inconsistency entirely). Sample rate isn't fixed here — the browser's
// AudioContext dictates it (commonly 44100/48000Hz, device-dependent) and
// it's already encoded in the WAV file's own header, so auto-detection reads
// it from there instead of this needing to match whatever the client sent.
// Returns an empty string if nothing was recognized — mirrors how "no
// speech captured" is treated as a normal, non-error outcome throughout the
// rest of this voice pipeline.
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const { client, projectId } = getClient();

  const request: protos.google.cloud.speech.v2.IRecognizeRequest = {
    recognizer: client.recognizerPath(projectId, LOCATION, "_"),
    config: {
      autoDecodingConfig: {},
      model: MODEL,
      languageCodes: ["en-US"],
      adaptation: {
        phraseSets: [
          {
            inlinePhraseSet: {
              phrases: PHRASE_HINTS.map((value) => ({ value, boost: PHRASE_HINT_BOOST })),
            },
          },
        ],
      },
    },
    content: audioBuffer,
  };

  const [response] = await client.recognize(request);

  const transcript = response.results
    ?.map((result: protos.google.cloud.speech.v2.ISpeechRecognitionResult) => result.alternatives?.[0]?.transcript ?? "")
    .filter(Boolean)
    .join(" ")
    .trim();

  return transcript ?? "";
}
