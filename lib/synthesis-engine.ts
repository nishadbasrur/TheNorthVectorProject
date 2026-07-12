// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/synthesis-scan.ts), same reasoning
// as lib/synthesis-context.ts. This is why lib/anthropic-client.ts had its
// own "server-only" guard removed — this file depends on it directly.
import { askClaude } from "./anthropic-client";
import type { SynthesisContext } from "./synthesis-context";

// A reasoning task this open-ended (finding non-obvious connections across
// heterogeneous sources) benefits from a stronger model than the shared
// Haiku default — see North_Vector_Synthesis_Engine_Plan.md Section 5.4.
// Requested explicitly here rather than silently inheriting whatever the
// global default happens to be.
const SYNTHESIS_MODEL = "claude-sonnet-5";

// Rewritten per North_Vector_Synthesis_Engine_Plan.md Section 0.1: the
// original draft erred toward fewer, high-confidence connections, matching
// Gmail's per-message urgency caution. That calibration is wrong for this
// system specifically — noticing and surfacing should be generous, since a
// wrong "worth knowing" costs a moment's attention, not an action taken.
// This prompt is deliberately calibrated to surface more, score honestly,
// and let lib/synthesis-priority.ts's delivery-channel logic (not this
// prompt) decide what interrupts versus what waits for a summary.
const SYNTHESIS_SYSTEM_PROMPT = `
You are North's synthesis reasoning pass. You will be given a snapshot of everything currently active across Nishad's calendar, inbox, Notion urgent items, tasks, goals, and relevant stored memories, starting with a CURRENT TIME line.

Ground every timing claim in the actual timestamps given (CURRENT TIME, calendar event start times, email received times) — never say something "just arrived," "is starting soon," or similar unless the real timestamps support it. It's fine to connect an old email to a current situation (e.g. "an email from three days ago about X is still relevant now that Y is happening") — just describe the actual elapsed time honestly rather than implying immediacy that isn't there. This instruction constrains HOW you describe timing, not WHETHER something is worth surfacing at all: a connection with no urgency whatsoever — mark it "urgency": "fyi" — is still exactly as worth surfacing as an urgent one, per the generous-surfacing instruction below. Do not become more hesitant to surface something just because it isn't time-critical; "this doesn't need immediate action, but here's a real connection worth knowing about" is a completely normal, expected output, not an edge case.

Your job is NOT to summarize each source individually — a separate part of the system already does that. Your job is to find CONNECTIONS: places where two or more sources relate to each other in a way that matters, or where a pattern across multiple items (not any single one) suggests something worth knowing.

Concrete examples of what counts as a connection worth surfacing:
- A calendar event and an email that are clearly about the same meeting/person/topic.
- A task deadline that conflicts with the calendar (no realistic time to do the work before it's due).
- An incoming opportunity (email, Notion item) that relates to an existing stated goal.
- Several small individually-unremarkable signals that together suggest a developing risk (e.g. a pattern of missed or rescheduled commitments related to the same goal).
- Indirect or offhand signals, not just explicit ones — a passing mention, a name that recurs across two unrelated sources, a date that lines up with something stored in memory. Err toward noticing the non-obvious connection rather than requiring it to be stated outright. If a reasonable person would raise an eyebrow and think "wait, doesn't that relate to—", that's worth surfacing even if you can't be fully certain.

What does NOT count as a connection worth surfacing:
- A single event, email, or task with nothing else to relate it to — that's just a normal item, not a synthesis finding, and the on-demand/reactive checks already handle "what's on my calendar" style questions for those.
- Pure coincidence with zero plausible relationship (e.g. two unrelated emails both happening to contain the word "meeting" is not a connection — a shared name, project, deadline, or person is).

Constitutional priority hierarchy to weigh relevance against, highest first: physical safety, physical health, mental health, legal obligations, academic performance, medical school competitiveness, career development, future optionality, financial stability, professional reputation, family relationships, important friendships, mentorship relationships, personal projects, entrepreneurship, exploration, entertainment, convenience, short-term pleasure.

For each connection found, respond with a JSON object with these fields: "sources" (array of source identifiers involved), "connection" (one clear sentence describing the relationship), "why_it_matters" (one sentence, framed against the priority hierarchy above), "urgency" ("now" | "today" | "this_week" | "fyi"), "confidence" ("high" | "medium" | "low").

Respond with a JSON array of these objects, or an empty array if genuinely nothing at all relates. Unlike a verdict that gets acted on automatically, everything you surface here is just being TOLD to Nishad, never executed — so err toward surfacing more, including lower-confidence or speculative connections (mark them "confidence": "low" or "medium" honestly, don't inflate the score to get something surfaced). Being wrong about something worth mentioning costs a moment of his attention; failing to mention something that mattered is the worse failure mode for this specific system. Confidence and urgency exist so the delivery layer can decide what interrupts him right now versus what waits for a summary — your job is to notice generously and score honestly, not to pre-filter down to only the sure things.
`.trim();

