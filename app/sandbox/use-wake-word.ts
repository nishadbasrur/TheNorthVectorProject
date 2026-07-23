"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WakeWordEngine, type WakeWordDetectEvent } from "openwakeword-wasm-browser";

// Custom-trained wake word — synthetic speech + augmentation via the Colab
// notebook documented in
// 10-Implementation/Notes/North_Vector_Hey_North_Wake_Word_Training_Walkthrough.md.
// assets/wake-word/hey_north_v0.1.onnx is the real trained model (13,814
// bytes), not a placeholder — see that directory's README.
export const WAKE_WORD_KEYWORD = "hey_north";

// Whisper support, Phase B — a second, separately-trained model for a
// whispered "Hey North," trained on real whispered recordings (not
// synthetic TTS, which can't approximate whisper acoustics).
export const WAKE_WORD_KEYWORD_WHISPER = "hey_north_whisper";

const MODEL_FILE_MAP: Record<string, string> = {
  hey_mycroft: "hey_mycroft_v0.1.onnx",
  hey_north: "hey_north_v0.1.onnx",
  [WAKE_WORD_KEYWORD_WHISPER]: "hey_north_whisper_v0.1.onnx",
};

type UseWakeWordOptions = {
  // Whether the engine should actively be listening for the wake word right
  // now (true only in the dormant state — see app/sandbox/page.tsx). The
  // engine itself is created and loaded once regardless, since model
  // loading is the expensive part; this only toggles start()/stop() (mic
  // stream acquisition), which is cheap to repeat.
  enabled: boolean;
  onDetect: (event: WakeWordDetectEvent) => void;
  onError?: (error: Error) => void;
};

export type WakeWordStatus = "loading" | "ready" | "unsupported" | "error";

export function useWakeWord({ enabled, onDetect, onError }: UseWakeWordOptions) {
  const [status, setStatus] = useState<WakeWordStatus>("loading");
  const engineRef = useRef<WakeWordEngine | null>(null);
  const onDetectRef = useRef(onDetect);
  const onErrorRef = useRef(onError);
  onDetectRef.current = onDetect;
  onErrorRef.current = onError;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === "undefined") {
      setStatus("unsupported");
      return;
    }

    const engine = new WakeWordEngine({
      keywords: [WAKE_WORD_KEYWORD, WAKE_WORD_KEYWORD_WHISPER],
      modelFiles: MODEL_FILE_MAP,
      baseAssetUrl: "/models",
      ortWasmPath: "/ort/",
    });
    engineRef.current = engine;

    const offDetect = engine.on("detect", (event) => onDetectRef.current(event));
    const offError = engine.on("error", (err) => onErrorRef.current?.(err));

    engine
      .load()
      .then(() => setStatus("ready"))
      .catch((err) => {
        console.error("[useWakeWord] Failed to load wake-word models:", err);
        setStatus("error");
        onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      offDetect();
      offError();
      engine.stop().catch(() => {});
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- engine created once; onDetect/onError read via refs
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || status !== "ready") return;

    if (enabled) {
      engine.start().catch((err) => {
        console.error("[useWakeWord] Failed to start listening:", err);
        onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
      });
    } else {
      engine.stop().catch(() => {});
    }
  }, [enabled, status]);

  const stopNow = useCallback(() => {
    engineRef.current?.stop().catch(() => {});
  }, []);

  return { status, stopNow };
}
