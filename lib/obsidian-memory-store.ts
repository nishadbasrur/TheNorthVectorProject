import { text as readStreamAsText } from "node:stream/consumers";
import { drive, auth as googleAuth, type drive_v3 } from "@googleapis/drive";
import matter from "gray-matter";
import { askClaude } from "./anthropic-client";

// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/transcript-batch-scan.ts), same
// reasoning as lib/google-calendar-client.ts and lib/opportunity-store.ts.
// Confirmed the hard way: the real "server-only" package's default export
// unconditionally throws unless a bundler sets the "react-server" import
// condition (only Next.js's own webpack config does) — plain Node/esbuild
// always resolve to the throwing branch, so this guard would crash the
// Cloud Functions runtime the instant this module loads.
//
// Memory storage, migrated from Firestore to markdown files in a Google
// Drive folder that's mirrored into an Obsidian vault by the Drive desktop
// app — see North_Vector_Memory_Storage_Migration_Obsidian_Two_Tier.md.
// Reuses the exact OAuth pattern already established in
// lib/google-calendar-client.ts (same Google Cloud OAuth client, same
// cached-singleton shape) — Drive access rides on the SAME refresh token
// as Gmail/Calendar once it's re-consented with the added drive.file scope
// (see scripts/oauth-widen-scopes-drive.js), not a separate credential.
//
// Two tiers, both under one root "North Vector Memories" folder:
// North Vector Memories/General (low bar, everything, write-only as far as
// keyword/semantic retrieval design goes — see
// lib/obsidian-memory-retrieval.ts's retrieveGeneralMemories) and
// North Vector Memories/Distilled (small, curated, the set
// lib/memory-retrieval.ts's scoreMemories() was actually designed for).

let cachedClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (cachedClient) {
    return cachedClient;
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REFRESH_TOKEN must all be set."
    );
  }

  const oauth2Client = new googleAuth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  cachedClient = drive({ version: "v3", auth: oauth2Client });
  return cachedClient;
}

export type MemoryTier = "general" | "distilled";

// Hardcoded rather than looked up by name — avoids a Drive files.list
// query (and its failure mode if the name-search can't find the
// subfolder, as happened with Transcripts) for folder IDs that never
// change.
const TIER_FOLDER_ID: Record<MemoryTier, string> = {
  general: "1L8vkmxQh4t86oSKM2O4zJPOuKbwYUwf0",
  distilled: "1aE-HOBcihomi7ChEK9Qmu-alDjIz4ZVV",
};

async function findOrCacheTierFolderId(tier: MemoryTier): Promise<string> {
  const envVar = tier === "general" ? "OBSIDIAN_GENERAL_FOLDER_ID" : "OBSIDIAN_DISTILLED_FOLDER_ID";
  const envFolderId = process.env[envVar];
  return envFolderId ?? TIER_FOLDER_ID[tier];
}

export type CreateMemoryParams = {
  content: string;
  domain: string;
  type: string;
  tier: MemoryTier;
  status?: string;
  confidence?: number;
  tags?: string[];
  // Additional frontmatter fields merged in alongside the standard set
  // above — e.g. functions/src/transcript-batch-scan.ts's General notes
  // carry source: "transcript-batch" and original-transcript: <filename>,
  // per North_Vector_Three_Tier_Memory_Pipeline_Plan.md. Never overrides
  // the fields above even if a key collides (see the spread order below).
  extraFrontmatter?: Record<string, string | number>;
  // General tier only — a category the caller already determined (e.g.
  // functions/src/transcript-batch-scan.ts folds classification into the
  // same Haiku call it already makes to decide what's worth promoting, so
  // it doesn't cost a second Claude call here). Must be one of CATEGORIES
  // below (case-insensitive) or it's ignored and classifyCategory runs as
  // usual. Omit to have createMemory classify content itself, as every
  // other General-tier caller (e.g. app/api/v1/memories/create/route.ts)
  // does.
  category?: string;
};

// Appended to every Distilled note's body — the Obsidian-side hub note
// every Distilled note links back to, on top of the full mesh below.
// General/Transcript notes no longer link to their center point directly —
// see CATEGORIES below, they link to their category note instead, which is
// itself the thing that links to the center point.
const DISTILLED_CENTER_POINT_LINK = "[[Distilled Memories Center Point]]";

