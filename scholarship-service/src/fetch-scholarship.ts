// Finds one real, currently-listed scholarship on Scholarship America's
// site and extracts its actual details — eligibility, deadline, award
// amount, requirements. Real scraped content, not a placeholder. Reuses
// the saved session from login-scholarshipamerica.ts, headlessly.
//
// The applicant Hub itself (start.scholarsapply.org) is a search-by-
// program-name portal, not a browsable catalog — real applicants get
// invited to a specific program name (e.g. via a recommender email) and
// search for it directly. The public listing that IS browsable lives on
// the same organization's main site (scholarshipamerica.org/students/
// browse-scholarships/) and links to real per-scholarship detail pages
// (scholarshipamerica.org/scholarship/{slug}/) — that's what this script
// walks, still using the authenticated session/context throughout.
//
// Run with: npm run fetch-scholarship   (from scholarship-service/)
import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = path.join(__dirname, "..", ".sessions", "scholarshipamerica.json");
const DATA_DIR = path.join(__dirname, "..", ".data");
const BROWSE_URL = "https://scholarshipamerica.org/students/browse-scholarships/";

export interface ScrapedScholarship {
  title: string;
  url: string;
  status: string;
  deadline: string;
  awardAmount: string;
  eligibility: string;
  requirements: string;
  rawDescription: string;
}

// Pulls the text between one heading (inclusive) and the next known
// heading in the page's rendered innerText — the real DOM here has no
// stable class names to hook a selector to, so this walks the same
// visible section headings a human reader would use. Uses lastIndexOf
// for the start heading deliberately: the page renders a "JUMP TO" table
// of contents earlier on the page repeating the same heading words
// ("Eligibility\nAwards\nRequirements") with no body text between them —
// the REAL section (with actual paragraph content) is the later
// occurrence, confirmed against a live #RAREis Scholarship Fund fetch
// during this test where the naive first-match version returned "".
function sectionBetween(text: string, startHeading: string, endHeadings: string[]): string | null {
  const startIdx = text.lastIndexOf(startHeading);
  if (startIdx === -1) return null;
  const afterStart = startIdx + startHeading.length;
  let endIdx = text.length;
  for (const h of endHeadings) {
    const idx = text.indexOf(h, afterStart);
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }
  return text.slice(afterStart, endIdx).trim();
}

async function main(): Promise<ScrapedScholarship> {
  if (!existsSync(SESSION_FILE)) {
    console.error(`[fetch-scholarship] No saved session at ${SESSION_FILE}. Run \`npm run login\` first.`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: SESSION_FILE });
  const page = await context.newPage();

  console.log(`[fetch-scholarship] Navigating to ${BROWSE_URL}`);
  await page.goto(BROWSE_URL, { waitUntil: "networkidle" });

  const scholarshipLinks = await page.$$eval("a", (els) =>
    els
      .map((el) => ({ text: el.textContent?.trim() ?? "", href: el.getAttribute("href") ?? "" }))
      .filter((e) => /^https:\/\/scholarshipamerica\.org\/scholarship\/[^/]+\/?$/.test(e.href) && e.text !== "Learn More")
  );

  if (scholarshipLinks.length === 0) {
    console.error("[fetch-scholarship] No real scholarship listings found on the browse page.");
    await browser.close();
    process.exit(1);
  }

  const target = scholarshipLinks[0];
  console.log(`[fetch-scholarship] Found ${scholarshipLinks.length} real listings — using: ${target.text}`);
  console.log(`[fetch-scholarship] Navigating to ${target.href}`);

  await page.goto(target.href, { waitUntil: "networkidle" });
  const fullText = (await page.locator("body").innerText()) ?? "";
  // The nav-listing <a> text was empty for this card (title lives in a
  // nested element the trimmed textContent filter didn't catch) — the
  // page's own <h1> is a more reliable source for the real title.
  const pageTitle = (await page.locator("h1").first().textContent())?.trim() || target.text || "Unknown";

  const statusMatch = fullText.match(/Status:\s*(Open|Closed)/i);
  const awardMatch = fullText.match(/Award Amount\s*\n?\s*(up to )?(\$[0-9,]+(?:\s*-\s*\$[0-9,]+)?)/i);
  const deadlineMatch = fullText.match(/Deadline\s*\n?\s*([A-Za-z0-9,\/\s]{4,40})/i);

  const eligibility = sectionBetween(fullText, "Eligibility\n", ["Awards\n", "Requirements\n", "Selection of Recipients"]) ?? "Not explicitly sectioned on page — see rawDescription";
  const requirements = sectionBetween(fullText, "Requirements\n", ["JUMP TO", "SCHOLARSHIP INFO", "SHARE"]) ?? sectionBetween(fullText, "Selection of Recipients\n", ["JUMP TO", "SHARE"]) ?? "Not explicitly sectioned on page — see rawDescription";

  const result: ScrapedScholarship = {
    title: pageTitle,
    url: target.href,
    status: statusMatch?.[1] ?? "Unknown — not found on page",
    deadline: deadlineMatch?.[1]?.trim() ?? "Not listed on page (may be TBD for a closed cycle)",
    awardAmount: awardMatch?.[2]?.trim() ?? "Not found on page — needs manual check",
    eligibility: eligibility.slice(0, 2000),
    requirements: requirements.slice(0, 2000),
    rawDescription: fullText.slice(0, 4000),
  };

  mkdirSync(DATA_DIR, { recursive: true });
  const outFile = path.join(DATA_DIR, "last-fetched-scholarship.json");
  writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(`[fetch-scholarship] Saved real scraped data to ${outFile}`);
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
  return result;
}

main().catch((err) => {
  console.error("[fetch-scholarship] Failed:", err);
  process.exit(1);
});
