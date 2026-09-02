// Deliberately no "server-only" guard — like lib/google-calendar-client.ts
// and lib/firebase-admin.ts, this is shared between the Next.js app runtime
// (app/api/v1/voice/spontaneous-stream/route.ts, the Gmail-urgent
// integration point) and the esbuild-bundled Cloud Functions runtime
// (functions/src/hourly-checkin-scan.ts, task-reminder-scan.ts,
// class-end-scan.ts, gmail-webhook.ts) — both need to be able to enqueue a
// spontaneous-speech event, and Firestore (via adminDb) is the one thing
// both runtimes already share a client for.
import { adminDb } from "./firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type SpontaneousSpeechUrgency = "urgent" | "routine";

// One entry per real trigger source (see the fix note's own trigger list),
// plus "debug" for the manual test endpoint — kept out of the real four so
// test firings never get confused with real trigger analytics later.
export type SpontaneousSpeechSource = "gmail-urgent" | "hourly-checkin" | "task-reminder" | "class-end" | "debug";

// Routine items (check-ins, reminders, class-end nudges) share ONE cooldown
// across all three routine sources — not a per-source cooldown — since the
// actual failure mode being guarded against is "several unrelated routine
// triggers land close together and stack into a flood," not "one source
// fires too often on its own." Urgent items always bypass this entirely;
// "urgent" means "no chime, speak the instant the app is next at rest," not
// "subject to the same throttling as a check-in." 20 minutes is a starting
// default — trivial to retune here without touching anything else.
const ROUTINE_COOLDOWN_MS = 20 * 60 * 1000;

export type EnqueueResult = { enqueued: boolean; reason?: string };

export async function enqueueSpontaneousSpeech(input: {
  text: string;
  urgency: SpontaneousSpeechUrgency;
  source: SpontaneousSpeechSource;
}): Promise<EnqueueResult> {
  if (input.urgency === "urgent") {
    await adminDb.collection("spontaneous_speech_queue").add({
      text: input.text,
      urgency: input.urgency,
      source: input.source,
      delivered: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { enqueued: true };
  }

  const cooldownRef = adminDb.collection("spontaneous_speech_state").doc("routine_cooldown");
  const cooldownSnap = await cooldownRef.get();
  const lastEnqueuedAt = cooldownSnap.exists ? (cooldownSnap.data()?.lastEnqueuedAt as Timestamp | undefined) : undefined;

  if (lastEnqueuedAt && Date.now() - lastEnqueuedAt.toMillis() < ROUTINE_COOLDOWN_MS) {
    return { enqueued: false, reason: "cooldown" };
  }

  await adminDb.collection("spontaneous_speech_queue").add({
    text: input.text,
    urgency: input.urgency,
    source: input.source,
    delivered: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  await cooldownRef.set({ lastEnqueuedAt: FieldValue.serverTimestamp() });

  return { enqueued: true };
}

// Proxy for "is the Tauri app currently open and its spontaneous-speech
// connection alive" — see app/api/v1/voice/spontaneous-stream/route.ts,
// which writes/refreshes client_presence/main.lastSeenAt for as long as a
// client is connected. Used by the hourly check-in scan to skip an hour
// entirely (not queue a catch-up for later) when the Mac was asleep or the
// app wasn't running — deliberately NOT true macOS system-sleep detection
// (that would need native IOKit power-notification hooks in
// src-tauri/src/lib.rs, out of scope here — see the plan's own note on
// this). A dropped network connection during an otherwise-awake session
// would also read as "not present" for up to staleAfterMinutes; treated as
// an acceptable simplification, not a bug.
export async function isClientPresent(staleAfterMinutes = 10): Promise<boolean> {
  const snap = await adminDb.collection("client_presence").doc("main").get();
  if (!snap.exists) return false;

  const lastSeenAt = snap.data()?.lastSeenAt as Timestamp | undefined;
  if (!lastSeenAt) return false;

  return Date.now() - lastSeenAt.toMillis() <= staleAfterMinutes * 60 * 1000;
}
