import { addDoc, collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export type TaskStatus = "scheduled" | "active" | "completed" | "paused" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskEnergy = "low" | "medium" | "high";
export type TaskDomain = "academic" | "career" | "health" | "personal" | "north-vector";

export type TaskRecord = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  energy: TaskEnergy;
  domain: TaskDomain;
  goalId?: string;
  projectId?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type CreateTaskInput = Omit<TaskRecord, "id" | "createdAt" | "updatedAt" | "completedAt">;

export async function createTask(input: CreateTaskInput) {
  const now = new Date().toISOString();

  const taskData = {
    ...input,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  Object.keys(taskData).forEach((key) => {
    if (taskData[key as keyof typeof taskData] === undefined) {
      delete taskData[key as keyof typeof taskData];
    }
  });

  return addDoc(collection(db, "tasks"), taskData);
}


export async function getTasks() {
  const taskQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(taskQuery);

  return snapshot.docs.map((taskDoc) => ({
    id: taskDoc.id,
    ...taskDoc.data(),
  })) as TaskRecord[];
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const now = new Date().toISOString();

  return updateDoc(doc(db, "tasks", taskId), {
    status,
    updatedAt: now,
    completedAt: status === "completed" ? now : null,
  });
}
