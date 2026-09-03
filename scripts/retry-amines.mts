// Targeted retry for just the amine category, after fixing the
// hyphen-before-"amine" naming bug in curriculum-compound-list.mts's
// genAmines(). A full blind retry of all 2,358 pass-1 failures proved
// unproductive (8% recovery on the first 100 tried) — most of those really
// are unresolvable names, not transient rate-limit blips. This is
// different: the amine bug is a verified, specific fix (confirmed live
// against PubChem: "N-ethyl-propylamine" 404s, "N-ethylpropylamine"
// resolves), so only the amine-shaped subset of failures is worth
// re-attempting in bulk.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveCid, fetchSdf, parseSdf, promoteTo3DGeometry } from "../lib/pubchem-parsing.ts";
import { generateCompoundList } from "./curriculum-compound-list.mts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHECKPOINT_PATH = path.join(__dirname, ".curriculum-library-checkpoint.json");
const DELAY_MS = 260;

function loadServiceAccountKeyFromEnvLocal(): void {
  const envPath = path.join(__dirname, "..", ".env.local");
  const envContent = fs.readFileSync(envPath, "utf8");
  const startMarker = "FIREBASE_SERVICE_ACCOUNT_KEY='";
  const start = envContent.indexOf(startMarker);
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

function cacheKeyFor(name: string): string {
  return name.trim().toLowerCase().replace(/\//g, "_");
}
function isAmineShaped(name: string): boolean {
  const n = name.toLowerCase();
  return n.endsWith("amine") || n.startsWith("n-") || n.startsWith("n,n-");
}

async function main() {
  const { adminDb } = await import("../lib/firebase-admin.ts");
  const { FieldValue } = await import("firebase-admin/firestore");
  const COLLECTION = "molecule_curriculum_library";

  const checkpoint: Record<string, { status: "ok" | "fail" }> = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));
  const allNames = generateCompoundList();
  const targets = allNames.filter((n) => isAmineShaped(n) && checkpoint[cacheKeyFor(n)]?.status !== "ok");

  console.log(`[retry-amines] ${targets.length} amine-shaped candidates not yet stored.`);

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < targets.length; i++) {
    const name = targets[i];
    const key = cacheKeyFor(name);
    const cid = await resolveCid(name);
    let stored = false;
    if (cid) {
      let sdf = await fetchSdf(cid, "3d");
      let usedRecordType: "3d" | "2d" = "3d";
      if (!sdf) {
        sdf = await fetchSdf(cid, "2d");
        usedRecordType = "2d";
      }
      let structure = sdf ? parseSdf(sdf) : null;
      if (structure) {
        if (usedRecordType === "2d") structure = promoteTo3DGeometry(structure);
        await adminDb.collection(COLLECTION).doc(key).set({
          compoundName: name,
          cid,
          atoms: structure.atoms,
          bonds: structure.bonds,
          builtAt: FieldValue.serverTimestamp(),
        });
        checkpoint[key] = { status: "ok" };
        ok++;
        stored = true;
      }
    }
    if (!stored) {
      checkpoint[key] = { status: "fail" };
      fail++;
    }
    if ((i + 1) % 25 === 0) {
      fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
      console.log(`[retry-amines] ${i + 1}/${targets.length} (${ok} ok, ${fail} fail)`);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
  console.log(`[retry-amines] DONE. ${ok} ok, ${fail} fail out of ${targets.length}.`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
