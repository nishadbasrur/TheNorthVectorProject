"use client";

import { useCallback, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";
import { useWakeWord } from "./use-wake-word";
import { HudMap, type MapVisual } from "./hud-map";

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
type Mode = "dormant" | "active";

// Human-readable form of the wake-word engine's internal keyword id — see
// app/sandbox/use-wake-word.ts for why "hey_mycroft" is today's placeholder
// rather than the real "Hey North" (custom wake words need training this
// environment can't run).
const WAKE_WORD_DISPLAY_NAME = "Hey Mycroft";

// Sleep phrase — loose/tolerant match against the raw transcript, not an
// exact string compare, since STT won't always transcribe "North" cleanly.
// Checked client-side before ever calling askNorth, so saying it doesn't
// cost an LLM call just to end the conversation.
const SLEEP_PHRASES = ["go to sleep, north", "go to sleep north", "go to sleep"];
function isSleepPhrase(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return SLEEP_PHRASES.some((phrase) => lower.includes(phrase));
}

// Hardcoded, not routed through askNorth/the persona prompt — same reasoning
// as above. Reuses the exact phrasing from the persona's own "that's all for
// now" example (app/api/v1/voice/respond/route.ts) for tonal consistency.
const SLEEP_ACKNOWLEDGMENT = "Understood, sir. I'll be here when something's worth mentioning.";

// Auto-stop-on-silence and barge-in thresholds — hand-tuned starting points
// against a Float32 [-1, 1] signal's RMS, not derived from any formal
// calibration. Expect these to need adjustment once tested against a real
// mic/room; that's expected, not a sign something's broken.
const SPEECH_RMS_THRESHOLD = 0.02;
const SILENCE_DURATION_MS = 1400;
const NO_SPEECH_GIVEUP_MS = 8000;
const INACTIVITY_TIMEOUT_MS = 75000; // real inactivity -> back to DORMANT
// Higher bar than SPEECH_RMS_THRESHOLD — without headphones, TTS audio
// bleeding into the mic (imperfect echo cancellation) needs a firmer floor
// than normal speech detection to avoid the system barging in on itself.
const BARGE_IN_RMS_THRESHOLD = 0.045;

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
// reused <audio> element inside a real user gesture (see armMic) — Safari
// blocks .play() on any element that hasn't successfully played something
// from directly within a user-gesture call stack at least once.
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

function rms(data: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < data.length; i++) sumSquares += data[i] * data[i];
  return Math.sqrt(sumSquares / data.length);
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

type VoiceRespondResult = { responseText: string; toolsUsed: string[]; visual: MapVisual | null };

function isMapVisual(value: unknown): value is MapVisual {
  const v = value as Record<string, unknown> | null | undefined;
  return (
    !!v &&
    v.type === "map" &&
    typeof v.location === "string" &&
    typeof v.lat === "number" &&
    typeof v.lon === "number" &&
    typeof v.zoom === "number"
  );
}

// Calls the tool-calling voice endpoint directly. sessionId carries
// multi-turn continuity across separate spoken utterances (see
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
  const visual = isMapVisual(data.visual) ? data.visual : null;

  return { responseText, toolsUsed, visual };
}

