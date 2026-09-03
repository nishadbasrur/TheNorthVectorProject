"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { WakeWordDetectEvent } from "openwakeword-wasm-browser";
import { auth } from "@/lib/firebase";
import { isPrivateAudioOutputConnected } from "@/lib/audio-output-detector";
import { useWakeWord, WAKE_WORD_KEYWORD, WAKE_WORD_KEYWORD_WHISPER, DEFAULT_DETECTION_THRESHOLD } from "./use-wake-word";
import { WakeWordDebugOverlay } from "./wake-word-debug-overlay";
import type { MapVisual } from "./hud-map";
import { isDisplayContent, type DisplayContent } from "./display-panel";
import { isHologramVisual, type HologramVisual, isUiAction, type UiAction } from "./hologram-panel";

// control_ui's "navigate" action targets — kept in sync with both
// lib/tool-dispatcher.ts's control_ui tool schema (which target strings
// are valid) and components/layout/app-shell.tsx's own nav hrefs (the
// actual routes). An unrecognized target is just ignored rather than
// navigating anywhere — see handleUiActionPayload below.
const UI_ACTION_NAVIGATE_TARGETS: Record<string, string> = {
  north: "/sandbox",
  dashboard: "/dashboard",
  weekly_review: "/weekly-review",
};

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

// Human-readable form of the wake-word engine's internal keyword id.
const WAKE_WORD_DISPLAY_NAME = "Hey North";

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
// Whisper mode's speech-detection floor — much lower than normal, since a
// whisper's RMS runs well under SPEECH_RMS_THRESHOLD. Starting point, same
// "expect real-world tuning" treatment as every other threshold on this
// page; genuinely can't be calibrated without a live mic/room test.
const WHISPER_SPEECH_RMS_THRESHOLD = 0.004;
// Whisper mode's text-only response has no natural "done" signal the way
// speak() has audio-playback duration — without an explicit pause here, the
// very next auto-relisten call clears the just-set response text
// (startListening resets setResponseText("")) before it ever has a chance
// to actually render, and the whole turn looks like it silently did
// nothing. Confirmed live: transcription and processing both genuinely
// succeeded, the response just never stayed on screen long enough to see.
const WHISPER_TEXT_READ_DELAY_MS = 20000;
const SILENCE_DURATION_MS = 1400;
const NO_SPEECH_GIVEUP_MS = 8000;
const INACTIVITY_TIMEOUT_MS = 75000; // real inactivity -> back to DORMANT
// getUserMedia() is normally near-instant once permission is already
// granted. Without a bound on it, a call that never settles (neither
// resolves nor rejects) leaves startListening's `await` pending forever —
// status stuck at "idle" ("One moment…") with mode still "active", no error
// shown, nothing to look at. Confirmed as a real (not hypothetical) failure
// mode of the native Tauri/WKWebView wrapper: the auto-relisten call after a
// spoken response — not tied to a fresh, direct user tap the way the
// original "Tap to enable voice" gesture was — hangs there in practice,
// where the same call in Safari-the-browser resolves normally. Root cause
// still unconfirmed (WKWebView's capture-session lifecycle vs. some
// gesture-adjacency requirement Safari doesn't enforce as strictly), so this
// is a bound, deliberately not a fix — but it turns an indefinite, silent
// hang into a visible, recoverable error instead.
const GET_USER_MEDIA_TIMEOUT_MS = 8000;
// Higher bar than SPEECH_RMS_THRESHOLD — without headphones, TTS audio
// bleeding into the mic (imperfect echo cancellation) needs a firmer floor
// than normal speech detection to avoid the system barging in on itself.
const BARGE_IN_RMS_THRESHOLD = 0.045;
// Chunks are 2048 samples — roughly 46ms at a typical 44.1kHz mic — so this
// is ~370ms of sustained loud audio required to fire, not just a momentary
// blip. Confirmed live that the RMS floor alone wasn't sufficient on
// built-in speakers: a single stressed syllable of North's own voice could
// clear it for a chunk or two and cut North off mid-response.
const BARGE_IN_SUSTAINED_CHUNKS = 8;

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

// Brief two-tone chime played before routine (not urgent) spontaneous
// speech, when audio is going out over open speakers rather than a
// private/Bluetooth device — see drainSpontaneousQueue below. Synthesized
// directly via an oscillator rather than a shipped audio asset; a couple
// short sine-wave beeps is all a "heads up, something's coming" cue needs.
function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioContextCtor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextCtor();
      const now = context.currentTime;
      const tones = [
        { freq: 880, start: 0 },
        { freq: 1320, start: 0.12 },
      ];
      let remaining = tones.length;

      for (const tone of tones) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = tone.freq;

        const startAt = now + tone.start;
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.11);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.12);
        oscillator.onended = () => {
          remaining -= 1;
          if (remaining === 0) {
            context.close().catch(() => {});
            resolve();
          }
        };
      }
    } catch {
      resolve(); // a failed chime shouldn't block the actual speech behind it
    }
  });
}

// Same clamp/scale math the old batch WAV-encoding path used (16-bit
// LINEAR16, see lib/google-stt.ts for why this format over browser-native
// MediaRecorder — inconsistent codec support across browsers, most notably
// Safari). No WAV header needed here — streaming sends raw PCM chunks
// directly, the service declares sample rate once up front instead (see
// stt-stream-service/src/server.ts's "config" message handling).
function float32ToInt16(samples: Float32Array): Int16Array<ArrayBuffer> {
  const out = new Int16Array(new ArrayBuffer(samples.length * 2));
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    out[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return out;
}

// wss:// endpoint for stt-stream-service (see that directory) — a fixed
// constant rather than an env var for now, since it's public-safe
// configuration (same category as the NEXT_PUBLIC_FIREBASE_* values already
// hardcoded in apphosting.yaml) and moving it there would need a redeploy
// of this app just to wire up a string.
const STT_STREAM_URL = "wss://stt-stream-service-1011959080844.us-east4.run.app/stt-stream";

function rms(data: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < data.length; i++) sumSquares += data[i] * data[i];
  return Math.sqrt(sumSquares / data.length);
}

type VoiceRespondResult = { responseText: string; toolsUsed: string[]; visual: MapVisual | null };

