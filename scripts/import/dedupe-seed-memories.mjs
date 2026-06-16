import fs from "node:fs";

const INPUT = "data/imports/openai-export/seed-memories.v1.json";
const OUTPUT = "data/imports/openai-export/base-memories.v1.json";

const memories = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const byContent = new Map();

for (const memory of memories) {
  const key = memory.content.toLowerCase().trim();

  if (!byContent.has(key)) {
    byContent.set(key, {
      ...memory,
      id: null,
      sources: [memory.source],
    });
  } else {
    const existing = byContent.get(key);
    existing.sources.push(memory.source);

    const oldConfidence = Number(existing.confidence) || 0;
    const newConfidence = Number(memory.confidence) || 0;
    existing.confidence = Math.max(oldConfidence, newConfidence);
  }
}

const deduped = Array.from(byContent.values()).map((memory, index) => {
  const { source, id, ...rest } = memory;

  return {
    ...rest,
    id: `base_memory_${String(index + 1).padStart(5, "0")}`,
    source_count: memory.sources.length,
  };
});

fs.writeFileSync(OUTPUT, JSON.stringify(deduped, null, 2));

console.log(`Read ${memories.length} seed memories.`);
console.log(`Wrote ${deduped.length} deduped base memories to ${OUTPUT}`);