export interface StoredDecision {
  question: string;
  recommendation: string;
  reasons: string[];
  risks: string[];
  confidence: string;
  createdAt: string;
  timesAsked: number;
}

const decisionStore = new Map<string, StoredDecision>();

function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function getStoredDecision(question: string) {
  const key = normalizeQuestion(question);
  const decision = decisionStore.get(key);

  if (!decision) {
    return null;
  }

  decision.timesAsked += 1;
  return decision;
}

export function storeDecision(
  question: string,
  decision: Omit<StoredDecision, "question" | "createdAt" | "timesAsked">
) {
  const key = normalizeQuestion(question);

  decisionStore.set(key, {
    question,
    createdAt: new Date().toISOString(),
    timesAsked: 1,
    ...decision,
  });
}