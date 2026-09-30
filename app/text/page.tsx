"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";
import { HologramPanel, isHologramVisual, isUiAction, type HologramVisual, type UiAction } from "@/app/sandbox/hologram-panel";
import { DisplayPanel, isDisplayContent, type DisplayContent } from "@/app/sandbox/display-panel";

// Text-chat mode's client — deliberately its own page/component, not a
// variant of app/sandbox/page.tsx or app/sandbox/voice-session-context.tsx.
// Per the 2026-09-30 fix note's explicit requirement, this has ZERO import
// from voice-session-context.tsx: no shared session state, no shared
// routing, nothing that could let a voice turn and a text turn cross wires.
// The only things imported from the sandbox/ directory are the
// HologramPanel/DisplayPanel UI components and their own exported type
// guards — shared UI rendering for tool results (fix note point 4's own
// "should behave the same way in text mode" requirement), not shared
// session logic.
//
// No mic, no wake word, no audio, no barge-in, no "keep running across
// navigation" provider the way voice needs (see voice-session-context.tsx's
// own header comment on why IT has to be mounted at the root layout) — a
// text chat has no live audio stream to lose on unmount, so a plain
// page-scoped client component is the right shape, not a global provider.

type ChatMessage = { role: "user" | "assistant"; content: string };

// Same minimal SSE-frame parser voice-session-context.tsx uses internally
// (that one's private to that file) — duplicated here rather than
// imported, deliberately: it's a generic "read event/data frames out of a
// streaming Response" utility with zero voice-specific logic in it, and
// duplicating ~15 lines is a smaller, more inspectable independence
// guarantee than importing anything at all from that file.
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

// Persisted in localStorage (per-browser, not per-account — fine for a
// single-owner app) so revisiting /text resumes the same thread instead of
// silently starting a new one every page load, matching the fix note's
// "Persistent history for this thread" requirement. A fresh id is only
// ever generated once, the first time this page loads with nothing stored.
const SESSION_STORAGE_KEY = "nv-text-session-id";

function getOrCreateSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // localStorage unavailable (private browsing etc.) — fall through to a
    // fresh in-memory-only id; history just won't survive a reload.
  }
  const fresh = `text-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, fresh);
  } catch {
    // Same private-browsing fallback as above.
  }
  return fresh;
}

export default function TextChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hologram, setHologram] = useState<HologramVisual | null>(null);
  const [display, setDisplay] = useState<DisplayContent | null>(null);
  const [uiActionQueue, setUiActionQueue] = useState<UiAction[]>([]);
  const uiActionSeqRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Mutual exclusion between the two takeover types, same reasoning as
  // voice-session-context.tsx's own setHologram/setDisplay wrappers (fixed
  // there 2026-09-04) — kept independently here rather than imported, same
  // "no coupling to that file" stance as everywhere else on this page.
  const showHologram = useCallback((next: HologramVisual | null) => {
    if (next) setDisplay(null);
    setHologram(next);
  }, []);
  const showDisplay = useCallback((next: DisplayContent | null) => {
    if (next) setHologram(null);
    setDisplay(next);
  }, []);

  useEffect(() => {
    const id = getOrCreateSessionId();
    setSessionId(id);
  }, []);

  // Load prior history once we have a session id.
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/v1/text/respond?sessionId=${encodeURIComponent(sessionId)}`, {
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.turns)) setMessages(data.turns);
      } catch (error) {
        console.warn("[TextChat] Failed to load history:", error);
      }
    })();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !sessionId || sending) return;

    setInput("");
    setErrorMessage(null);
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    // Whether the streaming assistant bubble has been appended yet — a
    // plain local variable in this async call's own closure, NOT a ref
    // mutated from inside a setState updater (that was the original bug
    // here: React can invoke an updater function more than once for the
    // same logical update — e.g. under Strict Mode's dev-only double-
    // invoke check — and a side effect like `ref.current = ...` inside
    // an updater runs however many times React happens to call it, which
    // desynced the ref from the array it was supposed to index into and
    // threw "Cannot read properties of undefined" on the next delta.
    // Every updater below is now a pure function of `prev` alone; this
    // variable only gets read/written from the async function's own
    // top-level execution, which genuinely does run once per real event.
    let streamingStarted = false;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/v1/text/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ text, sessionId }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status}).`);
      }

      for await (const { event, data } of parseSSEStream(res)) {
        if (event === "text_delta") {
          const delta = typeof data.text === "string" ? data.text : "";
          if (!delta) continue;
          if (!streamingStarted) {
            streamingStarted = true;
            setMessages((prev) => [...prev, { role: "assistant", content: delta }]);
          } else {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = { role: "assistant", content: last.content + delta };
              return next;
            });
          }
        } else if (event === "display" && isDisplayContent(data)) {
          showDisplay(data);
        } else if (event === "hologram" && isHologramVisual(data)) {
          showHologram(data);
        } else if (event === "ui_action" && isUiAction(data)) {
          if (data.action === "close_display") {
            setDisplay(null);
            setHologram(null);
            continue;
          }
          uiActionSeqRef.current += 1;
          const next: UiAction = { action: data.action, params: data.params, seq: uiActionSeqRef.current };
          setUiActionQueue((prev) => [...prev, next]);
        } else if (event === "done") {
          const responseText = typeof data.responseText === "string" ? data.responseText : "";
          if (!streamingStarted) {
            setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
          } else {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: responseText };
              return next;
            });
          }
        } else if (event === "error") {
          setErrorMessage(typeof data.error === "string" ? data.error : "Something went wrong.");
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }, [input, sessionId, sending, showDisplay, showHologram]);

  return (
    <AppShell>
      <div className="text-chat-page">
        {hologram && <HologramPanel hologram={hologram} onClose={() => showHologram(null)} uiActionQueue={uiActionQueue} />}
        {display && <DisplayPanel display={display} onClose={() => showDisplay(null)} />}

        <div className="text-chat-messages">
          {messages.length === 0 && (
            <div className="text-chat-empty">Nothing here yet — send a message to get started.</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`text-chat-bubble text-chat-bubble-${m.role}`}>
              {m.content}
            </div>
          ))}
          {errorMessage && <div className="hud-error">{errorMessage}</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="text-chat-input-row">
          <input
            type="text"
            className="text-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message North…"
            disabled={sending}
          />
          <button type="button" className="text-chat-send-btn" onClick={handleSend} disabled={sending || !input.trim()}>
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
