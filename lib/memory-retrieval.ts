import { loadLocalMemories, type LocalMemory } from "@/lib/local-memory-loader";

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

export function retrieveLocalMemories(
  query: string,
  limit = 10
): RetrievedMemory[] {
  const memories = loadLocalMemories();
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
        memory.status,
      ].join(" ");

      const memoryTokens = new Set(tokenize(searchableText));

      let tokenMatches = 0;

      for (const token of queryTokens) {
        if (memoryTokens.has(token)) {
          tokenMatches += 1;
        }
      }

      const matchScore = tokenMatches / queryTokens.size;
      const confidenceScore = memory.confidence ?? 0;
      const relevanceScore = matchScore * 0.8 + confidenceScore * 0.2;

      return {
        ...memory,
        relevanceScore,
        matchScore,
      };
    })
    .filter((memory) => memory.matchScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}