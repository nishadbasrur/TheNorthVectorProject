import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/require-owner";
import { createMemory, extractTags, type MemoryTier } from "@/lib/obsidian-memory-store";
import { embedText, storeEmbedding } from "@/lib/memory-embeddings";

// The Obsidian/Google-Drive-backed write path — see
// North_Vector_Memory_Storage_Migration_Obsidian_Two_Tier.md. A route, not
// a direct import, because lib/obsidian-memory-store.ts is "server-only"
// (OAuth secrets, Node APIs) and app/memories/page.tsx is a client
// component; those can't talk to each other directly.
//
// NOT yet wired up as the page's actual save path — app/memories/page.tsx
// still writes to the old Firestore lib/memory-store.ts for now. This
// route exists and works end-to-end once the real-world setup steps
// (Drive OAuth scope, Drive desktop app mirroring both Memories/General
// and Memories/Distilled, Obsidian Sync's selective-sync exclusion on
// both, and a VOYAGE_API_KEY for embeddings) are confirmed done; flipping
// the page over is then a one-line change to its handleSave function.
//
// tags are always extracted server-side (Section 3.4) — the caller never
// supplies them directly. Embeddings are only generated for the "general"
// tier (Section 3.2/3.3 — "distilled" keeps using the existing keyword
// scoreMemories() path, which has no use for a vector).
export async function POST(request: Request) {
  const auth = await requireOwner(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { content, domain, type, tier, status, confidence } = body as Record<string, unknown>;

  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'content' field." }, { status: 400 });
  }
  if (typeof domain !== "string" || domain.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'domain' field." }, { status: 400 });
  }
  if (typeof type !== "string" || type.trim().length === 0) {
    return NextResponse.json({ error: "Missing 'type' field." }, { status: 400 });
  }
  if (tier !== "general" && tier !== "distilled") {
    return NextResponse.json({ error: "'tier' must be \"general\" or \"distilled\"." }, { status: 400 });
  }

  const trimmedContent = content.trim();
  const memoryTier = tier as MemoryTier;

  try {
    const tags = await extractTags(trimmedContent);

    const { fileId } = await createMemory({
      content: trimmedContent,
      domain: domain.trim(),
      type: type.trim(),
      tier: memoryTier,
      status: typeof status === "string" ? status : undefined,
      confidence: typeof confidence === "number" ? confidence : undefined,
      tags,
    });

    if (memoryTier === "general") {
      const vector = await embedText(trimmedContent, "document");
      await storeEmbedding(fileId, vector, tags);
    }

    return NextResponse.json({ ok: true, fileId, tags });
  } catch (error) {
    console.error("[api/v1/memories/create] Failed to write memory:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save memory." },
      { status: 500 }
    );
  }
}
