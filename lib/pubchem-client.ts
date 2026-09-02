import "server-only";

// Feeds real molecular geometry into Tier 2's hologram takeover (see
// lib/tool-dispatcher.ts's handlePushToScreen and
// app/sandbox/hologram-panel.tsx) — resolves a compound name (e.g.
// "caffeine") to real atom positions and bonds via PubChem's public PUG
// REST API, no API key required. Next.js-only, not shared with the Cloud
// Functions runtime (same category as lib/wolfram-client.ts), so the
// "server-only" guard here is safe.
const PUBCHEM_BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

// NCBI's own usage policy for PUG REST/E-utilities asks API consumers to
// self-identify via a descriptive User-Agent (or tool/email params) —
// requests with none are exactly what their anti-abuse layer is tuned to
// throttle/reject, and Cloud Run's shared/ephemeral egress IPs are a
// classic trigger for it. Confirmed live: every single production request
// (bare `fetch()`, no headers) failed with a 503 from PubChem across many
// attempts over 11+ hours, while the identical request from a residential
// IP with a normal browser/curl User-Agent succeeded every time — not a
// transient blip, a systematic rejection of unidentified traffic from this
// server's network path specifically.
const PUBCHEM_REQUEST_HEADERS = {
  "User-Agent": "NorthVector/1.0 (personal voice assistant hologram feature; contact: nishadbasrur@gmail.com)",
};

// One retry after a short delay — cheap insurance against genuine
// transient NCBI-side load (a real, occasionally-documented occurrence
// independent of the identification issue above), not a fix for a hard
// block on its own.
const RETRY_DELAY_MS = 800;

async function fetchWithRetry(url: string): Promise<Response> {
  const first = await fetch(url, { headers: PUBCHEM_REQUEST_HEADERS });
  if (first.ok) return first;
  console.warn(`[pubchem-client] Request to ${url} returned ${first.status} — retrying once after ${RETRY_DELAY_MS}ms.`);
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  return fetch(url, { headers: PUBCHEM_REQUEST_HEADERS });
}

export type PubChemAtom = { element: string; x: number; y: number; z: number };
export type PubChemBond = { a: number; b: number; order: number };
export type PubChemStructure = { atoms: PubChemAtom[]; bonds: PubChemBond[] };

async function resolveCid(name: string): Promise<number | null> {
  try {
    const url = `${PUBCHEM_BASE_URL}/compound/name/${encodeURIComponent(name)}/cids/JSON`;
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      const body = await response.text().catch(() => "(no body)");
      console.warn(`[pubchem-client] CID lookup returned ${response.status} for "${name}": ${body.slice(0, 300)}`);
      return null;
    }
    const data = (await response.json()) as { IdentifierList?: { CID?: number[] } };
    const cid = data.IdentifierList?.CID?.[0];
    return typeof cid === "number" ? cid : null;
  } catch (error) {
    console.error(`[pubchem-client] CID lookup failed for "${name}":`, error);
    return null;
  }
}

