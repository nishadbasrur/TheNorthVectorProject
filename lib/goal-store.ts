import { addDoc, collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export type GoalStatus = "active" | "completed" | "paused" | "cancelled";
export type GoalHorizon = "now" | "mid" | "long";
export type GoalRisk = "low" | "medium" | "high";

export type GoalRecord = {
  id: string;
  title: string;
  description: string;
  horizon: GoalHorizon;
  status: GoalStatus;
  progress: number;
  targetDate?: string;
  keyResults: string[];
  risk: GoalRisk;
  createdAt: string;
  updatedAt: string;
};

export type CreateGoalInput = Omit<GoalRecord, "id" | "createdAt" | "updatedAt">;

export async function createGoal(input: CreateGoalInput) {
  const now = new Date().toISOString();

  const goalData = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  Object.keys(goalData).forEach((key) => {
    if (goalData[key as keyof typeof goalData] === undefined) {
      delete goalData[key as keyof typeof goalData];
    }
  });

  return addDoc(collection(db, "goals"), goalData);
}

export async function getGoals() {
  const goalQuery = query(collection(db, "goals"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(goalQuery);

  return snapshot.docs.map((goalDoc) => ({
    id: goalDoc.id,
    ...goalDoc.data(),
  })) as GoalRecord[];
}

export async function updateGoalStatus(goalId: string, status: GoalStatus) {
  const now = new Date().toISOString();

  return updateDoc(doc(db, "goals", goalId), {
    status,
    updatedAt: now,
  });
}
