// One-time follow-up to migrate-memories-to-obsidian.mjs — that run wrote
// all 34 Distilled/ notes to Drive successfully, but ~26 of them never got
// a memory_embeddings record because Voyage's free-tier rate limit (3 RPM,
// no payment method on file) returned 429s faster than the original
// script retried. This script does NOT touch Drive writes or Firestore's
// `memories` collection — it only lists what's already in Distilled/,
// checks which ones are missing a memory_embeddings doc (keyed by Drive
// fileId), and backfills just those.
//
// USAGE:
//   node --env-file=.env.local scripts/import/backfill-distilled-embeddings.mjs
//
// Requires: FIREBASE_SERVICE_ACCOUNT_KEY, GOOGLE_CALENDAR_CLIENT_ID,
// GOOGLE_CALENDAR_CLIENT_SECRET, GOOGLE_CALENDAR_REFRESH_TOKEN, VOYAGE_API_KEY.

import { text as readStreamAsText } from "node:stream/consumers";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { drive, auth as googleAuth } from "@googleapis/drive";
import matter from "gray-matter";
import { VoyageAIClient } from "voyageai";

// Same hardcoded ID as lib/obsidian-memory-store.ts's TIER_FOLDER_ID.distilled.
const DISTILLED_FOLDER_ID = "1aE-HOBcihomi7ChEK9Qmu-alDjIz4ZVV";
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
      "Run with: node --env-file=.env.local scripts/import/backfill-distilled-embeddings.mjs"
  );
  process.exit(1);
}

if (!process.env.VOYAGE_API_KEY) {
  console.error("Missing VOYAGE_API_KEY (needed for embeddings).");
  process.exit(1);
}

const oauth2Client = new googleAuth.OAuth2(clientId, clientSecret);
oauth2Client.setCredentials({ refresh_token: refreshToken });
const driveClient = drive({ version: "v3", auth: oauth2Client });

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

function getDistilledFolderId() {
  return process.env.OBSIDIAN_DISTILLED_FOLDER_ID ?? DISTILLED_FOLDER_ID;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Same backoff as the fixed migrate-memories-to-obsidian.mjs — 3 RPM cap
// on accounts with no payment method, so start at 20s (60s / 3) and double.
async function embedText(text) {
  const maxRetries = 5;
  const baseDelayMs = 20_000;

  for (let attempt = 0; ; attempt++) {
    try {
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

  const { data } = await driveClient.files.list({
    q: `'${folderId}' in parents and mimeType = 'text/markdown' and trashed = false`,
    fields: "files(id, name)",
  });
  const files = data.files ?? [];
  console.log(`Found ${files.length} note(s) in Distilled/.`);

  let backfilled = 0;
  let alreadyPresent = 0;
  let failed = 0;

  for (const file of files) {
    const existing = await db.collection("memory_embeddings").doc(file.id).get();
    if (existing.exists) {
      alreadyPresent += 1;
      continue;
    }

    console.log(`Backfilling embedding for ${file.name} (${file.id})...`);

    const response = await driveClient.files.get({ fileId: file.id, alt: "media" }, { responseType: "stream" });
    const raw = await readStreamAsText(response.data);
    const parsed = matter(raw);
    const content = parsed.content.trim();
    const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags.filter((t) => typeof t === "string") : [];

    if (!content) {
      console.warn(`  Skipping ${file.id}: empty content.`);
      continue;
    }

    try {
      const vector = await embedText(content);
      await db.collection("memory_embeddings").doc(file.id).set({
        fileId: file.id,
        vector,
        tags,
        createdAt: FieldValue.serverTimestamp(),
      });
      backfilled += 1;
    } catch (error) {
      console.error(`  Embedding failed for ${file.id}, giving up after retries:`, error.message || error);
      failed += 1;
    }
  }

  console.log(
    `\nBackfilled ${backfilled} embedding(s). ${alreadyPresent} already had one. ${failed} failed after retries.`
  );
}

main().catch((error) => {
  console.error("\nBackfill failed:", error);
  process.exit(1);
});
