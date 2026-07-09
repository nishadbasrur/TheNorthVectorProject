"use client";

import { useCallback, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";
import { routeVoiceInput } from "@/lib/voice-intent-router";

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

export default function SandboxPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setStatus("processing");
      setErrorMessage(null);

      try {
        const result = await routeVoiceInput(text);
        setResponseText(result.responseText);
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

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Experimental</div>
        <div className="page-title">Sandbox</div>
        <div className="page-meta">
          Voice input prototype · tap to talk, tap again to stop → Cloud Speech-to-Text → rule-based
          routing (task creation, decision engine, or Claude for anything unrecognized) → spoken
          response
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 480, textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--status-warning)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            ⚠ Experimental — voice recognition quality and routing accuracy are not guaranteed
          </div>

          <button
            className="nv-button"
            style={{ width: 160, height: 160, borderRadius: "50%", fontSize: 14 }}
            onClick={handleMicTap}
            disabled={status === "transcribing" || status === "processing" || status === "speaking"}
          >
            {statusLabel[status]}
          </button>

          {errorMessage && (
            <div style={{ marginTop: 16, fontSize: 12, color: "var(--status-warning)" }}>
              {errorMessage}
            </div>
          )}

          {transcript && (
            <div style={{ marginTop: 20, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                You said
              </div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 4 }}>{transcript}</div>
            </div>
          )}

          {responseText && (
            <div style={{ marginTop: 16, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                North
              </div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 4 }}>{responseText}</div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
