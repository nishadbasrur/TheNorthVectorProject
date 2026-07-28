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
// a move. Safe to re-run: before writing, it reads every existing note
// already in Distilled/ (including the 5 created by hand) and skips any
// Firestore record whose content matches one already there, so a partial
// failure or a second run won't create duplicates.
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
// ANTHROPIC_API_KEY (tag extraction), VOYAGE_API_KEY (embeddings). Writes
// into the hardcoded Distilled folder ID below (same pattern as
// lib/obsidian-memory-store.ts) unless OBSIDIAN_DISTILLED_FOLDER_ID is set.

import { text as readStreamAsText } from "node:stream/consumers";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { drive, auth as googleAuth } from "@googleapis/drive";
import matter from "gray-matter";
import Anthropic from "@anthropic-ai/sdk";
import { VoyageAIClient } from "voyageai";

const DEFAULT_DOMAIN = "general";
const DEFAULT_TYPE = "note";
const DEFAULT_CONFIDENCE = 0.7;
// Same hardcoded ID as lib/obsidian-memory-store.ts's TIER_FOLDER_ID.distilled
// — avoids a Drive files.list name-search (the failure mode that bit
// Transcripts/General/Distilled earlier).
const DISTILLED_FOLDER_ID = "1aE-HOBcihomi7ChEK9Qmu-alDjIz4ZVV";
const CENTER_POINT_LINK = "[[Distilled Memories Center Point]]";
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

function getDistilledFolderId() {
  return process.env.OBSIDIAN_DISTILLED_FOLDER_ID ?? DISTILLED_FOLDER_ID;
}

// Dedup guard — the 5 notes already created by hand through the /memories
// page use a different filename pattern (`${Date.now()}-memory.md`) than
// this script's own (`${doc.id}-memory.md`), so filenames alone can't
// detect an overlap. Compares by body content instead: reads every
// existing file in Distilled/, strips frontmatter and the trailing center
// point link, and returns the set of existing bodies so main() can skip
// any Firestore record whose content already exists there.
async function loadExistingDistilledContents(folderId) {
  const { data } = await driveClient.files.list({
    q: `'${folderId}' in parents and mimeType = 'text/markdown' and trashed = false`,
    fields: "files(id, name)",
  });

  const files = data.files ?? [];
  const existing = new Set();

  for (const file of files) {
    const response = await driveClient.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "stream" }
    );
    const raw = await readStreamAsText(response.data);
    const parsed = matter(raw);
    const body = parsed.content.replace(CENTER_POINT_LINK, "").trim();
    existing.add(body);
  }

  return existing;
}

// Claude sometimes wraps its JSON response in a ```json ... ``` fence
// despite the "ONLY a JSON array" instruction — strip it before parsing
// rather than tightening the prompt further, since the fence is easy to
// strip and prompt-only fixes for this are unreliable.
function stripCodeFence(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
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
    const parsed = JSON.parse(stripCodeFence(text));
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string").slice(0, 5) : [];
  } catch (error) {
    console.warn("  Tag extraction failed for this record, continuing with no tags:", error.message || error);
    return [];
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Voyage accounts without a payment method on file are capped at 3 RPM —
// exponential backoff starting at 20s (60s / 3 requests) so a 429 has a
// real chance of clearing by the next attempt, doubling up to 5 retries
// (20s, 40s, 80s, 160s, 320s) before giving up on that record.
async function embedText(text) {
  const maxRetries = 5;
  const baseDelayMs = 20_000;

  for (let attempt = 0; ; attempt++) {
    try {
      // Always "document" here — this script only ever embeds existing
      // stored memories being migrated, never a live retrieval query.
      const response = await voyage.embed({ input: text, model: EMBEDDING_MODEL, inputType: "document" });
      const values = response.data?.[0]?.embedding;
      if (!values) throw new Error("Voyage embedding API returned no vector.");
      return values;
    } catch (error) {
      const isRateLimit = error?.statusCode === 429 || /429/.test(error?.message ?? "");
      if (!isRateLimit || attempt >= maxRetries) {
        throw error;
      }
      const delayMs = baseDelayMs * 2 ** attempt;
      console.warn(`  Voyage rate limit hit, retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt + 1}/${maxRetries})...`);
      await sleep(delayMs);
    }
  }
}

async function main() {
  const folderId = getDistilledFolderId();

  console.log("Checking existing notes in Distilled/ for duplicates...");
  const existingContents = await loadExistingDistilledContents(folderId);
  console.log(`Found ${existingContents.size} existing note(s) already in Distilled/.`);

  const snapshot = await db.collection("memories").get();
  const originalCount = snapshot.size;
  console.log(`Found ${originalCount} documents in Firestore's memories collection.`);

  const defaulted = [];
  let written = 0;
  let skippedDuplicate = 0;
  let skippedNoContent = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const content = typeof data.content === "string" ? data.content.trim() : "";

    if (!content) {
      console.warn(`Skipping ${doc.id}: no content field.`);
      skippedNoContent += 1;
      continue;
    }

    if (existingContents.has(content)) {
      console.log(`Skipping ${doc.id}: already exists in Distilled/ (matched by content).`);
      skippedDuplicate += 1;
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

    const bodyWithCenterPoint = `${content}\n\n${CENTER_POINT_LINK}`;
    const fileContent = matter.stringify(bodyWithCenterPoint, {
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

  console.log(
    `\nWrote ${written} of ${originalCount} Firestore documents to Drive ` +
      `(${skippedDuplicate} skipped as duplicates, ${skippedNoContent} skipped for missing content).`
  );

  if (written + skippedDuplicate + skippedNoContent !== originalCount) {
    console.warn("Count mismatch — review the log above before considering the migration complete.");
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
