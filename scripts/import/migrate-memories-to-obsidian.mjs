// One-time migration: copies every document in Firestore's `memories`
// collection into a markdown file (with YAML frontmatter) in the Drive
// Memories/Distilled/ folder — see
// North_Vector_Memory_Storage_Migration_Obsidian_Two_Tier.md. Existing
// Firestore memories are already curated (they were hand-entered one at a
// time through the /memories page), so Distilled/ — not General/ — is the
// right tier for all of them; see Section 8 item 10.
//
// Also generates and stores an embedding for every migrated record, even
// though Distilled/'s own retrieval path (scoreMemories()) never uses
// vectors — per the plan's explicit ask, "for consistency if General/'s
// search ever needs to include historically-migrated content" later.
//
// Does NOT touch or delete the Firestore collection — this is a copy, not
// a move. Run it again safely if it fails partway (it doesn't dedupe
// against files already written, so re-running after a partial failure
// will create duplicates for whatever succeeded before the failure — check
// the printed count against Drive before re-running a second time).
//
// Every existing Firestore memory predates the domain/type fields (the
// original schema only ever stored `content` + `createdAt` — see
// lib/memory-store.ts's git history) — so EVERY record here needs a
// default, not just the ambiguous ones. Defaults are deliberately generic
// ("general" / "note") and every defaulted record is printed at the end so
// they can be reviewed and re-tagged by hand in Obsidian afterward, rather
// than silently guessing something more specific that might be wrong.
//
// USAGE (against production data — see the plan's Section 7 for testing
// against a copy first):
//   node --env-file=.env.local scripts/import/migrate-memories-to-obsidian.mjs
//
// Requires: FIREBASE_SERVICE_ACCOUNT_KEY, GOOGLE_CALENDAR_CLIENT_ID,
// GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN (re-consented
// with the added drive.file scope — see scripts/oauth-widen-scopes-drive.js),
// ANTHROPIC_API_KEY (tag extraction), VOYAGE_API_KEY (embeddings), and
// either OBSIDIAN_DISTILLED_FOLDER_ID or a "Memories/Distilled" folder
// already visible to that account in Drive.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { drive, auth as googleAuth } from "@googleapis/drive";
import matter from "gray-matter";
import Anthropic from "@anthropic-ai/sdk";
import { VoyageAIClient } from "voyageai";

const DEFAULT_DOMAIN = "general";
const DEFAULT_TYPE = "note";
const DEFAULT_CONFIDENCE = 0.7;
const ROOT_FOLDER_NAME = "Memories";
const DISTILLED_SUBFOLDER_NAME = "Distilled";
const EMBEDDING_MODEL = "voyage-3.5-lite";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  console.error(
    "Missing GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_CLIENT_SECRET / GOOGLE_CALENDAR_REFRESH_TOKEN.\n" +
      "Run with: node --env-file=.env.local scripts/import/migrate-memories-to-obsidian.mjs"
  );
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY (needed for tag extraction).");
  process.exit(1);
}

if (!process.env.VOYAGE_API_KEY) {
  console.error("Missing VOYAGE_API_KEY (needed for embeddings).");
  process.exit(1);
}

const oauth2Client = new googleAuth.OAuth2(clientId, clientSecret);
oauth2Client.setCredentials({ refresh_token: refreshToken });
const driveClient = drive({ version: "v3", auth: oauth2Client });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

async function findFolderIdByName(name, parentId) {
  const parentClause = parentId ? ` and '${parentId}' in parents` : "";
  const { data } = await driveClient.files.list({
    q: `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentClause}`,
    fields: "files(id, name)",
  });
  return data.files?.[0]?.id ?? null;
}

async function findDistilledFolderId() {
  if (process.env.OBSIDIAN_DISTILLED_FOLDER_ID) {
    return process.env.OBSIDIAN_DISTILLED_FOLDER_ID;
  }

  const rootId = await findFolderIdByName(ROOT_FOLDER_NAME);
  if (!rootId) {
    console.error(
      `No "${ROOT_FOLDER_NAME}" folder found in Drive. Confirm the Google Drive desktop app is mirroring ` +
        "the Obsidian vault's Memories/ folder before running this script."
    );
    process.exit(1);
  }

  const distilledId = await findFolderIdByName(DISTILLED_SUBFOLDER_NAME, rootId);
  if (!distilledId) {
    console.error(
      `No "${ROOT_FOLDER_NAME}/${DISTILLED_SUBFOLDER_NAME}" folder found in Drive. Create a ` +
        `"${DISTILLED_SUBFOLDER_NAME}" subfolder inside the vault's Memories/ folder before running this script.`
    );
    process.exit(1);
  }

  return distilledId;
}

