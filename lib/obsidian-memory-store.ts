import "server-only";
import { drive, auth as googleAuth, type drive_v3 } from "@googleapis/drive";
import matter from "gray-matter";
import { askClaude } from "./anthropic-client";

// Memory storage, migrated from Firestore to markdown files in a Google
// Drive folder that's mirrored into an Obsidian vault by the Drive desktop
// app — see North_Vector_Memory_Storage_Migration_Obsidian_Two_Tier.md.
// Reuses the exact OAuth pattern already established in
// lib/google-calendar-client.ts (same Google Cloud OAuth client, same
// cached-singleton shape) — Drive access rides on the SAME refresh token
// as Gmail/Calendar once it's re-consented with the added drive.file scope
// (see scripts/oauth-widen-scopes-drive.js), not a separate credential.
//
// Two tiers, both under one root "Memories" folder: Memories/General (low
// bar, everything, write-only as far as keyword/semantic retrieval design
// goes — see lib/obsidian-memory-retrieval.ts's retrieveGeneralMemories)
// and Memories/Distilled (small, curated, the set lib/memory-retrieval.ts's
// scoreMemories() was actually designed for).

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

const ROOT_FOLDER_NAME = "Memories";

export type MemoryTier = "general" | "distilled";

const TIER_SUBFOLDER_NAME: Record<MemoryTier, string> = {
  general: "General",
  distilled: "Distilled",
};

// Cached in module memory for the life of the server process — cheap and
// correct here since this app runs as a small number of long-lived
// instances (min-instances: 1, see apphosting.yaml), not ephemeral
// per-request functions. OBSIDIAN_GENERAL_FOLDER_ID / OBSIDIAN_DISTILLED_FOLDER_ID
// short-circuit the search entirely once each folder's real ID is known —
// set them once Section 4.2's Drive mirroring is confirmed working, to
// skip the lookup on every cold start.
const cachedFolderIds: Partial<Record<MemoryTier, string>> = {};

async function findFolderIdByName(
  client: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string | null> {
  const parentClause = parentId ? ` and '${parentId}' in parents` : "";
  const { data } = await client.files.list({
    q: `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentClause}`,
    fields: "files(id, name)",
  });

  return data.files?.[0]?.id ?? null;
}

async function findOrCacheTierFolderId(client: drive_v3.Drive, tier: MemoryTier): Promise<string> {
  if (cachedFolderIds[tier]) {
    return cachedFolderIds[tier]!;
  }

  const envVar = tier === "general" ? "OBSIDIAN_GENERAL_FOLDER_ID" : "OBSIDIAN_DISTILLED_FOLDER_ID";
  const envFolderId = process.env[envVar];
  if (envFolderId) {
    cachedFolderIds[tier] = envFolderId;
    return envFolderId;
  }

  const rootFolderId = await findFolderIdByName(client, ROOT_FOLDER_NAME);
  if (!rootFolderId) {
    throw new Error(
      `No "${ROOT_FOLDER_NAME}" folder found in Drive — confirm the Google Drive desktop app is mirroring the Obsidian vault's Memories/ folder before writing memories.`
    );
  }

  const subfolderName = TIER_SUBFOLDER_NAME[tier];
  const tierFolderId = await findFolderIdByName(client, subfolderName, rootFolderId);
  if (!tierFolderId) {
    throw new Error(
      `No "${ROOT_FOLDER_NAME}/${subfolderName}" folder found in Drive — create a "${subfolderName}" subfolder inside the vault's Memories/ folder before writing ${tier}-tier memories.`
    );
  }

  cachedFolderIds[tier] = tierFolderId;
  return tierFolderId;
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
};

// Appended to every note's body, tier-conditional — the Obsidian-side
// hub note each tier's individual notes link back to.
const TIER_CENTER_POINT_LINK: Record<MemoryTier, string> = {
  general: "[[General Memories Central Point]]",
  distilled: "[[Distilled Memories Center Point]]",
};

export async function createMemory(params: CreateMemoryParams): Promise<{ fileId: string }> {
  const bodyWithCenterPoint = `${params.content}\n\n${TIER_CENTER_POINT_LINK[params.tier]}`;

  const fileContent = matter.stringify(bodyWithCenterPoint, {
    ...params.extraFrontmatter,
    domain: params.domain,
    type: params.type,
    status: params.status ?? "active",
    confidence: params.confidence ?? 0.7,
    tier: params.tier,
    tags: params.tags ?? [],
    created_at: new Date().toISOString(),
  });

  const client = getDriveClient();
  const folderId = await findOrCacheTierFolderId(client, params.tier);

  const { data } = await client.files.create({
    requestBody: {
      name: `${Date.now()}-memory.md`,
      parents: [folderId],
      mimeType: "text/markdown",
    },
    media: {
      mimeType: "text/markdown",
      body: fileContent,
    },
  });

  if (!data.id) {
    throw new Error("Drive did not return a file ID for the newly created memory.");
  }

  return { fileId: data.id };
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
