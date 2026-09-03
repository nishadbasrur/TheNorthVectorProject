// Generates the candidate compound-name list for the offline curriculum
// molecule library (see scripts/build-curriculum-library.mts). Not a random
// "popular molecules" sample — every category here maps directly to
// something actually taught/drilled in General Chemistry, Organic
// Chemistry 1, or Organic Chemistry 2 (see the fix note this implements:
// "Bundle a curriculum-driven molecule library"). Two kinds of entries:
//   1. Hand-curated names (specific real compounds courses name directly —
//      amino acids, named reagents, common salts, etc.)
//   2. Systematically generated names (homologous series, positional/
//      stereo isomers, substituent combinatorics) — legitimate coursework
//      material even when a specific chain length/substituent combo isn't
//      individually named in a textbook (e.g. "predict the SN2 product of
//      2-bromooctane" is a completely standard practice-problem pattern),
//      NOT arbitrary padding. Chain lengths and substituent sets are
//      deliberately capped (not extended indefinitely) to keep this
//      curriculum-shaped rather than exhaustive — see the fix note's
//      explicit "curriculum relevance over raw volume" priority.
//
// This only PRODUCES candidate name strings — it makes no network calls
// and has no opinion on whether a given name actually resolves on
// PubChem. scripts/build-curriculum-library.mts is what finds out.

const ALKANE_STEMS = [
  "", "meth", "eth", "prop", "but", "pent", "hex", "hept", "oct", "non", "dec",
  "undec", "dodec", "tridec", "tetradec", "pentadec", "hexadec", "heptadec", "octadec", "nonadec", "icos",
]; // index = carbon count, 1..20

const HALOGEN_PREFIXES = ["fluoro", "chloro", "bromo", "iodo"];

function alkaneName(n: number): string {
  return `${ALKANE_STEMS[n]}ane`;
}
function alkylName(n: number): string {
  return `${ALKANE_STEMS[n]}yl`;
}

function uniq(list: string[]): string[] {
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))];
}

// --- Straight-chain + branched alkanes ------------------------------------
function genAlkanes(): string[] {
  const out: string[] = [];
  for (let n = 1; n <= 20; n++) out.push(alkaneName(n));

  // Branched isomers, C5-C10: 1-2 methyl substituents at internal positions.
  // Not exhaustive isomer enumeration (that combinatorially explodes past
  // C8) — covers the branching patterns Orgo 1 problem sets actually drill
  // (identifying/predicting a branched substrate for SN1 vs SN2 etc.).
  for (let n = 5; n <= 12; n++) {
    for (let p = 2; p <= n - 1; p++) {
      out.push(`${p}-methyl${alkaneName(n)}`);
    }
    for (let p1 = 2; p1 <= n - 1; p1++) {
      for (let p2 = p1; p2 <= n - 1; p2++) {
        if (p1 === p2) out.push(`${p1},${p1}-dimethyl${alkaneName(n)}`);
        else out.push(`${p1},${p2}-dimethyl${alkaneName(n)}`);
      }
    }
  }
  // Common trivially-named branched alkanes always worth having by name.
  out.push("isobutane", "isopentane", "neopentane", "isohexane", "isooctane", "2,2,4-trimethylpentane");

  return uniq(out);
}

// --- Cycloalkanes ----------------------------------------------------------
function genCycloalkanes(): string[] {
  const out: string[] = [];
  for (let n = 3; n <= 12; n++) out.push(`cyclo${alkaneName(n)}`);
  for (const ring of ["cyclopentane", "cyclohexane", "cycloheptane"]) {
    out.push(`methyl${ring}`, `ethyl${ring}`, `1,2-dimethyl${ring}`, `1,3-dimethyl${ring}`, `1,4-dimethyl${ring}`);
  }
  return uniq(out);
}

