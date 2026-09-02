"use client";

import { useEffect, useRef, useState } from "react";

// Live tuning aid for a real "Hey North" test pass — multiple distances,
// background noise, casual phrasing, per
// 10-Implementation/Notes/North_Vector_Hey_North_Wake_Word_Training_Walkthrough.md's
// own testing spirit. WakeWordEngine (openwakeword-wasm-browser) already
// logs per-chunk scores via console.debug when its own `debug: true` option
// is on (see use-wake-word.ts) — but that's raw console spam, genuinely
// unusable while also trying to speak into a mic and watch a screen at the
// same time. This captures that SAME existing signal (no library patch,
// no new dependency — just reading what's already being logged) and
// surfaces it as a live, glanceable readout instead.
//
// Only ever mounted when ?wakeword-debug is present (see
// voice-session-context.tsx) — this is a tuning tool, not shipped UI for
// normal use.

const MAX_LOG_ENTRIES = 8;
// A little longer than the engine's own 2000ms cooldown (see
// use-wake-word.ts's own comment on why that's left at its default) — a
// score reading should visibly hold on screen at least that long, not
// flicker back to 0 before Nishad can actually read it mid-test.
const SCORE_STALE_MS = 2500;

type ScoreEvent = { keyword: string; score: number };
type DetectionLogEntry = { keyword: string; score: number; at: number };
type LevelEvent = { rms: number; peak: number };
type VadEvent = { confidence: number };
type TrackLogEntry = { message: string; at: number };

// Matches the exact shape WakeWordEngine's own _debug() calls use (see
// node_modules/openwakeword-wasm-browser/src/WakeWordEngine.js) — this is
// deliberately narrow (checks the "[WakeWordEngine]" tag and the specific
// message strings) so wrapping console.debug here can never misinterpret
// or swallow some OTHER part of the app's own unrelated debug logging.
//
// "Chunk received" (raw mic RMS/peak) and "VAD result" (speech-detector
// confidence) were already being logged by the engine — just never
// surfaced here. Added specifically to answer one question live testing
// couldn't otherwise answer: when a "Hey North" attempt scores near-zero,
// is that because the model genuinely didn't recognize the phrase, or
// because no real audio was reaching the engine at all (e.g. a Bluetooth
// input route gone silent/muted after switching away for TTS playback)?
// Keyword score alone can't distinguish those — a silent buffer and a
// clearly-mis-scored real utterance both just look like "low score."
function parseWakeWordDebugCall(
  args: unknown[]
):
  | { type: "score"; event: ScoreEvent }
  | { type: "detect"; event: DetectionLogEntry }
  | { type: "level"; event: LevelEvent }
  | { type: "vad"; event: VadEvent }
  | { type: "track"; event: TrackLogEntry }
  | null {
  if (args[0] !== "[WakeWordEngine]") return null;
  const [, message, payload] = args;

  if (message === "Keyword score" && payload && typeof payload === "object") {
    const p = payload as { keyword?: unknown; score?: unknown };
    if (typeof p.keyword === "string" && typeof p.score === "number") {
      return { type: "score", event: { keyword: p.keyword, score: p.score } };
    }
  }

  if (message === "Detection emitted" && payload && typeof payload === "object") {
    const p = payload as { keyword?: unknown; score?: unknown };
    if (typeof p.keyword === "string" && typeof p.score === "number") {
      return { type: "detect", event: { keyword: p.keyword, score: p.score, at: performance.now() } };
    }
  }

  if (message === "Chunk received" && payload && typeof payload === "object") {
    const p = payload as { rms?: unknown; peak?: unknown };
    if (typeof p.rms === "number" && typeof p.peak === "number") {
      return { type: "level", event: { rms: p.rms, peak: p.peak } };
    }
  }

  if (message === "VAD result" && payload && typeof payload === "object") {
    const p = payload as { confidence?: unknown };
    if (typeof p.confidence === "number") {
      return { type: "vad", event: { confidence: p.confidence } };
    }
  }

  if (
    (message === "Mic track acquired" || message === "Mic track muted" || message === "Mic track unmuted" || message === "Mic track ended") &&
    typeof message === "string"
  ) {
    return { type: "track", event: { message, at: performance.now() } };
  }

  return null;
}

function useWakeWordDebugScores(enabled: boolean) {
  const [scores, setScores] = useState<Record<string, { score: number; at: number }>>({});
  const [log, setLog] = useState<DetectionLogEntry[]>([]);
  const [level, setLevel] = useState<{ rms: number; peak: number; at: number } | null>(null);
  const [vad, setVad] = useState<{ confidence: number; at: number } | null>(null);
  const [trackLog, setTrackLog] = useState<TrackLogEntry[]>([]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const original = console.debug;
    console.debug = (...args: unknown[]) => {
      original(...args);
      const parsed = parseWakeWordDebugCall(args);
      if (!parsed) return;

      if (parsed.type === "score") {
        setScores((prev) => ({ ...prev, [parsed.event.keyword]: { score: parsed.event.score, at: performance.now() } }));
      } else if (parsed.type === "detect") {
        setLog((prev) => [parsed.event, ...prev].slice(0, MAX_LOG_ENTRIES));
      } else if (parsed.type === "level") {
        setLevel({ ...parsed.event, at: performance.now() });
      } else if (parsed.type === "vad") {
        setVad({ ...parsed.event, at: performance.now() });
      } else {
        // "track" — mic acquired/muted/unmuted/ended. Kept as its own log
        // (not just the latest, like level/vad) since a mute→unmute blip
        // that already resolved by the time you glance at the overlay is
        // still exactly the signal worth seeing after the fact.
        setTrackLog((prev) => [parsed.event, ...prev].slice(0, MAX_LOG_ENTRIES));
      }
    };

    return () => {
      console.debug = original;
    };
  }, [enabled]);

  return { scores, log, level, vad, trackLog };
}

