import { text as readStreamAsText } from "node:stream/consumers";
import { drive, auth as googleAuth, type drive_v3 } from "@googleapis/drive";
import matter from "gray-matter";
import type { ScoreableMemory } from "./memory-retrieval";
import { embedText, findCandidatesByTags, cosineSimilarity } from "./memory-embeddings";
import type { MemoryTier } from "./obsidian-memory-store";
import { adminDb } from "./firebase-admin";

// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/transcript-batch-scan.ts and,
// transitively, weekly-retrospective-scan.ts via memory-promotion-engine.ts),
// same reasoning as lib/google-calendar-client.ts and
// lib/opportunity-store.ts. Confirmed the hard way: the real "server-only"
// package's default export unconditionally throws unless a bundler sets
// the "react-server" import condition (only Next.js's own webpack config
// does) — plain Node/esbuild always resolve to the throwing branch.
//
// Read path for the Obsidian/Drive-backed memory store — see
// lib/obsidian-memory-store.ts for the write path and the shared OAuth
// setup this mirrors exactly (same cached-client pattern, same env vars,
// same "North Vector Memories"/General + "North Vector Memories"/Distilled
// folder structure).

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

const ROOT_FOLDER_NAME = "North Vector Memories";
const TIER_SUBFOLDER_NAME: Record<MemoryTier, string> = {
  general: "General",
  distilled: "Distilled",
};

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
    throw new Error(`No "${ROOT_FOLDER_NAME}" folder found in Drive.`);
  }

  const subfolderName = TIER_SUBFOLDER_NAME[tier];
  const tierFolderId = await findFolderIdByName(client, subfolderName, rootFolderId);
  if (!tierFolderId) {
    throw new Error(`No "${ROOT_FOLDER_NAME}/${subfolderName}" folder found in Drive.`);
  }

  cachedFolderIds[tier] = tierFolderId;
  return tierFolderId;
}

type ParsedMemoryFile = ScoreableMemory & { fileId: string; tags: string[] };

// A malformed file (missing frontmatter, unreadable) is skipped rather than
// thrown — one bad note in the vault (e.g. a stray file Nishad drops in by
// hand, or a partially-synced write) must not take down retrieval for every
// other memory. Logged so it's still visible, not silently swallowed.
async function parseMemoryFile(
  client: drive_v3.Drive,
  file: drive_v3.Schema$File
): Promise<ParsedMemoryFile | null> {
  try {
    const response = await client.files.get(
      { fileId: file.id!, alt: "media" },
      { responseType: "stream" }
    );
    const raw = await readStreamAsText(response.data);
    const parsed = matter(raw);

    const content = parsed.content.trim();
    const domain = parsed.data.domain;
    const type = parsed.data.type;

    if (!content || typeof domain !== "string" || typeof type !== "string") {
      console.error(`[obsidian-memory-retrieval] Skipping malformed memory file ${file.name} (${file.id}): missing content/domain/type.`);
      return null;
    }

    return {
      fileId: file.id!,
      content,
      domain,
      type,
      status: typeof parsed.data.status === "string" ? parsed.data.status : undefined,
      confidence: typeof parsed.data.confidence === "number" ? parsed.data.confidence : undefined,
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.filter((t): t is string => typeof t === "string") : [],
    };
  } catch (error) {
    console.error(`[obsidian-memory-retrieval] Failed to parse memory file ${file.name} (${file.id}):`, error);
    return null;
  }
}

async function listTierFiles(tier: MemoryTier): Promise<ParsedMemoryFile[]> {
  const client = getDriveClient();
  const folderId = await findOrCacheTierFolderId(client, tier);

  const { data } = await client.files.list({
    q: `'${folderId}' in parents and mimeType = 'text/markdown' and trashed = false`,
    fields: "files(id, name)",
  });

  const files = data.files ?? [];
  const parsed = await Promise.all(files.map((file) => parseMemoryFile(client, file)));

  return parsed.filter((memory): memory is ParsedMemoryFile => memory !== null);
}

// Distilled/ — the small curated set. Feeds lib/memory-retrieval.ts's
// retrieveObsidianMemories, which reuses the existing keyword-overlap
// scoreMemories() unchanged. Deliberately NOT the mechanism General/ uses —
// see retrieveGeneralMemories below for why.
export async function loadObsidianMemories(): Promise<ScoreableMemory[]> {
  const files = await listTierFiles("distilled");
  return files.map(({ fileId: _fileId, tags: _tags, ...memory }) => memory);
}

export type GeneralMemoryResult = ScoreableMemory & { fileId: string; tags: string[]; similarity: number };

// General/ — the write-only archive. Keyword overlap doesn't scale to
// years of raw entries (that's what scoreMemories() was built for a SMALL
// curated set, not this), so this is a genuinely different two-stage
// mechanism per the plan's Section 3.3:
//   Stage 1 — cheap tag-overlap filter (Firestore array-contains-any on
//   memory_embeddings, via findCandidatesByTags) to narrow the candidate
//   set before any embedding math runs.
//   Stage 2 — rank the narrowed candidates by cosine similarity between
//   the query's own embedding and each candidate's stored vector.
//
// Candidates come from memory_embeddings (fileId + vector + tags), then
// their actual content is fetched from Drive by fileId for the ones that
// make the final cut — not for the whole candidate set, to avoid an
// unbounded number of Drive reads on a broad tag match.
export async function retrieveGeneralMemories(
  query: string,
  queryTags: string[],
  limit = 10
): Promise<GeneralMemoryResult[]> {
  const candidates = await findCandidatesByTags(queryTags);
  if (candidates.length === 0) {
    return [];
  }

  const queryVector = await embedText(query, "query");

  const ranked = candidates
    .map((candidate) => ({
      fileId: candidate.fileId,
      tags: candidate.tags,
      similarity: cosineSimilarity(queryVector, candidate.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  const client = getDriveClient();
  const withContent = await Promise.all(
    ranked.map(async (candidate) => {
      // id is already known from the embeddings collection — no need to
      // look up file metadata first, parseMemoryFile only needs the id
      // (and name, used purely for its own error-logging).
      const parsed = await parseMemoryFile(client, { id: candidate.fileId, name: candidate.fileId });
      return parsed ? { ...parsed, similarity: candidate.similarity } : null;
    })
  );

  return withContent.filter((memory): memory is GeneralMemoryResult => memory !== null);
}

// Feeds lib/memory-promotion-engine.ts — General/ entries written since a
// given point in time, for the Weekly Retrospective's promotion-proposal
// step (Section 5). memory_embeddings only ever holds General-tier
// entries (Distilled/ writes never generate an embedding — see
// app/api/v1/memories/create/route.ts), so a plain createdAt filter on
// that collection is a correct "General entries since X" query without
// needing to list the whole Drive folder.
export async function loadGeneralMemoriesSince(since: Date): Promise<ParsedMemoryFile[]> {
  const snapshot = await adminDb
    .collection("memory_embeddings")
    .where("createdAt", ">", since)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const client = getDriveClient();
  const parsed = await Promise.all(
    snapshot.docs.map((doc) => parseMemoryFile(client, { id: doc.id, name: doc.id }))
  );

  return parsed.filter((memory): memory is ParsedMemoryFile => memory !== null);
}
