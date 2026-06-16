import fs from "node:fs";

const INPUT = "data/imports/openai-export/north_vector_priority_conversations.json";
const OUTPUT = "data/imports/openai-export/seed-memories.v1.json";

const conversations = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const priorityTitles = [
  "AI Chief of Staff Concept",
  "Personal Blueprint Strategy",
  "Life Blueprint Strategy",
  "Blueprint Plan",
  "Med School Strategy Consultation",
  "Finance Strategy Discussion",
  "Class Registration Assistance",
  "UConn Math Placement Score",
  "Digital Rear-View Glasses",
];

const selected = conversations.filter((c) =>
  priorityTitles.includes(c.title)
);

function userText(c) {
  return c.messages
    .filter((m) => m.role === "user")
    .map((m) => m.text)
    .join("\n");
}

function source(c) {
  return {
    type: "openai_export",
    conversation_id: c.conversation_id,
    title: c.title,
    date: c.create_date,
  };
}

const memories = [];

for (const c of selected) {
  const text = userText(c).toLowerCase();

  if (text.includes("orthopedic")) {
    memories.push({
      type: "goal",
      domain: "career",
      content: "Nishad’s long-term career goal is to become a physician, with orthopedic surgery as the current preferred specialty.",
      confidence: 0.95,
      status: "pending_review",
      source: source(c),
    });
  }

  if (text.includes("uconn")) {
    memories.push({
      type: "fact",
      domain: "education",
      content: "Nishad is attending UConn Storrs starting Fall 2026 as a Physiology and Neurobiology major on the pre-med track.",
      confidence: 0.95,
      status: "pending_review",
      source: source(c),
    });
  }

  if (text.includes("chem 1127q")) {
    memories.push({
      type: "goal",
      domain: "education",
      content: "CHEM 1127Q is a high-priority course for Nishad because it directly affects his pre-med GPA foundation.",
      confidence: 0.9,
      status: "pending_review",
      source: source(c),
    });
  }

  if (text.includes("chief of staff")) {
    memories.push({
      type: "project",
      domain: "projects",
      content: "North Vector is intended to function as Nishad’s personal AI Chief of Staff, not merely a reactive chatbot.",
      confidence: 0.98,
      status: "pending_review",
      source: source(c),
    });
  }

  if (text.includes("not optimize for short-term comfort")) {
    memories.push({
      type: "principle",
      domain: "identity",
      content: "North should optimize for Nishad’s long-term alignment rather than short-term comfort.",
      confidence: 0.98,
      status: "pending_review",
      source: source(c),
    });
  }

  if (text.includes("systems beat willpower")) {
    memories.push({
      type: "principle",
      domain: "identity",
      content: "Nishad strongly believes systems beat willpower.",
      confidence: 0.95,
      status: "pending_review",
      source: source(c),
    });
  }

  if (text.includes("build strong credit")) {
    memories.push({
      type: "goal",
      domain: "finance",
      content: "Nishad wants to build strong credit early and use financial systems intentionally.",
      confidence: 0.9,
      status: "pending_review",
      source: source(c),
    });
  }

  if (text.includes("minimal debt") || text.includes("minimize unnecessary debt")) {
    memories.push({
      type: "constraint",
      domain: "finance",
      content: "Nishad wants to minimize unnecessary debt and preserve future financial optionality.",
      confidence: 0.9,
      status: "pending_review",
      source: source(c),
    });
  }

  if (text.includes("digital rear-view")) {
    memories.push({
      type: "project",
      domain: "projects",
      content: "Nishad has a digital rear-view smart glasses concept focused on pedestrian safety and situational awareness.",
      confidence: 0.9,
      status: "pending_review",
      source: source(c),
    });
  }

  if (text.includes("quiet luxury") || text.includes("quiet affluence")) {
    memories.push({
      type: "preference",
      domain: "style",
      content: "Nishad prefers quiet luxury, understated refinement, and substance over flashy status signaling.",
      confidence: 0.9,
      status: "pending_review",
      source: source(c),
    });
  }
}

const withIds = memories.map((m, i) => ({
  id: `seed_memory_${String(i + 1).padStart(5, "0")}`,
  created_at: new Date().toISOString(),
  ...m,
}));

fs.writeFileSync(OUTPUT, JSON.stringify(withIds, null, 2));

console.log(`Read ${selected.length} selected source conversations.`);
console.log(`Wrote ${withIds.length} seed memories to ${OUTPUT}`);