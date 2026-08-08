#!/usr/bin/env node
// Runs inside .github/workflows/autonomous-capability-draft.yml. Given a
// logged capability gap (lib/capability-gap-store.ts), asks Claude to draft
// a new voice tool, then applies it via three FIXED, mechanical insertion
// points in lib/tool-dispatcher.ts (never a free-form diff/edit) plus
// optional brand-new files strictly under lib/. This is the actual scope
// fence, not just a prompt instruction: the model's JSON output is only
// ever spliced into these exact anchors, so it structurally cannot touch
// firestore.rules, auth, package.json, CI config, or the body of any
// existing handler. See North_Vector_Autonomous_Self_Extension_Plan.md
// Section 3.
"use strict";

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const REPO_ROOT = path.join(__dirname, "..");
const TOOL_DISPATCHER_PATH = path.join(REPO_ROOT, "lib/tool-dispatcher.ts");

// Same model as lib/openai-client.ts's MODEL_AGENTIC — duplicated as a
// literal here (not imported) because this is a plain CommonJS script run
// directly via `node scripts/draft-capability.js` in CI, with no
// TS-transpilation step available to pull in a .ts module. No hidden
// default, same discipline as the main app: every call site names its
// model explicitly.
const MODEL_AGENTIC = "gpt-5.4-mini";

const GAP_ID = process.env.GAP_ID || "";
const CAPABILITY_REQUEST = process.env.CAPABILITY_REQUEST || "";
const CAPABILITY_DESCRIPTION = process.env.CAPABILITY_DESCRIPTION || "";
const CAPABILITY_PROPOSED_APPROACH = process.env.CAPABILITY_PROPOSED_APPROACH || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

// Deliberately exits 0, not 1 — "nothing draftable" (missing input, model
// judged it infeasible, a validation check failed) is an expected outcome,
// not a broken CI run. The workflow itself checks the `drafted` output to
// decide whether to continue to typecheck/build/PR.
function stop(reason) {
  console.error(`[draft-capability] ${reason}`);
  setOutput("drafted", "false");
  process.exit(0);
}

function requireUniqueAnchor(source, anchor, label) {
  const count = source.split(anchor).length - 1;
  if (count !== 1) {
    stop(`Expected exactly one "${label}" anchor, found ${count} — tool-dispatcher.ts structure has drifted, aborting rather than guessing.`);
  }
}