export type SynthesisConnection = {
  sources: string[];
  connection: string;
  whyItMatters: string;
  urgency: "now" | "today" | "this_week" | "fyi";
  confidence: "high" | "medium" | "low";
};

// Deliberately compact, structured serialization — not raw JSON.stringify of
// full objects (Gmail bodies especially need trimming, same 4000-char slice
// precedent already used in lib/gmail-urgency.ts).
function serializeContextForPrompt(context: SynthesisContext): string {
  const calendarBlock = context.calendarEvents
    .map((e) => `- [calendar:${e.id}] "${e.title}" starts ${e.start.toISOString()}`)
    .join("\n");

  // Includes the actual received date/time — without it, the model has no
  // way to honestly judge how recent or time-sensitive an email is, and
  // (confirmed against real output) will still produce confident-sounding
  // temporal language ("arrives right as...") inferred from subject-line
  // content alone rather than the real timestamp. That's exactly the kind
  // of ungrounded claim Section 0.1's "score honestly" principle argues
  // against, even when the underlying connection itself is reasonable.
  const emailBlock = context.inboxMessages
    .map((m) => `- [email:${m.id}] From: ${m.from} — Received: ${m.date || "(unknown)"} — "${m.subject}" — ${m.bodyText.slice(0, 500)}`)
    .join("\n");

  const notionBlock = context.notionUrgentItems.map((i) => `- [notion:${i.id}] "${i.title}"`).join("\n");

  const taskBlock = context.activeTasks
    .map((t) => `- [task:${t.id}] "${t.title}" (${t.status}, priority: ${t.priority})`)
    .join("\n");

  const goalBlock = context.activeGoals
    .map((g) => `- [goal:${g.id}] "${g.title}" (${g.horizon}, ${g.progress}% progress)`)
    .join("\n");

  const memoryBlock = context.relevantMemories.map((m) => `- ${m}`).join("\n");

  // CURRENT TIME is the ground-truth anchor every other timestamp in this
  // prompt needs to be judged against — without it, "starts in 40 minutes"
  // or "just arrived" style urgency claims (the exact kind Section 1's
  // examples call for) are structurally impossible to assess honestly, and
  // the model has no reliable substitute (training-data awareness of "the
  // current date" is not the same as knowing the actual moment this run
  // happened).
  return [
    `CURRENT TIME: ${context.generatedAt.toISOString()}`,
    `CALENDAR (next 72h):\n${calendarBlock || "(none)"}`,
    `INBOX (recent):\n${emailBlock || "(none)"}`,
    `NOTION URGENT ITEMS:\n${notionBlock || "(none)"}`,
    `ACTIVE TASKS:\n${taskBlock || "(none)"}`,
    `ACTIVE GOALS:\n${goalBlock || "(none)"}`,
    `RELEVANT MEMORIES:\n${memoryBlock || "(none)"}`,
  ].join("\n\n");
}

function parseConnections(text: string): SynthesisConnection[] {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];

    // Minimal shape validation — reject anything malformed rather than
    // trusting it blindly, same "fail conservative" precedent as
    // lib/gmail-urgency.ts's parseVerdict.
    type RawConnection = {
      sources: string[];
      connection: string;
      why_it_matters: string;
      urgency: SynthesisConnection["urgency"];
      confidence: SynthesisConnection["confidence"];
    };

    const isRawConnection = (c: unknown): c is RawConnection => {
      const candidate = c as Record<string, unknown>;
      return (
        Array.isArray(candidate.sources) &&
        typeof candidate.connection === "string" &&
        typeof candidate.why_it_matters === "string" &&
        ["now", "today", "this_week", "fyi"].includes(candidate.urgency as string) &&
        ["high", "medium", "low"].includes(candidate.confidence as string)
      );
    };

    return (parsed as unknown[]).filter(isRawConnection).map((c) => ({
      sources: c.sources,
      connection: c.connection,
      whyItMatters: c.why_it_matters,
      urgency: c.urgency,
      confidence: c.confidence,
    }));
  } catch {
    return [];
  }
}

export async function runSynthesis(context: SynthesisContext): Promise<SynthesisConnection[]> {
  const result = await askClaude({
    systemPrompt: SYNTHESIS_SYSTEM_PROMPT,
    userMessage: serializeContextForPrompt(context),
    maxTokens: 1500, // meaningfully larger than any other askClaude call in
                      // the codebase — this is doing real cross-source
                      // reasoning, not a one-line verdict
    model: SYNTHESIS_MODEL,
  });

  if (!result.ok) return [];
  return parseConnections(result.text);
}
