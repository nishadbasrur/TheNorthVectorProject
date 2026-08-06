// One-time, headed login step against the Scholarship America applicant
// Hub (https://start.scholarsapply.org/) — the login model this whole
// service depends on: Nishad types his actual credentials directly into
// the real site's real login page, in a visible browser window. This
// script never sees, stores, or enters a credential — it only opens the
// browser, waits for a human to finish logging in, then captures the
// resulting session state (cookies + localStorage) so future runs can
// reuse it headlessly instead of asking for the password again.
//
// Run with: npm run login   (from scholarship-service/)
import { chromium } from "playwright";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = path.join(__dirname, "..", ".sessions");
const SESSION_FILE = path.join(SESSIONS_DIR, "scholarshipamerica.json");
// Polled marker file instead of a blocking stdin prompt — this script runs
// as a background process (so the visible browser window stays up while
// control returns to the chat), and there's no interactive stdin attached
// to it. Creating this file is the "I'm done logging in" signal.
const READY_MARKER = path.join(SESSIONS_DIR, "READY_TO_CAPTURE");

const LOGIN_URL = "https://start.scholarsapply.org/";
const POLL_MS = 1500;
const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes to actually log in

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  mkdirSync(SESSIONS_DIR, { recursive: true });
  if (existsSync(READY_MARKER)) rmSync(READY_MARKER); // stale marker from a prior run

  console.log("[login] Launching a real, visible browser window.");
  console.log(`[login] Navigating to ${LOGIN_URL}`);
  console.log("[login] Log in yourself, in that window, with your real credentials.");
  console.log("[login] This script does not see or touch your password at any point.");
  console.log("[login] Once you're fully logged in and see your Hub/dashboard, tell North");
  console.log(`[login] you're done (in chat) — it will create ${READY_MARKER}`);
  console.log("[login] which this script is watching for, and capture the session then.");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(LOGIN_URL);

  const deadline = Date.now() + TIMEOUT_MS;
  while (!existsSync(READY_MARKER)) {
    if (Date.now() > deadline) {
      console.error("[login] Timed out waiting for the ready marker (15 min). Closing without saving.");
      await browser.close();
      process.exit(1);
    }
    await sleep(POLL_MS);
  }

  // Capture cookies + localStorage/sessionStorage — never the password,
  // which this process never had in the first place.
  await context.storageState({ path: SESSION_FILE });
  rmSync(READY_MARKER);
  console.log(`[login] Session state saved to ${SESSION_FILE}`);
  console.log("[login] This file is gitignored — see .gitignore for why, and the plan to");
  console.log("[login] move it to Secret Manager/GCS once this scales beyond one test site.");

  await browser.close();
}

main().catch((err) => {
  console.error("[login] Failed:", err);
  process.exit(1);
});
