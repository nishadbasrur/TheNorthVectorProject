import "server-only";
import { getUnannouncedApprovedCapability, markCapabilityAnnounced } from "./capability-gap-store";
import { getUnspokenConnections, markConnectionsSpoken } from "./synthesis-store";
import { getSurfaceableSignal, markSignalSurfaced, type RecurringSignalKind } from "./recurring-signal-store";

// Single composition point for everything that wants to open a fresh voice
// session unprompted — #58 (capability announcement), #99 (the existing
// synthesis-connection opener), and #88/#96 (recurring-signal offers) all
// converge here instead of each editing app/api/v1/voice/respond/route.ts's
// opener block directly. Priority order below is deliberate: a capability
// Nishad just approved is the most concrete/timely thing to mention; a
// recurring-signal offer is next; synthesis connections (the original,
// lowest-urgency "fyi" tier) are last.
export type Opener = {
  kind: "capability" | "recurring_signal" | "synthesis_connection";
  text: string;
  onDelivered: () => Promise<void>;
};

// #96 before #88 — "you've asked this 3 times today" is a same-day, more
// immediately actionable offer than #88's "you've mentioned this a few
// times over two weeks," so it takes priority when both are outstanding.
const RECURRING_SIGNAL_PRIORITY: RecurringSignalKind[] = ["question_category", "stated_intent"];

export async function pickOpener(): Promise<Opener | null> {
  const capability = await getUnannouncedApprovedCapability();
  if (capability) {
    const label = capability.summary ?? capability.toolName ?? capability.capability;
    return {
      kind: "capability",
      text:
        `Something worth mentioning came up since you last talked and hasn't been brought up yet: ` +
        `you just approved a new capability — ${label}. It's live now. If it fits naturally, lead ` +
        `with this before addressing what he just said — brief, in your own words, not a script. If ` +
        `it genuinely doesn't fit this specific turn, it's fine to skip it.`,
      onDelivered: () => markCapabilityAnnounced(capability.id),
    };
  }

  for (const kind of RECURRING_SIGNAL_PRIORITY) {
    const signal = await getSurfaceableSignal(kind);
    if (!signal) continue;

    const framing =
      kind === "question_category"
        ? `you've asked about the same thing (${signal.label}) several times today — worth just having North handle that going forward without being asked`
        : `you've mentioned wanting to do this (${signal.label}) a few times now without it happening`;

    return {
      kind: "recurring_signal",
      text:
        `Something worth mentioning came up since you last talked and hasn't been brought up yet: ` +
        `${framing}. Name this once, plainly, without nagging — offer it, don't push it. If it ` +
        `genuinely doesn't fit this specific turn, it's fine to skip it.`,
      onDelivered: () => markSignalSurfaced(kind, signal.key),
    };
  }

  const [connection] = await getUnspokenConnections(1);
  if (connection) {
    return {
      kind: "synthesis_connection",
      // Unchanged wording from the original inline opener block (#99) — this
      // exact text is what's being regression-checked.
      text:
        `Something worth mentioning came up since you last talked and hasn't been brought up yet: ` +
        `${connection.connection} ${connection.whyItMatters} If it fits naturally, lead with this ` +
        `before addressing what he just said — brief, in your own words, not a script ("Before you ` +
        `ask — " is one way to frame it, not the only one). If it genuinely doesn't fit this specific ` +
        `turn, it's fine to skip it.`,
      onDelivered: () => markConnectionsSpoken([connection]),
    };
  }

  return null;
}
