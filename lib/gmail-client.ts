import { gmail, auth as googleAuth, type gmail_v1 } from "@googleapis/gmail";

// Shared with Next.js API routes (see app/api/v1/gmail/check-urgent/route.ts)
// — no "server-only" guard, same reasoning as lib/google-calendar-client.ts
// and lib/notion-client.ts.

let cachedClient: gmail_v1.Gmail | null = null;

// gmail.modify, deliberately covering the whole inbox (not scoped to a
// label) — see docs/integrations/calendar-notion-gmail-task.md and
// North_Vector_Full_Read_Write_Calendar_Gmail_Access_Plan.md. Widened from
// gmail.readonly to support sendEmail/searchEmails/trashEmail. Deliberately
// NOT the broader https://mail.google.com/ scope — trashEmail() moves mail
// to Trash (recoverable for 30 days), never permanently erases it.
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

// Shared by getRecentInboxMessages and searchEmails — both end up with a
// list of message refs from Gmail and need the same full-fetch + field
// extraction to turn them into InboxMessage.
async function fetchMessagesByRefs(
  client: gmail_v1.Gmail,
  refs: { id?: string | null }[]
): Promise<InboxMessage[]> {
  return Promise.all(
    refs
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
}

// Fetches recent inbox messages (full inbox — not label-scoped, per the
// explicit full-inbox decision) with subject + body text extracted for
// urgency evaluation. `maxResults` bounds each on-demand check's cost.
export async function getRecentInboxMessages(maxResults = 25): Promise<InboxMessage[]> {
  const client = getGmailClient();

  const listResponse = await client.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults,
  });

  return fetchMessagesByRefs(client, listResponse.data.messages ?? []);
}

// Full-history search using Gmail's own search syntax (from:, subject:,
// older_than:, etc.) via the API's `q` param — not a client-side filter over
// a recent window, so this actually reaches messages getRecentInboxMessages
// never sees.
export async function searchEmails(query: string, maxResults = 10): Promise<InboxMessage[]> {
  const client = getGmailClient();

  const listResponse = await client.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });

  return fetchMessagesByRefs(client, listResponse.data.messages ?? []);
}

// Header values go straight into a raw RFC 2822 message below — stripping
// CR/LF prevents a crafted `to`/`subject` value from injecting extra
// headers (e.g. a second Bcc: line) into the outgoing message.
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

// Sends a new email as the authenticated user. No confirmation step, no
// draft/review stage — see North_Vector_Full_Read_Write_Calendar_Gmail_Access_Plan.md
// Section 4 for the autonomy decision this implements.
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const client = getGmailClient();

  const message = [
    `To: ${sanitizeHeaderValue(to)}`,
    `Subject: ${sanitizeHeaderValue(subject)}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    body,
  ].join("\r\n");

  const raw = Buffer.from(message).toString("base64url");

  await client.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

// Moves a message to Trash (recoverable for 30 days) — deliberately not a
// permanent delete, see the gmail.modify-not-mail.google.com scope note atop
// getGmailClient().
export async function trashEmail(messageId: string): Promise<void> {
  const client = getGmailClient();
  await client.users.messages.trash({ userId: "me", id: messageId });
}
