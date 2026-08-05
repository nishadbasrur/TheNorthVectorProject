// Assesses a real scraped scholarship (from fetch-scholarship.ts) against
// what's actually known about Nishad — a real yes/no/maybe with real
// reasoning grounded in the scraped eligibility text, not a generic
// "this could be a good fit" summary. Uses the same OpenAI Responses-API
// helper the main app uses (lib/openai-client.ts askOpenAI) rather than a
// bespoke call, and the same real profile facts already established
// elsewhere in this repo (lib/opportunity-research.ts's OPPORTUNITY_PROFILE,
// 00-Foundation/Intelligence_Profile.md) rather than inventing new ones.
//
// Run with: npm run assess   (from scholarship-service/, AFTER
// npm run fetch-scholarship has produced .data/last-fetched-scholarship.json)
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { askOpenAI, MODEL_AGENTIC } from "../../lib/openai-client";
import type { ScrapedScholarship } from "./fetch-scholarship";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", ".data", "last-fetched-scholarship.json");

// Real, known-true facts about Nishad — same profile string already used
// by the existing opportunity-research pipeline (lib/opportunity-research.ts),
// not invented for this test. No GPA is on file anywhere in the repo/memory
// at time of writing, so it's honestly left out rather than guessed.
const KNOWN_PROFILE =
  "Nishad Basrur, a pre-med undergraduate at the University of Connecticut (UConn), class of 2030. " +
  "Highly future-oriented, systems-thinking; long-term aspiration is to become a physician, specifically " +
  "pursuing orthopedic surgery. No GPA, financial-aid figures, or major-specific data is on file yet.";

const SYSTEM_PROMPT = [
  "You are assessing whether a specific real scholarship is worth Nishad applying to, based ONLY on the",
  "scraped eligibility/requirements text provided and the known profile facts below. Do not invent facts",
  "about Nishad that aren't given. If the scraped eligibility text is too thin to judge confidently, say",
  "so honestly rather than guessing — that's a valid 'maybe'.",
  "",
  `Known profile: ${KNOWN_PROFILE}`,
  "",
  "Respond with ONLY a JSON object: { \"verdict\": \"yes\" | \"no\" | \"maybe\", \"reasoning\": string }.",
  "reasoning should cite the actual eligibility text where possible, not generic advice.",
].join("\n");

async function main() {
  if (!existsSync(DATA_FILE)) {
    console.error(`[assess] No scraped scholarship at ${DATA_FILE}. Run \`npm run fetch-scholarship\` first.`);
    process.exit(1);
  }

  const scholarship: ScrapedScholarship = JSON.parse(readFileSync(DATA_FILE, "utf-8"));

  const userMessage = [
    `Title: ${scholarship.title}`,
    `URL: ${scholarship.url}`,
    `Deadline: ${scholarship.deadline}`,
    `Award amount: ${scholarship.awardAmount}`,
    `Eligibility (as scraped): ${scholarship.eligibility}`,
    `Requirements (as scraped): ${scholarship.requirements}`,
    "",
    "Full page text (first 3000 chars, for context if the fields above were thin):",
    scholarship.rawDescription,
  ].join("\n");

  console.log("[assess] Asking the model to assess real fit against real known facts...");
  const result = await askOpenAI({
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    model: MODEL_AGENTIC,
    maxTokens: 500,
  });

  if (!result.ok) {
    console.error(`[assess] Model call failed: ${result.error}`);
    process.exit(1);
  }

  console.log("\n=== Applicability Assessment ===");
  console.log(`Scholarship: ${scholarship.title}`);
  console.log(result.text);
}

main().catch((err) => {
  console.error("[assess] Failed:", err);
  process.exit(1);
});
