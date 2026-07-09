// Speech adaptation vocabulary for lib/google-stt.ts — curated from Nishad's
// own memory/project data (data/imports/reconciled-memories.v1.json), not
// guessed, and deliberately kept short. Google's own guidance: use as few
// phrases as meaningfully needed, since an over-broad hint list degrades
// recognition accuracy on everything else, not just the hinted terms.
//
// Boost 10-15 is Google's suggested starting range for meaningfully favoring
// a term without over-correcting into false-positive matches on
// similar-sounding words. Needs real tuning against actual test audio — see
// docs/integrations or task history for the verification process, not a
// "set once" value.
export const PHRASE_HINT_BOOST = 15;

export const PHRASE_HINTS: string[] = [
  "UConn",
  "Storrs",
  "Etherea",
  "Etherea Foundation",
  "SilverSupport",
  "TechLink",
  "ArbScore",
  "Kalshi",
  "Nishad",
  "North Vector",
  "PNB",
  "LEAP",
  "PSLF",
];