// --- Haloalkanes -------------------------------------------------------
function genHaloalkanes(): string[] {
  const out: string[] = [];
  for (let n = 1; n <= 20; n++) {
    const maxPos = Math.ceil(n / 2);
    for (const halo of HALOGEN_PREFIXES) {
      for (let p = 1; p <= maxPos; p++) {
        out.push(n === 1 ? `${halo}methane` : `${p}-${halo}${alkaneName(n)}`);
      }
    }
  }
  out.push(
    "2-chloro-2-methylpropane", "2-bromo-2-methylpropane", "2-iodo-2-methylpropane",
    "1-chloro-2-methylpropane", "2-chloropropane", "isopropyl bromide", "isopropyl chloride",
    "neopentyl chloride", "benzyl chloride", "benzyl bromide", "allyl chloride", "allyl bromide",
    "vinyl chloride", "chloroform", "dichloromethane", "carbon tetrachloride", "tetrabromomethane"
  );
  return uniq(out);
}

// --- Alcohols ------------------------------------------------------------
function genAlcohols(): string[] {
  const out: string[] = [];
  for (let n = 1; n <= 20; n++) {
    const maxPos = Math.ceil(n / 2);
    for (let p = 1; p <= maxPos; p++) {
      out.push(n === 1 ? "methanol" : `${p}-${ALKANE_STEMS[n]}anol`);
    }
  }
  out.push(
    "isopropanol", "tert-butanol", "isobutanol", "sec-butanol", "neopentyl alcohol",
    "ethylene glycol", "propylene glycol", "1,3-propanediol", "1,4-butanediol", "glycerol",
    "benzyl alcohol", "cyclohexanol", "cyclopentanol", "allyl alcohol", "phenol",
    "cresol", "catechol", "resorcinol", "hydroquinone", "menthol"
  );
  return uniq(out);
}

// --- Ethers ----------------------------------------------------------------
function genEthers(): string[] {
  const groups = ["methyl", "ethyl", "propyl", "isopropyl", "butyl", "isobutyl", "tert-butyl", "pentyl", "hexyl", "benzyl", "phenyl", "vinyl"];
  const out: string[] = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = i; j < groups.length; j++) {
      out.push(i === j ? `di${groups[i]} ether` : `${groups[i]} ${groups[j]} ether`);
    }
  }
  out.push("tetrahydrofuran", "1,4-dioxane", "anisole", "diphenyl ether", "diethylene glycol");
  return uniq(out);
}

// --- Alkenes (with cis/trans on genuine internal double bonds) ------------
function genAlkenes(): string[] {
  const out: string[] = [];
  for (let n = 2; n <= 20; n++) {
    const maxPos = n - 1;
    for (let p = 1; p <= Math.ceil(maxPos / 2); p++) {
      const base = n === 2 ? "ethene" : n === 3 ? "propene" : `${p}-${ALKANE_STEMS[n]}ene`;
      out.push(base);
      // Internal double bond (not at the chain terminus on either side) has
      // a genuine cis/trans pair — terminal (p===1) does not.
      if (p > 1 && p < maxPos) {
        out.push(`cis-${p}-${ALKANE_STEMS[n]}ene`, `trans-${p}-${ALKANE_STEMS[n]}ene`);
      }
    }
  }
  out.push(
    "isobutylene", "2-methyl-2-butene", "3-methyl-1-butene", "isoprene", "1,3-butadiene",
    "1,3-pentadiene", "1,3-cyclohexadiene", "1,4-cyclohexadiene", "cyclopentadiene", "cyclohexene",
    "cyclopentene", "styrene", "allylbenzene", "limonene"
  );
  return uniq(out);
}

// --- Alkynes ---------------------------------------------------------------
function genAlkynes(): string[] {
  const out: string[] = [];
  for (let n = 2; n <= 20; n++) {
    const maxPos = n - 1;
    for (let p = 1; p <= Math.ceil(maxPos / 2); p++) {
      out.push(n === 2 ? "acetylene" : `${p}-${ALKANE_STEMS[n]}yne`);
    }
  }
  out.push("propyne", "1-butyne", "2-butyne", "phenylacetylene", "3-methyl-1-butyne");
  return uniq(out);
}

