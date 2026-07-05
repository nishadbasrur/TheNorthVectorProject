import "server-only";
import { retrieveLocalMemories } from "@/lib/memory-retrieval";
import { getStoredDecision, storeDecision } from "@/lib/decision-memory-admin";

export interface DecisionResult {
  recommendation: string;
  reasons: string[];
  risks: string[];
  confidence: "low" | "medium" | "high";
  source: "new_evaluation" | "stored_decision";
  timesAsked?: number;
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export async function evaluateDecision(question: string): Promise<DecisionResult> {
  const storedDecision = await getStoredDecision(question);

  if (storedDecision) {
    return {
      recommendation: storedDecision.recommendation,
      reasons: storedDecision.reasons,
      risks: storedDecision.risks,
      confidence: storedDecision.confidence as DecisionResult["confidence"],
      source: "stored_decision",
      timesAsked: storedDecision.timesAsked,
    };
  }

  const normalizedQuestion = question.toLowerCase();
  const memories = retrieveLocalMemories(question, 10);

  const reasons = memories.slice(0, 3).map((memory) => memory.content);
  const risks: string[] = [];

  let recommendation = "Use retrieved context and risks to guide decision.";
  let confidence: DecisionResult["confidence"] = "medium";

  if (
    includesAny(normalizedQuestion, ["class", "semester", "credits", "course"])
  ) {
    recommendation =
      "Do not add another class unless there is a clear strategic reason. Protecting GPA, sleep, and stability matters more than adding extra credits right now.";

    risks.push("Potential GPA impact");
    risks.push("Reduced study bandwidth");
    risks.push("Higher stress during the first college semester");

    confidence = "high";
  }

  const result: DecisionResult = {
    recommendation,
    reasons,
    risks,
    confidence,
    source: "new_evaluation",
  };

  await storeDecision(question, {
    recommendation,
    reasons,
    risks,
    confidence,
  });

  return result;
}