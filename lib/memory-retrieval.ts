import "server-only";
import { loadLocalMemories, type LocalMemory } from "./local-memory-loader";
import { adminDb } from "./firebase-admin";
import { loadObsidianMemories } from "./obsidian-memory-retrieval";

const STOP_WORDS = new Set([
  "what",
  "should",
  "focus",
  "about",
  "with",
  "from",
  "this",
  "that",
  "have",
  "been",
  "will",
  "would",
  "could",
  "there",
  "their",
  "them",
  "they",
  "your",
  "you",
  "for",
  "and",
  "the",
  "are",
  // Added 2026-09-04, alongside the minimum-match-score floor below —
  // confirmed live that these carry essentially zero topical signal (they
  // pass length>=3 but appear in almost any query regardless of subject)
  // and were diluting/polluting match ratios in both directions: "can" and
  // "like" produced real but meaningless matches against a long memory's
  // incidental vocabulary (a query about checking email for anything
  // "urgent" partly matched on "can"; "what's the weather like" matched on
  // "like"), while "how" and "think" inflated a genuinely relevant short
  // query's token count enough to drag its match ratio below any
  // reasonable threshold ("how should I think about med school prep"
  // has exactly one real topical token — "school" — but was previously
  // scored out of 5).
  "how",
  "think",
  "can",
  "like",
]);

const QUERY_EXPANSIONS: Record<string, string[]> = {
  premed: [
    "medicine",
    "medical",
    "physician",
    "doctor",
    "mcat",
    "gpa",
    "chem",
    "chemistry",
    "biology",
  ],
  "pre-med": [
    "medicine",
    "medical",
    "physician",
    "doctor",
    "mcat",
    "gpa",
    "chem",
    "chemistry",
    "biology",
  ],
  uconn: ["college", "university", "storrs", "education", "school"],
  chem: ["chemistry", "1127q"],
  chemistry: ["chem", "1127q"],
  biology: ["bio", "biol", "1107"],
  bio: ["biology", "biol", "1107"],
  ortho: ["orthopedic", "orthopedics", "surgery", "surgeon"],
  orthopedic: ["ortho", "orthopedics", "surgery", "surgeon"],
};

export type RetrievedMemory = LocalMemory & {
  relevanceScore: number;
  matchScore: number;
};

// Common shape every scoreable memory record must have, regardless of
// whether it came from the local curated file, Firestore, or (new) Obsidian
// vault markdown files synced via Google Drive.
export type ScoreableMemory = {
  content: string;
  domain: string;
  type: string;
  status?: string;
  confidence?: number;
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

function tokenize(value: string) {
  const baseTokens = normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3)
    .filter((token) => !STOP_WORDS.has(token));

  const expandedTokens = new Set(baseTokens);

  for (const token of baseTokens) {
    const expansions = QUERY_EXPANSIONS[token] ?? [];

    for (const expansion of expansions) {
      const normalizedExpansion = normalizeText(expansion).trim();

      if (normalizedExpansion && !STOP_WORDS.has(normalizedExpansion)) {
        expandedTokens.add(normalizedExpansion);
      }
    }
  }

  return Array.from(expandedTokens);
}

// Basic stemming — strips a few common suffixes so a query token still
// connects to plural/gerund/participle variants in a memory ("sleeps" ->
// "sleep", "scheduling" -> "schedul"). Deliberately crude (no real
// stemming library, no linguistic correctness attempted) — same "good
// enough for keyword overlap" spirit as the rest of this scorer. Guards
// against stripping a short token down to nothing/near-nothing (e.g. "as"
// -> "").
function stem(token: string): string {
  const stripped = token.replace(/(ing|edly|ed|es|s)$/, "");
  return stripped.length >= 3 ? stripped : token;
}

// Expands one token into every form worth matching against: itself, its
// stem, and — for hyphenated compounds like "medical-school" — each
// hyphen-separated part and that part's own stem too. This is what lets a
// bare query token like "school" connect to a longer memory's
// "medical-school" without resorting to blind substring matching (which
// would just as happily match "art" inside "party" or "cat" inside
// "location") — confirmed live 2026-09-04 that exact-token-only matching
// missed a real, plausible query ("med school prep" against a memory
// containing "medical-school") for exactly this reason.
function expandTokenForms(token: string): Set<string> {
  const forms = new Set<string>([token, stem(token)]);
  if (token.includes("-")) {
    for (const part of token.split("-")) {
      if (part.length >= 3) {
        forms.add(part);
        forms.add(stem(part));
      }
    }
  }
  return forms;
}