// The 8 category sub-hubs living in both General/ and Transcript/ (see
// scripts/import/create-category-hubs.mjs) — every note written to either
// tier gets classified into exactly one of these and links to it instead
// of the tier's center point, so the center point isn't a single node with
// thousands of direct edges.
const CATEGORIES = ["Identity", "Goals", "Finance", "Academic", "Relationships", "Health", "Career", "Misc"];

const CATEGORY_CLASSIFICATION_SYSTEM_PROMPT =
  `Classify this memory into exactly one of these categories: ${CATEGORIES.join(", ")}. ` +
  "Respond with ONLY the category name, exactly as written above, nothing else.";

// Shared by createMemory (General tier) and lib/transcript-store.ts's
// createTranscript — same categories, same prompt, kept duplicated rather
// than shared per this codebase's existing convention of each Drive-facing
// store file being self-contained (see getDriveClient above).
async function classifyCategory(content: string): Promise<string> {
  const result = await askClaude({
    systemPrompt: CATEGORY_CLASSIFICATION_SYSTEM_PROMPT,
    userMessage: content,
    maxTokens: 20,
  });

  if (!result.ok) {
    console.error("[obsidian-memory-store] Category classification failed:", result.error);
    return "Misc";
  }

  const match = CATEGORIES.find((category) => category.toLowerCase() === result.text.trim().toLowerCase());
  if (!match) {
    console.error(`[obsidian-memory-store] Category classification returned unrecognized category: "${result.text.trim()}"`);
  }
  return match ?? "Misc";
}

// Uses params.category if the caller already determined one (and it's
// actually one of CATEGORIES); otherwise classifies from scratch. Keeps
// classifyCategory as the single source of truth for both the prompt-based
// path and the fallback when a caller-provided category doesn't validate.
async function resolveCategory(content: string, providedCategory?: string): Promise<string> {
  if (providedCategory) {
    const match = CATEGORIES.find((category) => category.toLowerCase() === providedCategory.toLowerCase());
    if (match) return match;
    console.error(
      `[obsidian-memory-store] Provided category "${providedCategory}" is not recognized, classifying instead.`
    );
  }
  return classifyCategory(content);
}

function linkTargetFromFileName(name: string): string {
  return name.replace(/\.md$/, "");
}

function extractWikilinkTargets(body: string): Set<string> {
  const targets = new Set<string>();
  const regex = /\[\[([^\]]+)\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body))) {
    targets.add(match[1]);
  }
  return targets;
}

type DistilledNoteRef = { fileId: string; linkTarget: string };

async function listDistilledNotes(client: drive_v3.Drive): Promise<DistilledNoteRef[]> {
  const folderId = await findOrCacheTierFolderId("distilled");
  const { data } = await client.files.list({
    q: `'${folderId}' in parents and mimeType = 'text/markdown' and trashed = false`,
    fields: "files(id, name)",
  });

  const files = data.files ?? [];
  return files.map((file) => ({ fileId: file.id!, linkTarget: linkTargetFromFileName(file.name!) }));
}

// Appends `[[linkTarget]]` to an existing Distilled note's body, under a
// "---" separator, unless that link is already present — keeps the full
// mesh (every Distilled note links to every other) up to date whenever a
// new note is added. Shared logic with
// scripts/import/build-distilled-mesh.mjs's retroactive pass, duplicated
// rather than imported since that script runs standalone via node,
// outside the Next.js/esbuild module graph.
async function appendLinkToDistilledNote(client: drive_v3.Drive, fileId: string, linkTarget: string): Promise<void> {
  const response = await client.files.get({ fileId, alt: "media" }, { responseType: "stream" });
  const raw = await readStreamAsText(response.data);

  if (extractWikilinkTargets(raw).has(linkTarget)) {
    return;
  }

  const updated = `${raw.trimEnd()}\n\n---\n[[${linkTarget}]]\n`;
  await client.files.update({
    fileId,
    media: { mimeType: "text/markdown", body: updated },
  });
}

