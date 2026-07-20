// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/weekly-retrospective-scan.ts), same
// reasoning as lib/synthesis-engine.ts. Depends on lib/anthropic-client.ts
// directly for the same reason that file has no "server-only" guard either.
import { askClaude } from "./anthropic-client";
import type { WeeklyRetrospectiveContext } from "./weekly-retrospective-context";
import type { WeeklyRetrospective } from "./weekly-retrospective-store";

const RETROSPECTIVE_MODEL = "claude-sonnet-5"; // same reasoning as
                                                 // lib/synthesis-engine.ts's
                                                 // SYNTHESIS_MODEL — genuine
                                                 // cross-source reasoning,
                                                 // not a one-line verdict

const RETROSPECTIVE_SYSTEM_PROMPT = `
You are North's weekly retrospective reasoning pass, delivered unprompted every Sunday morning. You will be given a snapshot of what happened over the past 7 days across Nishad's tasks, goals, and calendar — what was created, what was completed, what's still open, what's on the calendar, and (if available) last week's own goal-progress snapshot for comparison.

Your job is to give an honest "what actually happened this week vs. what was planned" retrospective — not a neutral summary, a real assessment. If goal progress stalled relative to last week's snapshot, say so plainly. If a lot of tasks were created but few completed, that's worth naming, not glossing over. If something genuinely went well, say that plainly too — this should feel like a real chief-of-staff's Sunday check-in, not a status report.

If no prior goal-progress snapshot is provided, this is the first-ever retrospective — say so plainly rather than fabricating a comparison, and focus on describing the current state as a baseline for next week.

Respond with a single JSON object with these fields:
- "summary": 2-4 sentences, spoken-friendly (no markdown, no bullet points), the actual retrospective.
- "wins": array of short strings, genuine things that went well this week (can be empty).
- "misses": array of short strings, genuine things that stalled or slipped this week (can be empty).
- "next_week_suggestion": one plain sentence suggesting a concrete focus for next week, grounded in what actually happened, not generic advice.
- "goal_progress_snapshot": an object mapping each active goal's id to its current progress (0-100), taken directly from the ACTIVE GOALS list given — this becomes next week's comparison baseline.

Respond with ONLY the JSON object, nothing else.
`.trim();

function serializeContextForPrompt(context: WeeklyRetrospectiveContext): string {
  const taskLine = (t: { id: string; title: string }) => `- [task:${t.id}] "${t.title}"`;
  const goalLine = (g: { id: string; title: string; progress: number }) =>
    `- [goal:${g.id}] "${g.title}" (${g.progress}% progress)`;

  const priorSnapshotBlock = context.priorGoalProgressSnapshot
    ? Object.entries(context.priorGoalProgressSnapshot)
        .map(([goalId, progress]) => `- [goal:${goalId}] was at ${progress}% last week`)
        .join("\n")
    : "(none — this is the first-ever retrospective, no prior week to compare against)";

  return [
    `WEEK: ${context.weekStart.toISOString()} to ${context.weekEnd.toISOString()}`,
    `TASKS CREATED THIS WEEK (${context.tasksCreated.length}):\n${context.tasksCreated.map(taskLine).join("\n") || "(none)"}`,
    `TASKS COMPLETED THIS WEEK (${context.tasksCompleted.length}):\n${context.tasksCompleted.map(taskLine).join("\n") || "(none)"}`,
    `TASKS STILL OPEN (${context.tasksStillOpen.length}):\n${context.tasksStillOpen.map(taskLine).join("\n") || "(none)"}`,
    `CALENDAR EVENTS THIS WEEK (${context.calendarEventsThisWeek.length}):\n${
      context.calendarEventsThisWeek.map((e) => `- [calendar:${e.id}] "${e.title}"`).join("\n") || "(none)"
    }`,
    `ACTIVE GOALS:\n${context.activeGoals.map(goalLine).join("\n") || "(none)"}`,
    `LAST WEEK'S GOAL-PROGRESS SNAPSHOT:\n${priorSnapshotBlock}`,
  ].join("\n\n");
}

function parseRetrospective(text: string, weekId: string): WeeklyRetrospective | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;

    if (typeof parsed.summary !== "string") return null;

    const goalProgressSnapshot: Record<string, number> = {};
    if (parsed.goal_progress_snapshot && typeof parsed.goal_progress_snapshot === "object") {
      for (const [goalId, progress] of Object.entries(parsed.goal_progress_snapshot as Record<string, unknown>)) {
        if (typeof progress === "number") goalProgressSnapshot[goalId] = progress;
      }
    }

    return {
      weekId,
      summary: parsed.summary,
      wins: Array.isArray(parsed.wins) ? parsed.wins.filter((w): w is string => typeof w === "string") : [],
      misses: Array.isArray(parsed.misses) ? parsed.misses.filter((m): m is string => typeof m === "string") : [],
      nextWeekSuggestion: typeof parsed.next_week_suggestion === "string" ? parsed.next_week_suggestion : "",
      goalProgressSnapshot,
    };
  } catch {
    return null;
  }
}

export async function runWeeklyRetrospective(
  context: WeeklyRetrospectiveContext
): Promise<WeeklyRetrospective | null> {
  const result = await askClaude({
    systemPrompt: RETROSPECTIVE_SYSTEM_PROMPT,
    userMessage: serializeContextForPrompt(context),
    maxTokens: 800,
    model: RETROSPECTIVE_MODEL,
  });

  if (!result.ok) return null;
  return parseRetrospective(result.text, context.weekId);
}
