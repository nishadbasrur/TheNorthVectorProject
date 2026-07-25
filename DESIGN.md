---
name: North
description: A single-operator JARVIS-register HUD for North Vector, a personal AI chief-of-staff.
colors:
  hud-cyan:
    value: "#3ad6ff"
  hud-cyan-soft:
    value: "rgba(58, 214, 255, 0.55)"
  hud-cyan-faint:
    value: "rgba(58, 214, 255, 0.18)"
  teal-cyan:
    value: "#4dcabc"
  teal-cyan-dim:
    value: "#2a7a70"
  navy-accent:
    value: "#3b5bdb"
  navy-950:
    value: "#04091a"
  navy-900:
    value: "#070d24"
  navy-800:
    value: "#0c1435"
  navy-700:
    value: "#122050"
  navy-600:
    value: "#1a2d6b"
  navy-500:
    value: "#243d8f"
  warm-gold:
    value: "#c9a84c"
  warm-gold-dim:
    value: "#7a5f22"
  slate-900:
    value: "#0f1117"
  slate-800:
    value: "#161b27"
  slate-700:
    value: "#1e2538"
  slate-600:
    value: "#2a3352"
  slate-500:
    value: "#3d4e6e"
  slate-400:
    value: "#5a6e96"
  slate-300:
    value: "#8898b8"
  slate-200:
    value: "#b3bed4"
  slate-100:
    value: "#d4daea"
  white:
    value: "#f0f2f8"
  white-pure:
    value: "#ffffff"
  status-success:
    value: "#22c55e"
  status-warning:
    value: "#f59e0b"
  status-risk:
    value: "#ef4444"
  status-info:
    value: "#60a5fa"
  status-muted:
    value: "#64748b"
typography:
  display:
    fontFamily: "DM Serif Display, Georgia, serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
  numeral:
    fontFamily: "DM Serif Display, serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Times New Roman, Times, serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  chrome-label:
    fontFamily: "Times New Roman, Times, serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  telemetry:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  xs: "3px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card:
    backgroundColor: "{colors.slate-800}"
    rounded: "{rounded.lg}"
    padding: "18px 20px"
  card-hover:
    backgroundColor: "{colors.slate-800}"
    rounded: "{rounded.lg}"
  button-primary:
    backgroundColor: "{colors.navy-accent}"
    textColor: "{colors.white-pure}"
    rounded: "{rounded.sm}"
    padding: "7px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.slate-300}"
    rounded: "{rounded.sm}"
    padding: "7px 16px"
  button-pill:
    backgroundColor: "rgba(34, 211, 238, 0.12)"
    textColor: "{colors.teal-cyan}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
  badge-cyan:
    backgroundColor: "rgba(77, 202, 188, 0.1)"
    textColor: "{colors.teal-cyan}"
    rounded: "4px"
    padding: "2px 8px"
---

# Design System: North

## Overview

**Creative North Star: "North"**

North is a single-operator instrument panel, not a product being sold to anyone. Every surface is built for exactly one person (Nishad) who already knows the system intimately — so the aesthetic optimizes for a HUD an expert operator glances at and trusts, not a landing page persuading a stranger. The register is JARVIS: dry, direct, technical, confident. Density and precision read as competence, not as clutter to soften.

The system already carries a real, deliberately-built identity: a glowing cyan signal ring as its signature HUD element, a dark navy-grounded base with a faint repeating grid texture behind all chrome, and a type pairing that splits duties cleanly — DM Serif Display for the few large numeral/heading moments that deserve weight, JetBrains Mono for anything that reads as live telemetry, Times New Roman carrying everything else. This is refinement territory, not a blank canvas: the direction is set, and new work should extend it consistently rather than introduce a competing sensibility.

North should never read as a generic SaaS dashboard. No purple-to-blue gradients, no cards nested in cards, no rounded-square icon tiles stacked above headings — those are the default AI-generated look this system explicitly rejects in favor of something closer to a real instrument panel.

