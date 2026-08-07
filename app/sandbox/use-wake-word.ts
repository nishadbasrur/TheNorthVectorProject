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

// Library default is 0.5 — reported as too conservative ("activates on the
// slightest hint" was the ask, closer to how Siri behaves). Lowered to fire
// on weaker/less-confident matches, at the deliberate cost of more false
// positives. 0.32 is a first-attempt starting value (the fix note's own
// suggested 0.3-0.35 range), NOT yet confirmed against real "Hey North"
// utterances with WakeWordEngine's debug score-logging enabled (see the
// `debug` option below) — that live tuning pass needs an actual human voice
// into a real microphone, which requires Nishad's own live testing in the
// sandbox UI. Revisit this constant once real score data comes back.
// Overridable per-call regardless, so tuning doesn't require touching this
// file at every call site.
const DEFAULT_DETECTION_THRESHOLD = 0.32;

// cooldownMs (the library's own 2000ms default, deliberately left
// unoverridden here) — considered and left as-is. It only governs how long
// the engine ignores further matches right after a detection fires, so it
// affects retry latency after a near-miss, not whether a genuine "Hey
// North" gets missed in the first place; detectionThreshold above is the
// actual lever for that. Revisit only if real tuning data shows a fast
// double-attempt getting swallowed by the cooldown window.

type UseWakeWordOptions = {
  // Whether the engine should actively be listening for the wake word right
  // now (true only in the dormant state — see app/sandbox/page.tsx). The
  // engine itself is created and loaded once regardless, since model
  // loading is the expensive part; this only toggles start()/stop() (mic
  // stream acquisition), which is cheap to repeat.
  enabled: boolean;
  onDetect: (event: WakeWordDetectEvent) => void;
  onError?: (error: Error) => void;
  // How confident a keyword match needs to be (0-1) before it fires —
  // passed straight through to WakeWordEngine. Omit to use
  // DEFAULT_DETECTION_THRESHOLD above.
  detectionThreshold?: number;
  // Enables WakeWordEngine's own console.debug score logging (one line per
  // audio chunk per keyword, tagged "[WakeWordEngine] Keyword score") — the
  // mechanism used to pick DEFAULT_DETECTION_THRESHOLD above. Off by
  // default; it's a lot of console noise for normal use.
  debug?: boolean;
};

export type WakeWordStatus = "loading" | "ready" | "unsupported" | "error";

export function useWakeWord({
  enabled,
  onDetect,
  onError,
  detectionThreshold = DEFAULT_DETECTION_THRESHOLD,
  debug = false,
}: UseWakeWordOptions) {
  const [status, setStatus] = useState<WakeWordStatus>("loading");
  const engineRef = useRef<WakeWordEngine | null>(null);
  const onDetectRef = useRef(onDetect);
  const onErrorRef = useRef(onError);
  onDetectRef.current = onDetect;
  onErrorRef.current = onError;
  // Read once at engine-construction time below (the effect this feeds has
  // an intentionally empty dep array — the engine is created once, not
  // recreated on every render) via refs, same pattern as onDetect/onError.
  const detectionThresholdRef = useRef(detectionThreshold);
  const debugRef = useRef(debug);
  detectionThresholdRef.current = detectionThreshold;
  debugRef.current = debug;

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
      detectionThreshold: detectionThresholdRef.current,
      debug: debugRef.current,
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
