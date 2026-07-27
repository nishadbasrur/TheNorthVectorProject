import "server-only";
import { VoyageAIClient } from "voyageai";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Semantic layer for General/ tier memories — see
// North_Vector_Memory_Storage_Migration_Obsidian_Two_Tier.md Section 3.2.
// Distilled/ keeps using lib/memory-retrieval.ts's keyword scoreMemories();
// this is deliberately a separate, parallel mechanism for the much larger
// General/ archive, not a replacement.
//
// Voyage AI's embedding model (voyage-3.5-lite — free tier, 200M tokens on
// signup, no billing account required, and more than sufficient for
// personal memory retrieval at this scale). API-key auth (VOYAGE_API_KEY),
// NOT the OAuth2 client used for Drive/Calendar/Gmail — a genuinely
// separate credential.
const EMBEDDING_MODEL = "voyage-3.5-lite";

let cachedClient: VoyageAIClient | null = null;

function getVoyageClient(): VoyageAIClient {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY must be set.");
  }

  cachedClient = new VoyageAIClient({ apiKey });
  return cachedClient;
}

// Voyage's documented recommendation for retrieval use cases: embed
// memories being STORED as "document" and the incoming query being
// RETRIEVED against as "query" — the two get different internal
// representations even though they go through the same model, and this
// meaningfully improves retrieval accuracy over embedding both the same
// way. Defaults to "document" since most callers are the write path
// (lib/obsidian-memory-store.ts / the migration script); retrieval call
// sites (lib/obsidian-memory-retrieval.ts's retrieveGeneralMemories) pass
// "query" explicitly.
export async function embedText(text: string, inputType: "query" | "document" = "document"): Promise<number[]> {
  const client = getVoyageClient();
  const response = await client.embed({
    input: text,
    model: EMBEDDING_MODEL,
    inputType,
  });

  const values = response.data?.[0]?.embedding;
  if (!values) {
    throw new Error("Voyage embedding API returned no vector.");
  }

  return values;
}

export type StoredEmbedding = {
  fileId: string;
  vector: number[];
  tags: string[];
  createdAt: FirebaseFirestore.Timestamp | FieldValue;
};

// Keyed by Drive file ID (not a Firestore auto-ID) — makes "does this file
// already have an embedding" a direct doc lookup, useful for the migration
// script's retroactive-embedding step and for avoiding duplicate writes if
// createMemory is ever retried.
export async function storeEmbedding(fileId: string, vector: number[], tags: string[]): Promise<void> {
  await adminDb.collection("memory_embeddings").doc(fileId).set({
    fileId,
    vector,
    tags,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export type EmbeddingCandidate = {
  fileId: string;
  vector: number[];
  tags: string[];
};

// Stage 1 of the two-stage retrieval in lib/obsidian-memory-retrieval.ts —
// cheap tag-overlap filter before any embedding math happens. Firestore's
// array-contains-any caps at 10 values per query, so queryTags is
// truncated to the first 10 (tag-extraction already keeps lists short —
// see the tag-extraction helper's "3-5 tags" instruction — so this should
// essentially never trigger in practice).
export async function findCandidatesByTags(queryTags: string[]): Promise<EmbeddingCandidate[]> {
  if (queryTags.length === 0) {
    return [];
  }

  const snapshot = await adminDb
    .collection("memory_embeddings")
    .where("tags", "array-contains-any", queryTags.slice(0, 10))
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      fileId: doc.id,
      vector: Array.isArray(data.vector) ? data.vector : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
    };
  });
}

// Standard cosine similarity — deliberately no external library for this,
// per the plan's own note that it's a handful of lines of real math.
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