// --- Amines ------------------------------------------------------------
function genAmines(): string[] {
  const groups = ["methyl", "ethyl", "propyl", "isopropyl", "butyl", "sec-butyl", "tert-butyl", "pentyl", "hexyl", "heptyl", "octyl"];
  const out: string[] = [];
  for (let n = 1; n <= 20; n++) out.push(`${alkylName(n)}amine`);
  for (let i = 0; i < groups.length; i++) {
    for (let j = i; j < groups.length; j++) {
      // No hyphen directly before "amine" — confirmed live against
      // PubChem: "N-ethyl-propylamine" 404s, but "N-ethylpropylamine"
      // (same name, no hyphen before the suffix) resolves fine. This bug
      // alone was responsible for the large majority of pass 1's amine
      // category failures (84% fail rate) — a naming-format bug, not a
      // real chemistry/coverage gap.
      out.push(i === j ? `di${groups[i]}amine` : `N-${groups[i]}${groups[j]}amine`);
    }
  }
  for (let i = 0; i < groups.length; i++) {
    for (let j = i; j < groups.length; j++) {
      for (let k = j; k < groups.length; k++) {
        out.push(`N,N-${groups[i]}${groups[j]}${groups[k]}amine`);
      }
    }
  }
  out.push(
    "aniline", "N-methylaniline", "N,N-dimethylaniline", "o-toluidine", "m-toluidine", "p-toluidine",
    "pyridine", "pyrrole", "pyrrolidine", "piperidine", "imidazole", "piperazine", "morpholine",
    "benzylamine", "cyclohexylamine", "ethylenediamine", "triethylamine", "diisopropylamine"
  );
  return uniq(out);
}

// --- Carbonyls: aldehydes, ketones, acids, esters, amides -----------------
function genAldehydes(): string[] {
  const out: string[] = [];
  for (let n = 1; n <= 20; n++) out.push(n === 1 ? "formaldehyde" : `${ALKANE_STEMS[n]}anal`);
  out.push("benzaldehyde", "cinnamaldehyde", "vanillin", "salicylaldehyde", "acrolein");
  return uniq(out);
}

function genKetones(): string[] {
  const out: string[] = [];
  for (let n = 3; n <= 20; n++) {
    const maxPos = n - 1;
    for (let p = 2; p <= Math.ceil(maxPos / 2) + 1; p++) {
      out.push(n === 3 ? "acetone" : `${p}-${ALKANE_STEMS[n]}anone`);
    }
  }
  out.push("acetophenone", "benzophenone", "cyclohexanone", "cyclopentanone", "methyl vinyl ketone", "camphor");
  return uniq(out);
}

const ACID_STEMS: [string, string][] = [
  ["formic acid", "formate"], ["acetic acid", "acetate"], ["propanoic acid", "propanoate"],
  ["butanoic acid", "butanoate"], ["pentanoic acid", "pentanoate"], ["hexanoic acid", "hexanoate"],
  ["heptanoic acid", "heptanoate"], ["octanoic acid", "octanoate"], ["nonanoic acid", "nonanoate"],
  ["decanoic acid", "decanoate"], ["benzoic acid", "benzoate"], ["2-methylpropanoic acid", "2-methylpropanoate"],
  ["3-methylbutanoic acid", "3-methylbutanoate"], ["cyclohexanecarboxylic acid", "cyclohexanecarboxylate"],
];

function genCarboxylicAcids(): string[] {
  const out: string[] = ACID_STEMS.map(([acid]) => acid);
  out.push(
    "oxalic acid", "malonic acid", "succinic acid", "glutaric acid", "adipic acid",
    "fumaric acid", "maleic acid", "citric acid", "lactic acid", "tartaric acid",
    "salicylic acid", "phthalic acid", "acrylic acid", "oleic acid", "stearic acid",
    "palmitic acid", "linoleic acid", "myristic acid", "lauric acid"
  );
  const benzoicSubstituents = ["chloro", "bromo", "nitro", "amino", "hydroxy", "methyl", "methoxy"];
  for (const sub of benzoicSubstituents) {
    for (const pos of [2, 3, 4]) out.push(`${pos}-${sub}benzoic acid`);
  }
  return uniq(out);
}

function genEsters(): string[] {
  const alcoholGroups = ["methyl", "ethyl", "propyl", "isopropyl", "butyl", "isobutyl", "tert-butyl", "pentyl", "hexyl", "benzyl", "phenyl", "cyclohexyl"];
  const out: string[] = [];
  for (const [, acidStem] of ACID_STEMS) {
    for (const alc of alcoholGroups) out.push(`${alc} ${acidStem}`);
  }
  return uniq(out);
}

