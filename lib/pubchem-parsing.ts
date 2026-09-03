// Pure PubChem name-resolution, fetch, and geometry logic — deliberately NO
// "server-only" guard, unlike lib/pubchem-client.ts. Split out specifically
// so the offline curriculum-library builder (scripts/build-curriculum-library.mts)
// can reuse the exact same resolveCid/fetchSdf/parseSdf/promoteTo3DGeometry
// logic as the live app path, rather than a hand-duplicated copy that could
// silently drift. lib/pubchem-client.ts imports all of this and adds only
// the Firestore-cache-specific glue (which does stay server-only-guarded).
const PUBCHEM_BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

// NCBI's own usage policy for PUG REST/E-utilities asks API consumers to
// self-identify via a descriptive User-Agent (or tool/email params).
export const PUBCHEM_REQUEST_HEADERS = {
  "User-Agent": "NorthVector/1.0 (personal voice assistant hologram feature; contact: nishadbasrur@gmail.com)",
};

// See lib/pubchem-client.ts's git history for the full context on why this
// retry schedule exists (Cloud Run's shared egress IP intermittently gets
// PUGREST.ServerBusy from PubChem, confirmed via production logs).
const RETRY_DELAYS_MS = [1500, 3500];

export async function fetchWithRetry(url: string): Promise<Response> {
  let response = await fetch(url, { headers: PUBCHEM_REQUEST_HEADERS });

  for (const delayMs of RETRY_DELAYS_MS) {
    if (response.ok) return response;
    const body = await response
      .clone()
      .text()
      .catch(() => "(no body)");
    console.warn(
      `[pubchem-parsing] Request to ${url} returned ${response.status} (${body.slice(0, 150)}) — retrying after ${delayMs}ms.`
    );
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    response = await fetch(url, { headers: PUBCHEM_REQUEST_HEADERS });
  }

  return response;
}

export type PubChemAtom = { element: string; x: number; y: number; z: number };
export type PubChemBond = { a: number; b: number; order: number };
export type PubChemStructure = { atoms: PubChemAtom[]; bonds: PubChemBond[] };

export async function resolveCid(name: string): Promise<number | null> {
  try {
    const url = `${PUBCHEM_BASE_URL}/compound/name/${encodeURIComponent(name)}/cids/JSON`;
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      const body = await response.text().catch(() => "(no body)");
      console.warn(`[pubchem-parsing] CID lookup returned ${response.status} for "${name}": ${body.slice(0, 300)}`);
      return null;
    }
    const data = (await response.json()) as { IdentifierList?: { CID?: number[] } };
    const cid = data.IdentifierList?.CID?.[0];
    return typeof cid === "number" ? cid : null;
  } catch (error) {
    console.error(`[pubchem-parsing] CID lookup failed for "${name}":`, error);
    return null;
  }
}

export async function fetchSdf(cid: number, recordType: "3d" | "2d"): Promise<string | null> {
  try {
    const url = `${PUBCHEM_BASE_URL}/compound/cid/${cid}/record/SDF?record_type=${recordType}`;
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      const body = await response.text().catch(() => "(no body)");
      console.warn(`[pubchem-parsing] SDF fetch returned ${response.status} for CID ${cid} (${recordType}): ${body.slice(0, 300)}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`[pubchem-parsing] SDF fetch failed for CID ${cid} (${recordType}):`, error);
    return null;
  }
}

// Minimal V2000 molfile parser — column layout confirmed directly against
// real PubChem SDF output (ethanol CID 702, glucose CID 5793).
export function parseSdf(sdf: string): PubChemStructure | null {
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
    if (line === undefined) break;
    const a = parseInt(line.slice(0, 3).trim(), 10);
    const b = parseInt(line.slice(3, 6).trim(), 10);
    const order = parseInt(line.slice(6, 9).trim(), 10);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(order)) continue;
    bonds.push({ a: a - 1, b: b - 1, order });
  }

  return { atoms, bonds };
}

// --- Idealized-geometry promotion for 2D-only records --------------------
const CENTRAL_ATOM_ELEMENTS = new Set([
  "SC", "TI", "V", "CR", "MN", "FE", "CO", "NI", "CU", "ZN",
  "Y", "ZR", "NB", "MO", "TC", "RU", "RH", "PD", "AG", "CD",
  "LA", "HF", "TA", "W", "RE", "OS", "IR", "PT", "AU", "HG",
  "AL", "SN", "SB", "PB", "BI",
]);

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

const MAX_COORDINATION_NUMBER = 6;
const NEIGHBOR_GAP_RATIO = 1.25;

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

export function promoteTo3DGeometry(structure: PubChemStructure): PubChemStructure {
  const centerIdx = findCoordinationCenter(structure);
  if (centerIdx === null) return structure;

  const neighbors = findDirectNeighbors(structure, centerIdx);
  const template = IDEAL_GEOMETRY[neighbors.length];
  if (!template) {
    console.log(
      `[pubchem-parsing] Coordination number ${neighbors.length} at atom ${centerIdx} (${structure.atoms[centerIdx].element}) has no idealized template — leaving 2D layout as-is.`
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
    const visited = new Set<number>([centerIdx, n]);
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
    `[pubchem-parsing] Promoted atom ${centerIdx} (${center.element}) to idealized CN-${neighbors.length} geometry.`
  );
  return { atoms: newAtoms, bonds: structure.bonds };
}
