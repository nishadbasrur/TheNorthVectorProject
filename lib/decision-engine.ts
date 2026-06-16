import { retrieveLocalMemories } from "./memory-retrieval";

export interface DecisionResult {
  recommendation: string;
  reasons: string[];
  risks: string[];
  confidence: "low" | "medium" | "high";
}

export function evaluateDecision(
  question: string
): DecisionResult {
  const memories = retrieveLocalMemories(question, 10);

  const reasons = memories
    .slice(0, 3)
    .map((memory) => memory.content);

  const risks: string[] = [];

  if (
    question.toLowerCase().includes("class") ||
    question.toLowerCase().includes("semester")
  ) {
    risks.push("Potential GPA impact");
    risks.push("Reduced study bandwidth");
  }

  return {
    recommendation:
      "Use retrieved context and risks to guide decision.",
    reasons,
    risks,
    confidence: "medium",
  };
}