function genAmides(): string[] {
  const out: string[] = [];
  const amideStems = [
    "formamide", "acetamide", "propanamide", "butanamide", "pentanamide", "hexanamide",
    "heptanamide", "octanamide", "benzamide", "2-methylpropanamide",
  ];
  for (const stem of amideStems) {
    out.push(stem, `N-methyl${stem}`, `N,N-dimethyl${stem}`);
  }
  return uniq(out);
}

// --- Aromatics: substituted benzenes ---------------------------------------
const BENZENE_SUBSTITUENTS = [
  "chloro", "bromo", "fluoro", "iodo", "nitro", "amino", "hydroxy", "methyl", "methoxy",
  "ethyl", "propyl", "isopropyl", "tert-butyl", "cyano", "trifluoromethyl", "acetyl",
  "formyl", "vinyl", "phenyl", "carboxy", "ethoxy", "isopropoxy", "thiol", "azido",
  "chloromethyl", "sulfonic acid",
];

function genSubstitutedBenzenes(): string[] {
  const out: string[] = [];
  for (const s of BENZENE_SUBSTITUENTS) out.push(`${s}benzene`);
  for (let i = 0; i < BENZENE_SUBSTITUENTS.length; i++) {
    for (let j = i + 1; j < BENZENE_SUBSTITUENTS.length; j++) {
      const a = BENZENE_SUBSTITUENTS[i];
      const b = BENZENE_SUBSTITUENTS[j];
      out.push(`1-${a}-2-${b}benzene`, `1-${a}-3-${b}benzene`, `1-${a}-4-${b}benzene`);
    }
  }
  // Symmetric 1,3,5-trisubstitution — the one trisubstituted pattern
  // simple/unambiguous enough to generate reliably (each substituent
  // equally spaced, no positional-numbering ambiguity), and a real EAS
  // regiochemistry teaching case (e.g. 1,3,5-trinitrobenzene, sym-collidine-
  // style patterns).
  const triSet = ["chloro", "bromo", "nitro", "amino", "methyl", "hydroxy"];
  for (let i = 0; i < triSet.length; i++) {
    for (let j = i; j < triSet.length; j++) {
      for (let k = j; k < triSet.length; k++) {
        out.push(`1,3,5-tri${triSet[i] === triSet[j] && triSet[j] === triSet[k] ? triSet[i] : "(mixed)"}benzene`);
      }
    }
  }
  // Drop the "(mixed)" placeholders — mixed-substituent 1,3,5 names need
  // per-position prefixes, not a single "tri-" prefix; only the genuinely
  // symmetric tri-X-benzene names above are unambiguous to generate this way.
  const filtered = out.filter((n) => !n.includes("(mixed)"));

  // Mixed trisubstitution at 1,2,4 — the one asymmetric pattern simple
  // enough to name unambiguously with per-position prefixes (each
  // substituent gets an explicit locant, so position order never matters).
  // A real EAS regiochemistry case (e.g. predicting a third nitration on an
  // already-disubstituted ring). Kept to a smaller substituent subset since
  // this is a 3-way combinatorial (k^3 territory) — still curriculum-tied,
  // not padding: multi-step EAS directing-effect problems are standard
  // Orgo 2 material.
  const triMixedSet = ["chloro", "bromo", "nitro", "amino", "methyl", "hydroxy", "methoxy", "cyano"];
  for (const a of triMixedSet) {
    for (const b of triMixedSet) {
      if (b === a) continue;
      for (const c of triMixedSet) {
        if (c === a || c === b) continue;
        filtered.push(`1-${a}-2-${b}-4-${c}benzene`);
      }
    }
  }

  return uniq(filtered);
}

// Common trivial-name aromatic parents + a single additional substituent —
// exactly the EAS-regiochemistry practice-problem pattern ("nitrate
// toluene, predict ortho/para product").
function genTrivialParentSubstituted(): string[] {
  const parents = ["toluene", "phenol", "aniline", "benzaldehyde", "benzoic acid", "anisole", "styrene", "acetophenone", "nitrobenzene", "benzonitrile"];
  const subs = ["chloro", "bromo", "fluoro", "nitro", "amino", "hydroxy", "methyl", "methoxy", "cyano", "iodo", "ethyl", "isopropyl", "trifluoromethyl", "acetyl"];
  const out: string[] = [];
  for (const parent of parents) {
    for (const sub of subs) {
      for (const pos of [2, 3, 4]) out.push(`${pos}-${sub}${parent}`);
    }
  }
  return uniq(out);
}

