"use client";

import { useCallback, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";
import { routeVoiceInput } from "@/lib/voice-intent-router";

type Status = "idle" | "listening" | "processing" | "speaking";

// Standard SpeechRecognition error codes (per the Web Speech API spec) mapped
// to copy a person can actually act on — the raw code alone (e.g.
// "audio-capture") is accurate but not obviously meaningful mid-conversation.
const SPEECH_ERROR_MESSAGES: Record<string, string> = {
  "audio-capture": "The microphone stream failed to start — try tapping again in a moment.",
  "not-allowed": "Microphone access is blocked — check this site's permission in your browser settings.",
  "no-speech": "Didn't catch anything — try holding a bit longer before you speak.",
  network: "Lost connection to the speech recognition service — try again.",
  aborted: "Listening was interrupted — try again.",
};

function describeSpeechError(code: string): string {
  return SPEECH_ERROR_MESSAGES[code] ?? `Speech recognition error: ${code}`;
}

// Builds a 1-sample silent WAV as a blob URL. Used only to "unlock" the
// reused <audio> element inside a real user gesture (see startListening) —
// Safari blocks .play() on any element that hasn't successfully played
// something from directly within a user-gesture call stack at least once.
function createSilentAudioUrl(): string {
  const sampleRate = 8000;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + 1, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byte rate (1 byte/sample * 1 channel)
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, 1, true);

  const blob = new Blob([header, new Uint8Array([128])], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

export default function SandboxPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Tracks whether onresult fired for the in-progress recognition session, so
  // onend can tell "got a transcript" apart from "ended with nothing captured"
  // (e.g. stop() tapped before any speech was recognized, or a silent no-speech
  // timeout) and show explicit feedback instead of resetting silently.
  const resultReceivedRef = useRef(false);
  // Reused across the page session (not recreated per response) — once this
  // exact element has played from within a user gesture, Safari allows later
  // programmatic .play() calls on it even outside a gesture call stack.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Backstop for a real-world quirk (most pronounced on Safari/iOS) where a
  // new recognition session can start without ever calling onresult, onerror,
  // or onend — with nothing to reset "listening", the mic button would be
  // stuck forever with zero visible feedback. Cleared whenever any of those
  // three callbacks actually fires.
  const listeningWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearListeningWatchdog = useCallback(() => {
    if (listeningWatchdogRef.current) {
      clearTimeout(listeningWatchdogRef.current);
      listeningWatchdogRef.current = null;
    }
  }, []);

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

  const startListening = useCallback(() => {
    if (status !== "idle") return;

    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setErrorMessage("Speech recognition isn't supported in this browser. Try Chrome or Safari.");
      return;
    }

    // A leftover instance from the previous cycle can leave the browser's
    // native recognition service half-torn-down if it wasn't fully released
    // yet — explicitly aborting it first gives the new instance a clean
    // handoff instead of silently failing to capture anything.
    try {
      recognitionRef.current?.abort();
    } catch {
      // Nothing to abort if it already fully ended — not an error.
    }

    setErrorMessage(null);
    setTranscript("");
    setResponseText("");

    if (!audioRef.current) {
      const audio = new Audio(createSilentAudioUrl());
      audio.play().catch(() => {});
      audioRef.current = audio;
    }

    resultReceivedRef.current = false;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      resultReceivedRef.current = true;
      const text = event.results[0]?.[0]?.transcript ?? "";
      handleTranscript(text);
    };

    recognition.onerror = (event) => {
      clearListeningWatchdog();
      console.warn("SpeechRecognition error:", event.error);
      setErrorMessage(describeSpeechError(event.error));
      setStatus("idle");
    };

    recognition.onend = () => {
      clearListeningWatchdog();
      setStatus((current) => {
        if (current !== "listening") return current;

        if (!resultReceivedRef.current) {
          setErrorMessage("Didn't catch anything — try holding a bit longer before you speak.");
        }

        return "idle";
      });
    };

    recognitionRef.current = recognition;
    setStatus("listening");

    try {
      recognition.start();
    } catch (error) {
      // start() can throw synchronously if the browser's speech service
      // hasn't fully released the previous session yet — without this catch
      // the button would get stuck showing "Listening…" forever, since
      // nothing else would ever fire to reset it.
      console.warn("SpeechRecognition.start() failed:", error);
      setErrorMessage("Couldn't start listening — try tapping again in a moment.");
      setStatus("idle");
      return;
    }

    clearListeningWatchdog();
    listeningWatchdogRef.current = setTimeout(() => {
      setStatus((current) => {
        if (current !== "listening") return current;
        setErrorMessage("Didn't catch anything — try holding a bit longer before you speak.");
        return "idle";
      });
    }, 10000);
  }, [status, handleTranscript, clearListeningWatchdog]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      // stop() can throw if the recognition session already ended on its own
      // (e.g. auto-stopped after detecting silence) before the user's second
      // tap arrived — that's a normal race, not a real failure, so just make
      // sure the UI doesn't get stuck rather than surfacing a scary error.
      console.warn("SpeechRecognition.stop() failed, likely already ended:", error);
      clearListeningWatchdog();
      setStatus((current) => (current === "listening" ? "idle" : current));
    }
  }, [clearListeningWatchdog]);

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
    processing: "Thinking…",
    speaking: "Speaking…",
  };

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Experimental</div>
        <div className="page-title">Sandbox</div>
        <div className="page-meta">
          Voice input prototype · tap to talk, tap again to stop → rule-based routing (task
          creation, decision engine, or Claude for anything unrecognized) → spoken response
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
            disabled={status === "processing" || status === "speaking"}
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
