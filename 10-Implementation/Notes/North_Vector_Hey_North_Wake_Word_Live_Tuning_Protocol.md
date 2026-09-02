# Hey North Wake-Word Live Tuning Protocol

**Status:** For Nishad — this step can't be run from Claude Code's environment (needs a real human voice into a real microphone). Everything on the code side is already wired up and waiting for the results: `DEFAULT_DETECTION_THRESHOLD` in `app/sandbox/use-wake-word.ts` is a documented placeholder (0.32) pending exactly this pass.

## Why this exists

`"Hey North"` is already a real, dedicated wake-word engine (openWakeWord, running as WASM in the browser) with a real trained model — not the old STT-transcript-pattern-matching approach, and not something that needs replacing. What it genuinely hasn't had yet is a **live tuning pass**: picking `detectionThreshold` based on real "Hey North" utterances instead of a first-attempt guess.

## 1. Turn on the live debug overlay

Open `/sandbox?wakeword-debug=1` (any value after `=` works, the code just checks the param is present).

This does two things:
- Turns on `WakeWordEngine`'s own per-chunk score logging (console).
- Shows a small live readout in the bottom-left corner — a bar + number for each of `hey_north` and `hey_north_whisper`, a vertical marker at the current threshold, and a running log of the last few actual detections. This is what you should actually watch during testing; the console log is a fallback if you want to dig into raw numbers afterward.

## 2. Run through these cases

Mirrors the "not just clean quiet repetition" spirit of a real informal test — vary distance, background noise, and how naturally you say it:

- **Close (~1 ft), quiet room, clearly said** — baseline sanity check.
- **~3 ft away, quiet room** — normal usage distance.
- **~10 ft away, quiet room** — worst-case distance you'd realistically want this to work at.
- **Normal room noise** (TV, music, talking nearby) at ~3 ft.
- **Casual/mumbled phrasing** — how you'd actually say it half-asleep or distracted, not enunciated for a demo.
- **Whispered** — this is what `hey_north_whisper` is specifically for; test it deliberately, separately from normal-volume speech.
- **A few false-positive checks** — say things that AREN'T "Hey North" (your name, "north" alone, random conversation) near the mic, watch the overlay for scores that get uncomfortably close to the threshold line without crossing it.

For each case, just watch the overlay: did the score cross the threshold line and get picked up in the detection log? How close/far was the peak score from the line?

## 3. What to send back

The actual numbers matter more than a pass/fail — e.g. "3 ft quiet: peaked around 0.41, detected fine. 10 ft quiet: peaked around 0.19, never fired. Whisper: peaked around 0.55, detected." That's enough to pick a real threshold value (or notice `hey_north` and `hey_north_whisper` might genuinely need different sensitivity — see the note below).

## Known limitation worth knowing about upfront

`WakeWordEngine` only supports **one global `detectionThreshold`**, shared across every active keyword — there's no per-keyword override in the library itself (confirmed by reading its source, not assumed). Since `hey_north` was trained on synthetic TTS speech and `hey_north_whisper` on real whispered recordings — acoustically very different signals — it's plausible one threshold ends up being a real compromise between the two rather than ideal for either. If your test data shows that clearly (e.g. normal speech needs a much higher threshold than whisper to avoid false positives, or vice versa), the fix is a small `patch-package` patch to the library adding a genuine `score` event callers can gate on per-keyword themselves — a real, scoped follow-up, not something to build blind ahead of having the data that justifies it.

## If it's still not accurate enough after tuning

Per the training walkthrough's own note: re-run the Colab notebook with a larger `n_samples` (3000-5000 instead of 1000) for a more robust model. That's a "the data says it's not good enough" decision, not something to preempt.
