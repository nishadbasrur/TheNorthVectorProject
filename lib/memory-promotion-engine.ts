// Weekly Retrospective's new job (Section 5 of
// North_Vector_Memory_Storage_Migration_Obsidian_Two_Tier.md): periodically
// review recent General/ entries and PROPOSE promotions to Distilled/ —
// never auto-promote, per the standing project-wide caution around
// autonomous actions that are hard to undo. Structurally mirrors
// lib/weekly-retrospective-engine.ts (assemble context, reason, return
// structured JSON) but is a genuinely separate concern grafted alongside
// it, not a change to what that engine already does.
//
// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/weekly-retrospective-scan.ts),
// same reasoning as lib/weekly-retrospective-engine.ts.
import { askOpenAI, MODEL_AGENTIC } from "./openai-client";
import { loadGeneralMemoriesSince } from "./obsidian-memory-retrieval";
import { logMemoryPromotionProposal } from "./capability-gap-store";

const PROMOTION_MODEL = MODEL_AGENTIC; // cross-entry pattern-finding, same
                                        // reasoning tier as the retrospective
                                        // itself — not a one-line verdict

// Exported (not just used internally by proposeMemoryPromotions below) so
// functions/src/weekly-retrospective-scan.ts's Batch API submit/poll path
// can build the same request and parse the same shape of result without
// duplicating this prompt — same reasoning lib/synthesis-engine.ts and
// lib/weekly-retrospective-engine.ts export their own prompts/parsers for.
export const PROMOTION_SYSTEM_PROMPT = `
You are North's memory-promotion reasoning pass, run as part of the weekly retrospective. You will be given a list of recent "General" memory entries — everything Nishad told North this week, low bar, unfiltered. Most of these are one-off and don't deserve a permanent place in the small curated "Distilled" memory set.

Your job: look for patterns ACROSS MULTIPLE entries (not just individually striking single entries) that collectively suggest something durable and worth remembering long-term — e.g. the same preference mentioned three different ways, a recurring person/topic, a fact that keeps getting referenced. A single mention of something, however interesting, is usually NOT enough on its own — the bar is "this keeps coming up" or "this is clearly a lasting fact," not "this was said."

If nothing in this batch meets that bar, that's a completely normal and expected outcome — return an empty array. Do not force a promotion just to have something to report.

Respond with a single JSON object with one field:
- "promotions": an array of objects, each with:
  - "content": the distilled fact itself, written as a clean standalone sentence (not quoting the original messages verbatim)
  - "domain": short category, e.g. "academic", "health", "relationships"
  - "type": short type, e.g. "preference", "fact", "recurring-topic"
  - "tags": 3-5 short lowercase hyphenated tags
  - "reasoning": one sentence explaining WHY this pattern earned promotion — cite what made it durable, not just "this seemed important"

Respond with ONLY the JSON object, nothing else.
`.trim();

export function serializeEntriesForPrompt(entries: { content: string; tags: string[] }[]): string {
  return entries.map((e, i) => `[entry ${i + 1}] (tags: ${e.tags.join(", ") || "none"})\n${e.content}`).join("\n\n");
}

export type ProposedPromotion = {
  content: string;
  domain: string;
  type: string;
  tags: string[];
  reasoning: string;
};

export function parseProposals(text: string): ProposedPromotion[] {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (!Array.isArray(parsed.promotions)) return [];

    return parsed.promotions
      .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
      .map((p) => ({
        content: typeof p.content === "string" ? p.content : "",
        domain: typeof p.domain === "string" ? p.domain : "general",
        type: typeof p.type === "string" ? p.type : "note",
        tags: Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === "string").slice(0, 5) : [],
        reasoning: typeof p.reasoning === "string" ? p.reasoning : "",
      }))
      .filter((p) => p.content.length > 0);
  } catch {
    return [];
  }
}

export type ProposeMemoryPromotionsSummary = {
  ok: boolean;
  entriesReviewed: number;
  proposalsLogged: number;
};

// Window is a plain "last 7 days," matching the Weekly Retrospective's own
// cadence — deliberately no separate "last run" cursor doc. A proposal
// that isn't reviewed within a week can resurface the following week (the
// human review gate means a duplicate is a minor annoyance — see it twice,
// deny the second — not a real risk, so not worth the extra state to
// prevent).
export async function proposeMemoryPromotions(): Promise<ProposeMemoryPromotionsSummary> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const entries = await loadGeneralMemoriesSince(since);

  if (entries.length === 0) {
    return { ok: true, entriesReviewed: 0, proposalsLogged: 0 };
  }

  const result = await askOpenAI({
    systemPrompt: PROMOTION_SYSTEM_PROMPT,
    userMessage: serializeEntriesForPrompt(entries),
    maxTokens: 1200,
    model: PROMOTION_MODEL,
  });

  if (!result.ok) {
    return { ok: false, entriesReviewed: entries.length, proposalsLogged: 0 };
  }

  const proposals = parseProposals(result.text);

  for (const proposal of proposals) {
    await logMemoryPromotionProposal(proposal);
  }

  return { ok: true, entriesReviewed: entries.length, proposalsLogged: proposals.length };
}
