# Custom wake-word models

`openwakeword-wasm-browser` (see `app/sandbox/use-wake-word.ts`) ships pretrained
models only for a fixed set of stock phrases (alexa, hey_mycroft, hey_jarvis,
hey_rhasspy, timer, weather) — "Hey North" isn't one of them, so it needs a
custom-trained model. This directory is where that trained model lives once
it exists, since (unlike everything in `node_modules`) nothing else can
regenerate it — it has to be committed to git.

**How to get `hey_north_v0.1.onnx` here:** see
`10-Implementation/Notes/North_Vector_Hey_North_Wake_Word_Training_Walkthrough.md`
for the full Colab walkthrough. Once you have the file, drop it in this
directory as `hey_north_v0.1.onnx` and flip the one-line switch documented in
`app/sandbox/use-wake-word.ts` (`WAKE_WORD_KEYWORD`).

`scripts/copy-wake-word-assets.js` copies whatever's in this directory into
`public/models/` alongside the npm-sourced models — it's a no-op until this
directory actually has a file in it.