async function main() {
  if (!OPENAI_API_KEY) stop("Missing OPENAI_API_KEY.");
  if (!GAP_ID || !CAPABILITY_REQUEST || !CAPABILITY_DESCRIPTION) stop("Missing gap payload (GAP_ID/CAPABILITY_REQUEST/CAPABILITY_DESCRIPTION).");

  const existingSource = fs.readFileSync(TOOL_DISPATCHER_PATH, "utf-8");
  const existingToolNames = Array.from(existingSource.matchAll(/name:\s*"([a-z_]+)"/g)).map((m) => m[1]);

  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const prompt = [
    "You are drafting exactly one new voice tool for North Vector, a personal voice assistant.",
    "",
    "A user asked North to do something it couldn't. Here's the gap:",
    `Request: "${CAPABILITY_REQUEST}"`,
    `Missing capability: "${CAPABILITY_DESCRIPTION}"`,
    "",
    ...(CAPABILITY_PROPOSED_APPROACH
      ? [
          "North's own proposed approach at the time it flagged this gap (a head start, not a spec —",
          "verify it against the codebase and STRICT CONSTRAINTS below rather than following it blindly):",
          `"${CAPABILITY_PROPOSED_APPROACH}"`,
          "",
        ]
      : []),
    "Here is the FULL current contents of lib/tool-dispatcher.ts for context and convention-matching:",
    "```ts",
    existingSource,
    "```",
    "",
    "Existing tool names (yours must not collide): " + existingToolNames.join(", "),
    "",
    "STRICT CONSTRAINTS — you are operating inside an automated pipeline with no human review of your",
    "code before it typechecks/builds. Any output that doesn't fit these constraints will be rejected:",
    "- No new npm dependencies. Only use what's already imported elsewhere in this codebase.",
    "- No modification to any existing file's existing content — only pure additions.",
    "- Any new client/helper file must be a NEW file under lib/, filename matching ^[a-z][a-z0-9-]*\\.ts$.",
    "- Never touch auth, secrets, firestore.rules, CI config, or package.json — you have no mechanism to",
    "  do so anyway (see output format below), but do not attempt workarounds like eval or dynamic requires.",
    "- Match the existing error-handling pattern: handlers catch their own errors, log with",
    "  console.error(\"[tool-dispatcher] <name> failed:\", error), and return a friendly fallback string —",
    "  never throw.",
    "- If the capability genuinely cannot be built within these constraints (needs a paid/keyed API,",
    "  needs modifying existing files, needs a new dependency, is unsafe/destructive, or is simply not a",
    "  coherent single tool), set \"feasible\": false and explain why in \"reason\" — do NOT force a bad attempt.",
    "",
    "Respond with ONLY a single JSON object, no prose before or after, matching this shape:",
    "{",
    '  "feasible": boolean,',
    '  "reason": string,  // required if feasible is false; why this can\'t be built in-scope',
    '  "toolName": string,  // snake_case, e.g. "some_new_tool" — required if feasible',
    '  "toolDefinitionCode": string,  // one TOOL_DEFINITIONS array entry, e.g. \'{ name: "x", description: "...", input_schema: {...} },\'',
    '  "handlerCode": string,  // one full `async function handleX(...) {...}` matching the existing pattern',
    '  "switchCaseCode": string,  // one `case "x": return {...};` matching the existing pattern',
    '  "newImports": string[],  // each exactly `import { ... } from "./new-file-name";` for any newFiles below, or []',
    '  "newFiles": [{ "path": "lib/new-file-name.ts", "content": string }],  // or []',
    '  "summary": string  // one sentence describing what this adds, for the PR description',
    "}",
  ].join("\n");

  // max_output_tokens: 8000 is far above the 16-token floor where OpenAI's
  // Responses API rejects a request outright (the bug already found and
  // fixed at the real call sites in lib/openai-client.ts) — this script's
  // whole draft (tool definition + handler + switch case + any new files)
  // genuinely needs the headroom, so no truncation risk either.
  const response = await client.responses.create({
    model: MODEL_AGENTIC,
    input: prompt,
    max_output_tokens: 8000,
  });

  if (!response.output_text) stop("No text response from the model.");

  let draft;
  try {
    const jsonMatch = response.output_text.match(/\{[\s\S]*\}/);
    draft = JSON.parse(jsonMatch[0]);
  } catch (error) {
    stop(`Could not parse model response as JSON: ${error.message}`);
  }

  if (!draft.feasible) {
    stop(`Model judged this infeasible within scope: ${draft.reason || "no reason given"}`);
  }

  // --- Validation (scope fence, part 1: reject anything malformed before touching disk) ---
  if (!/^[a-z][a-z0-9_]*$/.test(draft.toolName || "")) stop(`Invalid toolName: ${draft.toolName}`);
  if (existingToolNames.includes(draft.toolName)) stop(`Tool name "${draft.toolName}" already exists.`);
  if (!draft.toolDefinitionCode || !draft.handlerCode || !draft.switchCaseCode) stop("Missing required code sections.");

  const newFiles = Array.isArray(draft.newFiles) ? draft.newFiles : [];
  for (const f of newFiles) {
    if (!f.path || !/^lib\/[a-z][a-z0-9-]*\.ts$/.test(f.path)) stop(`New file path outside allowed scope: ${f.path}`);
    if (fs.existsSync(path.join(REPO_ROOT, f.path))) stop(`New file would overwrite an existing file: ${f.path}`);
    if (typeof f.content !== "string" || f.content.trim().length === 0) stop(`New file has no content: ${f.path}`);
  }

  const newImports = Array.isArray(draft.newImports) ? draft.newImports : [];
  for (const imp of newImports) {
    if (!/^import \{[^{}]+\} from "\.\/[a-z][a-z0-9-]*";$/.test(imp.trim())) {
      stop(`Disallowed import statement (must be a relative import of a new lib/ file): ${imp}`);
    }
  }

  // --- Apply insertions (scope fence, part 2: only these three fixed splice points, ever) ---
  // Re-synced against tool-dispatcher.ts's real current content — both of
  // these had silently drifted from ordinary, unrelated code growth
  // (capability-gap-store's import gained two more named exports;
  // executeTool's return-shape comment grew display/hologram/uiAction)
  // and were failing every real run with "structure has drifted" before
  // ever reaching the model-output insertion step. Found via this fix's
  // own required live-test of the real drafting flow, not the OpenAI
  // migration itself — but worth fixing here since the whole point of
  // that live-test was confirming the pipeline actually runs end to end.
  const LAST_IMPORT_ANCHOR = 'import { logCapabilityGap, getRecentCapabilityGaps, logDraftEmailGap } from "./capability-gap-store";';
  const TOOL_DEFINITIONS_CLOSE_ANCHOR = "];\n\n// Every handler catches its own errors";
  const EXECUTE_TOOL_ANCHOR = "// Returns { text, visual, display, hologram, uiAction } uniformly";
  const SWITCH_DEFAULT_ANCHOR = '    default:\n      return { text: `Unknown tool: ${name}` };';

  requireUniqueAnchor(existingSource, LAST_IMPORT_ANCHOR, "last import");
  requireUniqueAnchor(existingSource, TOOL_DEFINITIONS_CLOSE_ANCHOR, "TOOL_DEFINITIONS close");
  requireUniqueAnchor(existingSource, EXECUTE_TOOL_ANCHOR, "executeTool");
  requireUniqueAnchor(existingSource, SWITCH_DEFAULT_ANCHOR, "switch default");

  let updated = existingSource;

  if (newImports.length > 0) {
    updated = updated.replace(LAST_IMPORT_ANCHOR, `${LAST_IMPORT_ANCHOR}\n${newImports.join("\n")}`);
  }

  updated = updated.replace(
    TOOL_DEFINITIONS_CLOSE_ANCHOR,
    `  ${draft.toolDefinitionCode.trim()}\n${TOOL_DEFINITIONS_CLOSE_ANCHOR}`
  );

  updated = updated.replace(
    EXECUTE_TOOL_ANCHOR,
    // Re-insert via the same EXECUTE_TOOL_ANCHOR constant, not a second
    // hardcoded copy of the comment text — the previous version duplicated
    // it literally here too, so when the real comment grew
    // (display/hologram/uiAction), this copy silently stayed stale and a
    // successful splice would have quietly reverted the real file's
    // comment back to the old wording. One source of truth now.
    `${draft.handlerCode.trim()}\n\n${EXECUTE_TOOL_ANCHOR}`
  );

  updated = updated.replace(
    SWITCH_DEFAULT_ANCHOR,
    `    ${draft.switchCaseCode.trim()}\n${SWITCH_DEFAULT_ANCHOR}`
  );

  fs.writeFileSync(TOOL_DISPATCHER_PATH, updated);

  for (const f of newFiles) {
    fs.writeFileSync(path.join(REPO_ROOT, f.path), f.content);
  }

  console.log(`[draft-capability] Drafted "${draft.toolName}": ${draft.summary || ""}`);
  setOutput("drafted", "true");
  setOutput("tool-name", draft.toolName);
  setOutput("summary", (draft.summary || "").replace(/\n/g, " "));
}

main().catch((error) => {
  stop(`Unexpected error: ${error.message}`);
});
