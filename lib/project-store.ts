import { addDoc, collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export type ProjectStatus = "planning" | "active" | "completed" | "paused" | "cancelled";

export type ProjectRecord = {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  goalId?: string;
  taskCount: number;
  doneCount: number;
  nextMilestone?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = Omit<ProjectRecord, "id" | "createdAt" | "updatedAt">;

export async function createProject(input: CreateProjectInput) {
  const now = new Date().toISOString();

  const projectData = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  Object.keys(projectData).forEach((key) => {
    if (projectData[key as keyof typeof projectData] === undefined) {
      delete projectData[key as keyof typeof projectData];
    }
  });

  return addDoc(collection(db, "projects"), projectData);
}

export async function getProjects() {
  const projectQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(projectQuery);

  return snapshot.docs.map((projectDoc) => ({
    id: projectDoc.id,
    ...projectDoc.data(),
  })) as ProjectRecord[];
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const now = new Date().toISOString();

  return updateDoc(doc(db, "projects", projectId), {
    status,
    updatedAt: now,
  });
}