**Key Characteristics:**
- Dark, navy-grounded base with a faint cyan grid texture behind every chrome surface — never a flat, textureless background.
- One signature circular HUD ring (the Sandbox orb) carries the system's entire emotional range through glow intensity, pulse speed, and rotation — not through separate iconography per state.
- Two labeling registers, used deliberately: Times New Roman uppercase-letterspaced for structural chrome (page eyebrows, card labels, badges), JetBrains Mono uppercase-letterspaced for anything that is genuinely live/telemetry data (HUD status, transcripts, map labels, errors).
- Cyan and navy-blue are the informational/interactive defaults; warm gold is reserved for a distinct content category (long-horizon goals), not used as a general accent.

## Colors

The palette is a dark navy base with a bright cyan signal accent, a duller interactive blue for actionable elements, and a warm gold reserved for one specific content category — plus a conventional semantic status set layered on top.

### Primary
- **HUD Signal Cyan** (`#3ad6ff`): The system's signature glow — the Sandbox ring, page eyebrows, active-state borders and shadows, telemetry text. This is the color of "the system is alive and paying attention." Used with real restraint outside the ring itself: thin borders, small glowing text, never large fills.

### Secondary
- **Navy Interactive Blue** (`#3b5bdb`): The actionable/interactive default — primary buttons, active nav-item backgrounds, links, the user-avatar gradient, progress-bar fills. This is "the thing you can click," distinct from cyan's "the thing that's telling you something."
- **Teal-Cyan** (`#4dcabc`): A second, muted cyan used specifically for embedded UI accents — cyan badges, the task-checkbox hover state, the avatar gradient's second stop. Deliberately distinct from HUD Signal Cyan; do not blend the two or introduce a third cyan shade.

### Tertiary
- **Warm Gold** (`#c9a84c`): Reserved for exactly one content category today — long-horizon goal tags (`.horizon-long`). This is the confirmed pattern from the brief: palette can shift by content type rather than staying fixed everywhere. Don't reach for gold as a general-purpose accent.

### Neutral
- **Navy Base** (`#04091a` → `#122050`, five-step scale): Page background, sidebar background, elevated surfaces, darkest to lightest.
- **Slate** (`#0f1117` → `#d4daea`, nine-step scale): Card backgrounds, borders, and the full text-color ladder (primary/secondary/muted/faint) all derive from this one scale.
- **White** (`#f0f2f8` primary text, `#ffffff` pure white for high-contrast marks like the sidebar brand glyph).

### Status
Separate from the brand palette, used only for genuine state signaling: success `#22c55e`, warning `#f59e0b`, risk `#ef4444`, info `#60a5fa`, muted `#64748b`.

### Named Rules
**The Signal-vs-Action Rule.** HUD Signal Cyan means "the system is telling you something" (glow, telemetry, status). Navy Interactive Blue means "you can act on this" (buttons, active nav, links). Don't swap their roles.

**The One Gold Rule.** Warm Gold is reserved for the long-horizon goal category. It does not become a general secondary accent elsewhere.

## Typography

**Display Font:** DM Serif Display (with Georgia, serif fallback)
**Body Font:** Times New Roman (with Times, serif fallback)
**Label/Mono Font:** JetBrains Mono

**Character:** A confident serif for the handful of moments that deserve real weight (page titles, big numerals, the greeting), a classic print serif carrying everything else, and a monospace reserved specifically for anything that reads as live instrument data. Note: Times New Roman as the global body font is a deliberate departure from the technical-HUD sans that preceded it here — explicit user direction, not a drift the system arrived at on its own.

### Hierarchy
- **Display** (400, 26px, 1.2 line-height): Page titles.
- **Numeral** (400, 28–48px depending on context, 1 line-height): The system's serif numeral moments — stat values, countdown numbers, review scores, the greeting text. Always DM Serif Display, never the body serif.
- **Body** (400, 14px base, 1.6 line-height): Everything else — card text, nav labels, task rows, general UI copy.
- **Chrome Label** (600, 10–11px, 0.12–0.14em letter-spacing, uppercase): Structural labels — page eyebrows, sidebar section labels, card labels, badges, stat labels. Times New Roman, not mono.
- **Telemetry** (500, 10–12px, 0.12–0.14em letter-spacing, uppercase): Live/instrument-style text only — HUD status label, transcript readout label, map label, error text. Always JetBrains Mono. This is what makes the HUD ring's surrounding text feel like real telemetry rather than another UI label.

