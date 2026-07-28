// One-time retroactive pass: links every existing note in Memories/Distilled/
// to every other note (full mesh), matching the behavior
// lib/obsidian-memory-store.ts's createMemory now applies automatically to
// every new Distilled note going forward. Does NOT touch General/,
// Transcript/, or Firestore — Drive-only, Distilled-only.
//
// Idempotent: reads each note's existing wikilinks first and only appends
// links that aren't already present, under a "---" separator. Safe to
// re-run (e.g. after adding more Distilled notes by hand).
//
// USAGE:
//   node --env-file=.env.local scripts/import/build-distilled-mesh.mjs
//
// Requires: GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET,
// GOOGLE_CALENDAR_REFRESH_TOKEN.

import { text as readStreamAsText } from "node:stream/consumers";
import { drive, auth as googleAuth } from "@googleapis/drive";

// Same hardcoded ID as lib/obsidian-memory-store.ts's TIER_FOLDER_ID.distilled.
const DISTILLED_FOLDER_ID = "1aE-HOBcihomi7ChEK9Qmu-alDjIz4ZVV";

const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  console.error(
    "Missing GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_CLIENT_SECRET / GOOGLE_CALENDAR_REFRESH_TOKEN.\n" +
      "Run with: node --env-file=.env.local scripts/import/build-distilled-mesh.mjs"
  );
  process.exit(1);
}

const oauth2Client = new googleAuth.OAuth2(clientId, clientSecret);
oauth2Client.setCredentials({ refresh_token: refreshToken });
const driveClient = drive({ version: "v3", auth: oauth2Client });

function getDistilledFolderId() {
  return process.env.OBSIDIAN_DISTILLED_FOLDER_ID ?? DISTILLED_FOLDER_ID;
}

function linkTargetFromFileName(name) {
  return name.replace(/\.md$/, "");
}

function extractWikilinkTargets(body) {
  const targets = new Set();
  const regex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = regex.exec(body))) {
    targets.add(match[1]);
  }
  return targets;
}

async function main() {
  const folderId = getDistilledFolderId();

  const { data } = await driveClient.files.list({
    q: `'${folderId}' in parents and mimeType = 'text/markdown' and trashed = false`,
    fields: "files(id, name)",
  });
  const files = data.files ?? [];
  console.log(`Found ${files.length} note(s) in Distilled/.`);

  // Read every note's raw content up front, before any writes, so "existing
  // links" reflects the pre-run state uniformly for every note — otherwise
  // a note processed later in the loop could see another note's
  // just-added link and mistakenly treat it as pre-existing.
  const notes = [];
  for (const file of files) {
    const response = await driveClient.files.get({ fileId: file.id, alt: "media" }, { responseType: "stream" });
    const raw = await readStreamAsText(response.data);
    notes.push({ fileId: file.id, name: file.name, linkTarget: linkTargetFromFileName(file.name), raw });
  }

  const allLinkTargets = notes.map((n) => n.linkTarget);

  let updated = 0;
  let skipped = 0;

  for (const note of notes) {
    const existingLinks = extractWikilinkTargets(note.raw);
    const missing = allLinkTargets.filter((target) => target !== note.linkTarget && !existingLinks.has(target));

    if (missing.length === 0) {
      console.log(`Skipping ${note.name}: already links to every other note.`);
      skipped += 1;
      continue;
    }

    console.log(`Updating ${note.name}: adding ${missing.length} missing link(s).`);
    const newBody = `${note.raw.trimEnd()}\n\n---\n${missing.map((target) => `[[${target}]]`).join("\n")}\n`;
    await driveClient.files.update({
      fileId: note.fileId,
      media: { mimeType: "text/markdown", body: newBody },
    });
    updated += 1;
  }

  console.log(`\nUpdated ${updated} note(s), ${skipped} already had a full mesh.`);
}

main().catch((error) => {
  console.error("\nBuilding the Distilled mesh failed:", error);
  process.exit(1);
});
