// One-time promotion of data/imports/reconciled-memories.v1.json into the
// live Firestore `memories` collection, after explicit human review/approval
// of every entry (see chat history for the approval — Tier A + Tier B
// interpretive entries and all plain facts were approved together).
//
// Run from the project root with the FIREBASE_SERVICE_ACCOUNT_KEY env var
// available (e.g. `node --env-file=.env.local scripts/import/promote-reconciled-memories.mjs`).

import fs from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const INPUT = "data/imports/reconciled-memories.v1.json";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const entries = JSON.parse(fs.readFileSync(INPUT, "utf8"));

console.log(`Promoting ${entries.length} entries to Firestore memories collection...`);

let count = 0;
for (const entry of entries) {
  const doc = {
    content: entry.content,
    domain: entry.domain,
    type: entry.type,
    confidence: entry.confidence,
    source: "chatgpt-import",
    sourceVoice: entry.source_voice,
    sourceConversations: (entry.sources ?? []).map((s) => ({
      conversationId: s.conversation_id,
      title: s.title,
    })),
    createdAt: new Date().toISOString(),
    importedAt: FieldValue.serverTimestamp(),
  };

  if (entry.interpretive_tier) {
    doc.interpretiveTier = entry.interpretive_tier;
  }
  if (entry.note) {
    doc.importNote = entry.note;
  }

  await db.collection("memories").add(doc);
  count += 1;
}

console.log(`Done. Wrote ${count} documents.`);
