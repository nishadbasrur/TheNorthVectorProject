import { gmail, auth as googleAuth, type gmail_v1 } from "@googleapis/gmail";

// Shared with Next.js API routes (see app/api/v1/gmail/check-urgent/route.ts)
// — no "server-only" guard, same reasoning as lib/google-calendar-client.ts
// and lib/notion-client.ts.

let cachedClient: gmail_v1.Gmail | null = null;

// gmail.readonly only, deliberately covering the whole inbox (not scoped to
// a label) — see docs/integrations/calendar-notion-gmail-task.md Section 3.
// This client must never mark read/unread, archive, label, or reply.
function getGmailClient(): gmail_v1.Gmail {
  if (cachedClient) {
    return cachedClient;
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN must all be set."
    );
  }

  const oauth2Client = new googleAuth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  cachedClient = gmail({ version: "v1", auth: oauth2Client });
  return cachedClient;
}

export type InboxMessage = {
  id: string;
  subject: string;
  from: string;
  date: string;
  bodyText: string;
};

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

// Walks the MIME part tree looking for a text/plain part; falls back to
// text/html (tags stripped) if no plain-text part exists.
function extractBodyText(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return "";

  const queue: gmail_v1.Schema$MessagePart[] = [payload];
  let htmlFallback = "";

  while (queue.length > 0) {
    const part = queue.shift();
    if (!part) continue;

    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }

    if (part.mimeType === "text/html" && part.body?.data && !htmlFallback) {
      htmlFallback = decodeBase64Url(part.body.data).replace(/<[^>]+>/g, " ");
    }

    if (part.parts) {
      queue.push(...part.parts);
    }
  }

  return htmlFallback;
}

function getHeader(payload: gmail_v1.Schema$MessagePart | undefined, name: string): string {
  const header = payload?.headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value ?? "";
}

// Fetches recent inbox messages (full inbox — not label-scoped, per the
// explicit read-only-full-inbox decision) with subject + body text extracted
// for urgency evaluation. `maxResults` bounds each on-demand check's cost.
export async function getRecentInboxMessages(maxResults = 25): Promise<InboxMessage[]> {
  const client = getGmailClient();

  const listResponse = await client.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults,
  });

  const messageRefs = listResponse.data.messages ?? [];

  const messages = await Promise.all(
    messageRefs
      .filter((ref): ref is { id: string } => Boolean(ref.id))
      .map(async (ref) => {
        const full = await client.users.messages.get({
          userId: "me",
          id: ref.id,
          format: "full",
        });

        const subject = getHeader(full.data.payload, "Subject") || "(no subject)";
        const from = getHeader(full.data.payload, "From") || "(unknown sender)";
        const date = getHeader(full.data.payload, "Date") || "";
        const bodyText = extractBodyText(full.data.payload) || full.data.snippet || "";

        return { id: ref.id, subject, from, date, bodyText };
      })
  );

  return messages;
}