// One item pulled off app/api/v1/voice/spontaneous-stream's SSE feed — see
// drainSpontaneousQueue below for how these actually get spoken.
type SpontaneousSpeechEvent = { id: string; text: string; urgency: "urgent" | "routine"; source: string };

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

// Parses app/api/v1/voice/respond's SSE response (see that route's sseEvent
// helper for the exact "event: X\ndata: {...}\n\n" framing) into individual
// {event, data} records as they arrive. Shared by askNorth (drains this,
// discarding "audio" events — whisper mode needs the full text before
// deciding whether to speak it quietly or show it as text, not
// sentence-by-sentence audio) and askNorthAndSpeakStream (plays each "audio"
// event as it arrives — the actual point of streaming this at all).
async function* parseSSEStream(response: Response): AsyncGenerator<{ event: string; data: Record<string, unknown> }> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      const eventMatch = rawEvent.match(/^event: (.+)$/m);
      const dataMatch = rawEvent.match(/^data: (.+)$/m);
      if (!eventMatch || !dataMatch) continue;

      try {
        yield { event: eventMatch[1], data: JSON.parse(dataMatch[1]) };
      } catch {
        // Malformed frame — skip rather than crash the whole stream over one bad event.
      }
    }
  }
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseVoiceRespondDoneEvent(data: Record<string, unknown>): VoiceRespondResult {
  return {
    responseText:
      typeof data.responseText === "string" ? data.responseText : "I didn't catch that clearly — mind trying again?",
    toolsUsed: Array.isArray(data.toolsUsed) ? (data.toolsUsed as string[]) : [],
    visual: isMapVisual(data.visual) ? data.visual : null,
  };
}

async function postVoiceRespond(text: string, sessionId: string): Promise<Response> {
  const idToken = await auth.currentUser?.getIdToken();

  const response = await fetch("/api/v1/voice/respond", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ text, sessionId }),
  });

  if (!response.ok || !response.body) {
    let detail = "";
    try {
      const errorBody = await response.json();
      detail = typeof errorBody?.error === "string" ? errorBody.error : "";
    } catch {
      // Response body wasn't JSON — nothing more to extract.
    }
    throw new Error(`Voice request failed (${response.status}${detail ? `: ${detail}` : ""}).`);
  }

  return response;
}

// Calls the tool-calling voice endpoint directly. sessionId carries
// multi-turn continuity across separate spoken utterances (see
// lib/voice-session-store.ts); the endpoint itself decides which tool(s), if
// any, the transcript needs. Used by whisper mode, which needs the whole
// response text up front to decide whether to speak it quietly or show it
// as text — see askNorthAndSpeakStream for the progressive-audio version
// the normal (non-whisper) path uses instead.
async function askNorth(
  text: string,
  sessionId: string,
  onDisplay?: (display: DisplayContent) => void,
  onHologram?: (hologram: HologramVisual) => void,
  onUiAction?: (uiAction: Omit<UiAction, "seq">) => void
): Promise<VoiceRespondResult> {
  const response = await postVoiceRespond(text, sessionId);

  for await (const { event, data } of parseSSEStream(response)) {
    if (event === "done") return parseVoiceRespondDoneEvent(data);
    if (event === "error") {
      throw new Error(typeof data.error === "string" ? data.error : "Voice stream error.");
    }
    // Fired the instant a push_to_screen tool call resolves, well before
    // "done" — whisper mode still needs the whole response text up front
    // (see this function's own doc comment), but there's no reason to make
    // the display panel wait for that too.
    if (event === "display" && isDisplayContent(data)) {
      onDisplay?.(data);
    }
    // Tier 2's proactive scanner result — see
    // app/api/v1/voice/respond/route.ts, fired after "done" (that route
    // enqueues this after the primary response is already assembled, so
    // it never delays "done" itself).
    if (event === "hologram" && isHologramVisual(data)) {
      onHologram?.(data);
    }
    // control_ui's generic action name/params pair — see
    // handleUiActionPayload below for what actually happens with it.
    if (event === "ui_action" && isUiAction(data)) {
      onUiAction?.(data);
    }
  }

  throw new Error("Voice stream ended without a final response.");
}

type VoiceSessionValue = {
  ringState: string;
  statusLabel: string;
  errorMessage: string | null;
  showTranscript: boolean;
  setShowTranscript: (updater: boolean | ((current: boolean) => boolean)) => void;
  transcript: string;
  responseText: string;
  toolsUsed: string[];
  visual: MapVisual | null;
  setVisual: (visual: MapVisual | null) => void;
  display: DisplayContent | null;
  setDisplay: (display: DisplayContent | null) => void;
  hologram: HologramVisual | null;
  setHologram: (hologram: HologramVisual | null) => void;
  // Hologram-scoped control_ui actions only (close_display/navigate are
  // handled directly below in handleUiActionPayload, never surfaced
  // here) — see hologram-panel.tsx's own uiActionQueue prop/effect for
  // the consumer, and handleUiActionPayload's own comment for why this
  // is a queue rather than a single nullable slot.
  uiActionQueue: UiAction[];
  handleMicTap: () => void;
  // Do Not Disturb — manual kill switch for spontaneous (unprompted)
  // speech only; direct wake-word conversation is unaffected. See the
  // spontaneousMuted state declaration above for the full rationale.
  spontaneousMuted: boolean;
  toggleSpontaneousMute: () => void;
};

const VoiceSessionContext = createContext<VoiceSessionValue | null>(null);

export function useVoiceSession(): VoiceSessionValue {
  const ctx = useContext(VoiceSessionContext);
  if (!ctx) {
    throw new Error("useVoiceSession must be called from within a VoiceSessionProvider.");
  }
  return ctx;
}