### Named Rules
**The Two Labels Rule.** Chrome Label (Times New Roman) names a static piece of UI structure. Telemetry (JetBrains Mono) names something that is genuinely live or system-reported right now. Don't use mono for a label that isn't reporting live state, and don't use the body serif for something that is.

## Layout

The shell is a fixed sidebar (220px full, collapsing to a 64px icon rail at ≤1024px, replaced by a slide-in drawer + top bar at ≤767px) plus a scrolling main content area. Every page follows the same `page-header` (eyebrow + serif title + meta) → `page-body` (24–32px padding) structure. Utility grids (`grid-2`/`grid-3`/`grid-4`/`grid-main-side`) tile content into 16–20px-gapped columns, collapsing to fewer columns at each breakpoint.

Every chrome surface (sidebar, main content background, the Sandbox HUD page) shares one background treatment: a dark gradient vignette layered over a faint repeating 40px cyan grid line texture. This grid is the app's constant visual floor — it should appear behind chrome on every page, not just Sandbox.

## Elevation & Depth

Two depth languages coexist today, and the confirmed forward direction is to converge on the glass one everywhere. The HUD ring itself uses layered glow (radial-gradient blooms, drop-shadow filters, blurred backing) rather than a conventional shadow — depth reads as luminance, not as a cast shadow. Utility-page cards, by contrast, are currently flat and opaque: solid slate-800 fill, a thin border, no blur, no glow.

**Forward standard (confirmed):** extend the glass treatment — low-opacity fill, `backdrop-filter: blur(...)`, a thin glowing border — to every panel and card in the system, superseding the current flat solid-card convention. New card/panel work should be built glass-first; the older flat `.card` styling is legacy, not the target.

### Shadow Vocabulary
- **HUD glow bloom** (`radial-gradient` + `filter: blur(28px)`, cyan at low opacity): The ring's primary depth cue.
- **Active-state glow** (`box-shadow: -1px 0 8px rgba(58, 214, 255, 0.25)` and similar): Marks an active/selected state (active nav item), not general elevation.
- **Drawer shadow** (`box-shadow: 8px 0 24px rgba(0, 0, 0, 0.4)`): The one conventional cast shadow in the system, used only for the mobile nav drawer's slide-in.

### Named Rules
**The Glow-Not-Shadow Rule.** Depth in this system comes from luminance (glow, blur, gradient) far more than from cast shadow. Reach for a glow treatment before reaching for `box-shadow`.

## Shapes

Two form languages, used deliberately: soft small radii (6–10px) for structural chrome — cards, nav items, buttons — and true circles for anything that's a signal or a marker: the HUD ring itself, the user avatar, event-timeline dots, risk indicators' rounded caps. The ring/circle is the system's one recurring signature geometry per the JARVIS reference and should stay the dominant motif for anything status- or presence-related, not just the Sandbox orb.

One inconsistency exists today worth resolving rather than extending: two separate button shapes are in active use — `.btn-primary`/`.btn-ghost` (rectangular, 6px radius) and `.nv-button`/`.nv-button-secondary` (full pill, 999px radius, cyan-outlined). Don't add a third shape; converge on one of the two in a future pass.

## Components

### Buttons
- **Shape:** Two systems currently coexist (see Shapes above) — rectangular 6px-radius (`.btn-*`) and full pill (`.nv-button*`). Do not introduce a third.
- **Primary (`.btn-primary`):** Navy Interactive Blue fill, white text, 7px/16px padding.
- **Pill (`.nv-button`):** Transparent cyan-tinted fill (`rgba(34, 211, 238, 0.12)`), teal-cyan text, cyan border, full pill radius — used in Tasks, Settings, Capability Review, Accounts.
- **Ghost (`.btn-ghost`):** Transparent, muted text, subtle border; brightens border and text on hover.

### Cards / Containers
- **Corner Style:** 10px (`.card`) / 8px (`.card-sm`).
- **Background (current):** Solid `slate-800`.
- **Background (forward standard):** Glass — low-opacity fill + backdrop blur + glowing border, per the confirmed direction above.
- **Border:** 1px, `border-default` at rest, brightening to `border-strong` on hover.

