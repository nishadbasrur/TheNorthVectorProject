# North Vector: Simplify to Sandbox-First, Interactive Visuals, Wake Word Swap
**Status:** Implemented (five of six sub-tasks fully shipped; wake-word swap needs Nishad to run a Colab training notebook — see Section 3)
**Author:** Claude (planning session), for Nishad, executed by Claude Code
**Date:** July 12, 2026
**Repo:** `github.com/nishadbasrur/TheNorthVectorProject`

## 0. Decisions resolved during implementation

Two questions the original ticket left open, both answered directly by Nishad:

1. **Nav label / home screen:** Sandbox folds into the "Command" nav group (no more "Experimental"/"beta"/warning framing), labeled **"North"**. Additionally: the app now opens to Sandbox first — root `/` redirects to `/sandbox` instead of `/dashboard`.
2. **Map layout:** show_map takes over the entire screen; the orb doesn't disappear, it minimizes to a small still-tappable widget in the bottom-right corner.

## 1. Sidebar: Command + Sandbox only

`components/layout/app-shell.tsx` — `navGroups` collapsed to a single "Command" section: North (`/sandbox`), Dashboard, Weekly Review. Strategy/Execution/Intelligence/Finance are hidden, not deleted — their routes, Firestore data, and the tools that write to them (e.g. `create_task` → `/tasks`) are untouched; typing the URL directly still reaches them.

`app/page.tsx` — root redirect changed from `/dashboard` to `/sandbox`.

## 2. Sandbox page: stripped to just the orb

`app/sandbox/page.tsx` — removed the page-eyebrow/page-title/page-meta block and the "Experimental — voice recognition quality..." warning banner entirely. The orb's own built-in "NORTH" wordmark is now the only label on screen in the resting state.

Transcript/response/tools-used readouts are hidden by default (not deleted — they caught nearly every real bug during earlier development) behind a small "Details" toggle in the HUD panel.

## 3. Wake word: "Hey Mycroft" → "Hey North"

Confirmed this needs real training, not a string change — see
`10-Implementation/Notes/North_Vector_Hey_North_Wake_Word_Training_Walkthrough.md`
for the full walkthrough (a Google Colab notebook, ~20-30 min on a free T4
GPU). Code is prepared but not flipped live yet:

- `assets/wake-word/` — new git-tracked directory (unlike `node_modules`-sourced models, a custom model has nothing else to regenerate it) for the eventual `hey_north_v0.1.onnx`.
- `scripts/copy-wake-word-assets.js` — now also copies whatever's in `assets/wake-word/` into `public/models/`; a no-op until a file actually lands there.
- `app/sandbox/use-wake-word.ts` — `MODEL_FILE_MAP` already has the `hey_north` entry ready; `WAKE_WORD_KEYWORD` stays `"hey_mycroft"` (the live, working default) until Nishad completes training and flips the one line documented in the walkthrough.

## 4. Interactive visual responses: `show_map`

Scoped to maps only (not a general "render arbitrary UI" framework), per the original ticket's own recommendation.

**Provider:** Leaflet + OpenStreetMap tiles, geocoded via Nominatim — both free, no API key, no new billing/secrets to manage. Chosen over Mapbox/Google Maps specifically to avoid adding another account/secret to an already secret-heavy project (Firebase, Anthropic, Google Calendar/Gmail, Notion, Plaid, Google STT/TTS).

**"Current visual" state:** `lib/voice-session-store.ts` gained `VisualState`/`loadVisualState`/`saveVisualState`, stored in the same `voice_sessions` Firestore doc as turn history (same TTL), so a follow-up "zoom in" can act on whatever's already showing without the frontend re-sending its current view on every turn. (`saveSession` was changed to `.set(..., { merge: true })` — without that, its unconditional overwrite would wipe the `visual` field on every ordinary turn save.)

**Tool:** `show_map` in `lib/tool-dispatcher.ts` — accepts `location` (geocoded via `lib/map-client.ts`) and/or `zoomDelta`/`zoomLevel` for relative/absolute zoom adjustments against the current view. Returns a `visual` payload separately from the text handed to Claude; `executeTool`'s return shape changed from `Promise<string>` to `Promise<{ text, visual? }>` uniformly across all tools so `app/api/v1/voice/respond/route.ts` can lift `show_map`'s structured output into the API response (`{ responseText, toolsUsed, visual }`) without every other handler needing to change behavior.

**Frontend:** `app/sandbox/hud-map.tsx` — vanilla Leaflet (dynamically imported client-side, not `react-leaflet`, to sidestep Next.js App Router SSR issues and Leaflet's known default-marker-icon bundler breakage) rendered full-screen via a new `.hud-map-overlay`. `.hud-page-map-active` CSS scales the existing `.hud-stage` down via `transform: scale(0.4)` and fixed-positions it to the bottom-right corner — the same ring/glow markup, just visually shrunk, so the mic tap target (barge-in, stop-listening, escape-to-dormant) keeps working unchanged through the map view. Map (and the corner orb) closes via a small ✕ button or automatically on `goDormant()`.

## 5. Hide transcript by default

Covered in Section 2 — the "Details" toggle, not a deletion.

## 6. UConn 2029 → 2030

`components/layout/app-shell.tsx` — `user-role` string fixed.

## 7. What's verified vs. not

- `npm run typecheck:all` and a full production build (Next.js app + Cloud Functions subproject) — clean, using the established fake-credentials technique (no real Firebase project in this sandbox).
- Visual layout of the stripped Sandbox page and the map-takeover/corner-orb positioning verified via a standalone static-CSS mockup (the app itself is behind real Firebase auth this sandbox has no credentials for, so the actual authenticated pages couldn't be loaded live).
- **Not verified:** actual `show_map`/geocoding/Leaflet tile rendering against real network calls, actual multi-turn "zoom in" follow-up behavior, actual Nominatim rate-limit behavior in practice. These need a real signed-in session to test — flagged the same way every other network-dependent feature this session was.
