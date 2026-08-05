// Proves the saved session from login-scholarshipamerica.ts is genuinely
// reusable — a SEPARATE, HEADLESS run, no visible browser, no re-entering
// anything. If this only worked because the login browser was still open,
// this run (a fresh headless context loading nothing but the saved
// storageState file) would fail to show as logged in.
//
// Run with: npm run verify-session   (from scholarship-service/, AFTER
// npm run login has completed at least once)
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = path.join(__dirname, "..", ".sessions", "scholarshipamerica.json");
const HUB_URL = "https://start.scholarsapply.org/";

async function main() {
  if (!existsSync(SESSION_FILE)) {
    console.error(`[verify-session] No saved session at ${SESSION_FILE}.`);
    console.error("[verify-session] Run `npm run login` first.");
    process.exit(1);
  }

  console.log("[verify-session] Launching a HEADLESS browser, loading ONLY the saved session.");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: SESSION_FILE });
  const page = await context.newPage();

  await page.goto(HUB_URL, { waitUntil: "networkidle" });

  // Scholarship America's Hub renders its real post-login screen —
  // "Select the scholarship you'd like to access" / "Browse Scholarships"
  // / "Scholarship List" — once authenticated, and the logged-out
  // first-time-visitor prompts ("I'm a student" / registration form)
  // otherwise. Confirmed against a real screenshot (.sessions/verify-
  // session-screenshot.png) during this test — the page <title> stays
  // "Login/Register" either way (an SPA artifact, not a reliable signal),
  // so this deliberately checks rendered body text, not the tab title.
  const bodyText = (await page.textContent("body")) ?? "";
  const loggedOutMarkers = ["I'm a student", "Create an account", "Forgot password"];
  const loggedInMarkers = ["Browse Scholarships", "Scholarship List", "Select the scholarship you'd like to access"];

  const hasLoggedOutMarker = loggedOutMarkers.some((m) => bodyText.includes(m));
  const hasLoggedInMarker = loggedInMarkers.some((m) => bodyText.includes(m));

  console.log(`[verify-session] Page title: ${await page.title()}`);
  console.log(`[verify-session] Logged-in markers found: ${hasLoggedInMarker}`);
  console.log(`[verify-session] Logged-out markers found: ${hasLoggedOutMarker}`);

  await page.screenshot({ path: path.join(__dirname, "..", ".sessions", "verify-session-screenshot.png") });
  console.log("[verify-session] Screenshot saved to .sessions/verify-session-screenshot.png for visual confirmation.");

  await browser.close();

  if (hasLoggedInMarker && !hasLoggedOutMarker) {
    console.log("[verify-session] SESSION REUSE CONFIRMED — headless run is authenticated.");
  } else {
    console.log("[verify-session] INCONCLUSIVE or NOT logged in — check the screenshot.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[verify-session] Failed:", err);
  process.exit(1);
});
