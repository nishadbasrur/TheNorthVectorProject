// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/synthesis-scan.ts), same reasoning
// as lib/synthesis-context.ts.
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ensureFirebaseApp } from "./ensure-firebase-app";
import type { SynthesisConnection } from "./synthesis-engine";
import type { SynthesisContext } from "./synthesis-context";

// Dedup key: same source-pair combination, not exact string match — a
// connection between the same calendar event and email shouldn't re-surface
// identically every hour just because wording differs slightly between runs.
function connectionKey(connection: SynthesisConnection): string {
  return [...connection.sources].sort().join("|");
}

export async function alreadySurfacedConnection(connection: SynthesisConnection): Promise<boolean> {
  ensureFirebaseApp();
  const db = getFirestore();
  const doc = await db.collection("synthesis_connections").doc(connectionKey(connection)).get();
  if (!doc.exists) return false;

  // Re-surface if the underlying sources have materially changed since last
  // surfaced (e.g. a new email arrived), not just because time passed.
  // Simple v1 approach: re-surface after 6 hours regardless, and let the
  // priority filter catch anything genuinely stale. A more precise "did the
  // actual sources change" check is a reasonable v2 once this is observed
  // in practice — flagged, not built now.
  const surfacedAt = doc.data()?.surfacedAt?.toMillis?.() ?? 0;
  return Date.now() - surfacedAt < 6 * 60 * 60 * 1000;
}

export async function recordConnection(connection: SynthesisConnection): Promise<void> {
  ensureFirebaseApp();
  const db = getFirestore();

  await db.collection("synthesis_connections").doc(connectionKey(connection)).set({
    ...connection,
    surfacedAt: FieldValue.serverTimestamp(),
  });
}

export async function recordSynthesisRun(params: {
  context: SynthesisContext;
  allConnections: SynthesisConnection[];
  delivered: string[];
}): Promise<void> {
  ensureFirebaseApp();
  const db = getFirestore();

  // Store counts/summaries, not raw source content — same "no raw email
  // body persisted" boundary already established for Gmail
  // (docs/integrations/calendar-notion-gmail-task.md Section 3), applied
  // here across every source, not just Gmail.
  await db.collection("synthesis_runs").add({
    generatedAt: params.context.generatedAt,
    sourceCounts: {
      calendarEvents: params.context.calendarEvents.length,
      inboxMessages: params.context.inboxMessages.length,
      notionUrgentItems: params.context.notionUrgentItems.length,
      activeTasks: params.context.activeTasks.length,
      activeGoals: params.context.activeGoals.length,
    },
    connectionsFound: params.allConnections.length,
    connectionsDelivered: params.delivered,
    runAt: FieldValue.serverTimestamp(),
  });
}
