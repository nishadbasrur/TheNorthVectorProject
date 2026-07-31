import "server-only";
import { adminDb } from "./firebase-admin";
import type { GoalRecord } from "./goal-store";

// Admin SDK counterpart to lib/goal-store.ts's getGoals, for server-only
// callers (lib/tool-dispatcher.ts) — same client/admin split reasoning as
// lib/task-store-admin.ts. Read-only for now (backs the list_goals tool
// only) — Weekly Review's own create/update flows stay client-side;
// North just needed visibility into what's already there, not write
// access to a page it doesn't otherwise touch.
export async function listGoalsAsAdmin(): Promise<GoalRecord[]> {
  const snapshot = await adminDb.collection("goals").get();
  const goals = snapshot.docs.map((goalDoc) => ({ id: goalDoc.id, ...goalDoc.data() })) as GoalRecord[];

  return goals.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
