import { createServer } from "http";
import type { Socket } from "net";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { v2, protos } from "@google-cloud/speech";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { PHRASE_HINTS, PHRASE_HINT_BOOST } from "../../lib/speech-phrase-hints";

const { SpeechClient } = v2;

// Standalone Cloud Run service (NOT a Firebase Cloud Function, and NOT part
// of the Next.js App Hosting deploy) — genuinely a separate deploy pipeline,
// because streaming speech recognition needs a persistent bidirectional
// connection (audio flowing up, partial/final transcripts flowing down,
// continuously for as long as the user is talking), and neither of this
// project's two existing deploy targets can host that: Firebase Functions
// v2's onRequest wraps an Express app inside a framework-managed HTTP
// server with no exposed hook for a raw WebSocket 'upgrade' listener (the
// framework owns server creation, not our code), and App Hosting serves the
// standard request/response Next.js server, not a raw socket server. See
// the streaming STT scoping conversation for the fuller reasoning.
//
// Reuses the SAME GOOGLE_STT_SERVICE_ACCOUNT_KEY and
// FIREBASE_SERVICE_ACCOUNT_KEY secrets already in Secret Manager for the
// main app (see apphosting.yaml) — bound to this Cloud Run service at
// deploy time via --set-secrets, not duplicated.

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const LOCATION = "us";
const MODEL = "chirp_3"; // same model as the batch path (lib/google-stt.ts) for consistent behavior

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

function getServiceAccount(envVar: string): ServiceAccount {
  const raw = process.env[envVar];
  if (!raw) throw new Error(`${envVar} must be set.`);
  return JSON.parse(raw) as ServiceAccount;
}

const sttServiceAccount = getServiceAccount("GOOGLE_STT_SERVICE_ACCOUNT_KEY");

const speechClient = new SpeechClient({
  projectId: sttServiceAccount.project_id,
  credentials: {
    client_email: sttServiceAccount.client_email,
    private_key: sttServiceAccount.private_key,
  },
  apiEndpoint: `${LOCATION}-speech.googleapis.com`,
});

if (!getApps().length) {
  const firebaseServiceAccount = getServiceAccount("FIREBASE_SERVICE_ACCOUNT_KEY");
  initializeApp({
    credential: cert({
      projectId: firebaseServiceAccount.project_id,
      clientEmail: firebaseServiceAccount.client_email,
      privateKey: firebaseServiceAccount.private_key,
    }),
  });
}

type ClientToServerMessage =
  | { type: "config"; sampleRateHertz: number }
  | { type: "stop" };

type ServerToClientMessage =
  | { event: "interim" | "final"; transcript: string }
  | { event: "error"; error: string }
  | { event: "closed" };

function send(ws: WebSocket, message: ServerToClientMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

const httpServer = createServer((_req, res) => {
  // Plain health-check response for anything that isn't a WebSocket
  // upgrade — Cloud Run's own health probes hit the service over regular
  // HTTP, not just the /stt-stream path.
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("stt-stream-service OK");
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (request, socket: Socket, head) => {
  void (async () => {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);

    if (url.pathname !== "/stt-stream") {
      socket.destroy();
      return;
    }

    // Browsers can't set custom headers on a WebSocket handshake, so auth
    // travels as a query param instead of the Authorization header the rest
    // of this app's endpoints use — same Firebase ID token, just carried
    // differently for this one connection-oriented case.
    const token = url.searchParams.get("token");
    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      await getAuth().verifyIdToken(token);
    } catch (err) {
      console.error("[stt-stream] Token verification failed:", err);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  })();
});

wss.on("connection", (ws: WebSocket) => {
  let googleStream: ReturnType<typeof speechClient._streamingRecognize> | null = null;
  let configured = false;

  const recognizerName = speechClient.recognizerPath(sttServiceAccount.project_id, LOCATION, "_");

  function configureStream(sampleRateHertz: number) {
    googleStream = speechClient._streamingRecognize();

    googleStream.on("data", (response: protos.google.cloud.speech.v2.IStreamingRecognizeResponse) => {
      for (const result of response.results ?? []) {
        const transcript = result.alternatives?.[0]?.transcript ?? "";
        if (!transcript) continue;
        send(ws, { event: result.isFinal ? "final" : "interim", transcript });
      }
    });

    googleStream.on("error", (err: Error) => {
      console.error("[stt-stream] Google streamingRecognize error:", err);
      send(ws, { event: "error", error: err.message });
      ws.close();
    });

    googleStream.on("end", () => {
      send(ws, { event: "closed" });
      ws.close();
    });

    const configRequest: protos.google.cloud.speech.v2.IStreamingRecognizeRequest = {
      recognizer: recognizerName,
      streamingConfig: {
        config: {
          explicitDecodingConfig: {
            encoding: "LINEAR16",
            sampleRateHertz,
            audioChannelCount: 1,
          },
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
        streamingFeatures: {
          interimResults: true,
        },
      },
    };
    googleStream.write(configRequest);
    configured = true;
  }

  ws.on("message", (data: RawData, isBinary: boolean) => {
    if (!isBinary) {
      let message: ClientToServerMessage;
      try {
        message = JSON.parse(data.toString());
      } catch (err) {
        console.error("[stt-stream] Failed to parse control message:", err);
        return;
      }

      if (message.type === "config") {
        configureStream(message.sampleRateHertz);
      } else if (message.type === "stop") {
        googleStream?.end();
      }
      return;
    }

    // Binary message = one raw 16-bit LINEAR16 PCM chunk, matching whatever
    // sampleRateHertz the client declared in its config message.
    if (!configured || !googleStream) return;
    const audioRequest: protos.google.cloud.speech.v2.IStreamingRecognizeRequest = {
      recognizer: recognizerName,
      audio: data as Buffer,
    };
    googleStream.write(audioRequest);
  });

  ws.on("close", () => {
    googleStream?.end();
  });
});

httpServer.listen(PORT, () => {
  console.log(`[stt-stream] listening on ${PORT}`);
});
