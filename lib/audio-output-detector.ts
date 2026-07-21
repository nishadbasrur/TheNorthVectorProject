"use client";

// Whisper support (see 10-Implementation/Notes/ plan discussion) needs to
// know whether a private listening device is connected before deciding
// between a quiet spoken reply and a text-only one. Core2 — the actual
// intended hardware for this — doesn't exist yet (confirmed: documented in
// exactly one planning doc, always as unbuilt). Bluetooth-audio-output
// detection stands in as an interim proxy. Deliberately isolated to this one
// function so swapping in a real Core2 connection-status check later touches
// nothing else in the whisper-mode pipeline.
//
// Heuristic, not exact — device labels are OS/browser-assigned and not
// guaranteed to self-identify as Bluetooth. False negatives (a real Bluetooth
// device with a generic label) are possible; false positives are unlikely
// since built-in outputs consistently label themselves plainly ("Speakers",
// "MacBook Pro Speakers", etc.).
const PRIVATE_OUTPUT_LABEL_PATTERNS = [
  "bluetooth",
  "airpods",
  "buds",
  "headset",
  "earpods",
  "earphone",
  "wireless",
];

const BUILT_IN_LABEL_PATTERNS = ["speakers", "default", "built-in", "internal"];

function looksLikePrivateOutput(label: string): boolean {
  const lower = label.toLowerCase();
  if (BUILT_IN_LABEL_PATTERNS.some((pattern) => lower.includes(pattern))) return false;
  return PRIVATE_OUTPUT_LABEL_PATTERNS.some((pattern) => lower.includes(pattern));
}

export async function isPrivateAudioOutputConnected(): Promise<boolean> {
  if (!navigator.mediaDevices?.enumerateDevices) return false;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((device) => device.kind === "audiooutput" && looksLikePrivateOutput(device.label));
  } catch {
    // Enumeration can fail in some browsers/permission states — treat as
    // "no private device detected" rather than throw, same fail-safe
    // direction as everything else in the voice pipeline (text-only is the
    // safer default than assuming privacy that isn't there).
    return false;
  }
}
