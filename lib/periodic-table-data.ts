// Chemistry reference data for the hologram's subatomic reveal and
// electron-shell views (see app/sandbox/hologram-panel.tsx). No
// "server-only" guard — this is pure static data, safe to import from a
// client component (same category as lib/visual-scanner.ts).
//
// Covers H (Z=1) through Kr (Z=36) — everything Gen Chem touches,
// including the transition metals already exercised by the hologram's
// coordination-geometry work (Fe, Zn, Ag, etc. — see
// lib/pubchem-client.ts).
//
// shells is the standard simplified Bohr-model electron configuration
// (shell capacities 2, 8, 8, 18, ...) — the right level of accuracy for
// Gen Chem, not true quantum orbital shapes, same scoping decision
// already made for the idealized VSEPR/coordination geometry in
// lib/pubchem-client.ts. Includes the two classic exceptions where the
// real (and standardly-taught) configuration deviates from naive shell-
// filling order: chromium (2,8,13,1, not 2,8,12,2) and copper
// (2,8,18,1, not 2,8,17,2), both due to the real stability of a half-
// filled or fully-filled 3d subshell.
//
// atomicMass is the standard atomic weight — neutron count is derived
// from it at use time (Math.round(atomicMass) - atomicNumber), not
// stored directly, so there's one source of truth per element rather
// than two numbers that could silently drift apart.

export type ElementData = {
  symbol: string;
  atomicNumber: number;
  atomicMass: number;
  shells: number[];
};

export const PERIODIC_TABLE: Record<string, ElementData> = {
  H: { symbol: "H", atomicNumber: 1, atomicMass: 1.008, shells: [1] },
  HE: { symbol: "He", atomicNumber: 2, atomicMass: 4.003, shells: [2] },
  LI: { symbol: "Li", atomicNumber: 3, atomicMass: 6.941, shells: [2, 1] },
  BE: { symbol: "Be", atomicNumber: 4, atomicMass: 9.012, shells: [2, 2] },
  B: { symbol: "B", atomicNumber: 5, atomicMass: 10.811, shells: [2, 3] },
  C: { symbol: "C", atomicNumber: 6, atomicMass: 12.011, shells: [2, 4] },
  N: { symbol: "N", atomicNumber: 7, atomicMass: 14.007, shells: [2, 5] },
  O: { symbol: "O", atomicNumber: 8, atomicMass: 15.999, shells: [2, 6] },
  F: { symbol: "F", atomicNumber: 9, atomicMass: 18.998, shells: [2, 7] },
  NE: { symbol: "Ne", atomicNumber: 10, atomicMass: 20.18, shells: [2, 8] },
  NA: { symbol: "Na", atomicNumber: 11, atomicMass: 22.99, shells: [2, 8, 1] },
  MG: { symbol: "Mg", atomicNumber: 12, atomicMass: 24.305, shells: [2, 8, 2] },
  AL: { symbol: "Al", atomicNumber: 13, atomicMass: 26.982, shells: [2, 8, 3] },
  SI: { symbol: "Si", atomicNumber: 14, atomicMass: 28.086, shells: [2, 8, 4] },
  P: { symbol: "P", atomicNumber: 15, atomicMass: 30.974, shells: [2, 8, 5] },
  S: { symbol: "S", atomicNumber: 16, atomicMass: 32.065, shells: [2, 8, 6] },
  CL: { symbol: "Cl", atomicNumber: 17, atomicMass: 35.453, shells: [2, 8, 7] },
  AR: { symbol: "Ar", atomicNumber: 18, atomicMass: 39.948, shells: [2, 8, 8] },
  K: { symbol: "K", atomicNumber: 19, atomicMass: 39.098, shells: [2, 8, 8, 1] },
  CA: { symbol: "Ca", atomicNumber: 20, atomicMass: 40.078, shells: [2, 8, 8, 2] },
  SC: { symbol: "Sc", atomicNumber: 21, atomicMass: 44.956, shells: [2, 8, 9, 2] },
  TI: { symbol: "Ti", atomicNumber: 22, atomicMass: 47.867, shells: [2, 8, 10, 2] },
  V: { symbol: "V", atomicNumber: 23, atomicMass: 50.942, shells: [2, 8, 11, 2] },
  CR: { symbol: "Cr", atomicNumber: 24, atomicMass: 51.996, shells: [2, 8, 13, 1] }, // exception — see module comment
  MN: { symbol: "Mn", atomicNumber: 25, atomicMass: 54.938, shells: [2, 8, 13, 2] },
  FE: { symbol: "Fe", atomicNumber: 26, atomicMass: 55.845, shells: [2, 8, 14, 2] },
  CO: { symbol: "Co", atomicNumber: 27, atomicMass: 58.933, shells: [2, 8, 15, 2] },
  NI: { symbol: "Ni", atomicNumber: 28, atomicMass: 58.693, shells: [2, 8, 16, 2] },
  CU: { symbol: "Cu", atomicNumber: 29, atomicMass: 63.546, shells: [2, 8, 18, 1] }, // exception — see module comment
  ZN: { symbol: "Zn", atomicNumber: 30, atomicMass: 65.38, shells: [2, 8, 18, 2] },
  GA: { symbol: "Ga", atomicNumber: 31, atomicMass: 69.723, shells: [2, 8, 18, 3] },
  GE: { symbol: "Ge", atomicNumber: 32, atomicMass: 72.63, shells: [2, 8, 18, 4] },
  AS: { symbol: "As", atomicNumber: 33, atomicMass: 74.922, shells: [2, 8, 18, 5] },
  SE: { symbol: "Se", atomicNumber: 34, atomicMass: 78.971, shells: [2, 8, 18, 6] },
  BR: { symbol: "Br", atomicNumber: 35, atomicMass: 79.904, shells: [2, 8, 18, 7] },
  KR: { symbol: "Kr", atomicNumber: 36, atomicMass: 83.798, shells: [2, 8, 18, 8] },
};

export function lookupElement(symbol: string): ElementData | null {
  return PERIODIC_TABLE[symbol.toUpperCase()] ?? null;
}

// Real neutron count is isotope-specific (most elements are a mix of
// isotopes) — this derives a single representative value from the
// standard atomic weight, per the fix note's own instruction ("neutron
// count from each element's standard atomic mass"), not a real isotopic
// survey. Close enough to be chemically real for a stylized nucleus, not
// a claim about any specific isotope.
export function neutronCount(element: ElementData): number {
  return Math.round(element.atomicMass) - element.atomicNumber;
}
