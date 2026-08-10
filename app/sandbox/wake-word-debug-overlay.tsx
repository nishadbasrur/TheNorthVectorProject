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

// Matches the exact shape WakeWordEngine's own _debug() calls use (see
// node_modules/openwakeword-wasm-browser/src/WakeWordEngine.js) — this is
// deliberately narrow (checks the "[WakeWordEngine]" tag and the specific
// message strings) so wrapping console.debug here can never misinterpret
// or swallow some OTHER part of the app's own unrelated debug logging.
function parseWakeWordDebugCall(args: unknown[]): { type: "score"; event: ScoreEvent } | { type: "detect"; event: DetectionLogEntry } | null {
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

  return null;
}

function useWakeWordDebugScores(enabled: boolean) {
  const [scores, setScores] = useState<Record<string, { score: number; at: number }>>({});
  const [log, setLog] = useState<DetectionLogEntry[]>([]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const original = console.debug;
    console.debug = (...args: unknown[]) => {
      original(...args);
      const parsed = parseWakeWordDebugCall(args);
      if (!parsed) return;

      if (parsed.type === "score") {
        setScores((prev) => ({ ...prev, [parsed.event.keyword]: { score: parsed.event.score, at: performance.now() } }));
      } else {
        setLog((prev) => [parsed.event, ...prev].slice(0, MAX_LOG_ENTRIES));
      }
    };

    return () => {
      console.debug = original;
    };
  }, [enabled]);

  return { scores, log };
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
  const { scores, log } = useWakeWordDebugScores(true);
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
    </div>
  );
}