export default function SandboxPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<Mode>("dormant");
  const [micArmed, setMicArmed] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Transcript/response/tools-used readouts are debug detail, not something
  // the finished product should show by default — but they're what caught
  // nearly every real bug during development (truncated responses, stale
  // caches, missing tool calls), so keep them one tap away rather than
  // deleting the capability outright.
  const [showTranscript, setShowTranscript] = useState(false);
  // "What's currently on screen" — set whenever show_map runs, cleared on
  // manual dismiss or going dormant. Server-side mirror lives in
  // lib/voice-session-store.ts's VisualState so a follow-up "zoom in" can
  // act on it without the frontend having to resend the current view.
  const [visual, setVisual] = useState<MapVisual | null>(null);

  // One session per page visit — see lib/voice-session-store.ts for the
  // server-side idle expiration (10 min) that bounds how long this actually
  // carries conversational context for.
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  // Mirrors `mode` for use inside timers/event handlers, which otherwise
  // close over whatever `mode` was at the time they were created rather
  // than its current value.
  const modeRef = useRef<Mode>("dormant");
  modeRef.current = mode;

  // `status` (React state) is for rendering only. Control-flow decisions —
  // specifically startListening's re-entrancy guard — must NOT read it
  // directly: setState updates are batched and don't apply until the next
  // render, but startListening gets called synchronously in the very next
  // line after speak()'s finally block calls setStatus("idle"), before
  // React has re-rendered. That gap made startListening see a stale
  // "speaking" and silently refuse to start — confirmed live (both "had to
  // tap before the sleep word worked" and "went to One moment... and stuck
  // after barge-in" were the same bug). statusRef updates synchronously,
  // in lockstep with every setStatus call, so it's never stale.
  const statusRef = useRef<Status>("idle");
  const updateStatus = useCallback((next: Status) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recordedChunksRef = useRef<Float32Array[]>([]);
  const hasSpeechRef = useRef(false);
  // Reused across the page session (not recreated per response) — once this
  // exact element has played from within a user gesture, Safari allows later
  // programmatic .play() calls on it even outside a gesture call stack.
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const recordingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noSpeechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bargeInStreamRef = useRef<MediaStream | null>(null);
  const bargeInContextRef = useRef<AudioContext | null>(null);
  const bargeInProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // startListening calls itself again (no-speech giveup, post-response
  // loop) — a ref avoids stale closures inside setTimeout callbacks without
  // fighting useCallback's dependency array for a self-referencing function.
  const startListeningRef = useRef<() => void>(() => {});

  const clearRecordingWatchdog = useCallback(() => {
    if (recordingWatchdogRef.current) {
      clearTimeout(recordingWatchdogRef.current);
      recordingWatchdogRef.current = null;
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearNoSpeechTimer = useCallback(() => {
    if (noSpeechTimerRef.current) {
      clearTimeout(noSpeechTimerRef.current);
      noSpeechTimerRef.current = null;
    }
  }, []);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // Disconnects/stops everything from the current (or a leftover, half-torn
  // -down previous) recording session. Safe to call multiple times or when
  // nothing is active.
  const teardownRecording = useCallback(() => {
    clearRecordingWatchdog();
    clearSilenceTimer();
    clearNoSpeechTimer();

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
  }, [clearRecordingWatchdog, clearSilenceTimer, clearNoSpeechTimer]);

  const stopBargeInMonitor = useCallback(() => {
    try {
      bargeInProcessorRef.current?.disconnect();
    } catch {
      // Nothing to disconnect.
    }
    bargeInProcessorRef.current = null;

    try {
      bargeInContextRef.current?.close();
    } catch {
      // Already closed.
    }
    bargeInContextRef.current = null;

    bargeInStreamRef.current?.getTracks().forEach((track) => track.stop());
    bargeInStreamRef.current = null;
  }, []);

  // Barge-in v1: stop-then-relisten, not true simultaneous capture. Opens a
  // separate lightweight mic stream just to watch RMS while North is
  // speaking; on a sustained loud chunk, fires the callback (which pauses
  // TTS and starts a fresh recording). A few hundred ms of the very start
  // of what's said is likely lost in that handoff — a real, known
  // limitation, not a bug, of not running true overlapping audio capture.
  // Reliability will also vary a lot with hardware — headphones avoid the
  // TTS-echo-into-mic problem entirely; open speakers don't.
  const startBargeInMonitor = useCallback(async (onBargeIn: () => void) => {
    if (modeRef.current !== "active") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const AudioContextCtor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextCtor();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(2048, 1, 1);
      const silentGain = context.createGain();
      silentGain.gain.value = 0;

      let loudChunks = 0;
      processor.onaudioprocess = (event) => {
        const level = rms(event.inputBuffer.getChannelData(0));
        if (level > BARGE_IN_RMS_THRESHOLD) {
          loudChunks += 1;
          if (loudChunks >= 2) onBargeIn();
        } else {
          loudChunks = 0;
        }
      };

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(context.destination);

      bargeInStreamRef.current = stream;
      bargeInContextRef.current = context;
      bargeInProcessorRef.current = processor;
    } catch (error) {
      // Barge-in is a nice-to-have on top of the core flow — a mic failure
      // here shouldn't block or error out the actual spoken response.
      console.warn("[Sandbox] Barge-in monitor failed to start:", error);
    }
  }, []);

  const goDormant = useCallback(() => {
    clearInactivityTimer();
    teardownRecording();
    stopBargeInMonitor();
    audioRef.current?.pause();
    setMode("dormant");
    updateStatus("idle");
    setVisual(null); // map (if any) doesn't survive back to the resting orb-only screen
  }, [clearInactivityTimer, teardownRecording, stopBargeInMonitor, updateStatus]);

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      if (modeRef.current === "active") goDormant();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer, goDormant]);

  const speak = useCallback(
    async (text: string) => {
      updateStatus("speaking");

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
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            resolve();
          };

          audioElement.onended = finish;
          audioElement.onerror = () => {
            if (settled) return;
            settled = true;
            reject(new Error("Audio playback failed."));
          };

          startBargeInMonitor(() => {
            if (settled) return;
            audioElement.pause();
            finish();
          });

          audioElement.play().catch(reject);
        });

        URL.revokeObjectURL(url);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to play audio.");
      } finally {
        stopBargeInMonitor();
        updateStatus("idle");
      }
    },
    [startBargeInMonitor, stopBargeInMonitor, updateStatus]
  );

  const handleTranscript = useCallback(
    async (text: string) => {
      setTranscript(text);
      setResponseText("");
      setToolsUsed([]);
      updateStatus("processing");
      setErrorMessage(null);
      resetInactivityTimer(); // real interaction — push back the dormant deadline

      try {
        const result = await askNorth(text, sessionIdRef.current);
        setResponseText(result.responseText);
        setToolsUsed(result.toolsUsed);
        if (result.visual) setVisual(result.visual); // only ever set, never cleared by a non-map turn — see hud-map close button / goDormant for the ways it goes away
        await speak(result.responseText);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
        updateStatus("idle");
      }

      // Loop back to listening for the next turn — no tap needed, this is
      // the whole point of ACTIVE mode. Sleep word / inactivity timeout are
      // the only ways out (see isSleepPhrase and resetInactivityTimer).
      if (modeRef.current === "active") {
        startListeningRef.current();
      }
    },
    [speak, resetInactivityTimer, updateStatus]
  );

  const transcribeAndRoute = useCallback(
    async (sampleRate: number) => {
      updateStatus("transcribing");

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
          setErrorMessage("Didn't catch anything — try again.");
          updateStatus("idle");
          if (modeRef.current === "active") startListeningRef.current();
          return;
        }

        if (modeRef.current === "active" && isSleepPhrase(text)) {
          setTranscript(text);
          setResponseText(SLEEP_ACKNOWLEDGMENT);
          setToolsUsed([]);
          await speak(SLEEP_ACKNOWLEDGMENT);
          goDormant();
          return;
        }

        await handleTranscript(text);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setErrorMessage("Transcription took too long — try again.");
        } else {
          setErrorMessage(error instanceof Error ? error.message : "Couldn't transcribe — try again.");
        }
        updateStatus("idle");
        if (modeRef.current === "active") startListeningRef.current();
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [handleTranscript, speak, goDormant, updateStatus]
  );

  // The core recording loop. Auto-stops on ~1.4s of silence after real
  // speech was detected (replacing the old manual tap-to-stop), gives up
  // and restarts if nothing is said within 8s (not the same as the longer
  // 75s inactivityTimer — this just retries the current listening attempt;
  // resetInactivityTimer only pushes back on actual captured speech), and
  // keeps the original 60s hard watchdog as an absolute backstop.
  const startListening = useCallback(async () => {
    if (statusRef.current !== "idle") return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Microphone access isn't supported in this browser.");
      return;
    }

    teardownRecording();
    hasSpeechRef.current = false;

    setErrorMessage(null);
    setTranscript("");
    setResponseText("");
    setToolsUsed([]);

    if (!audioRef.current) {
      const audio = new Audio(createSilentAudioUrl());
      audio.play().catch(() => {});
      audioRef.current = audio;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
    } catch (error) {
      console.warn("getUserMedia failed:", error);
      setErrorMessage(describeMicError(error));
      if (modeRef.current === "active") goDormant(); // can't listen at all — don't strand in active mode
      return;
    }

    const AudioContextCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextCtor();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;

    recordedChunksRef.current = [];

    processor.onaudioprocess = (event) => {
      const data = event.inputBuffer.getChannelData(0);
      recordedChunksRef.current.push(new Float32Array(data));

      if (rms(data) > SPEECH_RMS_THRESHOLD) {
        if (!hasSpeechRef.current) {
          hasSpeechRef.current = true;
          clearNoSpeechTimer();
        }
        // Real speech — push back the silence deadline.
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          const sr = audioContextRef.current?.sampleRate ?? 16000;
          teardownRecording();
          transcribeAndRoute(sr);
        }, SILENCE_DURATION_MS);
      }
    };

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);

    mediaStreamRef.current = stream;
    audioContextRef.current = audioContext;
    processorRef.current = processor;

    updateStatus("listening");

    noSpeechTimerRef.current = setTimeout(() => {
      if (modeRef.current !== "active") return;
      teardownRecording();
      updateStatus("idle");
      startListeningRef.current();
    }, NO_SPEECH_GIVEUP_MS);

    clearRecordingWatchdog();
    recordingWatchdogRef.current = setTimeout(() => {
      setStatus((current) => {
        if (current !== "listening") return current;
        const sr = audioContextRef.current?.sampleRate ?? 16000;
        teardownRecording();
        transcribeAndRoute(sr);
        statusRef.current = "transcribing";
        return "transcribing";
      });
    }, 60000);
  }, [teardownRecording, clearRecordingWatchdog, clearSilenceTimer, clearNoSpeechTimer, transcribeAndRoute, goDormant, updateStatus]);

  startListeningRef.current = () => {
    startListening();
  };

  // Manual "stop and process now" override — auto-stop-on-silence should
  // usually fire first, but this stays available in case detection is slow
  // or picks up ambient noise oddly.
  const stopListeningManual = useCallback(() => {
    const sampleRate = audioContextRef.current?.sampleRate ?? 16000;
    teardownRecording();

    if (recordedChunksRef.current.length === 0 || !hasSpeechRef.current) {
      setErrorMessage("Didn't catch anything — try again.");
      updateStatus("idle");
      if (modeRef.current === "active") startListeningRef.current();
      return;
    }

    transcribeAndRoute(sampleRate);
  }, [teardownRecording, transcribeAndRoute, updateStatus]);

  // First-ever tap: just confirms mic permission (stops the probe stream
  // immediately, doesn't keep it open) so the wake-word engine's own
  // getUserMedia call resolves instantly afterward instead of prompting.
  const armMic = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Microphone access isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicArmed(true);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(describeMicError(error));
    }
  }, []);

  const handleWakeWordDetected = useCallback(() => {
    if (modeRef.current !== "dormant") return; // ignore late events mid-transition
    setMode("active");
    setErrorMessage(null);
    resetInactivityTimer();
    startListeningRef.current();
  }, [resetInactivityTimer]);

  const { status: wakeWordStatus } = useWakeWord({
    enabled: mode === "dormant" && micArmed,
    onDetect: handleWakeWordDetected,
    onError: (error) => console.warn("[Sandbox] Wake-word engine error:", error),
  });

  const handleMicTap = useCallback(() => {
    if (mode === "dormant") {
      if (!micArmed) {
        armMic();
      } else {
        // Manual bypass — skip the wake word, go straight to active.
        setMode("active");
        setErrorMessage(null);
        resetInactivityTimer();
        startListeningRef.current();
      }
      return;
    }

    // mode === "active"
    if (status === "listening") {
      stopListeningManual();
    } else {
      // Escape hatch from any other active sub-state (transcribing,
      // processing, speaking, or the brief idle gap between turns).
      goDormant();
    }
  }, [mode, micArmed, armMic, resetInactivityTimer, status, stopListeningManual, goDormant]);

  function getStatusLabel(): string {
    if (mode === "dormant") {
      if (!micArmed) return "Tap to enable voice";
      if (wakeWordStatus === "loading") return "Loading wake-word model…";
      if (wakeWordStatus === "unsupported") return "Wake word unsupported — tap to talk";
      if (wakeWordStatus === "error") return "Wake-word engine failed — tap to talk";
      return `Say "${WAKE_WORD_DISPLAY_NAME}"`;
    }

    switch (status) {
      case "idle":
        return "One moment…";
      case "listening":
        return "Listening… (tap to stop)";
      case "transcribing":
        return "Transcribing…";
      case "processing":
        return "Thinking…";
      case "speaking":
        return "Speaking… (tap to stop)";
      default:
        return "";
    }
  }

  const ringState = mode === "dormant" ? "dormant" : status;
  const statusLabel = getStatusLabel();

  return (
    <AppShell>
      <div className={`hud-page ${visual ? "hud-page-map-active" : ""}`}>
        {visual && <HudMap visual={visual} onClose={() => setVisual(null)} />}

        <div className="hud-ruler">
          {Array.from({ length: 48 }, (_, i) => (
            <div key={i} className="hud-ruler-tick" />
          ))}
        </div>

        <div className="hud-stage">
          <div className={`hud-ring-wrap hud-ring-${ringState}`}>
            {/* Solid-ish dark backing behind the glow — without it the
                mostly-transparent orb blended into light backgrounds (e.g.
                a light map, before the map switched to a dark theme).
                Independent of what's underneath, not just a fix for the
                map specifically. */}
            <div className="hud-orb-backing" />

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

            <button className="hud-ring-hit" onClick={handleMicTap} aria-label={statusLabel}>
              <span className="hud-wordmark">NORTH</span>
              <span className="hud-status-label">{statusLabel}</span>
            </button>
          </div>

          <div className="hud-panel">
            {errorMessage && <div className="hud-error">{errorMessage}</div>}

            {showTranscript && (
              <>
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
              </>
            )}

            <button
              type="button"
              className="hud-transcript-toggle"
              onClick={() => setShowTranscript((v) => !v)}
            >
              {showTranscript ? "Hide details" : "Details"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
