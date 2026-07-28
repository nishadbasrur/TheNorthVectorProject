// Shared by the nightly Transcripts → General batch scan
// (functions/src/transcript-batch-scan.ts, via the Batch API). Mirrors
// lib/opportunity-research.ts's role (prompt constant + parsing kept
// separate from the Cloud Function orchestration itself).
//
// Also does category classification for the General note this produces —
// folded into this same extraction call rather than a second Claude call
// in lib/obsidian-memory-store.ts's createMemory (see its CreateMemoryParams.category),
// since transcript-batch-scan.ts already calls Claude once per transcript
// here; a second call just for the category would double the cost for no
// benefit. Same 8 categories as lib/obsidian-memory-store.ts's CATEGORIES —
// duplicated rather than shared per this codebase's existing convention of
// each store/prompt file being self-contained.

const CATEGORIES = ["Identity", "Goals", "Finance", "Academic", "Relationships", "Health", "Career", "Misc"];

export const TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT = `
You are reviewing a voice message Nishad sent to his personal AI system, North Vector.

Extract ONLY the following if present:
- Strong opinions or stances ("I think X", "I'd never do Y", "X matters to me")
- Decisions or commitments ("I've decided to X", "I'm going to do Y", "I chose X")
- Actions taken or planned ("I signed up for X", "I'm dropping Y", "I'm starting Z")
- Values expressed ("I care about X", "X is important to me")

Do NOT extract:
- Questions or requests to North
- Small talk or filler
- Task instructions
- Anything that is purely transient (weather, what he had for lunch)

If nothing worth capturing is present, respond with exactly: NOTHING

If something is worth capturing, respond with exactly two lines:
1. One of these category names, exactly as written: ${CATEGORIES.join(", ")}
2. A single short paraphrased sentence or two of the content — no preamble, no labels.

Example:
Career
I've decided to leave my current job by the end of the quarter.
`.trim();

export const TRANSCRIPT_NOTHING_MARKER = "NOTHING";

export type TranscriptExtraction = {
  category: string;
  paraphrase: string;
};

// The prompt's contract is "NOTHING, or exactly two lines" — category on
// its own first line, paraphrase on the rest. Falls back to "Misc" if the
// first line isn't a recognized category (still capturing the paraphrase
// rather than discarding a genuinely worth-capturing extraction over a
// malformed category line).
export function parseTranscriptExtraction(responseText: string): TranscriptExtraction | null {
  const trimmed = responseText.trim();
  if (trimmed === TRANSCRIPT_NOTHING_MARKER || trimmed.length === 0) {
    return null;
  }

  const newlineIndex = trimmed.indexOf("\n");
  if (newlineIndex === -1) {
    // No second line — prompt wasn't followed at all, treat the whole
    // thing as the paraphrase rather than losing the extraction.
    return { category: "Misc", paraphrase: trimmed };
  }

  const firstLine = trimmed.slice(0, newlineIndex).trim();
  const rest = trimmed.slice(newlineIndex + 1).trim();

  const match = CATEGORIES.find((category) => category.toLowerCase() === firstLine.toLowerCase());
  if (!match) {
    // First line wasn't a valid category — most likely the paraphrase
    // started immediately without a category line. Treat the whole
    // response as the paraphrase, category Misc.
    return { category: "Misc", paraphrase: trimmed };
  }

  return { category: match, paraphrase: rest.length > 0 ? rest : trimmed };
}
