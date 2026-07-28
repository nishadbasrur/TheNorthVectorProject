// One-time setup for the two-tier graph architecture (see
// lib/obsidian-memory-store.ts's classifyCategory / CATEGORIES and
// lib/transcript-store.ts's copy of the same) — creates the 8 category
// sub-hub notes in both General/ and Transcript/, each linking up to its
// tier's center point. New General/Transcript notes link to their category
// note instead of the center point directly, so these hubs need to exist
// before any note gets written with a category link that would otherwise
// point at nothing.
//
// Idempotent: skips any category note that already exists by name, so it's
// safe to re-run (e.g. after adding categories) without duplicating hubs.
//
// USAGE:
//   node --env-file=.env.local scripts/import/create-category-hubs.mjs
//
// Requires: GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET,
// GOOGLE_CALENDAR_REFRESH_TOKEN.

import { drive, auth as googleAuth } from "@googleapis/drive";

const GENERAL_FOLDER_ID = "1L8vkmxQh4t86oSKM2O4zJPOuKbwYUwf0";
const TRANSCRIPT_FOLDER_ID = "1biOfzjeDtrragbFG9NaeHEyAICKsAEM9";
const CATEGORIES = ["Identity", "Goals", "Finance", "Academic", "Relationships", "Health", "Career", "Misc"];

const TIERS = [
  { name: "General", folderId: GENERAL_FOLDER_ID, centerPointLink: "[[General Memories Central Point]]" },
  { name: "Transcript", folderId: TRANSCRIPT_FOLDER_ID, centerPointLink: "[[Transcript Memories Center Point]]" },
];

const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  console.error(
    "Missing GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_CLIENT_SECRET / GOOGLE_CALENDAR_REFRESH_TOKEN.\n" +
      "Run with: node --env-file=.env.local scripts/import/create-category-hubs.mjs"
  );
  process.exit(1);
}

const oauth2Client = new googleAuth.OAuth2(clientId, clientSecret);
oauth2Client.setCredentials({ refresh_token: refreshToken });
const driveClient = drive({ version: "v3", auth: oauth2Client });

async function existingFileNames(folderId) {
  const { data } = await driveClient.files.list({
    q: `'${folderId}' in parents and mimeType = 'text/markdown' and trashed = false`,
    fields: "files(id, name)",
  });
  return new Set((data.files ?? []).map((f) => f.name));
}

async function main() {
  for (const tier of TIERS) {
    console.log(`\n${tier.name}/:`);
    const existing = await existingFileNames(tier.folderId);

    for (const category of CATEGORIES) {
      const fileName = `${category}.md`;
      if (existing.has(fileName)) {
        console.log(`  Skipping ${fileName}: already exists.`);
        continue;
      }

      const body = `# ${category}\n\n${tier.centerPointLink}\n`;
      await driveClient.files.create({
        requestBody: { name: fileName, parents: [tier.folderId], mimeType: "text/markdown" },
        media: { mimeType: "text/markdown", body },
      });
      console.log(`  Created ${fileName}.`);
    }
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("\nCategory hub creation failed:", error);
  process.exit(1);
});
