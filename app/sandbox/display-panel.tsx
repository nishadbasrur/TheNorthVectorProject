"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";

export type DisplayContentType = "markdown" | "json" | "html" | "image";

// General-purpose visual canvas push_to_screen (lib/tool-dispatcher.ts) pushes
// to — not a set of pre-defined widgets, just a type hint for how to render
// whatever content the tool call included. Kept structurally decoupled from
// that server-side tool-dispatcher.ts's own copy of this shape (same pattern
// as hud-map.tsx's MapVisual vs lib/voice-session-store.ts's VisualState) —
// this file is a client component and shouldn't import from a "server-only"
// file even for a type-only import.
export type DisplayContent = {
  type: DisplayContentType;
  content: string;
  title?: string;
};

function isDisplayContentType(value: unknown): value is DisplayContentType {
  return value === "markdown" || value === "json" || value === "html" || value === "image";
}

export function isDisplayContent(value: unknown): value is DisplayContent {
  const v = value as Record<string, unknown> | null | undefined;
  return !!v && isDisplayContentType(v.type) && typeof v.content === "string";
}

// Pretty-printed if the content parses as JSON, shown verbatim otherwise —
// a tool call producing slightly malformed JSON shouldn't make the whole
// panel disappear.
function JsonBlock({ content }: { content: string }) {
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }, [content]);

  return <pre className="hud-display-json">{formatted}</pre>;
}

// Sanitized before render — content here originates from a tool call (an
// LLM-generated string), not a trusted static source, so this can't go
// straight into dangerouslySetInnerHTML unsanitized.
function HtmlBlock({ content }: { content: string }) {
  const sanitized = useMemo(() => DOMPurify.sanitize(content), [content]);
  return <div className="hud-display-html" dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// Full-screen takeover, structurally parallel to HologramPanel's overlay
// (see hologram-panel.tsx and globals.css's .hud-hologram-* rules) — same
// top-left label badge, top-right circular close button, and full-viewport
// treatment, just with actual content filling the center instead of a
// Three.js canvas. Rendered as a top-level sibling in page.tsx (not nested
// inside .hud-stage) for the same reason HologramPanel/HudMap are: a
// transform on an ancestor (.hud-page-display-active .hud-stage's
// scale(0.4) shrink) would otherwise apply to this panel's own
// position: fixed too, since a transformed ancestor becomes the containing
// block for fixed descendants.
export function DisplayPanel({ display, onClose }: { display: DisplayContent; onClose: () => void }) {
  return (
    <div className="hud-display-overlay">
      <div className="hud-display-fade" />
      <div className="hud-display-label">{display.title || "DISPLAY"}</div>
      <button type="button" className="hud-display-close" onClick={onClose} aria-label="Close display">
        ✕
      </button>

      <div className="hud-display-body">
        <div className="hud-display-content">
          {display.type === "markdown" && (
            <div className="hud-display-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{display.content}</ReactMarkdown>
            </div>
          )}
          {display.type === "json" && <JsonBlock content={display.content} />}
          {display.type === "html" && <HtmlBlock content={display.content} />}
          {display.type === "image" && (
            // eslint-disable-next-line @next/next/no-img-element -- an
            // arbitrary remote URL from a live tool call, not a static asset
            // next/image's remotePatterns could whitelist ahead of time.
            <img className="hud-display-image" src={display.content} alt={display.title ?? "Displayed image"} />
          )}
        </div>
      </div>
    </div>
  );
}
