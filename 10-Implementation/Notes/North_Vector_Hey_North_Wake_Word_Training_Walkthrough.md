# Hey North Wake-Word Training Walkthrough

**Status:** Walkthrough for Nishad — this step can't be automated from Claude Code's environment (no GPU, no Piper TTS pipeline, and the actual training tool only runs on Linux). Everything on the code side is already wired up and waiting for the output file — see Section 4.

## 1. Why this needs training, not a string change

`"hey_mycroft"` isn't a placeholder value — it's the name of a specific pretrained openWakeWord model file (`hey_mycroft_v0.1.onnx`). openWakeWord ships models only for a small, fixed set of phrases (alexa, hey mycroft, hey jarvis, hey rhasspy, timer, weather). "Hey North" isn't one of them, because no one else has ever needed a model for it. Getting real "Hey North" detection means training a new custom classifier on synthetic speech of that exact phrase.

## 2. The notebook

openWakeWord's own repo ships an automated training notebook that runs entirely in Google Colab, no local setup, no development experience required:

- **[automatic_model_training.ipynb](https://colab.research.google.com/github/dscripka/openWakeWord/blob/main/notebooks/automatic_model_training.ipynb)** — open this link directly, it launches in Colab.
- Runs on a **free** Colab T4 GPU — no Colab Pro needed. The notebook's own estimate is **~10 minutes** of actual training time once everything's set up (budget ~20-30 minutes total including setup/dependency install cells).

## 3. Steps

1. Open the notebook link above. Sign in with your Google account if prompted.
2. **Runtime → Change runtime type → T4 GPU**, then save. (Free tier — no payment needed.)
3. Run the setup cells at the top in order (they install dependencies and download the pretrained melspectrogram/embedding/VAD models plus background-noise datasets used for augmentation — this is the slowest part, mostly downloading, not computing).
4. Find the config cell and set:
   - `target_phrase`: `"hey north"`
   - Leave `n_samples` / `n_samples_val` at their defaults (1000 each) for a first pass — this is enough for a real, usable model. You can retrain later with more samples if it feels unreliable in practice.
   - Leave `steps`, `target_accuracy`, `target_recall`, `background_paths`, `false_positive_validation_data_path` at their defaults unless you have a specific reason to change them.
5. Run the remaining cells in order: generate clips → augment clips → train model. (Skip the optional "convert to tflite" cell — this project only needs the `.onnx` file, not the mobile/TFLite variant.)
6. When training finishes, the notebook writes the output to `my_custom_model/hey_north.onnx` (in the Colab session's file browser, left sidebar).
7. Download that file from Colab's file browser (right-click → Download).

## 4. Wiring it into the app (already prepared — this is the only manual step left)

1. Rename the downloaded file to exactly `hey_north_v0.1.onnx`.
2. Drop it into `assets/wake-word/hey_north_v0.1.onnx` in this repo (see that directory's `README.md` — it's committed to git, since nothing else can regenerate it).
3. In `app/sandbox/use-wake-word.ts`, change one line:
   ```ts
   export const WAKE_WORD_KEYWORD = "hey_mycroft";
   ```
   to:
   ```ts
   export const WAKE_WORD_KEYWORD = "hey_north";
   ```
   (`MODEL_FILE_MAP` already has the `hey_north` entry ready — nothing else to change there.)
4. In `app/sandbox/page.tsx`, update `WAKE_WORD_DISPLAY_NAME` from `"Hey Mycroft"` to `"Hey North"`.
5. Run `npm run predev` (or just `npm run dev`/`npm run build`, which run it automatically) — `scripts/copy-wake-word-assets.js` will pick up the new file from `assets/wake-word/` and copy it into `public/models/` alongside the others.
6. Test locally: dormant Sandbox should now respond to "Hey North" instead of "Hey Mycroft."

If the result feels unreliable (false triggers, missed detections), the most common fix is re-running the notebook with a larger `n_samples` (e.g. 3000-5000) — more synthetic examples generally means a more robust model, at the cost of longer training time. This is a "tell me it's not working well and we'll retrain" situation, not something to over-tune blind.

## 5. Sources

- [dscripka/openWakeWord — GitHub](https://github.com/dscripka/openWakeWord)
- [automatic_model_training.ipynb](https://github.com/dscripka/openWakeWord/blob/main/notebooks/automatic_model_training.ipynb)
