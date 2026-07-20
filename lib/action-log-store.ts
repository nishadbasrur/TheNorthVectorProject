// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/push.ts writes here too, alongside
// the Next.js app's lib/push-server.ts), same reasoning as
// lib/synthesis-store.ts.
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "./ensure-firebase-app";

// Backs #65 ("what did you do today without me asking") — a reviewable log
// of every autonomous action, not just failures (lib/tool-error-log.ts's
// tool_errors only fires on error). Two write sources cover everything: any
// push notification (from any scan) and any voice-turn tool execution, at
// their respective single choke points (sendPushNotification in both
// lib/push-server.ts and functions/src/push.ts, and the one executeTool call
// site in app/api/v1/voice/respond/route.ts) — no per-caller instrumentation
// needed.
export type ActionLogEntry = {
  kind: "push" | "tool_call";
  title: string;
  body: string | null;
  toolName: string | null;
  outcome: string | null;
  sessionId: string | null;
};

const DAY_KEY_TIME_ZONE = "America/New_York";

// Same home-timezone convention as lib/google-calendar-client.ts's
// EVENT_TIME_ZONE and app/api/v1/voice/respond/route.ts's PERSONA_TIME_ZONE
// — "today" means Nishad's actual day, not the server's UTC day.
export function dayKey(date: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAY_KEY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return formatted; // en-CA formats as YYYY-MM-DD
}

// Fire-and-forget from both push-server modules and the tool-execution call
// site — a logging failure here must never block the action it's recording,
// same discipline as lib/tool-error-log.ts. Callers wrap with .catch(() => {}).
export async function recordAction(entry: ActionLogEntry): Promise<void> {
  ensureFirebaseApp();
  const db = getFirestore();

  await db.collection("action_log").add({
    ...entry,
    dayKey: dayKey(),
    createdAt: FieldValue.serverTimestamp(),
  });
}

export type ActionLogEntrySummary = ActionLogEntry & { id: string; createdAt: string | null };

// Backs /activity — most recent first, one calendar day at a time (see
// dayKey above), same "debugging/review feed, not paginated archive"
// treatment as getRecentToolErrors.
export async function getActionsForDay(day: string): Promise<ActionLogEntrySummary[]> {
  ensureFirebaseApp();
  const db = getFirestore();

  const snapshot = await db
    .collection("action_log")
    .where("dayKey", "==", day)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      kind: data.kind === "tool_call" ? "tool_call" : "push",
      title: typeof data.title === "string" ? data.title : "",
      body: typeof data.body === "string" ? data.body : null,
      toolName: typeof data.toolName === "string" ? data.toolName : null,
      outcome: typeof data.outcome === "string" ? data.outcome : null,
      sessionId: typeof data.sessionId === "string" ? data.sessionId : null,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
    };
  });
}