function genPolycyclicAromatics(): string[] {
  return [
    "naphthalene", "1-methylnaphthalene", "2-methylnaphthalene", "1-naphthol", "2-naphthol",
    "anthracene", "phenanthrene", "pyrene", "biphenyl", "9-fluorenone", "azulene",
  ];
}

// --- Stereochemistry: R/S pairs on genuine stereocenters -------------------
// Only applied to internal (non-terminal, non-exact-middle-of-a-symmetric-
// chain) halide/alcohol positions, which is where a real stereocenter
// exists — matches the fix note's explicit "basic stereochemistry
// examples" scope for Orgo 1.
function genStereoisomerPairs(): string[] {
  const out: string[] = [];
  for (let n = 4; n <= 12; n++) {
    for (let p = 2; p < n; p++) {
      if (p === n - p + 1) continue; // symmetric chain midpoint isn't a stereocenter
      for (const halo of HALOGEN_PREFIXES) {
        out.push(`(R)-${p}-${halo}${alkaneName(n)}`, `(S)-${p}-${halo}${alkaneName(n)}`);
      }
      out.push(`(R)-${p}-${ALKANE_STEMS[n]}anol`, `(S)-${p}-${ALKANE_STEMS[n]}anol`);
    }
  }
  out.push(
    "(R)-alanine", "(S)-alanine", "(R)-lactic acid", "(S)-lactic acid",
    "(R)-glyceraldehyde", "(S)-glyceraldehyde", "(2R,3R)-tartaric acid", "(2S,3S)-tartaric acid",
    "meso-tartaric acid", "meso-2,3-dibromobutane", "(2R,3S)-2,3-dibromobutane"
  );
  return uniq(out);
}

// --- Amino acids, peptides, sugars, nucleic-acid components ---------------
function genAminoAcids(): string[] {
  return [
    "glycine", "alanine", "valine", "leucine", "isoleucine", "proline", "phenylalanine",
    "tryptophan", "methionine", "serine", "threonine", "cysteine", "tyrosine", "asparagine",
    "glutamine", "aspartic acid", "glutamic acid", "lysine", "arginine", "histidine",
  ];
}

function genPeptidesAndSugars(): string[] {
  return [
    "glycylglycine", "alanylglycine", "glycylalanine", "diglycine",
    "glucose", "fructose", "galactose", "mannose", "ribose", "deoxyribose",
    "xylose", "arabinose", "allose", "altrose", "gulose", "idose", "talose",
    "sucrose", "lactose", "maltose", "cellobiose",
  ];
}

function genNucleicAcidComponents(): string[] {
  return [
    "adenine", "guanine", "cytosine", "thymine", "uracil",
    "adenosine", "guanosine", "cytidine", "thymidine", "uridine",
    "adenosine monophosphate", "adenosine diphosphate", "adenosine triphosphate",
    "guanosine monophosphate", "cyclic adenosine monophosphate",
  ];
}

function genLipidsAndNaturalProducts(): string[] {
  return [
    "cholesterol", "testosterone", "estradiol", "cortisone", "progesterone",
    "menthol", "camphor", "eugenol", "limonene", "vanillin", "caffeine",
    "aspirin", "ibuprofen", "acetaminophen", "nicotine", "capsaicin",
    "cinnamaldehyde", "carvone", "thymol", "geraniol",
  ];
}