async function createDistilledMemory(client: drive_v3.Drive, params: CreateMemoryParams): Promise<{ fileId: string }> {
  const existingNotes = await listDistilledNotes(client);

  const meshSection =
    existingNotes.length > 0
      ? `\n\n---\n${existingNotes.map((note) => `[[${note.linkTarget}]]`).join("\n")}`
      : "";
  const bodyWithLinks = `${params.content}\n\n${DISTILLED_CENTER_POINT_LINK}${meshSection}`;

  const fileContent = matter.stringify(bodyWithLinks, {
    ...params.extraFrontmatter,
    domain: params.domain,
    type: params.type,
    status: params.status ?? "active",
    confidence: params.confidence ?? 0.7,
    tier: params.tier,
    tags: params.tags ?? [],
    created_at: new Date().toISOString(),
  });

  const folderId = await findOrCacheTierFolderId("distilled");
  const fileName = `${Date.now()}-memory.md`;

  const { data } = await client.files.create({
    requestBody: { name: fileName, parents: [folderId], mimeType: "text/markdown" },
    media: { mimeType: "text/markdown", body: fileContent },
  });

  if (!data.id) {
    throw new Error("Drive did not return a file ID for the newly created memory.");
  }

  // Sequential, not Promise.all — Distilled is small/curated by design (see
  // file header), so this stays cheap, and it avoids bursting Drive's
  // per-user request quota with dozens of concurrent read+update pairs.
  const newLinkTarget = linkTargetFromFileName(fileName);
  for (const note of existingNotes) {
    await appendLinkToDistilledNote(client, note.fileId, newLinkTarget);
  }

  return { fileId: data.id };
}

async function createGeneralMemory(client: drive_v3.Drive, params: CreateMemoryParams): Promise<{ fileId: string }> {
  const category = await resolveCategory(params.content, params.category);
  const bodyWithLinks = `${params.content}\n\n[[${category}]]`;

  const fileContent = matter.stringify(bodyWithLinks, {
    ...params.extraFrontmatter,
    domain: params.domain,
    type: params.type,
    status: params.status ?? "active",
    confidence: params.confidence ?? 0.7,
    tier: params.tier,
    tags: params.tags ?? [],
    created_at: new Date().toISOString(),
  });

  const folderId = await findOrCacheTierFolderId("general");

  const { data } = await client.files.create({
    requestBody: { name: `${Date.now()}-memory.md`, parents: [folderId], mimeType: "text/markdown" },
    media: { mimeType: "text/markdown", body: fileContent },
  });

  if (!data.id) {
    throw new Error("Drive did not return a file ID for the newly created memory.");
  }

  return { fileId: data.id };
}

export async function createMemory(params: CreateMemoryParams): Promise<{ fileId: string }> {
  const client = getDriveClient();

  if (params.tier === "distilled") {
    return createDistilledMemory(client, params);
  }

  return createGeneralMemory(client, params);
}

const TAG_EXTRACTION_SYSTEM_PROMPT =
  "Extract 3-5 short tags from this memory — people mentioned, topics, rough category. " +
  "Lowercase, hyphenated if multi-word (e.g. \"dr-bala\", \"study-habits\"), no punctuation. " +
  'Respond with ONLY a JSON array of strings, nothing else, e.g. ["chemistry","dr-bala","study-habits"].';

// Deliberately small — per the plan's own note, this is "give me 3-5 tags
// for this sentence," not an elaborate classification system. Uses the
// shared askClaude default (Haiku), same as every other cheap
// single-purpose Claude call in this codebase.
export async function extractTags(content: string): Promise<string[]> {
  const result = await askClaude({
    systemPrompt: TAG_EXTRACTION_SYSTEM_PROMPT,
    userMessage: content,
    maxTokens: 100,
  });

  if (!result.ok) {
    console.error("[obsidian-memory-store] Tag extraction failed:", result.error);
    return [];
  }

  try {
    const parsed = JSON.parse(result.text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((tag): tag is string => typeof tag === "string").slice(0, 5);
  } catch (error) {
    console.error("[obsidian-memory-store] Tag extraction returned unparseable output:", result.text, error);
    return [];
  }
}
