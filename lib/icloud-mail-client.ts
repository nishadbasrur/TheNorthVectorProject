import { ImapFlow } from "imapflow";
import type { InboxMessage } from "./gmail-client";

// iCloud Mail has no OAuth/modern API — IMAP with an app-specific password
// is the only third-party access Apple offers (generated at
// appleid.apple.com → Sign-In and Security → App-Specific Passwords, a
// manual step only Nishad can do, same category as the Google OAuth
// consent walkthroughs earlier in this project). Reuses gmail-client.ts's
// InboxMessage shape so tool-dispatcher.ts's formatting logic doesn't need
// a parallel version per provider.
const IMAP_HOST = "imap.mail.me.com";
const IMAP_PORT = 993;

async function withIcloudClient<T>(fn: (client: ImapFlow) => Promise<T>): Promise<T> {
  const user = process.env.ICLOUD_EMAIL_ADDRESS;
  const pass = process.env.ICLOUD_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("ICLOUD_EMAIL_ADDRESS and ICLOUD_APP_PASSWORD must both be set.");
  }

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout();
  }
}

function extractBodyText(source: Buffer | undefined): string {
  if (!source) return "";
  // Messages are fetched with bodyStructure text/plain preferred; for a
  // quick snippet, plain-text decoding of the first ~2000 bytes is enough
  // — full MIME multipart walking (like gmail-client.ts does) isn't worth
  // the complexity here since this is only ever used for a short spoken
  // summary, not a full read.
  return source.toString("utf-8").slice(0, 2000);
}

// Fetches the most recent messages from the INBOX, newest first — mirrors
// gmail-client.ts's getRecentInboxMessages so tool-dispatcher.ts can format
// both the same way.
export async function getRecentIcloudMessages(maxResults = 25): Promise<InboxMessage[]> {
  return withIcloudClient(async (client) => {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const status = await client.status("INBOX", { messages: true });
      const total = status.messages ?? 0;
      if (total === 0) return [];

      const start = Math.max(1, total - maxResults + 1);
      const range = `${start}:${total}`;

      const messages: InboxMessage[] = [];
      for await (const message of client.fetch(range, { envelope: true, bodyParts: ["TEXT"] })) {
        const envelope = message.envelope;
        messages.push({
          id: String(message.uid),
          subject: envelope?.subject ?? "(no subject)",
          from: envelope?.from?.[0]?.address ?? "(unknown sender)",
          date: envelope?.date ? new Date(envelope.date).toISOString() : "",
          bodyText: extractBodyText(message.bodyParts?.get("TEXT")),
        });
      }

      return messages.reverse(); // newest first, matching getRecentInboxMessages
    } finally {
      lock.release();
    }
  });
}

// IMAP's SEARCH TEXT criterion (searches headers + body) — much less
// expressive than Gmail's q= operators, but the closest equivalent iCloud
// actually supports. Good enough for "find that email about X."
export async function searchIcloudEmails(query: string, maxResults = 10): Promise<InboxMessage[]> {
  return withIcloudClient(async (client) => {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ text: query }, { uid: true });
      if (!uids || uids.length === 0) return [];

      const recentUids = uids.slice(-maxResults);

      const messages: InboxMessage[] = [];
      for await (const message of client.fetch(recentUids, { envelope: true, bodyParts: ["TEXT"] }, { uid: true })) {
        const envelope = message.envelope;
        messages.push({
          id: String(message.uid),
          subject: envelope?.subject ?? "(no subject)",
          from: envelope?.from?.[0]?.address ?? "(unknown sender)",
          date: envelope?.date ? new Date(envelope.date).toISOString() : "",
          bodyText: extractBodyText(message.bodyParts?.get("TEXT")),
        });
      }

      return messages.reverse();
    } finally {
      lock.release();
    }
  });
}
