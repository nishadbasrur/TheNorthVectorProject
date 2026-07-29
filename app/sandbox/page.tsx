"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useVoiceSession } from "./voice-session-context";
import { HudMap } from "./hud-map";
import { DisplayPanel } from "./display-panel";
import { HologramPanel } from "./hologram-panel";

// Tick marks around the HUD ring, generated rather than hand-authored 24
// <line> elements — kept subtle (see globals.css) since the reference
// photo reads as a soft glowing orb, not a compass instrument.
const HUD_TICK_COUNT = 24;
const HUD_TICKS = Array.from({ length: HUD_TICK_COUNT }, (_, i) => ({
  angle: (360 / HUD_TICK_COUNT) * i,
  major: i % 4 === 0,
}));

// Scattered particle specks around the ring, matching the star-like flecks
// visible around the glow in the reference photo. Fixed positions (not
// Math.random() at render time) so server/client markup matches exactly —
// hand-placed for a natural, non-gridlike scatter, not procedurally random.
const HUD_PARTICLES = [
  { x: 18, y: 22, size: 2, blur: 2 },
  { x: 82, y: 16, size: 1.5, blur: 1.5 },
  { x: 90, y: 38, size: 2.5, blur: 3 },
  { x: 12, y: 58, size: 1.5, blur: 1.5 },
  { x: 8, y: 78, size: 2, blur: 2 },
  { x: 76, y: 88, size: 1.5, blur: 1.5 },
  { x: 92, y: 68, size: 2, blur: 2 },
  { x: 30, y: 6, size: 1.5, blur: 1.5 },
  { x: 60, y: 92, size: 2, blur: 2 },
  { x: 4, y: 40, size: 1.5, blur: 1.5 },
];

// Thinking/speaking indicator: a dense, STATIC field of dots (never move,
// never rotate) filling an annulus — outside the NORTH/status text's own
// circular footprint, capped at an invisible outer boundary (no drawn
// ring line; see hud-ring-outer/hud-ring-inner's removal below). No
// separate light source sweeps over them: each dot animates its OWN
// opacity, staggered by a per-dot delay proportional to its angle, so the
// same rotating-wave illusion emerges purely from each dot lighting
// itself up in turn (see .hud-wave-dot's animation in globals.css).
// HUD_WAVE_DOT_AMP is a per-dot peak-brightness ceiling that fades out
// smoothly over the outer ~45% of the band — this is what makes the whole
// field "radiate and fade out" near the invisible boundary instead of
// stopping at a hard edge. Positions use a Fibonacci/sunflower spiral
// generalized to an annulus (radius grows with sqrt of swept area, not
// sqrt of index, to stay evenly dense across a ring-shaped region rather
// than a full disc) — deterministic, not Math.random(), same reasoning as
// HUD_TICKS/HUD_PARTICLES above.
const HUD_WAVE_DOT_COUNT = 1040;
const HUD_WAVE_INNER_RADIUS = 70; // clear gap outside hud-ring-hit's own footprint (61.5) — dots must not bleed into the text/button
const HUD_WAVE_OUTER_RADIUS = 90; // the invisible enclosure — dots never go past this
const HUD_WAVE_FADE_START = 0.55; // fraction of the band width where the fade-out begins
const HUD_WAVE_GOLDEN_ANGLE = (137.50776405003785 * Math.PI) / 180;
const HUD_WAVE_DOTS = Array.from({ length: HUD_WAVE_DOT_COUNT }, (_, i) => {
  const areaFrac = (i + 0.5) / HUD_WAVE_DOT_COUNT;
  const r = Math.sqrt(
    HUD_WAVE_INNER_RADIUS ** 2 + (HUD_WAVE_OUTER_RADIUS ** 2 - HUD_WAVE_INNER_RADIUS ** 2) * areaFrac
  );
  const theta = i * HUD_WAVE_GOLDEN_ANGLE;
  const t = (r - HUD_WAVE_INNER_RADIUS) / (HUD_WAVE_OUTER_RADIUS - HUD_WAVE_INNER_RADIUS);
  const amp = t <= HUD_WAVE_FADE_START ? 1 : Math.max(0.05, 1 - (t - HUD_WAVE_FADE_START) / (1 - HUD_WAVE_FADE_START));
  return {
    cx: Math.round((100 + r * Math.cos(theta)) * 100) / 100,
    cy: Math.round((100 + r * Math.sin(theta)) * 100) / 100,
    frac: Math.round((theta / (2 * Math.PI) - Math.floor(theta / (2 * Math.PI))) * 1000) / 1000,
    amp: Math.round(amp * 100) / 100,
  };
});

