import "server-only";
import { askClaude } from "@/lib/anthropic-client";
import type { SynthesisContext } from "@/lib/synthesis-context";

// #89 — reuses lib/synthesis-context.ts's assembleSynthesisContext
// unchanged (called by the get_full_briefing tool handler in
// lib/tool-dispatcher.ts), but with its own reasoning pass: one genuinely
// synthesized "state of everything" spoken briefing, as opposed to
// lib/synthesis-engine.ts's connection-finding shape or
// get_proactive_updates' "only what's noteworthy" filter. Kept as a
// separate tool/engine rather than folded into either — different intent
// (everything, synthesized) from both.
const BRIEFING_MODEL = "claude-sonnet-5"; // same reasoning as
                                            // lib/synthesis-engine.ts's
                                            // SYNTHESIS_MODEL

const BRIEFING_SYSTEM_PROMPT = `
You are North, giving a full "state of everything" spoken briefing when Nishad explicitly asks for the complete picture — not a quick check-in, the whole thing. You will be given a snapshot of everything currently active across his calendar, inbox, Notion urgent items, recent text messages, tasks, goals, and relevant stored memories.

Genuinely synthesize this into one coherent spoken briefing — connect related items across sources where it's honest to do so, prioritize by what actually matters (constitutional priority: physical safety, physical health, mental health, legal obligations, academic performance, medical school competitiveness, career development, future optionality, financial stability, professional reputation, family relationships, important friendships, mentorship, personal projects, entrepreneurship, exploration, entertainment, convenience, short-term pleasure), and skip anything genuinely not worth mentioning rather than reciting every item mechanically.

This is spoken aloud — no markdown, no bullet points, no headers. Because this was explicitly requested as the full picture, you're allowed to run longer than North's normal 60-word/1-4-sentence limit — a real briefing covering everything active can reasonably run to a full paragraph or two. Still keep it tight and worth listening to, not padded.

Respond with ONLY the spoken briefing text, nothing else.
`.trim();

function serializeContextForPrompt(context: SynthesisContext): string {
  const calendarBlock = context.calendarEvents
    .map((e) => `- "${e.title}" starts ${e.start.toISOString()}`)
    .join("\n");
  const emailBlock = context.inboxMessages
    .map((m) => `- From: ${m.from} — Received: ${m.date || "(unknown)"} — "${m.subject}" — ${m.bodyText.slice(0, 300)}`)
    .join("\n");
  const notionBlock = context.notionUrgentItems.map((i) => `- "${i.title}"`).join("\n");
  const textBlock = context.textMessages
    .map((m) => `- From: ${m.senderName ?? m.sender} — Sent: ${m.sentAt || "(unknown)"} — ${m.text.slice(0, 300)}`)
    .join("\n");
  const taskBlock = context.activeTasks.map((t) => `- "${t.title}" (${t.status}, priority: ${t.priority})`).join("\n");
  const goalBlock = context.activeGoals.map((g) => `- "${g.title}" (${g.horizon}, ${g.progress}% progress)`).join("\n");
  const memoryBlock = context.relevantMemories.map((m) => `- ${m}`).join("\n");

  return [
    `CURRENT TIME: ${context.generatedAt.toISOString()}`,
    `CALENDAR (next 72h):\n${calendarBlock || "(none)"}`,
    `INBOX (recent):\n${emailBlock || "(none)"}`,
    `NOTION URGENT ITEMS:\n${notionBlock || "(none)"}`,
    `RECENT TEXT MESSAGES:\n${textBlock || "(none)"}`,
    `ACTIVE TASKS:\n${taskBlock || "(none)"}`,
    `ACTIVE GOALS:\n${goalBlock || "(none)"}`,
    `RELEVANT MEMORIES:\n${memoryBlock || "(none)"}`,
  ].join("\n\n");
}

export async function runStateOfEverythingBriefing(context: SynthesisContext): Promise<string> {
  const result = await askClaude({
    systemPrompt: BRIEFING_SYSTEM_PROMPT,
    userMessage: serializeContextForPrompt(context),
    maxTokens: 700,
    model: BRIEFING_MODEL,
  });

  if (!result.ok) return "I couldn't put the full briefing together just now — try again in a bit.";
  return result.text.trim();
}