// --- Gen Chem inorganics: elements, oxides, acids, bases, salts -----------
function genInorganics(): string[] {
  const out: string[] = [
    "hydrogen", "nitrogen", "oxygen", "fluorine", "chlorine", "bromine", "iodine",
    "helium", "neon", "argon", "krypton", "xenon", "white phosphorus", "sulfur",
    "carbon monoxide", "carbon dioxide", "nitric oxide", "nitrogen dioxide", "nitrous oxide",
    "dinitrogen trioxide", "dinitrogen tetroxide", "dinitrogen pentoxide",
    "sulfur dioxide", "sulfur trioxide", "phosphorus pentoxide",
    "aluminum oxide", "iron(III) oxide", "iron(II,III) oxide", "copper(II) oxide", "copper(I) oxide",
    "zinc oxide", "magnesium oxide", "calcium oxide", "sodium oxide", "potassium oxide",
    "silicon dioxide", "titanium dioxide", "manganese dioxide", "chromium(III) oxide",
    "nickel(II) oxide", "lead(II) oxide", "lead(IV) oxide", "tin(IV) oxide",
    "hydrochloric acid", "hydrobromic acid", "hydrofluoric acid", "hydroiodic acid",
    "sulfuric acid", "sulfurous acid", "nitric acid", "nitrous acid", "phosphoric acid",
    "phosphorous acid", "carbonic acid", "hypochlorous acid", "chlorous acid", "chloric acid",
    "perchloric acid", "acetic acid", "hydrogen sulfide", "hydrocyanic acid",
    "sodium hydroxide", "potassium hydroxide", "lithium hydroxide", "calcium hydroxide",
    "magnesium hydroxide", "barium hydroxide", "aluminum hydroxide", "iron(III) hydroxide",
    "copper(II) hydroxide", "zinc hydroxide", "ammonia", "ammonium hydroxide", "cesium hydroxide",
    "sodium bicarbonate", "calcium carbonate", "potassium permanganate", "potassium dichromate",
    "silver nitrate", "lead(II) iodide", "barium sulfate", "copper(II) sulfate", "epsom salt",
    "gypsum", "sodium chloride", "potassium chloride", "sodium sulfate", "ammonium chloride",
    "ammonium nitrate", "sodium nitrate", "potassium nitrate", "sodium carbonate",
    "calcium chloride", "magnesium sulfate", "iron(III) chloride", "iron(II) chloride",
  ];

  const cations = [
    "lithium", "sodium", "potassium", "ammonium", "magnesium", "calcium", "strontium",
    "barium", "aluminum", "iron(II)", "iron(III)", "copper(I)", "copper(II)", "zinc",
    "silver", "lead(II)", "tin(II)", "manganese(II)", "cobalt(II)", "nickel(II)",
    "chromium(III)", "mercury(II)", "cadmium", "cesium", "rubidium",
  ];
  const anions = [
    "chloride", "bromide", "fluoride", "iodide", "sulfate", "sulfite", "nitrate", "nitrite",
    "carbonate", "bicarbonate", "phosphate", "hydrogen phosphate", "dihydrogen phosphate",
    "sulfide", "cyanide", "acetate", "perchlorate", "chromate", "dichromate", "permanganate",
    "oxalate", "thiosulfate", "hypochlorite", "chlorite", "chlorate", "silicate", "borate",
  ];
  for (const cation of cations) {
    for (const anion of anions) out.push(`${cation} ${anion}`);
  }

  return uniq(out);
}

function genCoordinationComplexes(): string[] {
  return [
    "hexaamminecobalt(III) chloride", "tetraamminecopper(II) sulfate", "potassium ferrocyanide",
    "potassium ferricyanide", "cisplatin", "potassium tetrachloroplatinate(II)",
    "hexaaquairon(II) sulfate", "sodium hexafluoroaluminate", "ammonium hexachloroplatinate(IV)",
    "tris(ethylenediamine)cobalt(III) chloride", "diamminesilver(I) nitrate",
    "potassium hexacyanoferrate(III)", "sodium cobaltinitrite", "hexaamminenickel(II) chloride",
    "tetraamminezinc(II) sulfate", "pentaamminechlorocobalt(III) chloride",
    "sodium ethylenediaminetetraacetate", "calcium disodium EDTA", "ferrocene", "vanadocene dichloride",
  ];
}

