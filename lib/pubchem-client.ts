import "server-only";

// Feeds real molecular geometry into Tier 2's hologram takeover (see
// lib/tool-dispatcher.ts's handlePushToScreen and
// app/sandbox/hologram-panel.tsx) — resolves a compound name (e.g.
// "caffeine") to real atom positions and bonds via PubChem's public PUG
// REST API, no API key required. Next.js-only, not shared with the Cloud
// Functions runtime (same category as lib/wolfram-client.ts), so the
// "server-only" guard here is safe.
const PUBCHEM_BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

export type PubChemAtom = { element: string; x: number; y: number; z: number };
export type PubChemBond = { a: number; b: number; order: number };
export type PubChemStructure = { atoms: PubChemAtom[]; bonds: PubChemBond[] };

async function resolveCid(name: string): Promise<number | null> {
  try {
    const url = `${PUBCHEM_BASE_URL}/compound/name/${encodeURIComponent(name)}/cids/JSON`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[pubchem-client] CID lookup returned ${response.status} for "${name}"`);
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
    const response = await fetch(url);
    if (!response.ok) return null;
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

// Resolves a compound name to real 3D geometry — name -> CID -> SDF (3D
// conformer, falling back to 2D if PubChem has no 3D conformer for this
// compound, which happens for some ionic/salt/very simple compounds) ->
// parsed {atoms, bonds}. Fail-soft throughout, same pattern as
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

  const structure = parseSdf(sdf);
  if (!structure) {
    console.warn(`[pubchem-client] Failed to parse SDF for CID ${cid} ("${name}")`);
    return null;
  }

  console.log(
    `[pubchem-client] Resolved "${name}" -> CID ${cid}, ${usedRecordType} structure, ` +
      `${structure.atoms.length} atoms, ${structure.bonds.length} bonds`
  );
  return structure;
}
