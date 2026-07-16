// Shared between the on-demand research_scholarships tool
// (lib/tool-dispatcher.ts, via lib/anthropic-client.ts's synchronous
// askClaudeWithWebSearch) and the bi-daily scheduled scan
// (functions/src/scholarship-scan.ts, via the Batch API directly) — both
// need to ask Claude the same question the same way and parse the same
// response shape, so this file owns the prompt and the parser rather than
// duplicating either. Deliberately no "server-only" guard: shared across
// both runtimes, same reasoning as lib/google-calendar-client.ts.

// Single-user app; hardcoded like OWNER_EMAIL and EVENT_TIME_ZONE elsewhere
// in this codebase. Mirrors the exact framing already shown in the app's
// own UI (components/layout/app-shell.tsx's "Pre-Med · UConn 2030" label).
const SCHOLARSHIP_PROFILE =
  "Nishad Basrur, a pre-med undergraduate at the University of Connecticut (UConn), class of 2030.";

export const SCHOLARSHIP_SYSTEM_PROMPT = [
  "You are researching real, currently-open scholarships for a specific student, using web search.",
  `Student profile: ${SCHOLARSHIP_PROFILE}`,
  "",
  "Find scholarships this student could realistically apply to: pre-med / STEM / general undergraduate",
  "scholarships open to UConn students or Connecticut residents, or national scholarships with broad",
  "eligibility a rising college student would qualify for. Prioritize ones with a real, verifiable",
  "application page and a deadline that hasn't already passed.",
  "",
  "This is research only — you are not applying to anything, just finding and summarizing real",
  "opportunities for the student to review and decide on later.",
  "",
  "After searching, respond with ONLY a JSON array (no prose before or after), each entry shaped:",
  "{",
  '  "name": string,',
  '  "description": string,  // one or two sentences: what it is, who it\'s for',
  '  "amount": string,  // e.g. "$2,500" or "$1,000-$5,000" or "Varies" if unclear',
  '  "deadline": string,  // e.g. "March 15, 2027" or "Rolling" if unclear',
  '  "eligibilitySummary": string,  // one sentence on who qualifies',
  '  "applyUrl": string  // the real application/info page URL you found',
  "}",
  "Return at most 8 entries — quality over quantity. If you can't verify a real scholarship, don't",
  "include it. Return an empty array [] if nothing genuinely fits.",
].join("\n");

export const SCHOLARSHIP_DEFAULT_QUERY =
  "Do a general search across pre-med, STEM, Connecticut-resident, and broad undergraduate scholarships.";

export interface ScholarshipCandidate {
  name: string;
  description: string;
  amount: string;
  deadline: string;
  eligibilitySummary: string;
  applyUrl: string;
}

// Extracts and validates the JSON array from a completed research
// response's text. Malformed/missing output degrades to an empty array
// rather than throwing — callers treat "found nothing" and "couldn't
// parse" the same way (both just mean no candidates to save or report).
export function parseScholarshipCandidates(text: string): ScholarshipCandidate[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.filter((entry): entry is ScholarshipCandidate => {
    return (
      entry !== null &&
      typeof entry === "object" &&
      typeof entry.name === "string" &&
      entry.name.trim().length > 0 &&
      typeof entry.description === "string" &&
      typeof entry.amount === "string" &&
      typeof entry.deadline === "string" &&
      typeof entry.eligibilitySummary === "string" &&
      typeof entry.applyUrl === "string"
    );
  });
}
