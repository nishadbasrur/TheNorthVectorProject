"use client";

import { useCallback, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";

// TEMPORARY — lets Nishad grab a real ID token from the browser console for
// manual curl testing of owner-gated endpoints (e.g. triggerSynthesisScan),
// without having to fish through devtools for internal SDK variable names.
// This app uses the modular Firebase SDK (no global `firebase` object), so
// there's nothing to call directly from the console otherwise. Writes the
// resolved token straight to the clipboard rather than relying on manually
// selecting console output — Safari's console visually truncates long
// string previews inside object inspectors (e.g. a resolved Promise's
// `result` field), and copying that truncated preview produces a token
// that looks plausible but silently fails auth. Still also logs the raw
// string as a fallback in case clipboard access is blocked. Remove once
// Synthesis Engine manual testing is done — this has no reason to exist in
// shipped code.
if (typeof window !== "undefined") {
  (window as unknown as { getNorthToken: () => Promise<string | undefined> }).getNorthToken = async () => {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
      console.log("No signed-in user — sign in first.");
      return undefined;
    }

    console.log(token);

    try {
      await navigator.clipboard.writeText(token);
      console.log("^ full token copied to your clipboard — just paste it, no need to select the text above.");
    } catch {
      console.log(
        "Clipboard write failed — triple-click the token line directly above (not any collapsed Promise/object view) to select the whole line, then copy."
      );
    }

    return token;
  };
}

type Status = "idle" | "listening" | "transcribing" | "processing" | "speaking";

// getUserMedia rejection names mapped to copy a person can actually act on —
// the raw DOMException name alone (e.g. "NotAllowedError") is accurate but
// not obviously meaningful mid-conversation. Same intent as the old
// SpeechRecognition-error-code mapping this replaces, just against a
// different browser API's error vocabulary.
const MIC_ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError: "Microphone access is blocked — check this site's permission in your browser settings.",
  NotFoundError: "No microphone found on this device.",
  NotReadableError: "The microphone stream failed to start — try tapping again in a moment.",
};

function describeMicError(error: unknown): string {
  if (error instanceof DOMException) {
    return MIC_ERROR_MESSAGES[error.name] ?? `Microphone error: ${error.name}`;
  }
  return "Couldn't access the microphone.";
}

// Shared by both the Safari audio-unlock hack below and encodeWav() — a
// single header-writing routine parameterized by sample rate/bit depth/
// channel count, rather than duplicating the RIFF/WAVE byte-twiddling twice.
function writeWavHeader(
  view: DataView,
  dataLength: number,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number
) {
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataLength, true);
}

