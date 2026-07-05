"use client";

import { useCallback, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";
import { routeVoiceInput } from "@/lib/voice-intent-router";

type Status = "idle" | "listening" | "processing" | "speaking";

export default function SandboxPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
      const audioElement = new Audio(url);

      await new Promise<void>((resolve) => {
        audioElement.onended = () => resolve();
        audioElement.onerror = () => resolve();
        audioElement.play().catch(() => resolve());
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
