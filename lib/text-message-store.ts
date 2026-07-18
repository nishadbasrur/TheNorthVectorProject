import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Deliberately no "server-only" guard — shared cross-runtime pattern (only
// used from the Next.js app currently, but kept consistent with
// lib/opportunity-store.ts and friends in case Cloud Functions ever need
// it too, e.g. a future scheduled urgency pass over texts).
function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

export interface IncomingTextMessage {
  sender: string; // phone number or email, whatever handle chat.db has for this message
  senderName: string | null; // resolved contact name, if the agent could determine one
  text: string;
  isGroupChat: boolean;
  chatId: string; // stable per-conversation identifier from chat.db
  sentAt: string; // ISO timestamp of when the message was actually sent
}

export interface StoredTextMessage extends IncomingTextMessage {
  id: string;
  receivedAt: string; // when this backend actually received/stored it
}

const COLLECTION = "text_messages";

export async function saveTextMessage(message: IncomingTextMessage): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.collection(COLLECTION).add({
    ...message,
    receivedAt: FieldValue.serverTimestamp(),
  });
}

function parseStoredMessage(id: string, data: FirebaseFirestore.DocumentData): StoredTextMessage {
  return {
    id,
    sender: typeof data.sender === "string" ? data.sender : "",
    senderName: typeof data.senderName === "string" ? data.senderName : null,
    text: typeof data.text === "string" ? data.text : "",
    isGroupChat: Boolean(data.isGroupChat),
    chatId: typeof data.chatId === "string" ? data.chatId : "",
    sentAt: typeof data.sentAt === "string" ? data.sentAt : "",
    receivedAt: data.receivedAt?.toDate ? data.receivedAt.toDate().toISOString() : "",
  };
}

// Backs the check_messages voice tool — most recent first, mirrors
// getRecentInboxMessages'/getRecentIcloudMessages' shape so
// lib/tool-dispatcher.ts can format all of them the same way.
export async function getRecentTextMessages(maxResults = 25): Promise<StoredTextMessage[]> {
  ensureAdminApp();
  const db = getFirestore();
  const snapshot = await db.collection(COLLECTION).orderBy("receivedAt", "desc").limit(maxResults).get();
  return snapshot.docs.map((doc) => parseStoredMessage(doc.id, doc.data()));
}

// Simple substring match over a larger recent window — no full-text search
// index, same "good enough for one household's message volume" reasoning
// as lib/icloud-mail-client.ts's IMAP TEXT search. A real search index is a
// reasonable v2 if this collection grows large; not needed for the
// foundation this is.
export async function searchTextMessages(query: string, maxResults = 200): Promise<StoredTextMessage[]> {
  const recent = await getRecentTextMessages(maxResults);
  const needle = query.toLowerCase();
  return recent.filter(
    (m) =>
      m.text.toLowerCase().includes(needle) ||
      m.sender.toLowerCase().includes(needle) ||
      (m.senderName ?? "").toLowerCase().includes(needle)
  );
}
