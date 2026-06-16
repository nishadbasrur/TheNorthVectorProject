import fs from "node:fs";
import path from "node:path";

export type LocalMemory = {
  id: string;
  status: string;
  created_at: string;
  type: string;
  domain: string;
  content: string;
  confidence: number;
};

const LOCAL_MEMORY_PATH = path.join(
  process.cwd(),
  "data",
  "memories",
  "base-memories.local.json"
);

export function loadLocalMemories(): LocalMemory[] {
  if (!fs.existsSync(LOCAL_MEMORY_PATH)) {
    return [];
  }

  const raw = fs.readFileSync(LOCAL_MEMORY_PATH, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((memory) => {
    return (
      typeof memory.id === "string" &&
      typeof memory.content === "string" &&
      typeof memory.domain === "string" &&
      typeof memory.type === "string"
    );
  });
}