async function fetchSdf(cid: number, recordType: "3d" | "2d"): Promise<string | null> {
  try {
    const url = `${PUBCHEM_BASE_URL}/compound/cid/${cid}/record/SDF?record_type=${recordType}`;
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      const body = await response.text().catch(() => "(no body)");
      console.warn(`[pubchem-client] SDF fetch returned ${response.status} for CID ${cid} (${recordType}): ${body.slice(0, 300)}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`[pubchem-client] SDF fetch failed for CID ${cid} (${recordType}):`, error);
    return null;
  }
}

// Minimal V2000 molfile parser — an SDF record is a molfile (4 header
// lines, then a fixed-width atom block, then a fixed-width bond block)
// followed by a "> <PROPERTY>" data block this function never reads.
// Column layout confirmed directly against real PubChem SDF output
// (ethanol CID 702, glucose CID 5793) rather than assumed from the spec
// alone: counts line has atom count in cols 0-3 and bond count in cols
// 3-6; each atom line has x/y/z in three 10-char fields (cols 0-30) then
// a space then the element symbol left-justified in cols 31-34; each bond
// line has the two 1-indexed atom numbers in 3-char fields (cols 0-3,
// 3-6) then the bond order in cols 6-9. See the CTfile/molfile V2000 spec
// for the full field layout (most of which — charge, stereo, etc. — this
// ignores; only geometry and connectivity matter for the hologram).
function parseSdf(sdf: string): PubChemStructure | null {
  const lines = sdf.split("\n");
  if (lines.length < 4) return null;

  const countsLine = lines[3];
  const atomCount = parseInt(countsLine.slice(0, 3).trim(), 10);
  const bondCount = parseInt(countsLine.slice(3, 6).trim(), 10);
  if (!Number.isFinite(atomCount) || atomCount <= 0 || !Number.isFinite(bondCount) || bondCount < 0) {
    return null;
  }

  const atoms: PubChemAtom[] = [];
  for (let i = 0; i < atomCount; i++) {
    const line = lines[4 + i];
    if (line === undefined) return null;
    const x = parseFloat(line.slice(0, 10));
    const y = parseFloat(line.slice(10, 20));
    const z = parseFloat(line.slice(20, 30));
    const element = line.slice(31, 34).trim();
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !element) return null;
    atoms.push({ element, x, y, z });
  }

  const bonds: PubChemBond[] = [];
  for (let i = 0; i < bondCount; i++) {
    const line = lines[4 + atomCount + i];
    if (line === undefined) break; // malformed bond block shouldn't discard already-parsed atoms
    const a = parseInt(line.slice(0, 3).trim(), 10);
    const b = parseInt(line.slice(3, 6).trim(), 10);
    const order = parseInt(line.slice(6, 9).trim(), 10);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(order)) continue;
    bonds.push({ a: a - 1, b: b - 1, order }); // molfile atom numbers are 1-indexed; atoms[] is 0-indexed
  }

  return { atoms, bonds };
}

// --- Idealized-geometry promotion for 2D-only records --------------------
//
// PubChem's 2D depictions are flat (z=0) by construction — fine for an
// organic molecule where the *relative* 2D layout still reads sensibly in
// 3D, but actively wrong for an inorganic coordination complex, where the
// entire pedagogical point (octahedral vs. tetrahedral vs. trigonal
// bipyramidal, etc.) is a 3D angular arrangement a flat projection can
// never show. This promotes a 2D record's coordination sphere to a real
// idealized 3D geometry (VSEPR/coordination templates) whenever a
// recognizable coordination center is found, purely as a display
// approximation — not a real conformer. Only ever runs for 2D records;
// real 3D PubChem data is never touched (see fetchPubChemStructure below).

// d-block transition metals plus a handful of common non-d-block
// "coordination center" elements from Gen Chem examples (Al, Sn, Sb, Pb,
// Bi complexes are standard VSEPR teaching cases too). Deliberately not
// exhaustive (no lanthanides/actinides) — this only needs to cover the
// compounds this feature is realistically asked to render.
const CENTRAL_ATOM_ELEMENTS = new Set([
  "SC", "TI", "V", "CR", "MN", "FE", "CO", "NI", "CU", "ZN",
  "Y", "ZR", "NB", "MO", "TC", "RU", "RH", "PD", "AG", "CD",
  "LA", "HF", "TA", "W", "RE", "OS", "IR", "PT", "AU", "HG",
  "AL", "SN", "SB", "PB", "BI",
]);

// Idealized unit-vector templates, keyed by coordination number. Every
// listed CN gets a documented VSEPR-standard geometry EXCEPT 4, which
// defaults to tetrahedral (109.5°) — square planar is the known ambiguity
// here (distinguishing the two from bond count alone needs d-electron
// count, which isn't recoverable from a bare connection table), called
// out here rather than silently guessing at a more elaborate heuristic.
const IDEAL_GEOMETRY: Record<number, [number, number, number][]> = {
  2: [
    [1, 0, 0],
    [-1, 0, 0],
  ],
  3: [0, 1, 2].map((k) => trigDirection(k, 3)) as [number, number, number][],
  4: (
    [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
    ] as [number, number, number][]
  ).map(normalize3) as [number, number, number][],
  5: [
    [0, 0, 1],
    [0, 0, -1],
    ...([0, 1, 2].map((k) => trigDirection(k, 3)) as [number, number, number][]),
  ],
  6: [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ],
};

function trigDirection(k: number, count: number): [number, number, number] {
  const angle = (2 * Math.PI * k) / count;
  return [Math.cos(angle), Math.sin(angle), 0];
}

function normalize3(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
  return len === 0 ? v : [v[0] / len, v[1] / len, v[2] / len];
}

function distance3(a: PubChemAtom, b: PubChemAtom): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

// The largest coordination number this module has a template for — also
// used as a hard cap on the spatial-proximity fallback below, so it never
// proposes a coordination number nothing here can act on.
const MAX_COORDINATION_NUMBER = 6;
// How much farther the NEXT atom out has to be (as a ratio) before it's
// treated as outside the coordination shell, when falling back to
// distance-based clustering. 1.25 comfortably separates real cases seen
// live (potassium ferrocyanide: the 6 coordinating carbons all sit at
// exactly 1.000 from Fe, with every other atom — including the spectator
// K+ ions — at 1.732 or farther, a 73% jump) without being so tight that
// minor bond-length variation within a real coordination shell (e.g.
// slightly different M-N vs. M-O distances in a mixed-ligand complex)
// falsely triggers a cut partway through the real shell.
const NEIGHBOR_GAP_RATIO = 1.25;

// Finds the atoms directly coordinated to `centerIdx`. Tries the formal
// bond list first (some SDFs do encode metal-ligand bonds directly — see
// ammonium tetrachlorozincate's real Zn-Cl bonds, CID 61754). Falls back
// to spatial-proximity clustering when the center has zero formal bonds,
// which is common for PubChem's depiction of coordination complexes as
// ionic salts — confirmed live against potassium ferrocyanide (CID
// 9605257), where Fe has zero bonds in the connection table despite six
// real coordinating carbons.
function findDirectNeighbors(structure: PubChemStructure, centerIdx: number): number[] {
  const bonded = new Set<number>();
  for (const bond of structure.bonds) {
    if (bond.a === centerIdx) bonded.add(bond.b);
    else if (bond.b === centerIdx) bonded.add(bond.a);
  }
  if (bonded.size > 0) return [...bonded];

  const center = structure.atoms[centerIdx];
  const others = structure.atoms
    .map((atom, i) => ({ i, d: distance3(atom, center) }))
    // Hydrogen is never a coordinating/donor atom in real coordination
    // chemistry — without this exclusion, a ligand's own substituent
    // hydrogens (e.g. an NH3 ligand's H atoms) can end up geometrically
    // closer to the metal than the real donor atom in an arbitrary 2D
    // depiction, and win the proximity race. Confirmed live against
    // diamminesilver(I) (CID 5460738): without this filter, two of
    // ammonia's own H atoms out-distanced the real N donor and produced
    // a wrong CN-6 guess instead of the correct CN-2 linear geometry.
    .filter((o) => o.i !== centerIdx && structure.atoms[o.i].element.toUpperCase() !== "H")
    .sort((a, b) => a.d - b.d);
  if (others.length === 0) return [];

  let cut = Math.min(others.length, MAX_COORDINATION_NUMBER);
  for (let k = 1; k < cut; k++) {
    if (others[k].d / others[k - 1].d > NEIGHBOR_GAP_RATIO) {
      cut = k;
      break;
    }
  }
  return others.slice(0, cut).map((o) => o.i);
}

// Picks the coordination center: the CENTRAL_ATOM_ELEMENTS atom with the
// most direct neighbors (see findDirectNeighbors). Handles the common
// case (exactly one central-atom-eligible element present) trivially;
// for a compound with more than one (rare for what this feature is
// realistically asked to render), this is a simple heuristic, not a real
// polynuclear-complex solver. Returns null when no eligible element is
// present at all, in which case the caller leaves the 2D layout untouched.
function findCoordinationCenter(structure: PubChemStructure): number | null {
  const candidates = structure.atoms
    .map((atom, i) => ({ i, element: atom.element.toUpperCase() }))
    .filter((a) => CENTRAL_ATOM_ELEMENTS.has(a.element));
  if (candidates.length === 0) return null;

  let best = candidates[0].i;
  let bestCount = -1;
  for (const { i } of candidates) {
    const count = findDirectNeighbors(structure, i).length;
    if (count > bestCount) {
      bestCount = count;
      best = i;
    }
  }
  return best;
}

// Greedily assigns each neighbor's ORIGINAL direction from the center to
// the closest still-unused idealized direction (by dot product), highest-
// similarity pairs first. Not a globally optimal assignment, but doesn't
// need to be — the point is picking a sensible correspondence so a
// ligand ends up near where its 2D depiction already suggested, not
// finding the mathematically best one.
function assignIdealDirections(
  originalDirs: [number, number, number][],
  idealDirs: [number, number, number][]
): number[] {
  const pairs: { n: number; g: number; dot: number }[] = [];
  for (let n = 0; n < originalDirs.length; n++) {
    for (let g = 0; g < idealDirs.length; g++) {
      const dot =
        originalDirs[n][0] * idealDirs[g][0] +
        originalDirs[n][1] * idealDirs[g][1] +
        originalDirs[n][2] * idealDirs[g][2];
      pairs.push({ n, g, dot });
    }
  }
  pairs.sort((a, b) => b.dot - a.dot);

  const assignment: number[] = new Array(originalDirs.length).fill(-1);
  const usedG = new Set<number>();
  let assignedCount = 0;
  for (const p of pairs) {
    if (assignment[p.n] !== -1 || usedG.has(p.g)) continue;
    assignment[p.n] = p.g;
    usedG.add(p.g);
    assignedCount++;
    if (assignedCount === originalDirs.length) break;
  }
  return assignment;
}

// Repositions the coordination center's direct neighbors onto an
// idealized VSEPR/coordination geometry (same bond length as the 2D
// data, only the direction changes), then carries each ligand's own
// substituents along rigidly: anything bonded further out than the
// direct neighbor is translated by that neighbor's own offset, via a
// bond-graph walk that never crosses back through the center — so each
// ligand's internal layout stays intact, just relocated to its new 3D
// anchor point. Returns the original structure unchanged if no
// coordination center is found or its coordination number has no
// template (anything outside 2-6).
function promoteTo3DGeometry(structure: PubChemStructure): PubChemStructure {
  const centerIdx = findCoordinationCenter(structure);
  if (centerIdx === null) return structure;

  const neighbors = findDirectNeighbors(structure, centerIdx);
  const template = IDEAL_GEOMETRY[neighbors.length];
  if (!template) {
    console.log(
      `[pubchem-client] Coordination number ${neighbors.length} at atom ${centerIdx} (${structure.atoms[centerIdx].element}) has no idealized template — leaving 2D layout as-is.`
    );
    return structure;
  }

  const center = structure.atoms[centerIdx];
  const originalDirs = neighbors.map((n) => {
    const atom = structure.atoms[n];
    return normalize3([atom.x - center.x, atom.y - center.y, atom.z - center.z]);
  });
  const bondLengths = neighbors.map((n) => distance3(structure.atoms[n], center));
  const assignment = assignIdealDirections(originalDirs, template);

  const newAtoms = structure.atoms.map((atom) => ({ ...atom }));
  const offsets = new Map<number, [number, number, number]>();

  neighbors.forEach((n, idx) => {
    const dir = template[assignment[idx]];
    const bondLength = bondLengths[idx];
    const newX = center.x + dir[0] * bondLength;
    const newY = center.y + dir[1] * bondLength;
    const newZ = center.z + dir[2] * bondLength;
    offsets.set(n, [newX - newAtoms[n].x, newY - newAtoms[n].y, newZ - newAtoms[n].z]);
    newAtoms[n] = { ...newAtoms[n], x: newX, y: newY, z: newZ };
  });

  const adjacency = new Map<number, number[]>();
  for (const bond of structure.bonds) {
    if (!adjacency.has(bond.a)) adjacency.set(bond.a, []);
    if (!adjacency.has(bond.b)) adjacency.set(bond.b, []);
    adjacency.get(bond.a)!.push(bond.b);
    adjacency.get(bond.b)!.push(bond.a);
  }

  for (const n of neighbors) {
    const offset = offsets.get(n)!;
    const visited = new Set<number>([centerIdx, n]); // seed with the center too, so a real M-L bond in the graph can never route a branch back through it
    const queue = [...(adjacency.get(n) ?? [])];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      newAtoms[cur] = {
        ...newAtoms[cur],
        x: newAtoms[cur].x + offset[0],
        y: newAtoms[cur].y + offset[1],
        z: newAtoms[cur].z + offset[2],
      };
      for (const next of adjacency.get(cur) ?? []) {
        if (!visited.has(next)) queue.push(next);
      }
    }
  }

  console.log(
    `[pubchem-client] Promoted atom ${centerIdx} (${center.element}) to idealized CN-${neighbors.length} geometry.`
  );
  return { atoms: newAtoms, bonds: structure.bonds };
}

// Resolves a compound name to real 3D geometry — name -> CID -> SDF (3D
// conformer, falling back to 2D if PubChem has no 3D conformer for this
// compound, which happens for some ionic/salt/very simple compounds) ->
// parsed {atoms, bonds}, with 2D-only records additionally promoted to an
// idealized coordination geometry (see promoteTo3DGeometry above) so an
// inorganic complex's real shape shows up even without a lab-measured 3D
// conformer. Fail-soft throughout, same pattern as
// lib/wolfram-client.ts's fetchWolframImage: never throws, any failure
// (name not recognized, no structure available, malformed SDF) returns
// null. A hologram falling back to its generic placeholder shape is an
// expected, non-exceptional outcome here, not a bug that should break
// push_to_screen.
export async function fetchPubChemStructure(name: string): Promise<PubChemStructure | null> {
  const cid = await resolveCid(name);
  if (!cid) {
    console.warn(`[pubchem-client] No CID found for "${name}"`);
    return null;
  }

  let sdf = await fetchSdf(cid, "3d");
  let usedRecordType: "3d" | "2d" = "3d";
  if (!sdf) {
    sdf = await fetchSdf(cid, "2d");
    usedRecordType = "2d";
  }
  if (!sdf) {
    console.warn(`[pubchem-client] No SDF (3d or 2d) available for CID ${cid} ("${name}")`);
    return null;
  }

  let structure = parseSdf(sdf);
  if (!structure) {
    console.warn(`[pubchem-client] Failed to parse SDF for CID ${cid} ("${name}")`);
    return null;
  }

  if (usedRecordType === "2d") {
    structure = promoteTo3DGeometry(structure);
  }

  console.log(
    `[pubchem-client] Resolved "${name}" -> CID ${cid}, ${usedRecordType} structure, ` +
      `${structure.atoms.length} atoms, ${structure.bonds.length} bonds`
  );
  return structure;
}