// Builds a 1-sample silent WAV as a blob URL. Used only to "unlock" the
// reused <audio> element inside a real user gesture (see startListening) —
// Safari blocks .play() on any element that hasn't successfully played
// something from directly within a user-gesture call stack at least once.
function createSilentAudioUrl(): string {
  const sampleRate = 8000;
  const header = new ArrayBuffer(44);
  writeWavHeader(new DataView(header), 1, sampleRate, 1, 8);

  const blob = new Blob([header, new Uint8Array([128])], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

// Encodes captured Float32 PCM (from ScriptProcessorNode, range [-1, 1])
// into a 16-bit LINEAR16 mono WAV blob — see lib/google-stt.ts for why this
// exact format was chosen over browser-native MediaRecorder output
// (inconsistent codec support across browsers, most notably Safari).
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const dataLength = samples.length * 2; // 16-bit = 2 bytes/sample
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeWavHeader(view, dataLength, sampleRate, 1, 16);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function mergeSamples(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

// Tick marks around the HUD ring, generated rather than hand-authored 24
// <line> elements — kept subtle (see globals.css) since the reference
// photo reads as a soft glowing orb, not a compass instrument.
const HUD_TICK_COUNT = 24;
const HUD_TICKS = Array.from({ length: HUD_TICK_COUNT }, (_, i) => ({
  angle: (360 / HUD_TICK_COUNT) * i,
  major: i % 4 === 0,
}));

// Scattered particle specks around the ring, matching the star-like flecks
// visible around the glow in the reference photo. Fixed positions (not
// Math.random() at render time) so server/client markup matches exactly —
// hand-placed for a natural, non-gridlike scatter, not procedurally random.
const HUD_PARTICLES = [
  { x: 18, y: 22, size: 2, blur: 2 },
  { x: 82, y: 16, size: 1.5, blur: 1.5 },
  { x: 90, y: 38, size: 2.5, blur: 3 },
  { x: 12, y: 58, size: 1.5, blur: 1.5 },
  { x: 8, y: 78, size: 2, blur: 2 },
  { x: 76, y: 88, size: 1.5, blur: 1.5 },
  { x: 92, y: 68, size: 2, blur: 2 },
  { x: 30, y: 6, size: 1.5, blur: 1.5 },
  { x: 60, y: 92, size: 2, blur: 2 },
  { x: 4, y: 40, size: 1.5, blur: 1.5 },
];

type VoiceRespondResult = { responseText: string; toolsUsed: string[] };

// Calls the tool-calling voice endpoint directly — replaces
// lib/voice-intent-router.ts's client-side rule-based dispatch, deleted as
// part of the JARVIS tool-calling migration. sessionId carries multi-turn
// continuity across separate spoken utterances (see
// lib/voice-session-store.ts); the endpoint itself decides which tool(s), if
// any, the transcript needs.
async function askNorth(text: string, sessionId: string): Promise<VoiceRespondResult> {
  const idToken = await auth.currentUser?.getIdToken();

  const response = await fetch("/api/v1/voice/respond", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ text, sessionId }),
  });

  if (!response.ok) {
    // Throw with the real status + server detail instead of silently
    // returning the generic fallback string — every failure (bad request,
    // auth failure, model error, a deleted route) used to collapse into the
    // identical "I didn't catch that clearly" text, which made three
    // different real bugs look indistinguishable from the transcript alone.
    // handleTranscript's existing catch block routes this into the same
    // errorMessage display already used for mic/auth/TTS failures.
    let detail = "";
    try {
      const errorBody = await response.json();
      detail = typeof errorBody?.error === "string" ? errorBody.error : "";
    } catch {
      // Response body wasn't JSON — nothing more to extract.
    }
    throw new Error(`Voice request failed (${response.status}${detail ? `: ${detail}` : ""}).`);
  }

  const data = await response.json();
  const responseText =
    typeof data.responseText === "string" ? data.responseText : "I didn't catch that clearly — mind trying again?";
  const toolsUsed = Array.isArray(data.toolsUsed) ? data.toolsUsed : [];

  return { responseText, toolsUsed };
}

