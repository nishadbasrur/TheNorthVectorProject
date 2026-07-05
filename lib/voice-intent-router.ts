import { auth } from "./firebase";
import { createTask, type CreateTaskInput } from "./task-store";

const TASK_TRIGGERS = ["add task", "create task", "new task", "remind me to", "i need to"];

const MAX_VOICE_SENTENCES = 4;

// lib/decision-engine.ts's own literal placeholder for "no specific rule
// matched" (see its default `recommendation` value). Since the rule-based
// classifier here has no dedicated "unrecognized" bucket of its own, this
// exact string is the only signal that the decision engine didn't actually
// have an answer — treat it as unrecognized instead of showing it verbatim.
const DECISION_ENGINE_GENERIC_FALLBACK = "Use retrieved context and risks to guide decision.";

// Deliberately not importing lib/decision-engine.ts's DecisionResult type —
// that module (and its node:fs-dependent memory-retrieval chain) is
// server-only and must never be imported, even for types, from this
// client-side router. This is the shape its JSON response actually has.
export type DecisionApiResult = {
  recommendation: string;
  reasons: string[];
  risks: string[];
  confidence: "low" | "medium" | "high";
  source: "new_evaluation" | "stored_decision";
  timesAsked?: number;
};

export type VoiceIntentResult =
  | { type: "task"; responseText: string }
  | { type: "decision"; responseText: string; decision: DecisionApiResult }
  | { type: "unrecognized"; responseText: string };

function matchTaskTrigger(lowerText: string): string | null {
  return TASK_TRIGGERS.find((trigger) => lowerText.startsWith(trigger)) ?? null;
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Voice_Interaction_Design.md's Brevity Rules: voice responses default to
// 1-4 sentences, longer explanations only on request.
function limitToSentences(text: string, maxSentences: number): string {
  const sentences = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  return sentences.slice(0, maxSentences).join(" ").trim();
}

async function getIdToken(): Promise<string | undefined> {
  return auth.currentUser?.getIdToken();
}

async function askDecisionEngine(question: string): Promise<DecisionApiResult> {
  const idToken = await getIdToken();

  const response = await fetch("/api/v1/decisions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error("Decision engine request failed.");
  }

  return response.json();
}

// Server-only (Anthropic SDK, "server-only" guard) — must be reached via
// fetch, same reasoning as askDecisionEngine above, never imported directly.
async function askVoiceFallback(text: string): Promise<string> {
  const idToken = await getIdToken();

  const response = await fetch("/api/v1/voice/respond", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    // Safe fallback if the API call fails — never leave the user without a reply.
    return "I didn't catch that clearly — mind trying again?";
  }

  const data = await response.json();
  return typeof data.responseText === "string" ? data.responseText : "I didn't catch that clearly — mind trying again?";
}

export async function routeVoiceInput(transcript: string): Promise<VoiceIntentResult> {
  const trimmed = transcript.trim();
  const trigger = matchTaskTrigger(trimmed.toLowerCase());

  if (trigger) {
    const title = capitalize(trimmed.slice(trigger.length).trim()) || trimmed;

    const input: CreateTaskInput = {
      title,
      description: "",
      status: "scheduled",
      priority: "medium",
      energy: "medium",
      domain: "personal",
    };

    await createTask(input);

    // "Light Confirmation" per Voice_Interaction_Design.md — task creation
    // doesn't need reasoning or tradeoffs, just a terse acknowledgment.
    return { type: "task", responseText: `Added: ${title}.` };
  }

  const decision = await askDecisionEngine(trimmed);

  if (decision.recommendation === DECISION_ENGINE_GENERIC_FALLBACK) {
    const responseText = await askVoiceFallback(trimmed);
    return { type: "unrecognized", responseText };
  }

  return {
    type: "decision",
    responseText: limitToSentences(decision.recommendation, MAX_VOICE_SENTENCES),
    decision,
  };
}
