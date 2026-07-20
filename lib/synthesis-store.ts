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

// `spoken` distinguishes "found and recorded" from "actually communicated
// to Nishad" — an interrupt-tier connection is spoken the instant its push
// notification is sent; a summary-tier one is recorded but NOT spoken,
// since being written to Firestore isn't the same as Nishad ever hearing
// about it. That gap — real findings sitting recorded but never actually
// surfaced anywhere Nishad would encounter them unprompted — is what
// getUnspokenConnections/markConnectionsSpoken below close. See
// North_Vector_Real_Time_Triggers_Plan.md Section 2.1.
export async function recordConnection(connection: SynthesisConnection, spoken: boolean): Promise<void> {
  ensureFirebaseApp();
  const db = getFirestore();

  await db.collection("synthesis_connections").doc(connectionKey(connection)).set({
    ...connection,
    spoken,
    // #75 — reset alongside `spoken` on every (re-)surface, same reasoning:
    // a connection resurfacing after 6h is effectively a fresh mention, so
    // whether Nishad engaged with the PREVIOUS surfacing shouldn't carry
    // forward and taint this one.
    engagement: "unknown",
    surfacedAt: FieldValue.serverTimestamp(),
  });
}

// #75 — records whether Nishad's next turn after an opener actually engaged
// with what it mentioned (see lib/engagement-detector.ts). A logging
// failure here must never affect the actual voice response — callers
// fire-and-forget this.
export async function setConnectionEngagement(
  connection: SynthesisConnection,
  engagement: "engaged" | "ignored"
): Promise<void> {
  ensureFirebaseApp();
  const db = getFirestore();

  await db
    .collection("synthesis_connections")
    .doc(connectionKey(connection))
    .set({ engagement }, { merge: true });
}

export type EngagementSummaryEntry = {
  connection: string;
  engagement: "unknown" | "engaged" | "ignored";
  surfacedAt: string | null;
};

// Backs /activity's engagement readout — most recently surfaced
// connections regardless of source (opener or get_proactive_updates), with
// whatever engagement classification (if any) has landed so far. Plain
// orderBy, no equality filter, so no composite index needed.
export async function getRecentEngagementSummary(maxResults = 20): Promise<EngagementSummaryEntry[]> {
  ensureFirebaseApp();
  const db = getFirestore();

  const snapshot = await db
    .collection("synthesis_connections")
    .orderBy("surfacedAt", "desc")
    .limit(maxResults)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      connection: typeof data.connection === "string" ? data.connection : "",
      engagement: (data.engagement as EngagementSummaryEntry["engagement"]) ?? "unknown",
      surfacedAt: data.surfacedAt?.toDate ? data.surfacedAt.toDate().toISOString() : null,
    };
  });
}

// Backs the voice respond route's conversational-opener check — the
// summary-tier connections that were recorded but never actually spoken to
// Nishad. Ordered most-recent-first and capped small: this folds into a
// greeting, not a briefing, so one or two genuinely worth mentioning beats
// reciting everything that's piled up.
export async function getUnspokenConnections(maxResults = 2): Promise<SynthesisConnection[]> {
  ensureFirebaseApp();
  const db = getFirestore();

  const snapshot = await db
    .collection("synthesis_connections")
    .where("spoken", "==", false)
    .orderBy("surfacedAt", "desc")
    .limit(maxResults)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      sources: Array.isArray(data.sources) ? data.sources : [],
      connection: typeof data.connection === "string" ? data.connection : "",
      whyItMatters: typeof data.whyItMatters === "string" ? data.whyItMatters : "",
      urgency: (data.urgency as SynthesisConnection["urgency"]) ?? "fyi",
      confidence: (data.confidence as SynthesisConnection["confidence"]) ?? "medium",
    };
  });
}

// Called once a conversational opener actually goes out (see the voice
// respond route) — marks those connections spoken so the same finding
// doesn't open every subsequent session until something new bumps it.
export async function markConnectionsSpoken(connections: SynthesisConnection[]): Promise<void> {
  if (connections.length === 0) return;
  ensureFirebaseApp();
  const db = getFirestore();

  const batch = db.batch();
  for (const connection of connections) {
    batch.set(
      db.collection("synthesis_connections").doc(connectionKey(connection)),
      { spoken: true },
      { merge: true }
    );
  }
  await batch.commit();
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