function genNamedReactionReagents(): string[] {
  const grignardR = ["methyl", "ethyl", "propyl", "isopropyl", "butyl", "phenyl", "vinyl", "benzyl"];
  const out: string[] = [];
  for (const r of grignardR) {
    out.push(`${r}magnesium bromide`, `${r}magnesium chloride`, `${r}lithium`);
  }
  out.push(
    "sodium borohydride", "lithium aluminum hydride", "diisobutylaluminum hydride",
    "pyridinium chlorochromate", "pyridinium dichromate", "meta-chloroperoxybenzoic acid",
    "osmium tetroxide", "ozone", "borane", "9-borabicyclo[3.3.1]nonane",
    "N-bromosuccinimide", "N-chlorosuccinimide", "phosphorus tribromide", "phosphorus trichloride",
    "phosphorus pentachloride", "thionyl chloride", "phosphoryl chloride", "tosyl chloride",
    "methanesulfonyl chloride", "dicyclohexylcarbodiimide", "Dess-Martin periodinane",
    "methylenetriphenylphosphorane", "Tollens' reagent", "chlorotrimethylsilane",
    "tert-butyldimethylsilyl chloride", "di-tert-butyl dicarbonate", "benzyl chloroformate",
    "acetic anhydride", "benzoyl chloride", "para-toluenesulfonic acid",
  );
  return uniq(out);
}

function genDielsAlderSubstrates(): string[] {
  return [
    "1,3-butadiene", "cyclopentadiene", "2,3-dimethyl-1,3-butadiene", "isoprene",
    "maleic anhydride", "acrylonitrile", "methyl acrylate", "ethyl acrylate", "acrolein",
    "fumaric acid", "maleic acid", "tetracyanoethylene", "dimethyl fumarate", "dimethyl maleate",
    "1,4-benzoquinone", "N-phenylmaleimide", "furan", "anthracene",
  ];
}

export function generateCompoundList(): string[] {
  const all = [
    ...genAlkanes(),
    ...genCycloalkanes(),
    ...genHaloalkanes(),
    ...genAlcohols(),
    ...genEthers(),
    ...genAlkenes(),
    ...genAlkynes(),
    ...genAmines(),
    ...genAldehydes(),
    ...genKetones(),
    ...genCarboxylicAcids(),
    ...genEsters(),
    ...genAmides(),
    ...genSubstitutedBenzenes(),
    ...genTrivialParentSubstituted(),
    ...genPolycyclicAromatics(),
    ...genStereoisomerPairs(),
    ...genAminoAcids(),
    ...genPeptidesAndSugars(),
    ...genNucleicAcidComponents(),
    ...genLipidsAndNaturalProducts(),
    ...genInorganics(),
    ...genCoordinationComplexes(),
    ...genNamedReactionReagents(),
    ...genDielsAlderSubstrates(),
  ];
  return uniq(all);
}

// Standalone run: print the count and category breakdown so the real
// number (not an estimate) is visible before the expensive fetch pass runs.
if (import.meta.url === `file://${process.argv[1]}`) {
  const categories: [string, () => string[]][] = [
    ["alkanes", genAlkanes], ["cycloalkanes", genCycloalkanes], ["haloalkanes", genHaloalkanes],
    ["alcohols", genAlcohols], ["ethers", genEthers], ["alkenes", genAlkenes], ["alkynes", genAlkynes],
    ["amines", genAmines], ["aldehydes", genAldehydes], ["ketones", genKetones],
    ["carboxylic acids", genCarboxylicAcids], ["esters", genEsters], ["amides", genAmides],
    ["substituted benzenes", genSubstitutedBenzenes], ["trivial-parent aromatics", genTrivialParentSubstituted],
    ["polycyclic aromatics", genPolycyclicAromatics], ["stereoisomer pairs", genStereoisomerPairs],
    ["amino acids", genAminoAcids], ["peptides/sugars", genPeptidesAndSugars],
    ["nucleic acid components", genNucleicAcidComponents], ["lipids/natural products", genLipidsAndNaturalProducts],
    ["inorganics/salts", genInorganics], ["coordination complexes", genCoordinationComplexes],
    ["named-reaction reagents", genNamedReactionReagents], ["Diels-Alder substrates", genDielsAlderSubstrates],
  ];
  let total = 0;
  for (const [label, fn] of categories) {
    const count = fn().length;
    total += count;
    console.log(`${label.padEnd(28)} ${count}`);
  }
  const deduped = generateCompoundList();
  console.log(`\nSum across categories (pre-global-dedup): ${total}`);
  console.log(`Final unique candidate count: ${deduped.length}`);
}
