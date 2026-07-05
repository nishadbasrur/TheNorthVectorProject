"use client";

import { useCallback, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";
import { routeVoiceInput } from "@/lib/voice-intent-router";

type Status = "idle" | "listening" | "processing" | "speaking";

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
  // Reused across the page session (not recreated per response) — once this
  // exact element has played from within a user gesture, Safari allows later
  // programmatic .play() calls on it even outside a gesture call stack.
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    setErrorMessage(null);
    setTranscript("");
    setResponseText("");

    if (!audioRef.current) {
      const audio = new Audio(createSilentAudioUrl());
      audio.play().catch(() => {});
      audioRef.current = audio;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      handleTranscript(text);
    };

    recognition.onerror = (event) => {
      setErrorMessage(`Speech recognition error: ${event.error}`);
      setStatus("idle");
    };

    recognition.onend = () => {
      setStatus((current) => (current === "listening" ? "idle" : current));
    };

    recognitionRef.current = recognition;
    setStatus("listening");
    recognition.start();
  }, [status, handleTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const statusLabel: Record<Status, string> = {
    idle: "Hold to talk",
    listening: "Listening…",
    processing: "Thinking…",
    speaking: "Speaking…",
  };

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Experimental</div>
        <div className="page-title">Sandbox</div>
        <div className="page-meta">
          Voice input prototype · push-to-talk → rule-based routing (task creation or
          decision engine) → spoken response · no open-ended AI reasoning
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
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onMouseLeave={stopListening}
            onTouchStart={(event) => {
              event.preventDefault();
              startListening();
            }}
            onTouchEnd={(event) => {
              event.preventDefault();
              stopListening();
            }}
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
