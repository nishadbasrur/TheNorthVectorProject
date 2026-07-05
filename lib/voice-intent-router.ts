import { auth } from "./firebase";
import { createTask, type CreateTaskInput } from "./task-store";

const TASK_TRIGGERS = ["add task", "create task", "new task", "remind me to", "i need to"];

const MAX_VOICE_SENTENCES = 4;

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
  | { type: "decision"; responseText: string; decision: DecisionApiResult };

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

async function askDecisionEngine(question: string): Promise<DecisionApiResult> {
  const idToken = await auth.currentUser?.getIdToken();

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

  return {
    type: "decision",
    responseText: limitToSentences(decision.recommendation, MAX_VOICE_SENTENCES),
    decision,
  };
}
