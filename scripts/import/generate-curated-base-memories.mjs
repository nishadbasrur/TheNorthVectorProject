import fs from "node:fs";

const OUTPUT = "data/imports/openai-export/curated-base-memories.v1.json";

const now = new Date().toISOString();

const memories = [
  {
    type: "identity",
    domain: "identity",
    content:
      "Nishad is highly future-oriented, systems-thinking, reflective, and ambitious. He naturally thinks in long time horizons and connects academics, career, finances, family, environment, productivity, and identity into one broader life system.",
    confidence: 0.98,
  },
  {
    type: "value",
    domain: "identity",
    content:
      "Nishad is primarily motivated by alignment, control, stability, competence, and building a sustainable high-level life, not by prestige alone.",
    confidence: 0.95,
  },
  {
    type: "value",
    domain: "identity",
    content:
      "Nishad values intentionality, structure, professionalism, refinement, competence, calmness, discipline, responsibility, and long-term strategic thinking.",
    confidence: 0.98,
  },
  {
    type: "aversion",
    domain: "identity",
    content:
      "Nishad strongly dislikes chaos, laziness, performative behavior, flakiness, entitlement, poor communication, emotional irrationality, and immature or unserious environments.",
    confidence: 0.95,
  },
  {
    type: "goal",
    domain: "career",
    content:
      "Nishad’s long-term professional goal is to become a physician, with orthopedic surgery as the current preferred specialty.",
    confidence: 0.98,
  },
  {
    type: "goal",
    domain: "career",
    content:
      "Nishad is interested in orthopedic surgery because of precision, structure, tangible impact, restoration, procedural skill, and long-term financial sustainability.",
    confidence: 0.92,
  },
  {
    type: "goal",
    domain: "career",
    content:
      "Nishad is interested in potential long-term paths involving private practice ownership, ambulatory surgery centers, healthcare entrepreneurship, and professional autonomy.",
    confidence: 0.9,
  },
  {
    type: "fact",
    domain: "education",
    content:
      "Nishad is attending UConn Storrs starting Fall 2026 as a Physiology and Neurobiology major on the pre-med track.",
    confidence: 0.98,
  },
  {
    type: "goal",
    domain: "education",
    content:
      "Nishad wants to maintain a medical-school-competitive GPA and treat early college science courses as high-leverage foundation work.",
    confidence: 0.96,
  },
  {
    type: "constraint",
    domain: "education",
    content:
      "Nishad should avoid overloading his first college semester if doing so would threaten GPA, sleep, stability, or long-term pre-med performance.",
    confidence: 0.9,
  },
  {
    type: "learning_profile",
    domain: "education",
    content:
      "Nishad performs better when vague academic pressure is converted into concrete study blocks, specific topics, timelines, and measurable next actions.",
    confidence: 0.95,
  },
  {
    type: "learning_profile",
    domain: "education",
    content:
      "Nishad has identified algebra manipulation, exponent rules, logarithms, unit circle fluency, radians, and graph interpretation as important math foundation areas to strengthen.",
    confidence: 0.9,
  },
  {
    type: "project",
    domain: "projects",
    content:
      "North Vector is intended to be Nishad’s personal AI Chief of Staff, not merely a reactive chatbot or generic assistant.",
    confidence: 0.99,
  },
  {
    type: "project_requirement",
    domain: "projects",
    content:
      "North Vector should understand Nishad’s goals, priorities, obligations, projects, schedule, risks, preferences, and life systems, then help him execute against them.",
    confidence: 0.98,
  },
  {
    type: "principle",
    domain: "projects",
    content:
      "North Vector should optimize for long-term alignment rather than short-term comfort.",
    confidence: 0.99,
  },
  {
    type: "principle",
    domain: "projects",
    content:
      "North Vector should be proactive: it should notice conflicts, risks, and high-leverage actions before Nishad has to ask.",
    confidence: 0.97,
  },
  {
    type: "principle",
    domain: "projects",
    content:
      "North Vector should request approval before consequence-bearing actions such as sending emails, spending money, deleting files, or making major schedule changes.",
    confidence: 0.98,
  },
  {
    type: "decision_framework",
    domain: "identity",
    content:
      "When priorities conflict, Nishad’s system should prioritize physical safety, health, mental health, and legal obligations first; academic performance and medical-school competitiveness next; then optionality, financial stability, reputation, relationships, projects, and entertainment.",
    confidence: 0.98,
  },
  {
    type: "decision_framework",
    domain: "identity",
    content:
      "Nishad’s optionality framework asks which option gives Future Nishad the greatest number of high-quality choices.",
    confidence: 0.98,
  },
  {
    type: "decision_framework",
    domain: "identity",
    content:
      "For important decisions, Nishad benefits from evaluating long-term impact, reversibility, downside risk, opportunity cost, alignment with values, and effect on future optionality.",
    confidence: 0.96,
  },
  {
    type: "behavioral_pattern",
    domain: "identity",
    content:
      "Nishad tends to overthink major decisions and can carry many psychological open loops; he benefits from converting abstract worry into structured plans and concrete next actions.",
    confidence: 0.94,
  },
  {
    type: "behavioral_pattern",
    domain: "identity",
    content:
      "When emotionally overloaded, Nishad may withdraw, become quiet, shut down, or struggle to communicate in heated environments.",
    confidence: 0.9,
  },
  {
    type: "strength",
    domain: "identity",
    content:
      "Nishad’s strengths include strategic planning, communication, professionalism, emotional insight, persistence, long-term thinking, systems thinking, and willingness to self-reflect.",
    confidence: 0.95,
  },
  {
    type: "risk",
    domain: "identity",
    content:
      "Nishad is vulnerable to overthinking, catastrophizing, future-oriented anxiety, emotional exhaustion, perfectionistic thinking, and mental overload.",
    confidence: 0.92,
  },
  {
    type: "principle",
    domain: "identity",
    content:
      "Nishad strongly believes systems beat willpower.",
    confidence: 0.98,
  },
  {
    type: "preference",
    domain: "style",
    content:
      "Nishad prefers quiet luxury, understated refinement, classic menswear, maturity, structure, and professional presentation over flashy or performative status signaling.",
    confidence: 0.95,
  },
  {
    type: "principle",
    domain: "style",
    content:
      "Nishad believes presentation affects perception and opportunity, but aesthetics should support competence rather than replace it.",
    confidence: 0.94,
  },
  {
    type: "goal",
    domain: "finance",
    content:
      "Nishad wants to build strong credit early, minimize unnecessary debt, save consistently, invest responsibly, and preserve financial optionality.",
    confidence: 0.96,
  },
  {
    type: "constraint",
    domain: "finance",
    content:
      "Nishad’s financial decisions should prioritize sustainability, resilience, optionality, and avoiding avoidable debt.",
    confidence: 0.95,
  },
  {
    type: "project",
    domain: "projects",
    content:
      "Nishad founded Etherea Foundation, including TechLink and senior technology support initiatives focused on digital literacy, intergenerational support, and community service.",
    confidence: 0.96,
  },
  {
    type: "project_learning",
    domain: "projects",
    content:
      "Through Etherea and TechLink, Nishad learned about leadership, operations, outreach, volunteer coordination, sustainability limits, conflict management, and the emotional weight of responsibility.",
    confidence: 0.93,
  },
  {
    type: "project",
    domain: "projects",
    content:
      "Nishad has a digital rear-view smart glasses concept focused on pedestrian safety, situational awareness, rear-facing camera feeds, and walking or safety modes.",
    confidence: 0.92,
  },
  {
    type: "interface_preference",
    domain: "projects",
    content:
      "Nishad is interested in voice and wearable interfaces because typing everything is friction-heavy, and audible recitation could make memory capture and daily interaction easier.",
    confidence: 0.94,
  },
  {
    type: "life_vision",
    domain: "identity",
    content:
      "Nishad’s long-term life vision includes professional mastery, financial independence, strong family life, calm suburban stability, health, meaningful relationships, and a self-authored life.",
    confidence: 0.97,
  },
  {
    type: "preference",
    domain: "lifestyle",
    content:
      "Nishad is drawn toward calm, structure, warm weather, suburban stability, family-centered living, and quiet affluence rather than chaotic or performative environments.",
    confidence: 0.92,
  },
];

const output = memories.map((memory, index) => ({
  id: `curated_memory_${String(index + 1).padStart(5, "0")}`,
  status: "pending_review",
  created_at: now,
  ...memory,
}));

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));

console.log(`Wrote ${output.length} curated base memories to ${OUTPUT}`);