// A query token "matches" a memory's token set if any of its expanded
// forms overlaps any of the memory tokens' expanded forms — computed once
// per memory (not per query token) since the memory side doesn't change
// across the loop below.
function expandTokenSet(tokens: Set<string>): Set<string> {
  const forms = new Set<string>();
  for (const token of tokens) {
    for (const form of expandTokenForms(token)) forms.add(form);
  }
  return forms;
}

// Below this, a "match" is too weak to be worth surfacing at all — e.g. a
// single coincidental shared word between a short unrelated query and a
// long memory with broad vocabulary coverage. Confirmed live 2026-09-04:
// a 6,500-character Distilled memory was returned for "What's the weather
// like this weekend?" and "Can you check my email for anything urgent?"
// (real matchScores ~0.33 and ~0.40) purely because a long document has
// enough incidental vocabulary to weakly overlap almost any query — not
// because either query was actually about that memory. Chosen with real
// margin below the genuine matches seen in that same test (~0.83-1.0) and
// above those two false positives, not a round-number guess.
const MIN_MATCH_SCORE = 0.3;

// Shared keyword-overlap scorer — no embeddings/vector DB, just token
// overlap (with basic stemming/compound-splitting, see expandTokenForms
// above) between the query and each memory's content/domain/type, blended
// with the memory's own confidence, gated by a minimum match-score floor
// so a weak coincidental overlap never qualifies at all. Used by both the
// local-file retrieval (below, unchanged in behavior) and the
// Firestore-backed retrieval used by the Judgment Engine.
function scoreMemories<T extends ScoreableMemory>(
  memories: T[],
  query: string,
  limit: number
): (T & { relevanceScore: number; matchScore: number })[] {
  const queryTokens = new Set(tokenize(query));

  if (queryTokens.size === 0) {
    return memories
      .map((memory) => ({
        ...memory,
        relevanceScore: memory.confidence ?? 0,
        matchScore: 0,
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  return memories
    .map((memory) => {
      const searchableText = [
        memory.content,
        memory.domain,
        memory.type,
        memory.status ?? "",
      ].join(" ");

      const memoryTokens = new Set(tokenize(searchableText));
      const memoryTokenForms = expandTokenSet(memoryTokens);

      let tokenMatches = 0;

      for (const token of queryTokens) {
        const queryForms = expandTokenForms(token);
        let matched = false;
        for (const form of queryForms) {
          if (memoryTokenForms.has(form)) {
            matched = true;
            break;
          }
        }
        if (matched) tokenMatches += 1;
      }

      const matchScore = tokenMatches / queryTokens.size;
      const confidenceScore = memory.confidence ?? 0;
      const relevanceScore = matchScore * 0.8 + confidenceScore * 0.2;

      return { ...memory, relevanceScore, matchScore };
    })
    .filter((memory) => memory.matchScore >= MIN_MATCH_SCORE)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

export function retrieveLocalMemories(
  query: string,
  limit = 10
): RetrievedMemory[] {
  const memories = loadLocalMemories();
  return scoreMemories(memories, query, limit);
}

// Firestore-backed equivalent, for server-side callers with an authoritative
// view of the real `memories` collection (e.g. the Judgment Engine). Fetches
// the full collection and scores in-memory — fine at this scale (dozens of
// documents), and deliberately simple: no embeddings, no vector DB, per the
// same "start minimal" scoping as the rest of the Judgment Engine work.
export type FirestoreRetrievedMemory = {
  id: string;
  content: string;
  domain: string;
  type: string;
  confidence: number;
  relevanceScore: number;
  matchScore: number;
};

export async function retrieveMemories(
  query: string,
  limit = 5
): Promise<FirestoreRetrievedMemory[]> {
  const snapshot = await adminDb.collection("memories").get();

  const memories = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data();
    return {
      id: doc.id,
      content: typeof data.content === "string" ? data.content : "",
      domain: typeof data.domain === "string" ? data.domain : "",
      type: typeof data.type === "string" ? data.type : "",
      confidence: typeof data.confidence === "number" ? data.confidence : 0,
    };
  });

  return scoreMemories(memories, query, limit);
}

// Obsidian/Google-Drive-backed equivalent of retrieveMemories above — same
// scoreMemories() call, sourced from markdown files instead of Firestore.
// NOT yet wired into app/api/v1/judgment/route.ts's call site: that swap
// waits on the three real-world setup steps (Drive OAuth scope, Drive
// desktop app mirroring the vault, Obsidian Sync's selective-sync
// exclusion) actually being done and confirmed, so retrieveMemories stays
// the live path — and the old Firestore `memories` collection stays
// intact — until then.
export async function retrieveObsidianMemories(
  query: string,
  limit = 5
): Promise<(ScoreableMemory & { relevanceScore: number; matchScore: number })[]> {
  const memories = await loadObsidianMemories();
  return scoreMemories(memories, query, limit);
}