export default function SandboxPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // One session per page visit — see lib/voice-session-store.ts for the
  // server-side idle expiration (10 min) that bounds how long this actually
  // carries conversational context for.
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recordedChunksRef = useRef<Float32Array[]>([]);
  // Reused across the page session (not recreated per response) — once this
  // exact element has played from within a user gesture, Safari allows later
  // programmatic .play() calls on it even outside a gesture call stack.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Backstop against forgetting to tap stop (or the tap handler somehow not
  // firing) — raw recording has no auto-stop-on-silence the way
  // SpeechRecognition did, so without this a session could record
  // indefinitely.
  const recordingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRecordingWatchdog = useCallback(() => {
    if (recordingWatchdogRef.current) {
      clearTimeout(recordingWatchdogRef.current);
      recordingWatchdogRef.current = null;
    }
  }, []);

  // Disconnects/stops everything from the current (or a leftover, half-torn
  // -down previous) recording session. Safe to call multiple times or when
  // nothing is active.
  const teardownRecording = useCallback(() => {
    clearRecordingWatchdog();

    try {
      processorRef.current?.disconnect();
    } catch {
      // Nothing to disconnect if it was never connected.
    }
    processorRef.current = null;

    try {
      audioContextRef.current?.close();
    } catch {
      // Already closed — not an error.
    }
    audioContextRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, [clearRecordingWatchdog]);

  const speak = useCallback(async (text: string) => {
    setStatus("speaking");

    try {
      const idToken = await auth.currentUser?.getIdToken();

      const response = await fetch("/api/v1/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Text-to-speech request failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audioElement = audioRef.current ?? new Audio();
      audioElement.src = url;

      await new Promise<void>((resolve, reject) => {
        audioElement.onended = () => resolve();
        audioElement.onerror = () => reject(new Error("Audio playback failed."));
        audioElement.play().catch(reject);
      });

      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to play audio.");
    } finally {
      setStatus("idle");
    }
  }, []);

  const handleTranscript = useCallback(
    async (text: string) => {
      setTranscript(text);
      setResponseText("");
      setToolsUsed([]);
      setStatus("processing");
      setErrorMessage(null);

      try {
        const result = await askNorth(text, sessionIdRef.current);
        setResponseText(result.responseText);
        setToolsUsed(result.toolsUsed);
        await speak(result.responseText);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
        setStatus("idle");
      }
    },
    [speak]
  );

  const transcribeAndRoute = useCallback(
    async (sampleRate: number) => {
      setStatus("transcribing");

      const samples = mergeSamples(recordedChunksRef.current);
      recordedChunksRef.current = [];
      const wavBlob = encodeWav(samples, sampleRate);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const idToken = await auth.currentUser?.getIdToken();

        const response = await fetch("/api/v1/voice/transcribe", {
          method: "POST",
          headers: {
            "Content-Type": "audio/wav",
            Authorization: `Bearer ${idToken}`,
          },
          body: wavBlob,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Transcription request failed.");
        }

        const data = await response.json();
        const text = typeof data.transcript === "string" ? data.transcript.trim() : "";

        if (!text) {
          setErrorMessage("Didn't catch anything — try holding a bit longer before you speak.");
          setStatus("idle");
          return;
        }

        await handleTranscript(text);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setErrorMessage("Transcription took too long — try again.");
        } else {
          setErrorMessage(error instanceof Error ? error.message : "Couldn't transcribe — try again.");
        }
        setStatus("idle");
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [handleTranscript]
  );

  const startListening = useCallback(async () => {
    if (status !== "idle") return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Microphone access isn't supported in this browser.");
      return;
    }

    // A leftover session from a previous cycle can leave audio nodes/stream
    // tracks half-torn-down if cleanup didn't fully complete — tearing down
    // first gives the new session a clean handoff.
    teardownRecording();

    setErrorMessage(null);
    setTranscript("");
    setResponseText("");

    if (!audioRef.current) {
      const audio = new Audio(createSilentAudioUrl());
      audio.play().catch(() => {});
      audioRef.current = audio;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      console.warn("getUserMedia failed:", error);
      setErrorMessage(describeMicError(error));
      return;
    }

    // webkitAudioContext: older Safari's prefixed name, not in lib.dom.d.ts.
    const AudioContextCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextCtor();
    const source = audioContext.createMediaStreamSource(stream);
    // ScriptProcessorNode requires reaching the destination to reliably fire
    // onaudioprocess in some browsers — routed through a zero-gain node so
    // the raw mic input is never actually audible (no feedback/echo).
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;

    recordedChunksRef.current = [];

    processor.onaudioprocess = (event) => {
      recordedChunksRef.current.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);

    mediaStreamRef.current = stream;
    audioContextRef.current = audioContext;
    processorRef.current = processor;

    setStatus("listening");

    clearRecordingWatchdog();
    recordingWatchdogRef.current = setTimeout(() => {
      setStatus((current) => {
        if (current !== "listening") return current;
        const sampleRate = audioContextRef.current?.sampleRate ?? 16000;
        teardownRecording();
        transcribeAndRoute(sampleRate);
        return "transcribing";
      });
    }, 60000);
  }, [status, teardownRecording, clearRecordingWatchdog, transcribeAndRoute]);

  const stopListening = useCallback(() => {
    const sampleRate = audioContextRef.current?.sampleRate ?? 16000;
    teardownRecording();

    if (recordedChunksRef.current.length === 0) {
      setErrorMessage("Didn't catch anything — try holding a bit longer before you speak.");
      setStatus("idle");
      return;
    }

    transcribeAndRoute(sampleRate);
  }, [teardownRecording, transcribeAndRoute]);

  const handleMicTap = useCallback(() => {
    if (status === "idle") {
      startListening();
    } else if (status === "listening") {
      stopListening();
    }
  }, [status, startListening, stopListening]);

  const statusLabel: Record<Status, string> = {
    idle: "Tap to talk",
    listening: "Listening… (tap to stop)",
    transcribing: "Transcribing…",
    processing: "Thinking…",
    speaking: "Speaking…",
  };

  const ringDisabled = status === "transcribing" || status === "processing" || status === "speaking";

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Experimental</div>
        <div className="page-title">Sandbox</div>
        <div className="page-meta">
          Voice input prototype · tap to talk, tap again to stop → Cloud Speech-to-Text → Claude with
          tool-calling (checks email/calendar/Notion, creates tasks, or answers directly, as needed) →
          spoken response
        </div>
      </div>

      <div className="hud-page">
        <div className="hud-ruler">
          {Array.from({ length: 48 }, (_, i) => (
            <div key={i} className="hud-ruler-tick" />
          ))}
        </div>

        <div className="hud-stage">
          <div className={`hud-ring-wrap hud-ring-${status}`}>
            <svg className="hud-ticks" viewBox="0 0 200 200">
              {HUD_TICKS.map(({ angle, major }) => (
                <line
                  key={angle}
                  className={major ? "hud-tick-major" : undefined}
                  x1="100"
                  y1="6"
                  x2="100"
                  y2={major ? "18" : "13"}
                  transform={`rotate(${angle} 100 100)`}
                />
              ))}
            </svg>

            <div className="hud-glow" />
            <div className="hud-glow-core" />

            <div className="hud-particles">
              {HUD_PARTICLES.map((p, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: p.size,
                    height: p.size,
                    borderRadius: "50%",
                    background: "var(--white)",
                    boxShadow: `0 0 ${p.blur}px var(--hud-cyan)`,
                  }}
                />
              ))}
            </div>

            <svg className="hud-ring-svg" viewBox="0 0 200 200">
              <circle className="hud-ring-outer" cx="100" cy="100" r="94" />
              <circle className="hud-ring-inner" cx="100" cy="100" r="80" />
              <path
                className="hud-ring-arc"
                d="M 100 22 A 78 78 0 0 1 178 100"
                pathLength={100}
              />
            </svg>

            <button
              className="hud-ring-hit"
              onClick={handleMicTap}
              disabled={ringDisabled}
              aria-label={statusLabel[status]}
            >
              <span className="hud-wordmark">NORTH</span>
              <span className="hud-status-label">{statusLabel[status]}</span>
            </button>
          </div>

          <div className="hud-panel">
            <div className="hud-warning">
              Experimental — voice recognition quality and routing accuracy are not guaranteed
            </div>

            {errorMessage && <div className="hud-error">{errorMessage}</div>}

            {transcript && (
              <div className="hud-readout">
                <div className="hud-readout-label">You said</div>
                <div className="hud-readout-text">{transcript}</div>
              </div>
            )}

            {responseText && (
              <div className="hud-readout">
                <div className="hud-readout-label">North</div>
                <div className="hud-readout-text">{responseText}</div>
              </div>
            )}

            {toolsUsed.length > 0 && (
              <div className="hud-readout">
                <div className="hud-readout-label">Tools used</div>
                <div className="hud-readout-text">{toolsUsed.join(", ")}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
