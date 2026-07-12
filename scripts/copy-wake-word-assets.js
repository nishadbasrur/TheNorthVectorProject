// Copies wake-word ONNX models and onnxruntime-web's WASM binaries from
// node_modules into public/, where the browser can fetch them as static
// assets. Not committed to git (public/models/, public/ort/ are
// gitignored) — node_modules is the source of truth and is itself
// gitignored/reinstalled, so duplicating ~80MB of binaries into git history
// would be pure bloat. Runs automatically via predev/prebuild.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function copyIfMissingOrStale(src, dest) {
  const srcStat = fs.statSync(src);
  if (fs.existsSync(dest)) {
    const destStat = fs.statSync(dest);
    if (destStat.mtimeMs >= srcStat.mtimeMs && destStat.size === srcStat.size) return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

const modelsDir = path.join(root, "node_modules/openwakeword-wasm-browser/models");
const publicModelsDir = path.join(root, "public/models");
// melspectrogram + embedding + VAD are always needed; hey_mycroft_v0.1 is
// today's active wake word (see app/sandbox/use-wake-word.ts) — swap in a
// trained hey_north model once available, per
// assets/wake-word/README.md / North_Vector_Hey_North_Wake_Word_Training_Walkthrough.md.
const modelFiles = ["melspectrogram.onnx", "embedding_model.onnx", "silero_vad.onnx", "hey_mycroft_v0.1.onnx"];
for (const file of modelFiles) {
  copyIfMissingOrStale(path.join(modelsDir, file), path.join(publicModelsDir, file));
}

// Custom-trained models (currently just a not-yet-trained hey_north) live in
// assets/wake-word/, not node_modules — nothing regenerates them, so unlike
// the npm-sourced files above they're committed to git. Copies whatever's
// actually present; a no-op until a trained file lands there.
const customModelsDir = path.join(root, "assets/wake-word");
let customModelCount = 0;
if (fs.existsSync(customModelsDir)) {
  for (const file of fs.readdirSync(customModelsDir).filter((f) => f.endsWith(".onnx"))) {
    copyIfMissingOrStale(path.join(customModelsDir, file), path.join(publicModelsDir, file));
    customModelCount += 1;
  }
}

const ortDistDir = path.join(root, "node_modules/onnxruntime-web/dist");
const publicOrtDir = path.join(root, "public/ort");
// All four simd-threaded variants (.wasm + matching .mjs) — the loader
// feature-detects and picks exactly one at runtime with no fallback retry,
// and which one gets picked appears to differ by browser (confirmed one
// variant in a Chromium-based test; Safari, the actual target browser, is
// untested from this environment). Shipping all four avoids a silent
// browser-specific 404 until that's been verified in practice — worth
// trimming once confirmed.
const ortFiles = fs.readdirSync(ortDistDir).filter((f) => /^ort-wasm-simd-threaded.*\.(wasm|mjs)$/.test(f));
for (const file of ortFiles) {
  copyIfMissingOrStale(path.join(ortDistDir, file), path.join(publicOrtDir, file));
}

console.log(
  `[copy-wake-word-assets] Copied ${modelFiles.length} model file(s), ${customModelCount} custom model(s), and ${ortFiles.length} onnxruntime-web asset(s).`
);