// All the actual voice/mic/audio state and logic lives in
// VoiceSessionContext, mounted once at the root layout (app/layout.tsx) so
// it survives navigating away from this page — see that file's module
// comment. This component just renders the HUD from whatever the context
// currently holds.
export default function SandboxPage() {
  const {
    ringState,
    statusLabel,
    errorMessage,
    showTranscript,
    setShowTranscript,
    transcript,
    responseText,
    toolsUsed,
    visual,
    setVisual,
    display,
    setDisplay,
    hologram,
    setHologram,
    handleMicTap,
  } = useVoiceSession();

  const takeoverClass = visual ? "hud-page-map-active" : hologram ? "hud-page-hologram-active" : "";

  return (
    <AppShell>
      <div className={`hud-page ${takeoverClass}`}>
        {visual && <HudMap visual={visual} onClose={() => setVisual(null)} />}
        {hologram && <HologramPanel hologram={hologram} onClose={() => setHologram(null)} />}

        <div className="hud-ruler">
          {Array.from({ length: 48 }, (_, i) => (
            <div key={i} className="hud-ruler-tick" />
          ))}
        </div>

        <div className="hud-stage">
          <div className={`hud-ring-wrap hud-ring-${ringState}${errorMessage ? " hud-ring-error" : ""}`}>
            {/* Solid-ish dark backing behind the glow — without it the
                mostly-transparent orb blended into light backgrounds (e.g.
                a light map, before the map switched to a dark theme).
                Independent of what's underneath, not just a fix for the
                map specifically. */}
            <div className="hud-orb-backing" />

            <svg className="hud-ticks" viewBox="0 0 200 200">
              {HUD_TICKS.map(({ angle, major }) => (
                <line
                  key={angle}
                  className={major ? "hud-tick-major" : undefined}
                  x1="100"
                  y1="6"
                  x2="100"
                  y2={major ? "18" : "13"}
                  transform={`rotate(${angle} 100 100)`}
                />
              ))}
            </svg>

            <div className="hud-glow" />
            <div className="hud-glow-core" />

            <div className="hud-particles">
              {HUD_PARTICLES.map((p, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: p.size,
                    height: p.size,
                    borderRadius: "50%",
                    background: "var(--white)",
                    boxShadow: `0 0 ${p.blur}px var(--hud-cyan)`,
                  }}
                />
              ))}
            </div>

            {/* No drawn ring lines anymore — see HUD_WAVE_DOTS above.
                The dot field's own radial fade-out (amp) is what implies
                the outer boundary now, instead of a stroked circle. */}
            <svg className="hud-wave-field" viewBox="0 0 200 200">
              {HUD_WAVE_DOTS.map(({ cx, cy, frac, amp }, i) => (
                <circle
                  key={i}
                  className="hud-wave-dot"
                  cx={cx}
                  cy={cy}
                  r="0.7"
                  style={{ "--dot-frac": frac, "--dot-amp": amp } as React.CSSProperties}
                />
              ))}
            </svg>

            <button className="hud-ring-hit" onClick={handleMicTap} aria-label={statusLabel}>
              <span className="hud-wordmark">NORTH</span>
              <span className="hud-status-label">{statusLabel}</span>
            </button>
          </div>

          <div className="hud-panel">
            {errorMessage && <div className="hud-error">{errorMessage}</div>}

            {showTranscript && (
              <>
                {transcript && (
                  <div className="hud-readout">
                    <div className="hud-readout-label">You said</div>
                    <div className="hud-readout-text">{transcript}</div>
                  </div>
                )}

                {responseText && (
                  <div className="hud-readout">
                    <div className="hud-readout-label">North</div>
                    <div className="hud-readout-text">{responseText}</div>
                  </div>
                )}

                {toolsUsed.length > 0 && (
                  <div className="hud-readout">
                    <div className="hud-readout-label">Tools used</div>
                    <div className="hud-readout-text">{toolsUsed.join(", ")}</div>
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              className="hud-transcript-toggle"
              onClick={() => setShowTranscript((v) => !v)}
            >
              {showTranscript ? "Hide details" : "Details"}
            </button>
          </div>

          {display && <DisplayPanel display={display} onClose={() => setDisplay(null)} />}
        </div>
      </div>
    </AppShell>
  );
}
