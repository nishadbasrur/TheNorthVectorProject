import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  resolveCid,
  fetchSdf,
  parseSdf,
  promoteTo3DGeometry,
  type PubChemStructure,
} from "./pubchem-parsing";

// Feeds real molecular geometry into Tier 2's hologram takeover (see
// lib/tool-dispatcher.ts's handlePushToScreen and
// app/sandbox/hologram-panel.tsx) — resolves a compound name (e.g.
// "caffeine") to real atom positions and bonds via PubChem's public PUG
// REST API, no API key required. Next.js-only, not shared with the Cloud
// Functions runtime (same category as lib/wolfram-client.ts), so the
// "server-only" guard here is safe. The actual name -> CID -> SDF -> parsed
// structure logic lives in lib/pubchem-parsing.ts (no "server-only" guard),
// specifically so scripts/build-curriculum-library.mts (an offline, one-time
// build script, not part of the live app) can reuse the exact same
// resolution/parsing/geometry code rather than a hand-duplicated copy that
// could silently drift from this file's behavior.
export type { PubChemAtom, PubChemBond, PubChemStructure } from "./pubchem-parsing";

// --- Curriculum library (pre-seeded, offline-built) -----------------------
//
// Built once, offline, by scripts/build-curriculum-library.mts — run from a
// non-Cloud-Run IP (avoids the shared-egress-IP rate-limiting entirely for
// the one-time bulk fetch) against a curated + systematically-generated
// list of Gen Chem / Orgo 1 / Orgo 2 coursework-relevant compounds. Static
// data, no expiry — checked BEFORE the user-triggered cache below, so a
// curriculum-relevant request never touches live PubChem at all once this
// library is populated.
const CURRICULUM_LIBRARY_COLLECTION = "molecule_curriculum_library";

async function getCurriculumStructure(name: string): Promise<PubChemStructure | null> {
  try {
    const doc = await adminDb.collection(CURRICULUM_LIBRARY_COLLECTION).doc(cacheKeyFor(name)).get();
    if (!doc.exists) return null;

    const data = doc.data();
    const atoms = data?.atoms as PubChemStructure["atoms"] | undefined;
    const bonds = data?.bonds as PubChemStructure["bonds"] | undefined;
    if (!Array.isArray(atoms) || !Array.isArray(bonds)) return null;

    console.log(`[pubchem-client] Curriculum library hit for "${name}" — skipping PubChem entirely.`);
    return { atoms, bonds };
  } catch (error) {
    // Same fail-soft discipline as the cache below — a read failure here
    // just falls through to the next tier (cache, then live PubChem),
    // never blocks the lookup.
    console.warn(`[pubchem-client] Curriculum library read failed for "${name}":`, error);
    return null;
  }
}

// --- Structure cache -------------------------------------------------
//
// PubChem intermittently rate-limits requests from this app's shared
// Cloud Run egress IP (PUGREST.ServerBusy — see lib/pubchem-parsing.ts's
// fetchWithRetry), sometimes for sustained multi-minute windows, not just
// momentary blips. A Cloud NAT static IP would fix that at the network
// level but costs real money and infra upkeep (~$5-8/month, deferred for
// now). This is the free mitigation: molecular structure data is static —
// caffeine's shape doesn't change — so once a lookup succeeds, cache it
// permanently. Doesn't help a first-ever lookup during a bad PubChem
// window, but eliminates repeat exposure for anything already resolved
// once. The curriculum library above covers the common coursework case
// ahead of even needing this; this cache is what catches everything else
// (a one-off compound never anticipated by the curriculum list).
const MOLECULE_CACHE_COLLECTION = "molecule_structure_cache";

// Lowercase + trim so "Caffeine"/"caffeine"/"CAFFEINE" all hit the same
// entry. Firestore document ids can't contain "/" — replaced defensively
// even though no realistic compound name would include one. Shared by both
// the curriculum library and the user-triggered cache, so a name normalizes
// identically regardless of which tier resolved it.
function cacheKeyFor(name: string): string {
  return name.trim().toLowerCase().replace(/\//g, "_");
}

async function getCachedStructure(name: string): Promise<PubChemStructure | null> {
  try {
    const doc = await adminDb.collection(MOLECULE_CACHE_COLLECTION).doc(cacheKeyFor(name)).get();
    if (!doc.exists) return null;

    const data = doc.data();
    const atoms = data?.atoms as PubChemStructure["atoms"] | undefined;
    const bonds = data?.bonds as PubChemStructure["bonds"] | undefined;
    if (!Array.isArray(atoms) || !Array.isArray(bonds)) return null;

    console.log(`[pubchem-client] Cache hit for "${name}" — skipping PubChem entirely.`);
    return { atoms, bonds };
  } catch (error) {
    // Cache read failing is never fatal — falls through to the real
    // PubChem lookup exactly as if there were no cache at all.
    console.warn(`[pubchem-client] Cache read failed for "${name}":`, error);
    return null;
  }
}

async function setCachedStructure(name: string, cid: number, structure: PubChemStructure): Promise<void> {
  try {
    await adminDb
      .collection(MOLECULE_CACHE_COLLECTION)
      .doc(cacheKeyFor(name))
      .set({
        compoundName: name,
        cid,
        atoms: structure.atoms,
        bonds: structure.bonds,
        cachedAt: FieldValue.serverTimestamp(),
      });
  } catch (error) {
    // A failed cache WRITE must never fail the lookup itself — the caller
    // already has a good structure to show either way, this is purely an
    // optimization for next time.
    console.warn(`[pubchem-client] Cache write failed for "${name}":`, error);
  }
}

// Resolves a compound name to real 3D geometry — curriculum library first
// (pre-seeded, offline-built, see above), then the user-triggered cache,
// then on a miss from both: name -> CID -> SDF (3D conformer, falling back
// to 2D if PubChem has no 3D conformer for this compound, which happens for
// some ionic/salt/very simple compounds) -> parsed {atoms, bonds}, with
// 2D-only records additionally promoted to an idealized coordination
// geometry (see lib/pubchem-parsing.ts's promoteTo3DGeometry) so an
// inorganic complex's real shape shows up even without a lab-measured 3D
// conformer. Fail-soft throughout, same pattern as lib/wolfram-client.ts's
// fetchWolframImage: never throws, any failure (name not recognized, no
// structure available, malformed SDF) returns null. A hologram falling back
// to its generic placeholder shape is an expected, non-exceptional outcome
// here, not a bug that should break push_to_screen. A successful live
// PubChem result is cached before returning; a failure is never cached (so
// a bad PubChem window doesn't permanently poison a real molecule — the
// next attempt just retries PubChem again, same as today).
export async function fetchPubChemStructure(name: string): Promise<PubChemStructure | null> {
  const fromLibrary = await getCurriculumStructure(name);
  if (fromLibrary) return fromLibrary;

  const cached = await getCachedStructure(name);
  if (cached) return cached;

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

  await setCachedStructure(name, cid, structure);
  return structure;
}
