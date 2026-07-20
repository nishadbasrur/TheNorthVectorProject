import "server-only";
import { getUnannouncedApprovedCapability, markCapabilityAnnounced } from "./capability-gap-store";
import { getUnspokenConnections, markConnectionsSpoken } from "./synthesis-store";

// Single composition point for everything that wants to open a fresh voice
// session unprompted — #58 (capability announcement), #99 (the existing
// synthesis-connection opener), and Unit 3's recurring-signal offers
// (#88/#96) all converge here instead of each editing
// app/api/v1/voice/respond/route.ts's opener block directly. Priority order
// below is deliberate: a capability Nishad just approved is the most
// concrete/timely thing to mention; a recurring-signal offer is next;
// synthesis connections (the original, lowest-urgency "fyi" tier) are last.
export type Opener = {
  kind: "capability" | "synthesis_connection";
  text: string;
  onDelivered: () => Promise<void>;
};

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

  // Unit 3 adds a recurring-signal (#88/#96) candidate here, between the
  // capability tier above and the synthesis-connection tier below.

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
