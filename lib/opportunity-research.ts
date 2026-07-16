// Shared by the bi-daily opportunity scan (functions/src/opportunity-scan.ts,
// via the Batch API). Maps to 03-Chief-Engine/Opportunity_Engine.md's own
// design — categories, detection sources, and the standard opportunity
// record — rather than being scoped to any single topic like scholarships.
// Deliberately a trimmed v1: one web-search research pass per cycle, no
// scoring/lifecycle model, no email/calendar/goals context fed in yet
// (a natural next step would be reusing lib/synthesis-context.ts's context
// assembly here, the same way the Synthesis Engine does, so the search
// itself is grounded in what's actually going on rather than a static
// profile string).

const OPPORTUNITY_PROFILE =
  "Nishad Basrur, a pre-med undergraduate at the University of Connecticut (UConn), class of 2030.";

export const OPPORTUNITY_SYSTEM_PROMPT = [
  "You are proactively researching real opportunities for a specific student, using web search.",
  `Student profile: ${OPPORTUNITY_PROFILE}`,
  "",
  "Look across these categories (see 03-Chief-Engine/Opportunity_Engine.md for the full design):",
  "academic (scholarships, honors programs, workshops), career (research positions, internships,",
  "shadowing, mentorship), financial (scholarships, cost reductions), and learning (relevant courses,",
  "certifications) — weighted toward what's realistic and timely for a rising pre-med undergraduate",
  "right now. Prioritize real, verifiable, currently-open opportunities with a real application page",
  "and a deadline that hasn't already passed.",
  "",
  "This is research only — you are not applying to or signing up for anything, just finding and",
  "summarizing real opportunities for the student to review and decide on later.",
  "",
  "After searching, respond with ONLY a JSON array (no prose before or after), each entry shaped:",
  "{",
  '  "title": string,',
  '  "category": string,  // one of: academic, career, financial, learning',
  '  "description": string,  // one or two sentences: what it is, who it\'s for',
  '  "amount": string,  // dollar value if relevant, e.g. "$2,500", else "N/A"',
  '  "deadline": string,  // e.g. "March 15, 2027" or "Rolling" if unclear',
  '  "eligibilitySummary": string,  // one sentence on who qualifies',
  '  "applyUrl": string  // the real application/info page URL you found',
  "}",
  "Return at most 8 entries — quality over quantity. If you can't verify something real, don't",
  "include it. Return an empty array [] if nothing genuinely fits.",
].join("\n");

export const OPPORTUNITY_DEFAULT_QUERY =
  "Do a broad search across academic, career, financial, and learning opportunities relevant to a " +
  "rising pre-med undergraduate at UConn right now.";

export interface OpportunityCandidate {
  title: string;
  category: string;
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
export function parseOpportunityCandidates(text: string): OpportunityCandidate[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.filter((entry): entry is OpportunityCandidate => {
    return (
      entry !== null &&
      typeof entry === "object" &&
      typeof entry.title === "string" &&
      entry.title.trim().length > 0 &&
      typeof entry.category === "string" &&
      typeof entry.description === "string" &&
      typeof entry.amount === "string" &&
      typeof entry.deadline === "string" &&
      typeof entry.eligibilitySummary === "string" &&
      typeof entry.applyUrl === "string"
    );
  });
}
