import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Firestore-backed write path — being migrated to Drive/Obsidian, see
// North_Vector_Memory_Storage_Migration_Obsidian_Two_Tier.md and
// lib/obsidian-memory-store.ts. Kept as the live path until the migration's
// real-world setup steps are confirmed done. domain/type/status/confidence/
// tier are new (this collection only ever stored bare `content` before) so
// that anything created from here on already has the fields the eventual
// migration script would otherwise have to guess at. tags are deliberately
// NOT captured here — tag extraction is a server-only Claude call (see
// lib/obsidian-memory-store.ts's extractTags), not something this
// client-side Firestore write can do; the migration script generates them
// retroactively instead.
export async function createMemory(params: {
  content: string;
  domain: string;
  type: string;
  tier: "general" | "distilled";
  status?: string;
  confidence?: number;
}) {
  return addDoc(collection(db, "memories"), {
    content: params.content,
    domain: params.domain,
    type: params.type,
    tier: params.tier,
    status: params.status ?? "active",
    confidence: params.confidence ?? 0.7,
    createdAt: new Date().toISOString(),
  });
}

export async function getMemories() {
  const snapshot = await getDocs(collection(db, "memories"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

