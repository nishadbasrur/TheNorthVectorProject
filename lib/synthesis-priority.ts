import type { SynthesisConnection } from "./synthesis-engine";

// Rewritten per North_Vector_Synthesis_Engine_Plan.md Section 0.1 — the
// original draft suppressed low-confidence and "fyi" connections by
// default. That's the wrong calibration for the noticing layer
// specifically; inverted below. What did NOT change: this function's only
// output is which channel something gets communicated through. Nothing in
// this file, or anywhere in the synthesis system, causes an action to
// execute — that boundary lives entirely in lib/tool-dispatcher.ts and is
// untouched by this system, which has no mechanism to call into it.
export function deliveryChannel(connection: SynthesisConnection): "interrupt" | "summary" | "suppress" {
  // Only suppress entirely on the narrowest case: low confidence AND the
  // lowest urgency tier at once. Anything with real confidence, or
  // anything urgent regardless of confidence, still gets surfaced
  // somewhere — a wrong "fyi" costs nothing, so the bar to suppress it
  // entirely should be high, not the default.
  if (connection.confidence === "low" && connection.urgency === "fyi") {
    return "suppress";
  }

  // "now" and "today" interrupt (push notification) regardless of
  // confidence — even a medium/low-confidence "this seems time-sensitive"
  // is worth a real-time nudge, since the cost of surfacing it wrong is
  // just a glance, not an action taken.
  if (connection.urgency === "now" || connection.urgency === "today") {
    return "interrupt";
  }

  // Everything else (this_week, fyi-but-not-lowest-confidence) goes to a
  // summary channel rather than an interrupt — still surfaced, just not
  // pushed as urgent. This is the actual mechanism for "surface generously
  // without spamming push notifications constantly": volume goes up, but
  // through a lower-friction channel, not suppressed outright.
  return "summary";
}