### Badges / Pills
- **Style:** Small (2px/8px padding), 4px radius, low-opacity tinted background matched to a semantic or brand color, 1px border in the same hue at slightly higher opacity. One variant per status color plus a dedicated cyan and navy variant.

### Inputs / Fields
- **Style (`.nv-input`/`.nv-textarea`):** 14px radius, dark translucent background (`rgba(4, 9, 26, 0.6)`), border.
- **Known gap:** these currently reference `var(--cyan-500)`, `var(--cyan-300)`, and `var(--border-subtle)` for their border/text/focus treatment, none of which are defined in `:root` — a live bug (see Do's and Don'ts) affecting real, shipped pages (Tasks, Settings, Capability Review, Accounts).

### Navigation
- **Style:** 13px text, 7px/8px padding, 6px radius per item. Active item gets a filled tinted background, a 2px cyan left border, and a cyan glow shadow — the one place outside the HUD ring where the glow language already appears on a utility surface.

### The HUD Ring (signature component)
The system's one true signature: a 260×260px circular instrument built from stacked layers — a dark backing disc for contrast, faint radial tick marks, a two-layer glow bloom (soft outer + bright core), scattered particle specks, and an SVG ring with an animated arc segment. Six distinct states (idle, dormant, listening, transcribing/processing, speaking) are expressed purely through opacity, glow intensity, and animation speed/style on these same layers — never through swapping icons or shapes. This state-through-glow-not-iconography pattern is the model for any future status-bearing element in the system.

## Do's and Don'ts

### Do:
- **Do** use HUD Signal Cyan (`#3ad6ff`) for anything reporting live system state or telemetry; use Navy Interactive Blue (`#3b5bdb`) for anything actionable.
- **Do** build new panels and cards glass-first — low-opacity fill, backdrop blur, glowing border — per the confirmed forward standard, even though older `.card` usage is still flat.
- **Do** use JetBrains Mono only for genuinely live/telemetry text (Telemetry role); use Times New Roman for structural labels (Chrome Label role).
- **Do** keep the grid-texture + gradient-vignette background on every chrome surface, not just Sandbox.
- **Do** express component state (active/loading/listening/etc.) through glow, opacity, and motion on existing shapes before reaching for a new icon or shape.

### Don't:
- **Don't** introduce a purple-to-blue gradient, nested cards, or rounded-square icon tiles above headings — the generic-SaaS pattern this system explicitly rejects.
- **Don't** introduce a third cyan shade. HUD Signal Cyan (`#3ad6ff`) and Teal-Cyan (`#4dcabc`) are the only two, and they have distinct roles (signal vs. embedded accent).
- **Don't** use Warm Gold as a general secondary accent — it's reserved for the long-horizon goal category only.
- **Don't** add a third button shape. Reconcile the existing rectangular (`.btn-*`) and pill (`.nv-button*`) systems before extending either.
- **Don't** attempt floating 3D wireframe holograms composited over physical space, or literal dated browser-chrome styling — both are explicitly out of scope for a 2D web app.
- **Don't** ship new `.nv-input`/`.nv-textarea`/`.nv-button` usage without first fixing the missing `--cyan-500`, `--cyan-300`, and `--border-subtle` custom properties — they're referenced but never defined, so these elements are currently rendering with invalid/fallback styling on live pages (Tasks, Settings, Capability Review, Accounts).
- **Don't** put `backdrop-filter: blur()` on a circular element expecting it to blend seamlessly — confirmed live bug on the Sandbox HUD ring: the blur is clipped hard to the element's own `border-radius`, and that clip boundary shows up as a visible gray/black circular edge against whatever's behind it. Use it on rectangular glass panels only, or accept the visible edge as an intentional frame.
- **Don't** rely on a bare `<button>`'s `background`/`border` overrides alone to fully suppress native browser chrome — confirmed live bug on the HUD ring's hit-target button: a lingering native `appearance: auto` edge stayed visible until `appearance: none` (plus `-webkit-appearance: none`) was added explicitly. Any custom-styled `<button>` in this system should set `appearance: none` up front, not just override colors.