function ScoreBar({ keyword, score, threshold, isStale }: { keyword: string; score: number; threshold: number; isStale: boolean }) {
  const clamped = Math.max(0, Math.min(1, score));
  const overThreshold = score >= threshold;

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: isStale ? 0.4 : 1, marginBottom: 2 }}>
        <span>{keyword}</span>
        <span>{score.toFixed(3)}</span>
      </div>
      <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 3, opacity: isStale ? 0.4 : 1 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${clamped * 100}%`,
            background: overThreshold ? "#5eead4" : "#5b8cff",
            borderRadius: 3,
            transition: "width 60ms linear",
          }}
        />
        {/* Threshold marker — where the engine's actual detectionThreshold sits on this same 0-1 scale, so a live score visibly crossing it is the whole point of this readout. */}
        <div
          style={{
            position: "absolute",
            left: `${Math.max(0, Math.min(1, threshold)) * 100}%`,
            top: -2,
            bottom: -2,
            width: 1,
            background: "rgba(255,255,255,0.6)",
          }}
        />
      </div>
    </div>
  );
}

export function WakeWordDebugOverlay({ keywords, threshold }: { keywords: string[]; threshold: number }) {
  const { scores, log, level, vad, trackLog } = useWakeWordDebugScores(true);
  // Forces a re-render on a slow interval purely so isStale (computed from
  // `performance.now() - lastSeenAt`, not itself reactive state) actually
  // fades a score back out after SCORE_STALE_MS of silence, instead of
  // staying frozen at its last value forever once audio chunks stop
  // arriving (e.g. wake word already fired, engine's gone dormant->active).
  const [, forceTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    tickRef.current = setInterval(() => forceTick((n) => n + 1), 400);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const now = performance.now();

  return (
    <div
      style={{
        position: "fixed",
        // bottom-right, not bottom-left — the sidebar's own account widget
        // lives in that corner (confirmed overlapping it live).
        bottom: 16,
        right: 16,
        zIndex: 9999,
        width: 260,
        padding: "10px 12px",
        background: "rgba(5, 7, 10, 0.85)",
        border: "1px solid rgba(94, 234, 212, 0.3)",
        borderRadius: 8,
        color: "#e2e8f0",
        fontFamily: "monospace",
        pointerEvents: "none", // never blocks the real UI underneath — this is read-only
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>WAKE WORD DEBUG · threshold {threshold.toFixed(2)}</div>
      {(() => {
        // Same staleness window as scores — chunks normally arrive every
        // ~80ms (1280-sample frames at 16kHz), so if this goes stale
        // (>2.5s with nothing) the audio pipeline itself has stopped
        // producing chunks at all, not just gone quiet for a beat. That's
        // the "no signal reaching the engine" case (dead/muted input
        // route) — visually distinct here from "signal present but
        // consistently too low," which instead shows as a real rms/peak
        // reading that just never rises.
        const levelStale = !level || now - level.at > SCORE_STALE_MS;
        const vadStale = !vad || now - vad.at > SCORE_STALE_MS;
        return (
          <div style={{ fontSize: 10, opacity: levelStale ? 0.4 : 0.85, marginBottom: 8 }}>
            <div>
              mic: {levelStale ? "no signal" : `rms ${level!.rms.toFixed(4)} · peak ${level!.peak.toFixed(4)}`}
            </div>
            <div>vad: {vadStale ? "no signal" : `${(vad!.confidence * 100).toFixed(0)}%`}</div>
          </div>
        );
      })()}
      {keywords.map((keyword) => {
        const entry = scores[keyword];
        const isStale = !entry || now - entry.at > SCORE_STALE_MS;
        return <ScoreBar key={keyword} keyword={keyword} score={isStale ? 0 : entry.score} threshold={threshold} isStale={isStale} />;
      })}
      {log.length > 0 && (
        <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 6, fontSize: 10, opacity: 0.8 }}>
          {log.map((entry, i) => (
            <div key={`${entry.at}-${i}`}>
              ✓ {entry.keyword} @ {entry.score.toFixed(3)}
            </div>
          ))}
        </div>
      )}
      {trackLog.length > 0 && (
        <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 6, fontSize: 10, opacity: 0.8 }}>
          {trackLog.map((entry, i) => (
            <div key={`${entry.at}-${i}`} style={{ color: entry.message.includes("muted") || entry.message.includes("ended") ? "#f87171" : undefined }}>
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