async function extractTags(content) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001", // matches lib/anthropic-client.ts's DEFAULT_MODEL exactly
      max_tokens: 100,
      system:
        "Extract 3-5 short tags from this memory — people mentioned, topics, rough category. " +
        "Lowercase, hyphenated if multi-word, no punctuation. Respond with ONLY a JSON array of strings.",
      messages: [{ role: "user", content }],
    });
    const text = response.content[0]?.type === "text" ? response.content[0].text : "[]";
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string").slice(0, 5) : [];
  } catch (error) {
    console.warn("  Tag extraction failed for this record, continuing with no tags:", error.message || error);
    return [];
  }
}

async function embedText(text) {
  // Always "document" here — this script only ever embeds existing stored
  // memories being migrated, never a live retrieval query.
  const response = await voyage.embed({ input: text, model: EMBEDDING_MODEL, inputType: "document" });
  const values = response.data?.[0]?.embedding;
  if (!values) throw new Error("Voyage embedding API returned no vector.");
  return values;
}

async function main() {
  const folderId = await findDistilledFolderId();

  const snapshot = await db.collection("memories").get();
  const originalCount = snapshot.size;
  console.log(`Found ${originalCount} documents in Firestore's memories collection.`);

  const defaulted = [];
  let written = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const content = typeof data.content === "string" ? data.content.trim() : "";

    if (!content) {
      console.warn(`Skipping ${doc.id}: no content field.`);
      continue;
    }

    const domain = typeof data.domain === "string" && data.domain.trim() ? data.domain.trim() : DEFAULT_DOMAIN;
    const type = typeof data.type === "string" && data.type.trim() ? data.type.trim() : DEFAULT_TYPE;
    const status = typeof data.status === "string" && data.status.trim() ? data.status.trim() : "active";
    const confidence = typeof data.confidence === "number" ? data.confidence : DEFAULT_CONFIDENCE;

    if (domain === DEFAULT_DOMAIN && type === DEFAULT_TYPE && (!data.domain || !data.type)) {
      defaulted.push({ id: doc.id, content: content.slice(0, 80) });
    }

    console.log(`Processing ${doc.id}...`);
    const tags = await extractTags(content);

    const fileContent = matter.stringify(content, {
      domain,
      type,
      status,
      confidence,
      tier: "distilled",
      tags,
      created_at: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
      firestore_id: doc.id, // traceability back to the source record, harmless extra frontmatter field
    });

    const { data: created } = await driveClient.files.create({
      requestBody: {
        name: `${doc.id}-memory.md`,
        parents: [folderId],
        mimeType: "text/markdown",
      },
      media: { mimeType: "text/markdown", body: fileContent },
    });

    try {
      const vector = await embedText(content);
      await db.collection("memory_embeddings").doc(created.id).set({
        fileId: created.id,
        vector,
        tags,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.warn(`  Embedding failed for ${doc.id} (file still written to Drive):`, error.message || error);
    }

    written += 1;
  }

  console.log(`\nWrote ${written} of ${originalCount} Firestore documents to Drive.`);

  if (written !== originalCount) {
    console.warn(
      `Count mismatch: ${originalCount - written} document(s) were skipped (see warnings above, ` +
        "usually missing content). Review before considering the migration complete."
    );
  }

  if (defaulted.length > 0) {
    console.log(
      `\n${defaulted.length} record(s) had no domain/type in Firestore and were defaulted to ` +
        `"${DEFAULT_DOMAIN}" / "${DEFAULT_TYPE}" — review and re-tag these in Obsidian:\n`
    );
    for (const entry of defaulted) {
      console.log(`  - ${entry.id}: "${entry.content}${entry.content.length === 80 ? "..." : ""}"`);
    }
  }

  console.log("\nFirestore's memories collection was NOT modified — this was a copy, not a move.");
}

main().catch((error) => {
  console.error("\nMigration failed:", error);
  process.exit(1);
});
