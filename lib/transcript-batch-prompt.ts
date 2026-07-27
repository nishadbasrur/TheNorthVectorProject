// Shared by the nightly Transcripts → General batch scan
// (functions/src/transcript-batch-scan.ts, via the Batch API). Mirrors
// lib/opportunity-research.ts's role (prompt constant + parsing kept
// separate from the Cloud Function orchestration itself). Prompt text is
// exactly as specified in
// North_Vector_Three_Tier_Memory_Pipeline_Plan.md — verbatim, not
// reworded.

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

If something is worth capturing, respond with a single short paraphrased sentence or two. No preamble, no labels, just the paraphrased content.
`.trim();

export const TRANSCRIPT_NOTHING_MARKER = "NOTHING";

// Trivial by design — the prompt's own contract is "respond with exactly
// NOTHING, or a short paraphrase, nothing else," so parsing is just a
// trim + exact-match check, not a JSON/regex extraction like
// lib/opportunity-research.ts's parseOpportunityCandidates needs.
export function parseTranscriptExtraction(responseText: string): string | null {
  const trimmed = responseText.trim();
  if (trimmed === TRANSCRIPT_NOTHING_MARKER || trimmed.length === 0) {
    return null;
  }
  return trimmed;
}
