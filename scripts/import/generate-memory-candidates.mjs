import fs from "node:fs";

const INPUT = "data/imports/openai-export/north_vector_priority_conversations.json";
const OUTPUT = "data/imports/openai-export/memory-candidates.v1.json";

const conversations = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const domainRules = [
  ["career", ["med school", "premed", "orthopedic", "career", "job"]],
  ["education", ["uconn", "class registration", "math placement", "college"]],
  ["finance", ["finance", "credit", "wealth", "amex"]],
  ["projects", ["techlink", "etherea", "chief", "north vector", "digital rear-view"]],
  ["identity", ["blueprint", "life", "personal"]],
  ["style", ["closet", "style", "hairstyle"]],
];

function inferDomain(title = "") {
  const t = title.toLowerCase();
  for (const [domain, keywords] of domainRules) {
    if (keywords.some((k) => t.includes(k))) return domain;
  }
  return "general";
}

function candidateId(index) {
  return `candidate_${String(index + 1).padStart(5, "0")}`;
}

const candidates = conversations.map((conversation, index) => {
  const userText = conversation.messages
    .filter((m) => m.role === "user")
    .map((m) => m.text)
    .join("\n")
    .slice(0, 12000);

  return {
    id: candidateId(index),
    status: "pending_review",
    confidence: "medium",
    source: {
      type: "openai_export",
      conversation_id: conversation.conversation_id,
      title: conversation.title,
      date: conversation.create_date,
      message_count: conversation.message_count,
    },
    memory_type: "source_conversation_summary",
    domain: inferDomain(conversation.title),
    title: conversation.title,
    raw_user_signal_preview: userText,
    proposed_memory: "",
    review_notes: "Needs AI/human summarization before promotion to permanent memory.",
    created_at: new Date().toISOString(),
  };
});

fs.writeFileSync(OUTPUT, JSON.stringify(candidates, null, 2));

console.log(`Read ${conversations.length} priority conversations.`);
console.log(`Wrote ${candidates.length} memory candidates to ${OUTPUT}`);