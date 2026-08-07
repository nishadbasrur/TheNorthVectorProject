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
// here to extract a "clean" query, just pass the response itself (after
// stripUrls below), capped to keep the request URL a sane length.
const WOLFRAM_QUERY_MAX_LENGTH = 300;

// push_to_screen content routinely carries markdown links/images
// (`[text](url)`, `![alt](url)`) alongside the actual subject text — e.g.
// a Wikipedia thumbnail sitting next to a molecule's name. Left in, a URL
// easily becomes the "subject" sent to Wolfram (it's often the longest
// contiguous token, and matches ate it wholesale as part of the 300-char
// slice) instead of the real topic, which Wolfram then can't answer.
// Markdown link/image syntax is unwrapped to keep its visible text (a
// plain "text" is still useful signal for Wolfram); bare URLs are dropped
// outright since they have no visible text to keep.
function stripUrls(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function detectWolframQuery(responseText: string): string | null {
  const stripped = stripUrls(responseText);
  if (!stripped) return null;

  const matched =
    WOLFRAM_SIGNAL_PATTERNS.some((pattern) => pattern.test(stripped)) || looksLikeChemicalFormula(stripped);

  if (!matched) return null;
  return stripped.slice(0, WOLFRAM_QUERY_MAX_LENGTH);
}

// "reaction" is deliberately excluded from what detectHologramSubject
// (regex scan over free text) can ever produce — a reaction hologram only
// ever comes from push_to_screen's explicit `reaction` schema field
// (structured reactant/product subjects Claude supplies directly), never
// from pattern-matching prose. See DetectableHologramObjectType below.
export type HologramObjectType = "card" | "molecule" | "building" | "product" | "abstract" | "reaction";
type DetectableHologramObjectType = Exclude<HologramObjectType, "reaction">;

// structure carries real per-atom geometry for the "molecule" case — see
// lib/pubchem-client.ts (whose PubChemStructure this shape mirrors) and
// lib/tool-dispatcher.ts's handlePushToScreen, the only place this gets
// populated. Left undefined for every other objectType, and for a
// molecule when no `subject` was supplied or PubChem couldn't resolve
// one — app/sandbox/hologram-panel.tsx falls back to its generic
// placeholder shape whenever this is absent, so an unresolved subject
// never breaks the hologram outright.
export type HologramAtom = { element: string; x: number; y: number; z: number };
export type HologramBond = { a: number; b: number; order: number };
export type HologramStructure = { atoms: HologramAtom[]; bonds: HologramBond[] };

// One reactant or product species in a reaction hologram — same
// label/structure shape a single-molecule HologramSignal carries,
// just nested under reactants/products instead of being the whole payload.
export type ReactionSpecies = { label: string; structure?: HologramStructure };

// Optional word-problem context for a reaction — "compound A dissolved in
// compound B, heated to 350°C" carries a solvent and a set of reaction
// conditions that aren't part of the reactant/product chemistry itself,
// but change how the scene sets up (vessel + solvent fill) before the
// already-built crossfade takes over. Both fields are free text, passed
// straight through from whatever Claude extracted from the word problem —
// no parsing/validation attempted here, same as `label` elsewhere in this
// file.
export type ReactionVessel = { solvent?: string; conditions?: string };

// A discriminated union rather than one flat type with everything
// optional — a "reaction" hologram has fundamentally different shape
// (multiple species, no single `structure`) from every other object
// type, and this makes that a compile-time distinction instead of a
// runtime "well it depends which fields happen to be set" one.
export type HologramSignal =
  | { objectType: DetectableHologramObjectType; label: string; structure?: HologramStructure }
  | {
      objectType: "reaction";
      label: string;
      reactants: ReactionSpecies[];
      products: ReactionSpecies[];
      vessel?: ReactionVessel;
    };

// Checked in order — first match wins. The four specific renderers listed
// in the spec first, then a broader (but still bounded, still zero-AI)
// catch-all list mapped to the "abstract" wireframe renderer for anything
// else that's plausibly a physical/visual subject.
// Every alternative below is deliberately checked as a whole word (\b...\b)
// against the RAW form actually likely to appear in prose — plural ("card"
// vs "cards") and, for molecule specifically, a word-stem variant
// ("molecule" vs "molecular") both silently fail a literal \bmolecule\b
// match even though they're obviously the same category to a person. Bit
// by this exactly once already (see the "Potassium ferrocyanide ... -
// molecular structure" miss this pattern list is being fixed for) — every
// entry below is now checked for the same trap, not just molecule.
const HOLOGRAM_SIGNAL_PATTERNS: { type: DetectableHologramObjectType; pattern: RegExp }[] = [
  {
    type: "card",
    pattern: /\b(credit cards?|debit cards?|visa|mastercard|amex|american express|gift cards?)\b/i,
  },
  {
    type: "molecule",
    pattern: /\b(molecules?|molecular|compound|chemical structures?|dna (strands?|helix|helices)|protein structures?|atoms?)\b/i,
  },
  {
    type: "building",
    pattern: /\b(buildings?|skyscrapers?|architecture|cathedrals?|towers?|bridges?|stadiums?)\b/i,
  },
  {
    type: "product",
    pattern: /\b(phones?|smartphones?|laptops?|tablets?|devices?|gadgets?|cameras?|headphones?|watch(es)?)\b/i,
  },
  {
    type: "abstract",
    pattern:
      /\b(cars?|airplanes?|planes?|rockets?|planets?|stars?|trees?|instruments?|furniture|engines?|circuits?|computers?|robots?|spacecraft|satellites?)\b/i,
  },
];

export function detectHologramSubject(responseText: string): Extract<HologramSignal, { structure?: HologramStructure }> | null {
  for (const { type, pattern } of HOLOGRAM_SIGNAL_PATTERNS) {
    const match = responseText.match(pattern);
    if (match) {
      return { objectType: type, label: match[0] };
    }
  }
  return null;
}