// Mounted once at the root layout (app/layout.tsx), NOT inside
// app/sandbox/page.tsx — this is what makes the voice session (mic capture,
// the STT socket, TTS/audio playback, wake-word listening, all the timers)
// survive navigating away from /sandbox to another page. This used to all
// live directly inside SandboxPage, so navigating to /dashboard or
// /weekly-review unmounted the whole component tree mid-turn: the mic
// stream and STT socket got torn down, any in-flight <audio> playback
// stopped, and the next visit to /sandbox started a brand new session from
// scratch — confirmed live as "North stops talking and resets to Tap to
// enable voice." app/sandbox/page.tsx now just reads from useVoiceSession()
// and renders the HUD; the actual session state and imperative logic live
// here, above the page level, so none of it depends on which route is
// currently mounted.
export function VoiceSessionProvider({ children }: { children: ReactNode }) {
  // Gates the wake-word debug overlay's render (see the return statement
  // below) so its presence in the tree is IDENTICAL between server render
  // and the client's first render (both false — window doesn't exist on
  // the server, so there's nothing to mismatch), only revealing it in a
  // client-only update after hydration completes. Standard fix for "a
  // window-derived value used directly in JSX output causes a hydration
  // mismatch" — distinct from wakeWordDebugEnabled itself below, which is
  // safe to compute synchronously since it only ever feeds an effect.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

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
  const [visualState, setVisualState] = useState<MapVisual | null>(null);
  // What push_to_screen has pushed, if anything — set the instant the
  // "display" SSE event arrives (before "done", see askNorth/
  // askNorthAndSpeakStream below), not tied to any tool-specific follow-up
  // state the way `visual` is (no server-side session record for this —
  // nothing needs to read "what's currently displayed" back). Persists
  // across turns until manually dismissed or replaced by a new push, same
  // as the ticket's own spec — not cleared by goDormant the way `visual` is.
  const [display, setDisplay] = useState<DisplayContent | null>(null);
  // Tier 2's full-screen holographic takeover — set the instant a
  // "hologram" SSE event arrives (see askNorth/askNorthAndSpeakStream
  // below). Both this and `visual` (the map) are full-screen takeovers, so
  // setting either one clears the other — see setVisual/setHologram below,
  // not the raw state setters — to keep two overlays from ever stacking.
  const [hologramState, setHologramState] = useState<HologramVisual | null>(null);

  const setVisual = useCallback((next: MapVisual | null) => {
    if (next) setHologramState(null);
    setVisualState(next);
  }, []);

  const setHologram = useCallback((next: HologramVisual | null) => {
    if (next) setVisualState(null);
    setHologramState(next);
  }, []);

  // control_ui's generic action name/params pair — see lib/tool-
  // dispatcher.ts's control_ui tool and hologram-panel.tsx's UiAction
  // type/registry for the full contract. Two of the actions
  // (close_display/navigate) are handled directly here, since this
  // provider already owns setDisplay/setHologram and is the only place
  // with a router — everything else just gets appended to a queue and
  // forwarded through context for hologram-panel.tsx's own effect to
  // drain. A QUEUE, not a single nullable slot — parseSSEStream can
  // yield more than one event from a single already-buffered chunk read
  // (e.g. two control_ui tool calls in the same response resolve close
  // together and land in the same network read), and React 18's
  // automatic batching can coalesce multiple setState calls made across
  // those same-microtask-burst yields into one re-render. A single
  // `setUiAction(newValue)` would silently lose every action but the
  // last one in that case; appending via the functional updater form
  // doesn't, since each call composes onto the true latest queue
  // regardless of how many renders actually happen. Confirmed live: two
  // actions dispatched with zero delay between them (see this file's own
  // history) lost the first one under a single-slot design and didn't
  // under this one.
  const router = useRouter();
  const uiActionSeqRef = useRef(0);
  const [uiActionQueue, setUiActionQueue] = useState<UiAction[]>([]);

  const handleUiActionPayload = useCallback(
    (payload: Omit<UiAction, "seq">) => {
      if (payload.action === "close_display") {
        setDisplay(null);
        setHologram(null);
        return;
      }
      if (payload.action === "navigate") {
        const target = typeof payload.params?.target === "string" ? payload.params.target : "";
        const href = UI_ACTION_NAVIGATE_TARGETS[target];
        if (href) router.push(href);
        return;
      }
      uiActionSeqRef.current += 1;
      const next: UiAction = { action: payload.action, params: payload.params, seq: uiActionSeqRef.current };
      setUiActionQueue((prev) => [...prev, next]);
    },
    [router, setHologram]
  );

  // One session per app visit (this provider mounts once at the root
  // layout and never remounts on navigation — see the module comment
  // above) — see lib/voice-session-store.ts for the server-side idle
  // expiration (10 min) that bounds how long this actually carries
  // conversational context for.
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
  const hasSpeechRef = useRef(false);

  // Spontaneous-speech channel state — see connectSpontaneousStream and
  // drainSpontaneousQueue below.
  const spontaneousQueueRef = useRef<SpontaneousSpeechEvent[]>([]);
  const spontaneousAbortRef = useRef<AbortController | null>(null);
  const spontaneousReconnectAttemptRef = useRef(0);
  const spontaneousReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manual "Do Not Disturb" kill switch for spontaneous speech — added
  // 2026-09-03 after North spoke unprompted (a wrong, wall-clock-confused
  // hourly check-in) mid-lecture in a public room. This is a hard, fast
  // mute: while on, incoming spontaneous-speech events are dropped at the
  // SSE handler (never queued — nothing builds up to blast out the moment
  // it's turned back off, same semantics as a phone's Do Not Disturb), and
  // any spontaneous audio already playing is paused immediately. Persisted
  // to localStorage so a mute set before class survives a reload/relaunch
  // — the whole point is not having to remember to re-arm it every
  // session, only to remember to turn it back off. Deliberately does NOT
  // affect direct wake-word conversation (asking North something and
  // getting an answer) — only the unprompted/proactive channel, which is
  // the one that can fire with zero warning in a public setting.
  const DND_STORAGE_KEY = "nv-spontaneous-dnd";
  const [spontaneousMuted, setSpontaneousMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(DND_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const spontaneousMutedRef = useRef(spontaneousMuted);
  spontaneousMutedRef.current = spontaneousMuted;

  const setSpontaneousMuted = useCallback((next: boolean) => {
    setSpontaneousMutedState(next);
    spontaneousMutedRef.current = next;
    try {
      window.localStorage.setItem(DND_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Persistence failing is never fatal — the toggle still works for
      // the rest of this session, it just won't survive a reload.
    }
    if (next) {
      // Instant kill, not "stop queueing going forward" — a spontaneous
      // line already mid-playback when the toggle is hit must cut off
      // immediately, that's the entire point of a public-setting mute.
      spontaneousQueueRef.current = [];
      audioRef.current?.pause();
    }
  }, []);

  const toggleSpontaneousMute = useCallback(() => {
    setSpontaneousMuted(!spontaneousMutedRef.current);
  }, [setSpontaneousMuted]);

  // Streaming STT — see stt-stream-service/ (a standalone Cloud Run
  // WebSocket service, not part of this Next.js app's own deploy; Firebase
  // Functions v2's onRequest can't expose a raw WebSocket 'upgrade' hook,
  // and App Hosting only serves the normal Next.js request/response server,
  // so persistent bidirectional audio streaming needed its own deploy
  // target). Replaces the old record-the-whole-utterance-then-POST-it flow:
  // raw PCM chunks go out continuously as they're captured, Google's
  // interim/final transcripts come back continuously too, and the mic's
  // existing client-side silence detection just tells the socket when to
  // stop rather than gating when a single batch upload begins.
  const sttSocketRef = useRef<WebSocket | null>(null);
  // Chunks captured before the socket finishes its handshake would
  // otherwise be silently dropped — audioprocess starts firing the instant
  // the processor node connects, which can easily beat a fresh WebSocket's
  // open event by a beat. Queued here and flushed once "config" has gone out.
  const sttPendingChunksRef = useRef<Int16Array<ArrayBuffer>[]>([]);
  const sttConfiguredRef = useRef(false);
  // Accumulates "final" transcript segments for the turn currently in
  // progress — Google's own endpointing can emit more than one is_final
  // result per utterance (long sentences, natural pauses), same as the old
  // batch recognize() call's multiple `results[]` entries, which were
  // joined the same way (see lib/google-stt.ts's transcribeAudio).
  const sttFinalTranscriptRef = useRef<string>("");
  // Resolved by the "closed" WS event once Google has finished flushing
  // every final result after a stop request — the bridge between the
  // message-handling closure set up once in startListening() and whichever
  // timer/handler later decides it's time to stop and get the result.
  const sttClosedResolveRef = useRef<((finalText: string) => void) | null>(null);
  // Whisper support — true for the whole active-mode session once entered
  // via the whisper wake word, same lifecycle as `mode` itself rather than
  // resetting per-turn. Drives both the RMS threshold used in startListening
  // and the response-delivery branch in handleTranscript.
  const isWhisperModeRef = useRef(false);
  // Reused across the whole app session (not recreated per response) — once
  // this exact element has played from within a user gesture, Safari allows
  // later programmatic .play() calls on it even outside a gesture call
  // stack.
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
          // Requires a sustained loud stretch, not a brief blip — confirmed
          // in practice that even a raised RMS floor alone wasn't enough:
          // a single stressed syllable of North's own TTS echoing off
          // built-in speakers could clear the threshold for a chunk or two
          // and falsely self-trigger. A deliberate interruption sustains
          // well past this; a transient echo blip doesn't.
          if (loudChunks >= BARGE_IN_SUSTAINED_CHUNKS) onBargeIn();
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
    // Explicit close, not left to teardownRecording — that function only
    // tears down the mic/AudioContext, deliberately not the STT socket,
    // since the normal stop-and-transcribe path (finishListeningAndTranscribe)
    // needs the socket to survive its own teardownRecording() call long
    // enough to receive trailing final results. goDormant means the whole
    // active session is ending, though, so any still-open socket here
    // (e.g. the 75s inactivity timeout firing mid-listen) is a real one to
    // clean up rather than leave connected to Google for no reason.
    sttSocketRef.current?.close();
    stopBargeInMonitor();
    audioRef.current?.pause();
    setMode("dormant");
    updateStatus("idle");
    setVisual(null); // map (if any) doesn't survive back to the resting orb-only screen
    setHologram(null); // same treatment as the map takeover above
    isWhisperModeRef.current = false;
  }, [clearInactivityTimer, teardownRecording, stopBargeInMonitor, updateStatus, setVisual, setHologram]);

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      if (modeRef.current === "active") goDormant();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer, goDormant]);

  const speak = useCallback(
    async (text: string, options?: { quiet?: boolean }) => {
      updateStatus("speaking");

      try {
        const idToken = await auth.currentUser?.getIdToken();

        const response = await fetch("/api/v1/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ text, quiet: options?.quiet === true }),
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

  // Plays the next queued spontaneous-speech item, but ONLY once the app is
  // genuinely at rest — mode "dormant" AND status "idle", not even the
  // brief between-turn gap of an active session. speak() has no
  // re-entrancy guard of its own (calling it mid-turn would stomp the
  // shared status/mode state machine), and talking over a live human turn
  // would be bad UX regardless — so "urgent" here only ever means "no
  // chime, speak the instant the app is next at rest," never "interrupt."
  // Called both reactively (the mode/status effect below, whenever the app
  // actually settles into that resting state) and recursively after each
  // item finishes speaking, so a multi-item backlog drains back-to-back
  // without waiting for a fresh render/effect cycle in between.
  const drainSpontaneousQueue = useCallback(() => {
    if (spontaneousMutedRef.current) {
      // Redundant with the drop-on-arrival check in connectSpontaneousStream
      // below, deliberately — this is the actual last line of defense
      // right before anything would be spoken, so a mute flipped on in the
      // narrow window between an event arriving and this function running
      // still lands in time.
      spontaneousQueueRef.current = [];
      return;
    }
    if (modeRef.current !== "dormant" || statusRef.current !== "idle") return;
    const next = spontaneousQueueRef.current.shift();
    if (!next) return;

    void (async () => {
      if (next.urgency === "routine" && !(await isPrivateAudioOutputConnected())) {
        await playChime();
      }
      await speak(next.text);
      drainSpontaneousQueue();
    })();
  }, [speak]);

  // Opens (and, on any drop, reconnects) the long-lived SSE connection
  // behind North's always-on spontaneous speech — see
  // app/api/v1/voice/spontaneous-stream/route.ts for the server side.
  // Modeled on this file's existing STT-WebSocket reconnect handling
  // (staleness-guard via a ref, explicit close/reopen), not a from-scratch
  // design. A server-initiated "reconnect" event (the route's own
  // ~6-minute connection rotation, well under Cloud Run's request-timeout
  // ceiling) reconnects immediately with no backoff — it's a planned
  // handoff, not a failure. Anything else (network drop, server error)
  // backs off exponentially (capped at 30s) so a real outage doesn't spin
  // hot.
  const connectSpontaneousStream = useCallback(async () => {
    const controller = new AbortController();
    spontaneousAbortRef.current = controller;
    let plannedReconnect = false;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/v1/voice/spontaneous-stream", {
        headers: { Authorization: `Bearer ${idToken ?? ""}` },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Spontaneous-speech stream request failed: ${response.status}`);
      }

      for await (const { event, data } of parseSSEStream(response)) {
        if (event === "spontaneous_speech") {
          if (spontaneousMutedRef.current) continue; // Do Not Disturb — dropped, never queued
          const raw = data as { id?: unknown; text?: unknown; urgency?: unknown; source?: unknown };
          if (typeof raw.text === "string") {
            spontaneousQueueRef.current.push({
              id: typeof raw.id === "string" ? raw.id : "",
              text: raw.text,
              urgency: raw.urgency === "routine" ? "routine" : "urgent",
              source: typeof raw.source === "string" ? raw.source : "",
            });
            drainSpontaneousQueue();
          }
        } else if (event === "reconnect") {
          plannedReconnect = true;
        } else if (event === "error") {
          console.warn("[Sandbox] Spontaneous-speech stream error:", data);
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return; // provider unmounted — no reconnect
      console.warn("[Sandbox] Spontaneous-speech stream dropped:", error);
    }

    if (controller.signal.aborted) return;

    const attempt = spontaneousReconnectAttemptRef.current;
    const delayMs = plannedReconnect ? 0 : Math.min(30000, 1000 * 2 ** attempt);
    spontaneousReconnectAttemptRef.current = plannedReconnect ? 0 : attempt + 1;

    spontaneousReconnectTimerRef.current = setTimeout(() => {
      connectSpontaneousStream();
    }, delayMs);
  }, [drainSpontaneousQueue]);

  // Opened once when this provider mounts (root layout, survives
  // navigation — see the module comment at the top of this file) and kept
  // alive for as long as the Tauri app process is running, deliberately
  // independent of window focus/visibility (no gate on that here, and no
  // IPC bridge exists to signal it anyway — see the connectSpontaneousStream
  // comment / the plan this was built against).
  useEffect(() => {
    connectSpontaneousStream();
    return () => {
      spontaneousAbortRef.current?.abort();
      if (spontaneousReconnectTimerRef.current) clearTimeout(spontaneousReconnectTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- opened once on mount; connectSpontaneousStream reads current refs internally, doesn't need to be re-run when it's redefined
  }, []);

  // Cmd/Ctrl+Shift+D — the "kill it now" keyboard shortcut for the
  // Do Not Disturb toggle above. Window-level, not a Tauri global shortcut:
  // this only fires while the app window has focus, which is the realistic
  // case (the whole point is reacting the instant something starts playing
  // out loud, at which point the app is already the thing making noise on
  // screen). A true OS-wide global hotkey would need a Tauri-side
  // registration — worth adding later, not blocking tonight's fix on it
  // since the visible on-screen toggle covers the same "no menus, no
  // force-quit" requirement regardless.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggleSpontaneousMute();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSpontaneousMute]);

  // Reactive drain trigger — fires whenever the app actually settles into
  // (dormant, idle), regardless of which of this file's many
  // updateStatus("idle")/goDormant() call sites got it there. More robust
  // than threading an explicit drainSpontaneousQueue() call into every one
  // of those sites by hand (and just as correct: React's own state update
  // is what "settles into idle" means here).
  useEffect(() => {
    if (mode === "dormant" && status === "idle") {
      drainSpontaneousQueue();
    }
  }, [mode, status, drainSpontaneousQueue]);

  // Streaming sibling of speak() — plays each sentence's audio as it
  // arrives from app/api/v1/voice/respond's SSE stream instead of waiting
  // for the whole response then fetching one complete audio file (the
  // actual time-to-first-word fix). Sequential chunk playback via chained
  // <audio> elements, not a single element — see the streaming pipeline
  // plan's Section 3. speak() itself stays untouched above for whisper
  // mode's quiet/single-shot path, which needs the full text up front
  // anyway (see askNorth) and doesn't benefit from per-sentence streaming.
  //
  // Barge-in is set up ONCE for the whole response (not per chunk) — a
  // sustained loud stretch pauses whatever chunk is currently playing and
  // stops the loop from starting any more queued chunks, matching speak()'s
  // existing interrupt-and-return semantics rather than only interrupting
  // the one sentence that happened to be playing.
  const askNorthAndSpeakStream = useCallback(
    async (text: string, sessionId: string): Promise<VoiceRespondResult> => {
      const response = await postVoiceRespond(text, sessionId);

      updateStatus("speaking");

      let bargedIn = false;
      let currentAudioElement: HTMLAudioElement | null = null;
      // Settles whichever chunk's playback Promise is currently pending, if
      // any — set/cleared around each chunk's own Promise below. Without
      // this, pausing currentAudioElement alone doesn't unblock the loop:
      // .pause() fires neither onended nor onerror, so the `await new
      // Promise` for the chunk that was playing at the moment of barge-in
      // never resolves, the for-await loop never reaches its next
      // `if (bargedIn) break`, and the whole turn hangs at "speaking"
      // forever — confirmed live (audio genuinely stops, but the state
      // machine never moves on). speak() avoids this same trap by setting
      // up barge-in from *inside* its own single Promise executor, with
      // direct access to that call's own finish(); this function calls
      // startBargeInMonitor once for the whole streamed response instead
      // (see the comment above), so it needs an explicit hook into
      // whichever chunk is active right now.
      let finishCurrentChunk: (() => void) | null = null;
      startBargeInMonitor(() => {
        bargedIn = true;
        currentAudioElement?.pause();
        finishCurrentChunk?.();
      });

      let finalMeta: VoiceRespondResult | null = null;
      // Surfaced at most once per response even if multiple chunks fail —
      // this loop is deliberately resilient (one bad chunk shouldn't sink
      // the whole turn, per enqueueSentence's server-side comment), but that
      // resilience was also making chunk playback failures completely
      // invisible: console.warn only, nothing in the UI, nothing to go on
      // when audio silently never plays. First failure now shows up in the
      // HUD's error line so a hung/silent turn has a visible reason instead
      // of none — see the finding this was added for.
      let playbackErrorSurfaced = false;

      try {
        for await (const { event, data } of parseSSEStream(response)) {
          if (bargedIn) break;

          if (event === "audio") {
            const audioBase64 = typeof data.audioBase64 === "string" ? data.audioBase64 : "";
            const mimeType = typeof data.mimeType === "string" ? data.mimeType : "audio/ogg";
            if (!audioBase64) continue;

            const blob = new Blob([base64ToBytes(audioBase64)], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const audioElement = audioRef.current ?? new Audio();
            audioRef.current = audioElement;
            currentAudioElement = audioElement;
            audioElement.src = url;

            await new Promise<void>((resolve) => {
              let settled = false;
              const finish = () => {
                if (settled) return;
                settled = true;
                resolve();
              };
              finishCurrentChunk = finish;
              audioElement.onended = finish;
              audioElement.onerror = () => {
                // MediaError.code is one of MEDIA_ERR_ABORTED/NETWORK/
                // DECODE/SRC_NOT_SUPPORTED (1-4) — logging it (not just a
                // generic warning) is the difference between "playback
                // failed, no idea why" and actually knowing whether this is
                // a decode problem, an unsupported-source problem, etc.
                const mediaError = audioElement.error;
                console.warn(
                  "[Sandbox] Audio chunk playback failed, skipping.",
                  mediaError ? { code: mediaError.code, message: mediaError.message } : "(no MediaError set)"
                );
                if (!playbackErrorSurfaced) {
                  playbackErrorSurfaced = true;
                  setErrorMessage(
                    `Audio playback failed (code ${mediaError?.code ?? "?"}) — see console for details.`
                  );
                }
                finish();
              };
              audioElement.play().catch((error: unknown) => {
                // On Safari/WKWebView this is typically a DOMException
                // (NotAllowedError/NotSupportedError/AbortError) — surface
                // its real name/message rather than swallowing it, same
                // reasoning as onerror above.
                console.warn("[Sandbox] audioElement.play() rejected:", error);
                if (!playbackErrorSurfaced) {
                  playbackErrorSurfaced = true;
                  const name = error instanceof DOMException ? error.name : "playback error";
                  setErrorMessage(`Audio playback failed (${name}) — see console for details.`);
                }
                finish();
              });
            });
            finishCurrentChunk = null;

            URL.revokeObjectURL(url);
          } else if (event === "done") {
            // Set as soon as it's known, not after this whole function
            // returns — "done" typically arrives partway through the
            // remaining audio queue (there's usually a sentence or two
            // still left to play), and the caller's own setResponseText
            // call happens right before the auto-relisten loop clears it
            // again for the next turn. Those two writes landing back to
            // back was invisible in practice (same React-batching shape as
            // a prior whisper-mode bug in this file) — setting it here
            // instead gives it real, visible time on screen while the
            // remaining sentences play.
            finalMeta = parseVoiceRespondDoneEvent(data);
            setResponseText(finalMeta.responseText);
            setToolsUsed(finalMeta.toolsUsed);
            if (finalMeta.visual) setVisual(finalMeta.visual);
          } else if (event === "error") {
            throw new Error(typeof data.error === "string" ? data.error : "Voice stream error.");
          } else if (event === "display") {
            // Arrives well before "done" — the instant push_to_screen's
            // tool call resolves, typically while an earlier iteration's
            // audio is still playing (or before the final iteration's own
            // audio has even started) — the actual point of this being its
            // own event instead of bundled into "done" like visual is.
            if (isDisplayContent(data)) setDisplay(data);
          } else if (event === "hologram") {
            // Tier 2's proactive scanner result — fired after "done" (see
            // app/api/v1/voice/respond/route.ts), so this always lands
            // after finalMeta is already set above.
            if (isHologramVisual(data)) setHologram(data);
          } else if (event === "ui_action") {
            // control_ui's generic action name/params pair — see
            // handleUiActionPayload above for what actually happens with it.
            if (isUiAction(data)) handleUiActionPayload(data);
          }
        }
      } finally {
        stopBargeInMonitor();
        updateStatus("idle");
      }

      if (!finalMeta) {
        throw new Error("Voice stream ended without a final response.");
      }

      return finalMeta;
    },
    [startBargeInMonitor, stopBargeInMonitor, updateStatus, setVisual, setHologram, handleUiActionPayload]
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
        if (isWhisperModeRef.current) {
          // Whisper mode needs the whole response text up front to decide
          // its routing below, not sentence-by-sentence audio — askNorth
          // drains the same SSE stream askNorthAndSpeakStream plays
          // progressively, it just discards the "audio" events.
          const result = await askNorth(text, sessionIdRef.current, setDisplay, setHologram, handleUiActionPayload);
          setResponseText(result.responseText);
          setToolsUsed(result.toolsUsed);
          if (result.visual) setVisual(result.visual); // only ever set, never cleared by a non-map turn — see hud-map close button / goDormant for the ways it goes away

          // Quiet audio if a private listening device (Bluetooth today,
          // real Core2 later) is connected, text-only otherwise. Text-only
          // skips speak() entirely (saves the TTS call too) and forces the
          // response readout open, since it's hidden by default.
          const hasPrivateOutput = await isPrivateAudioOutputConnected();
          if (hasPrivateOutput) {
            await speak(result.responseText, { quiet: true });
          } else {
            setShowTranscript(true);
            updateStatus("idle");
            // Give the text time to actually be seen before the next
            // startListening() call wipes it — see WHISPER_TEXT_READ_DELAY_MS.
            await new Promise((resolve) => setTimeout(resolve, WHISPER_TEXT_READ_DELAY_MS));
          }
        } else {
          // Normal mode — progressive per-sentence playback, the actual
          // time-to-first-word fix. askNorthAndSpeakStream sets
          // responseText/toolsUsed/visual itself the moment its "done"
          // event arrives (partway through the remaining audio queue, not
          // after this call returns) — see that function for why.
          await askNorthAndSpeakStream(text, sessionIdRef.current);
        }
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
    [speak, askNorthAndSpeakStream, resetInactivityTimer, updateStatus]
  );

  // Sends the "stop" control message over the still-open STT socket and
  // waits for the "closed" event, which fires only once Google has finished
  // flushing every trailing final result — see sttClosedResolveRef and the
  // "closed" handler set up in startListening's ws.onmessage. Falls back to
  // whatever's accumulated so far (possibly empty) if "closed" never
  // arrives — mirrors the old batch flow's 45s abort timeout, just shorter
  // since this is only waiting on the tail of an already-streaming
  // connection, not a whole fresh upload.
  function requestFinalTranscript(): Promise<string> {
    return new Promise((resolve) => {
      const socket = sttSocketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        resolve(sttFinalTranscriptRef.current.trim());
        return;
      }

      const timeoutId = setTimeout(() => {
        sttClosedResolveRef.current = null;
        resolve(sttFinalTranscriptRef.current.trim());
      }, 15000);

      sttClosedResolveRef.current = (finalText) => {
        clearTimeout(timeoutId);
        resolve(finalText);
      };

      socket.send(JSON.stringify({ type: "stop" }));
    });
  }

  // Replaces the old transcribeAndRoute(sampleRate) — audio was already
  // streamed continuously as it was captured (see startListening's
  // onaudioprocess), so there's no clip left to upload here, just the tail
  // wait for Google's remaining final results plus the same
  // sleep-phrase/handleTranscript routing as before.
  const finishListeningAndTranscribe = useCallback(async () => {
    updateStatus("transcribing");

    try {
      const text = (await requestFinalTranscript()).trim();

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

        // Same whisper-mode routing as handleTranscript — this hardcoded
        // acknowledgment shouldn't play out loud on a bare speaker just
        // because it's a fixed phrase rather than a normal Claude response.
        if (isWhisperModeRef.current && !(await isPrivateAudioOutputConnected())) {
          setShowTranscript(true);
          await new Promise((resolve) => setTimeout(resolve, WHISPER_TEXT_READ_DELAY_MS));
        } else {
          await speak(SLEEP_ACKNOWLEDGMENT, isWhisperModeRef.current ? { quiet: true } : undefined);
        }

        goDormant();
        return;
      }

      await handleTranscript(text);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Couldn't transcribe — try again.");
      updateStatus("idle");
      if (modeRef.current === "active") startListeningRef.current();
    }
  }, [handleTranscript, speak, goDormant, updateStatus]);

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
    // Declared outside the try block, not just inline in the Promise.race
    // below, so a stray late resolution — arriving after the timeout below
    // already rejected and this function has moved on — can still be caught
    // and stopped in the catch block. Without that, a "timed out" mic
    // request that actually succeeds a beat later would leave a live,
    // ungoverned mic stream running with nothing left referencing or ever
    // stopping it.
    const rawRequest = navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });

    try {
      stream = await Promise.race([
        rawRequest,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Microphone didn't respond — the request timed out.")),
            GET_USER_MEDIA_TIMEOUT_MS
          )
        ),
      ]);
    } catch (error) {
      // If `error` came from the timeout branch, rawRequest is still live
      // and may resolve moments later — when/if it does, stop its tracks
      // immediately rather than leaving an orphaned live mic stream nothing
      // else knows about. If it instead rejects (the more common real
      // failure), this is a no-op.
      rawRequest.then((lateStream) => lateStream.getTracks().forEach((track) => track.stop())).catch(() => {});
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

    // Streaming STT socket — opened fresh per listening session, same
    // lifecycle as the mic stream/AudioContext it's paired with. Config
    // (sample rate) goes out the instant the connection opens; audio chunks
    // captured before that handshake completes are queued rather than
    // dropped (see sttPendingChunksRef).
    sttFinalTranscriptRef.current = "";
    sttConfiguredRef.current = false;
    sttPendingChunksRef.current = [];
    sttClosedResolveRef.current = null;

    const idToken = await auth.currentUser?.getIdToken();
    const socket = new WebSocket(`${STT_STREAM_URL}?token=${encodeURIComponent(idToken ?? "")}`);
    sttSocketRef.current = socket;

    // Every handler below guards on sttSocketRef.current === socket before
    // touching any shared state. Without this, a socket explicitly closed
    // by the no-speech-giveup timer (which closes the old socket then
    // immediately starts a new listening session — .close() doesn't
    // complete synchronously, the real onclose fires a moment later) could
    // have its belated onclose/onmessage events fire AFTER a new socket for
    // the NEXT turn already took over sttSocketRef, resolving or
    // overwriting the new turn's in-progress transcript with the old
    // (closed) turn's stale data. That race — confirmed by reading through
    // this exact sequence, not just theorized — is what "goes right back to
    // listening right after finishing a real sentence" was: not a failure
    // to hear anything, a stale event from the previous cycle stomping on
    // the current one's pending promise.
    socket.onopen = () => {
      if (sttSocketRef.current !== socket) return;
      socket.send(JSON.stringify({ type: "config", sampleRateHertz: audioContext.sampleRate }));
      sttConfiguredRef.current = true;
      for (const chunk of sttPendingChunksRef.current) {
        socket.send(chunk.buffer);
      }
      sttPendingChunksRef.current = [];
    };

    socket.onmessage = (event) => {
      if (sttSocketRef.current !== socket) return;

      let msg: { event?: string; transcript?: string; error?: string };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.event === "interim" && typeof msg.transcript === "string") {
        // Live partial text — the actual point of streaming this at all.
        // Not persisted anywhere; "final" segments below are what
        // eventually get routed to handleTranscript.
        setTranscript(msg.transcript);
      } else if (msg.event === "final" && typeof msg.transcript === "string") {
        // Google's endpointing can emit more than one is_final result per
        // utterance (long sentences, natural pauses) — joined with spaces,
        // same as the old batch recognize() call's multiple results[].
        sttFinalTranscriptRef.current = `${sttFinalTranscriptRef.current} ${msg.transcript}`.trim();
        setTranscript(sttFinalTranscriptRef.current);
      } else if (msg.event === "closed") {
        sttClosedResolveRef.current?.(sttFinalTranscriptRef.current.trim());
        sttClosedResolveRef.current = null;
      } else if (msg.event === "error") {
        console.warn("[Sandbox] STT stream error:", msg.error);
      }
    };

    socket.onerror = (event) => {
      if (sttSocketRef.current !== socket) return;
      console.warn("[Sandbox] STT socket error:", event);
    };

    socket.onclose = () => {
      if (sttSocketRef.current !== socket) return;
      sttSocketRef.current = null;
      // If a stop was already requested but the socket closed before
      // "closed" arrived (dropped connection, service hiccup), resolve with
      // whatever's accumulated so far rather than hang until the 15s
      // fallback timeout in requestFinalTranscript.
      if (sttClosedResolveRef.current) {
        const resolve = sttClosedResolveRef.current;
        sttClosedResolveRef.current = null;
        resolve(sttFinalTranscriptRef.current.trim());
      }
    };

    processor.onaudioprocess = (event) => {
      const data = event.inputBuffer.getChannelData(0);
      const pcm16 = float32ToInt16(data);
      if (sttConfiguredRef.current && socket.readyState === WebSocket.OPEN) {
        socket.send(pcm16.buffer);
      } else {
        sttPendingChunksRef.current.push(pcm16);
      }

      const speechThreshold = isWhisperModeRef.current ? WHISPER_SPEECH_RMS_THRESHOLD : SPEECH_RMS_THRESHOLD;
      if (rms(data) > speechThreshold) {
        if (!hasSpeechRef.current) {
          hasSpeechRef.current = true;
          clearNoSpeechTimer();
          // Push back the 75s dormant deadline the moment real speech
          // starts, not just once a full utterance is transcribed
          // (handleTranscript's own resetInactivityTimer call). That
          // deadline runs continuously from the END of the previous turn —
          // through North's own response-speaking time, think-time, and any
          // no-speech-giveup retries — so without this, it's possible to
          // still be mid-sentence when it expires and get bounced all the
          // way back to dormant (confirmed live: "cut me off and went back
          // to say hey north").
          resetInactivityTimer();
        }
        // Real speech — push back the silence deadline.
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          teardownRecording();
          finishListeningAndTranscribe();
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
      sttSocketRef.current?.close();
      updateStatus("idle");
      startListeningRef.current();
    }, NO_SPEECH_GIVEUP_MS);

    clearRecordingWatchdog();
    recordingWatchdogRef.current = setTimeout(() => {
      setStatus((current) => {
        if (current !== "listening") return current;
        teardownRecording();
        finishListeningAndTranscribe();
        statusRef.current = "transcribing";
        return "transcribing";
      });
    }, 60000);
  }, [
    teardownRecording,
    clearRecordingWatchdog,
    clearSilenceTimer,
    clearNoSpeechTimer,
    resetInactivityTimer,
    finishListeningAndTranscribe,
    goDormant,
    updateStatus,
  ]);

  startListeningRef.current = () => {
    startListening();
  };

  // Manual "stop and process now" override — auto-stop-on-silence should
  // usually fire first, but this stays available in case detection is slow
  // or picks up ambient noise oddly.
  const stopListeningManual = useCallback(() => {
    teardownRecording();

    if (!hasSpeechRef.current) {
      sttSocketRef.current?.close();
      setErrorMessage("Didn't catch anything — try again.");
      updateStatus("idle");
      if (modeRef.current === "active") startListeningRef.current();
      return;
    }

    finishListeningAndTranscribe();
  }, [teardownRecording, finishListeningAndTranscribe, updateStatus]);

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

  const handleWakeWordDetected = useCallback(
    (event: WakeWordDetectEvent) => {
      if (modeRef.current !== "dormant") return; // ignore late events mid-transition
      setMode("active");
      setErrorMessage(null);
      // Phase B — WAKE_WORD_KEYWORD_WHISPER is active alongside the normal
      // keyword in use-wake-word.ts's engine config, so this really does
      // fire from a real whispered detection now, not just in theory.
      isWhisperModeRef.current = event.keyword === WAKE_WORD_KEYWORD_WHISPER;
      resetInactivityTimer();
      startListeningRef.current();
    },
    [resetInactivityTimer]
  );

  // Opt-in via ?wakeword-debug (any value, e.g. ?wakeword-debug=1) — turns
  // on WakeWordEngine's per-chunk console.debug score logging (see
  // app/sandbox/use-wake-word.ts) AND the live on-screen readout below
  // (wake-word-debug-overlay.tsx) that turns that same logging into
  // something actually usable during a real test pass, rather than raw
  // console spam. Off by default; too noisy/intrusive for normal use.
  //
  // Computed synchronously (not via useState+useEffect) — useWakeWord's own
  // engine-construction effect (empty dep array, runs once) reads this via
  // a ref captured during THIS render, so it needs to already be correct on
  // the very first client render, not one render behind. Safe to read
  // window directly here for that value: it only ever feeds an effect
  // (useWakeWord internals), never the render output itself, so a
  // server/client difference in the value never shows up as a hydration
  // mismatch. The OVERLAY below is different — it's real JSX output, so it
  // needs the separate hasMounted-gated flag underneath instead.
  const wakeWordDebugEnabled = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("wakeword-debug");

  const { status: wakeWordStatus } = useWakeWord({
    enabled: mode === "dormant" && micArmed,
    onDetect: handleWakeWordDetected,
    onError: (error) => console.warn("[Sandbox] Wake-word engine error:", error),
    debug: wakeWordDebugEnabled,
  });

  const handleMicTap = useCallback(() => {
    if (mode === "dormant") {
      if (!micArmed) {
        armMic();
      } else {
        // Manual bypass — skip the wake word, go straight to active (normal mode).
        setMode("active");
        setErrorMessage(null);
        isWhisperModeRef.current = false;
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

  const value: VoiceSessionValue = {
    ringState,
    statusLabel,
    errorMessage,
    showTranscript,
    setShowTranscript,
    transcript,
    responseText,
    toolsUsed,
    visual: visualState,
    setVisual,
    display,
    setDisplay,
    hologram: hologramState,
    setHologram,
    uiActionQueue,
    handleMicTap,
    spontaneousMuted,
    toggleSpontaneousMute,
  };

  return (
    <VoiceSessionContext.Provider value={value}>
      {children}
      {hasMounted && wakeWordDebugEnabled && (
        // "hey_mycroft" here matches use-wake-word.ts's own debug-mode-only
        // addition of it as a control-group keyword — see that file's
        // comment for why. Not shown/active outside debug mode.
        <WakeWordDebugOverlay
          keywords={[WAKE_WORD_KEYWORD, WAKE_WORD_KEYWORD_WHISPER, "hey_mycroft"]}
          threshold={DEFAULT_DETECTION_THRESHOLD}
        />
      )}
    </VoiceSessionContext.Provider>
  );
}
