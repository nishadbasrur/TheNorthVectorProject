// One-time offline builder for the curriculum molecule library (see the fix
// note "Bundle a curriculum-driven molecule library to avoid live PubChem
// dependency"). Deliberately run from a normal dev-machine IP, NOT Cloud
// Run — the whole point is sidestepping the shared-egress-IP rate-limiting
// that live production requests hit, for this one-time bulk fetch. Paced at
// PubChem's documented 5 req/s-per-IP limit.
//
// Resumable: writes progress to a local JSON checkpoint file after every
// compound, and skips names already resolved (success OR permanent
// failure) on a re-run, so an interruption doesn't waste already-completed
// work. Reuses the exact same resolveCid/fetchSdf/parseSdf/
// promoteTo3DGeometry logic as the live app (lib/pubchem-parsing.ts) — same
// resolution rules apply, so anything in this library that fails here would
// have failed live too.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveCid, fetchSdf, parseSdf, promoteTo3DGeometry, type PubChemStructure } from "../lib/pubchem-parsing.ts";
import { generateCompoundList } from "./curriculum-compound-list.mts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This is a bare tsx script, not Next.js — .env.local isn't auto-loaded.
// Same extraction approach used elsewhere this session for standalone
// scripts: the service-account JSON spans multiple lines inside a
// single-quoted block, so a simple regex can't isolate it.
function loadServiceAccountKeyFromEnvLocal(): void {
  const envPath = path.join(__dirname, "..", ".env.local");
  const envContent = fs.readFileSync(envPath, "utf8");
  const startMarker = "FIREBASE_SERVICE_ACCOUNT_KEY='";
  const start = envContent.indexOf(startMarker);
  if (start === -1) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local");
  const jsonStart = start + startMarker.length;
  let end = -1;
  for (let i = jsonStart; i < envContent.length; i++) {
    if (envContent[i] === "'" && (envContent[i + 1] === "\n" || i + 1 === envContent.length)) {
      end = i;
      break;
    }
  }
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY = envContent.slice(jsonStart, end);
}
loadServiceAccountKeyFromEnvLocal();
const CHECKPOINT_PATH = path.join(__dirname, ".curriculum-library-checkpoint.json");
const DELAY_MS = 260; // ~3.8 req/s, comfortably under PubChem's 5 req/s/IP limit

type CheckpointEntry = { status: "ok" | "fail"; cid?: number; atomCount?: number; bondCount?: number };
type Checkpoint = Record<string, CheckpointEntry>;

function loadCheckpoint(): Checkpoint {
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveCheckpoint(cp: Checkpoint): void {
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(cp));
}

function cacheKeyFor(name: string): string {
  return name.trim().toLowerCase().replace(/\//g, "_");
}

async function resolveOne(name: string): Promise<{ cid: number; structure: PubChemStructure } | null> {
  const cid = await resolveCid(name);
  if (!cid) return null;

  let sdf = await fetchSdf(cid, "3d");
  let usedRecordType: "3d" | "2d" = "3d";
  if (!sdf) {
    sdf = await fetchSdf(cid, "2d");
    usedRecordType = "2d";
  }
  if (!sdf) return null;

  let structure = parseSdf(sdf);
  if (!structure) return null;
  if (usedRecordType === "2d") structure = promoteTo3DGeometry(structure);

  return { cid, structure };
}

async function main() {
  const { adminDb } = await import("../lib/firebase-admin.ts");
  const { FieldValue } = await import("firebase-admin/firestore");
  const COLLECTION = "molecule_curriculum_library";

  const allNames = generateCompoundList();
  const checkpoint = loadCheckpoint();
  // Retries anything not yet resolved AND anything that failed last run —
  // pass 1 found a large fraction of "fail" entries were transient
  // PUGREST.ServerBusy hits during the run's own sustained request volume
  // (confirmed live: "chlorobenzene", an extremely common real compound,
  // 503'd during a diagnostic re-check), not genuinely bad/unresolvable
  // names. Only a real "ok" is treated as permanently done.
  const pending = allNames.filter((n) => {
    const entry = checkpoint[cacheKeyFor(n)];
    return !entry || entry.status === "fail";
  });

  console.log(`[build-curriculum-library] ${allNames.length} total candidates, ${Object.keys(checkpoint).length} already processed, ${pending.length} pending.`);

  let okCount = 0;
  let failCount = 0;
  let sinceLastSave = 0;
  const startTime = Date.now();

  for (let i = 0; i < pending.length; i++) {
    const name = pending[i];
    const key = cacheKeyFor(name);

    const result = await resolveOne(name);
    if (result) {
      try {
        await adminDb.collection(COLLECTION).doc(key).set({
          compoundName: name,
          cid: result.cid,
          atoms: result.structure.atoms,
          bonds: result.structure.bonds,
          builtAt: FieldValue.serverTimestamp(),
        });
        checkpoint[key] = { status: "ok", cid: result.cid, atomCount: result.structure.atoms.length, bondCount: result.structure.bonds.length };
        okCount++;
      } catch (error) {
        console.error(`[build-curriculum-library] Firestore write failed for "${name}":`, error);
        checkpoint[key] = { status: "fail" };
        failCount++;
      }
    } else {
      checkpoint[key] = { status: "fail" };
      failCount++;
    }

    sinceLastSave++;
    if (sinceLastSave >= 25) {
      saveCheckpoint(checkpoint);
      sinceLastSave = 0;
      const elapsedSec = (Date.now() - startTime) / 1000;
      const rate = (i + 1) / elapsedSec;
      const remaining = pending.length - (i + 1);
      const etaMin = Math.round(remaining / rate / 60);
      console.log(
        `[build-curriculum-library] ${i + 1}/${pending.length} processed (${okCount} ok, ${failCount} failed) — ~${etaMin}min remaining`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  saveCheckpoint(checkpoint);
  const totalOk = Object.values(checkpoint).filter((e) => e.status === "ok").length;
  const totalFail = Object.values(checkpoint).filter((e) => e.status === "fail").length;
  console.log(`\n[build-curriculum-library] DONE. This run: ${okCount} ok, ${failCount} failed.`);
  console.log(`[build-curriculum-library] Overall checkpoint totals: ${totalOk} stored, ${totalFail} failed, ${totalOk + totalFail} total attempted of ${allNames.length} candidates.`);
}

main().catch((error) => {
  console.error("[build-curriculum-library] Fatal error:", error);
  process.exit(1);
});
