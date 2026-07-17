#!/usr/bin/env node
// Runs inside .github/workflows/autonomous-capability-draft.yml when
// inputs.kind == "bug_fix" — given a real tool failure (functions/src/index.ts's
// onToolError, watching lib/tool-error-log.ts's tool_errors collection),
// asks Claude to fix it. Unlike scripts/draft-capability.js (which only ever
// ADDS to lib/tool-dispatcher.ts via three fixed anchors), this one rewrites
// an EXISTING file — but the scope fence is tighter, not looser: the target
// file is looked up from a hardcoded, code-owned allowlist keyed by tool
// name (TOOL_TO_FILE below), never chosen by the model, and this script
// only ever writes to that exact single path. It structurally cannot touch
// lib/tool-dispatcher.ts's routing, any other lib/ file, firestore.rules,
// auth, package.json, or CI config. Typecheck + build (next steps in the
// workflow) still gate before a PR is even opened, and a human still
// reviews the real diff before anything merges — same guarantees as the
// capability-draft path, just with a different fence shape suited to
// "fix this one thing" instead of "add something new."
"use strict";

const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const REPO_ROOT = path.join(__dirname, "..");

// Kept in sync with FIXABLE_TOOLS in functions/src/index.ts — that set only
// gates whether a fix is even attempted (and avoids a dead-end review-page
// entry for a tool with nowhere to route a fix); this map is what actually
// decides which single file may be touched. A tool with no entry here — or
// one filtered out upstream — never reaches this script with feasible: true.
const TOOL_TO_FILE = {
  check_email: "lib/gmail-client.ts",
  search_email: "lib/gmail-client.ts",
  send_email: "lib/gmail-client.ts",
  delete_email: "lib/gmail-client.ts",
  check_calendar: "lib/google-calendar-client.ts",
  create_calendar_event: "lib/google-calendar-client.ts",
  update_calendar_event: "lib/google-calendar-client.ts",
  delete_calendar_event: "lib/google-calendar-client.ts",
  check_notion: "lib/notion-client.ts",
  get_decision_recommendation: "lib/decision-engine.ts",
  show_map: "lib/map-client.ts",
  highlight_building: "lib/map-client.ts",
  check_icloud_email: "lib/icloud-mail-client.ts",
  search_icloud_email: "lib/icloud-mail-client.ts",
  create_task: "lib/task-store-admin.ts",
  // These three don't have one clean dedicated file the way the tools above
  // do — best-guess single-file bets on where a real bug is most likely to
  // actually live, not a perfect 1:1 mapping. That's an acceptable
  // limitation of this fence, not a safety gap: a wrong guess just means
  // typecheck/build/review catches an ineffective fix (or the model itself
  // reports infeasible), never an unsafe one, since the single-file
  // constraint still holds regardless of which file was picked.
  research: "lib/anthropic-client.ts", // the actual web-search API call/parsing
  check_bug_status: "lib/capability-gap-store.ts", // more complex of its two data sources
  get_proactive_updates: "lib/synthesis-engine.ts", // the reasoning pass itself, of its three files
};

const GAP_ID = process.env.GAP_ID || "";
const TOOL_NAME = process.env.TOOL_NAME || "";
const ERROR_MESSAGE = process.env.ERROR_MESSAGE || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

// Same "exit 0, not 1" contract as draft-capability.js — "nothing to fix
// here" (no mapped file, model judged it unfixable in-scope, a validation
// check failed) is an expected outcome, not a broken CI run.
function stop(reason) {
  console.error(`[draft-bugfix] ${reason}`);
  setOutput("drafted", "false");
  process.exit(0);
}

async function main() {
  if (!ANTHROPIC_API_KEY) stop("Missing ANTHROPIC_API_KEY.");
  if (!GAP_ID || !TOOL_NAME || !ERROR_MESSAGE) stop("Missing gap payload (GAP_ID/TOOL_NAME/ERROR_MESSAGE).");

  const targetFile = TOOL_TO_FILE[TOOL_NAME];
  if (!targetFile) stop(`No fixable file mapped for tool "${TOOL_NAME}" — not eligible for auto-fix drafting.`);

  const targetPath = path.join(REPO_ROOT, targetFile);
  if (!fs.existsSync(targetPath)) stop(`Mapped file does not exist: ${targetFile}`);

  const existingSource = fs.readFileSync(targetPath, "utf-8");

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const prompt = [
    "You are fixing a real, observed bug in North Vector, a personal voice assistant — not adding a",
    `new feature. The tool "${TOOL_NAME}" failed in production with this real error:`,
    "```",
    ERROR_MESSAGE,
    "```",
    "",
    `Here is the FULL current content of the one file you may change, ${targetFile}:`,
    "```ts",
    existingSource,
    "```",
    "",
    "STRICT CONSTRAINTS — you are operating inside an automated pipeline with no human review of your",
    "code before it typechecks/builds. Any output that doesn't fit these constraints will be rejected:",
    `- You may only change ${targetFile}. You have no ability to touch any other file anyway (this`,
    "  script only ever writes back to this exact path), so don't describe changes elsewhere.",
    "- No new npm dependencies. Only use what's already imported in this file or elsewhere in this codebase.",
    "- Do not rename or change the signature (parameters, return type, exported/not-exported) of any",
    "  function unless the bug is literally impossible to fix otherwise — other files import and call",
    "  these functions by their current names and shapes; an incompatible change fails typecheck and",
    "  blocks this fix from ever reaching review.",
    "- Preserve everything not directly relevant to the fix exactly as-is, including comments.",
    "- If this genuinely cannot be fixed within these constraints (needs a new dependency, needs changes",
    "  to a different file, needs information you don't have, or the error doesn't point to an actual",
    "  bug in this file), set \"feasible\": false and explain why in \"reason\" — do NOT force a bad attempt.",
    "",
    "Respond with ONLY a single JSON object, no prose before or after, matching this shape:",
    "{",
    '  "feasible": boolean,',
    '  "reason": string,  // required if feasible is false; why this can\'t be fixed in-scope',
    '  "newFileContent": string,  // the COMPLETE new content of the file, every line — not a diff',
    '  "summary": string  // one sentence describing the actual fix, for the PR description',
    "}",
  ].join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) stop("No text response from the model.");

  let draft;
  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    draft = JSON.parse(jsonMatch[0]);
  } catch (error) {
    stop(`Could not parse model response as JSON: ${error.message}`);
  }

  if (!draft.feasible) {
    stop(`Model judged this unfixable within scope: ${draft.reason || "no reason given"}`);
  }

  // --- Validation (cheap structural sanity checks; typecheck/build in the
  // next workflow steps are the real correctness gate) ---
  if (typeof draft.newFileContent !== "string" || draft.newFileContent.trim().length === 0) {
    stop("Missing or empty newFileContent.");
  }
  if (!draft.newFileContent.includes("export ")) {
    stop("New file content has no exports — looks broken/truncated, aborting rather than guessing.");
  }

  fs.writeFileSync(targetPath, draft.newFileContent);

  console.log(`[draft-bugfix] Rewrote ${targetFile} to fix ${TOOL_NAME}: ${draft.summary || ""}`);
  setOutput("drafted", "true");
  setOutput("tool-name", TOOL_NAME);
  setOutput("target-file", targetFile);
  setOutput("summary", (draft.summary || "").replace(/\n/g, " "));
}

main().catch((error) => {
  stop(`Unexpected error: ${error.message}`);
});
