import { collection, doc, getDoc, getDocs, increment, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface StoredDecision {
  question: string;
  recommendation: string;
  reasons: string[];
  risks: string[];
  confidence: string;
  createdAt: string;
  timesAsked: number;
}

function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

export async function getStoredDecision(question: string) {
  const key = normalizeQuestion(question);
  const decisionRef = doc(db, "decisions", key);
  const snapshot = await getDoc(decisionRef);

  if (!snapshot.exists()) {
    return null;
  }

  await updateDoc(decisionRef, { timesAsked: increment(1) });

  const decision = snapshot.data() as StoredDecision;
  return { ...decision, timesAsked: decision.timesAsked + 1 };
}

export async function storeDecision(
  question: string,
  decision: Omit<StoredDecision, "question" | "createdAt" | "timesAsked">
) {
  const key = normalizeQuestion(question);

  await setDoc(doc(db, "decisions", key), {
    question,
    createdAt: new Date().toISOString(),
    timesAsked: 1,
    ...decision,
  });
}

export async function getDecisions() {
  const decisionQuery = query(collection(db, "decisions"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(decisionQuery);

  return snapshot.docs.map((decisionDoc) => decisionDoc.data()) as StoredDecision[];
}
