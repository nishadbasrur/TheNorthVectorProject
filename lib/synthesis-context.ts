// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/synthesis-scan.ts), same reasoning
// as lib/google-calendar-client.ts / lib/notion-client.ts / lib/gmail-client.ts.
// For the same reason, this file avoids lib/firebase-admin.ts's adminDb
// singleton (Next.js-only initialization) and lib/task-store.ts /
// lib/goal-store.ts / lib/preferences-store.ts entirely — not just their
// runtime code, but even their *types*. functions/tsconfig.json has no "@/"
// path alias, and those files transitively resolve one (e.g.
// preferences-store.ts imports "@/lib/firebase-admin"), which breaks
// `tsc --noEmit` for the whole functions/ subproject the moment anything
// here is imported from synthesis-scan.ts. This file defines its own
// minimal local shapes instead — genuinely self-contained, not just
// "no runtime import."
import { getFirestore } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "./ensure-firebase-app";
import { getUpcomingEvents, type UpcomingEvent } from "./google-calendar-client";
import { getRecentInboxMessages, type InboxMessage } from "./gmail-client";
import { getUrgentItems, type UrgentNotionItem } from "./notion-client";
import { getRecentTextMessages, type StoredTextMessage } from "./text-message-store";

export type SynthesisTask = { id: string; title: string; status: string; priority: string };
export type SynthesisGoal = { id: string; title: string; status: string; horizon: string; progress: number };
export type SynthesisPreference = { key: string; value: string };

export type SynthesisContext = {
  generatedAt: Date;
  calendarEvents: UpcomingEvent[];
  inboxMessages: InboxMessage[];
  notionUrgentItems: UrgentNotionItem[];
  textMessages: StoredTextMessage[];
  activeTasks: SynthesisTask[];
  activeGoals: SynthesisGoal[];
  relevantMemories: string[];
  preferences: SynthesisPreference[];
};

async function getActiveTasks(): Promise<SynthesisTask[]> {
  const db = getFirestore();
  const snapshot = await db.collection("tasks").get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: typeof data.title === "string" ? data.title : "(untitled task)",
        status: typeof data.status === "string" ? data.status : "scheduled",
        priority: typeof data.priority === "string" ? data.priority : "medium",
      };
    })
    .filter((task) => task.status !== "completed" && task.status !== "cancelled");
}

async function getActiveGoals(): Promise<SynthesisGoal[]> {
  const db = getFirestore();
  const snapshot = await db.collection("goals").get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: typeof data.title === "string" ? data.title : "(untitled goal)",
        status: typeof data.status === "string" ? data.status : "active",
        horizon: typeof data.horizon === "string" ? data.horizon : "mid",
        progress: typeof data.progress === "number" ? data.progress : 0,
      };
    })
    .filter((goal) => goal.status !== "completed" && goal.status !== "cancelled");
}

async function getPreferences(): Promise<SynthesisPreference[]> {
  const db = getFirestore();
  const snapshot = await db.collection("preferences").get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      key: typeof data.key === "string" ? data.key : doc.id,
      value: typeof data.value === "string" ? data.value : "",
    };
  });
}

const STOP_WORDS = new Set(["with", "from", "this", "that", "have", "been", "will", "your", "about"]);

function keywordsFrom(titles: string[]): Set<string> {
  const words = titles
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  return new Set(words);
}

// Intentionally simpler than lib/memory-retrieval.ts's retrieveMemories (no
// query-expansion table, no weighted blend) — this is a broad "what's
// relevant to what's currently active" pull, not answering one specific
// question, and that file has the same "server-only" + cross-boundary-type
// problem described at the top of this file. A plain keyword-overlap-
// against-active-goals/tasks pass is good enough for this context-gathering
// step; genuine query-specific retrieval still goes through the existing
// Judgment Engine path.
async function getRelevantMemories(activeTasks: SynthesisTask[], activeGoals: SynthesisGoal[], limit = 15): Promise<string[]> {
  const db = getFirestore();
  const snapshot = await db.collection("memories").get();

  const keywords = keywordsFrom([...activeGoals.map((g) => g.title), ...activeTasks.map((t) => t.title)]);

  const scored = snapshot.docs.map((doc) => {
    const data = doc.data();
    const content = typeof data.content === "string" ? data.content : "";
    const confidence = typeof data.confidence === "number" ? data.confidence : 0;
    const lowerContent = content.toLowerCase();

    let matches = 0;
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) matches += 1;
    }

    return { content, confidence, matches };
  });

  return scored
    .filter((m) => m.content.length > 0)
    .sort((a, b) => (b.matches - a.matches) || (b.confidence - a.confidence))
    .slice(0, limit)
    .map((m) => m.content);
}

// Pulls from every source in parallel — this function's entire reason for
// existing is to put everything in one place at the same time, which is the
// structural gap functions/src/urgency-scan.ts has (see
// North_Vector_Synthesis_Engine_Plan.md Section 2). Read-only across every
// source, same hard constraint as every existing integration.
export async function assembleSynthesisContext(): Promise<SynthesisContext> {
  ensureFirebaseApp();

  const [calendarEvents, inboxMessages, notionUrgentItems, textMessages, activeTasks, activeGoals, preferences] =
    await Promise.all([
      getUpcomingEvents(72), // wider window than the 48h on-demand default —
                              // synthesis looks for developing patterns, not
                              // just imminent events
      getRecentInboxMessages(25),
      getUrgentItems(),
      getRecentTextMessages(25),
      getActiveTasks(),
      getActiveGoals(),
      getPreferences(),
    ]);

  const relevantMemories = await getRelevantMemories(activeTasks, activeGoals, 15);

  return {
    generatedAt: new Date(),
    calendarEvents,
    inboxMessages,
    notionUrgentItems,
    textMessages,
    activeTasks,
    activeGoals,
    relevantMemories,
    preferences,
  };
}
