import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function createMemory(content: string) {
  return addDoc(collection(db, "memories"), {
    content,
    createdAt: new Date().toISOString(),
  });
}

export async function getMemories() {
  const snapshot = await getDocs(collection(db, "memories"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

