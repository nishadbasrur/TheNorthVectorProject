// Deterministic, zero-AI-call scanner over an assembled voice response's
// text — decides whether app/api/v1/voice/respond/route.ts should
// proactively fire Tier 1 (Wolfram Alpha) or Tier 2 (Three.js hologram)
// visuals, per North_Vector's three-tier Sandbox display system. Runs once
// per response, after finalText is known. Tier 3 (push_to_screen markdown)
// stays entirely up to Claude's own tool call — this scanner never
// triggers it, and the caller skips running this scanner at all if
// push_to_screen or show_map already claimed the screen this turn (see
// that route's own call site).
//
// Regex/keyword only, deliberately, per the spec's explicit "zero AI
// calls" constraint — this can notice the response LOOKS like it's about
// math/science/data (Tier 1) or a physical/visual object (Tier 2), and
// hand off a coarse signal to the next stage (Wolfram's own NLP turns a
// query into a real answer; the Three.js renderer only needs an
// object-type bucket, not a precise identification). It cannot reliably
// identify an arbitrary open-vocabulary subject the way an LLM call
// could — that's an accepted trade-off, not an oversight.

const WOLFRAM_SIGNAL_PATTERNS: RegExp[] = [
  // Arithmetic/algebraic expressions — digits with an operator between them.
  /\d+\s*[+\-*/^]\s*\d+/,
  // Explicit math vocabulary.
  /\b(equation|derivative|integral|logarithm|square root|squared|cubed|factorial|percentage|ratio of)\b/i,
  // Unit conversions.
  /\bconver(t|sion)\b.*\b(to|into)\b/i,
  /\b\d+(\.\d+)?\s*(km|kilometers?|miles?|meters?|feet|inches?|kg|kilograms?|lbs?|pounds?|celsius|fahrenheit|liters?|gallons?)\b/i,
  // Nutrition/statistics/science data.
  /\b(calories?|protein|carbohydrates?|nutritional|nutrition facts)\b/i,
  /\b(population of|gdp of|life expectancy|statistics? (on|for|about))\b/i,
  /\b(atomic (number|weight|mass)|molecular (formula|weight)|boiling point|melting point|speed of light|molar mass)\b/i,
  // Geography/weather/sports data.
  /\b(distance between|weather in|temperature in|forecast for)\b/i,
  /\b(batting average|earned run average|winning percentage|final score)\b/i,
];

// Chemical-formula shape (H2O, CO2, C6H12O6, NH3) — a separate check from
// the list above since it needs a post-match digit requirement to avoid
// matching ordinary all-caps acronyms (USA, NASA, FBI), which would
// otherwise satisfy "1-4 groups of an uppercase letter plus optional
// lowercase plus optional digits" just as easily as a real formula does.
const CHEMICAL_FORMULA_PATTERN = /\b(?:[A-Z][a-z]?\d*){2,4}\b/;

function looksLikeChemicalFormula(text: string): boolean {
  const match = text.match(CHEMICAL_FORMULA_PATTERN);
  return !!match && /\d/.test(match[0]);
}

// Wolfram's own NLP handles messy natural-language input fine — no attempt
// here to extract a "clean" query, just pass the response itself, capped
// to keep the request URL a sane length.
const WOLFRAM_QUERY_MAX_LENGTH = 300;

export function detectWolframQuery(responseText: string): string | null {
  const matched =
    WOLFRAM_SIGNAL_PATTERNS.some((pattern) => pattern.test(responseText)) || looksLikeChemicalFormula(responseText);

  if (!matched) return null;
  return responseText.trim().slice(0, WOLFRAM_QUERY_MAX_LENGTH);
}

export type HologramObjectType = "card" | "molecule" | "building" | "product" | "abstract";

export type HologramSignal = {
  objectType: HologramObjectType;
  label: string;
};

// Checked in order — first match wins. The four specific renderers listed
// in the spec first, then a broader (but still bounded, still zero-AI)
// catch-all list mapped to the "abstract" wireframe renderer for anything
// else that's plausibly a physical/visual subject.
const HOLOGRAM_SIGNAL_PATTERNS: { type: HologramObjectType; pattern: RegExp }[] = [
  { type: "card", pattern: /\b(credit card|debit card|visa|mastercard|amex|american express|gift card)\b/i },
  { type: "molecule", pattern: /\b(molecule|compound|chemical structure|dna (strand|helix)|protein structure|atoms?)\b/i },
  { type: "building", pattern: /\b(building|skyscraper|architecture|cathedral|tower|bridge|stadium)\b/i },
  { type: "product", pattern: /\b(phone|smartphone|laptop|tablet|device|gadget|camera|headphones?|watch)\b/i },
  {
    type: "abstract",
    pattern:
      /\b(car|airplane|plane|rocket|planet|star|tree|instrument|furniture|engine|circuit|computer|robot|spacecraft|satellite)\b/i,
  },
];

export function detectHologramSubject(responseText: string): HologramSignal | null {
  for (const { type, pattern } of HOLOGRAM_SIGNAL_PATTERNS) {
    const match = responseText.match(pattern);
    if (match) {
      return { objectType: type, label: match[0] };
    }
  }
  return null;
}
