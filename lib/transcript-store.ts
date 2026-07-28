import { text as readStreamAsText } from "node:stream/consumers";
import { drive, auth as googleAuth, type drive_v3 } from "@googleapis/drive";
import matter from "gray-matter";

// Deliberately no "server-only" guard — shared with the esbuild-bundled
// Cloud Functions runtime (functions/src/transcript-batch-scan.ts), same
// reasoning as lib/google-calendar-client.ts and lib/opportunity-store.ts.
// Confirmed the hard way: the real "server-only" package's default export
// unconditionally throws unless a bundler sets the "react-server" import
// condition (only Next.js's own webpack config does) — plain Node/esbuild
// always resolve to the throwing branch, so this guard would crash the
// Cloud Functions runtime the instant this module loads, not just fail to
// protect anything.
//
// Tier 1 of the three-tier memory pipeline — raw, unfiltered voice-message
// capture, no AI involved. See
// North_Vector_Three_Tier_Memory_Pipeline_Plan.md. Deliberately its own
// file, not folded into lib/obsidian-memory-store.ts: transcripts are not
// ScoreableMemory records (no domain/type/confidence, never scored or
// semantically retrieved directly) — a genuinely different concept living
// in a sibling Drive folder, same OAuth setup.
//
// Memories/Transcripts/ is NOT auto-created — same convention already
// established for Memories/General/ and Memories/Distilled/ in the prior
// session: findFolderIdByName throws a clear error if it's missing, and a
// human creates the folder once in Drive/Obsidian. See this plan's
// verification checklist.

let cachedClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (cachedClient) {
    return cachedClient;
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REFRESH_TOKEN must all be set."
    );
  }

  const oauth2Client = new googleAuth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  cachedClient = drive({ version: "v3", auth: oauth2Client });
  return cachedClient;
}

// Hardcoded rather than looked up by name — avoids a Drive files.list
// query (and its failure mode if the folder gets renamed, or if the
// name-search just can't find it — the "Transcripts" name lookup under
// the root folder was failing even though the subfolder exists) for the
// one folder ID that never changes.
const TRANSCRIPTS_FOLDER_ID = "1biOfzjeDtrragbFG9NaeHEyAICKsAEM9";

async function findTranscriptsFolderId(): Promise<string> {
  const envFolderId = process.env.OBSIDIAN_TRANSCRIPTS_FOLDER_ID;
  return envFolderId ?? TRANSCRIPTS_FOLDER_ID;
}

// YYYY-MM-DD-HH-MM-SS, in America/New_York — matches the timezone
// convention already used everywhere else voice-facing in this codebase
// (lib/google-calendar-client.ts's EVENT_TIME_ZONE,
// app/api/v1/voice/respond/route.ts's PERSONA_TIME_ZONE), not the server's
// own timezone.
function transcriptFileName(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}-${parts.hour}-${parts.minute}-${parts.second}.md`;
}

// Fire-and-forget from app/api/v1/voice/respond/route.ts — every voice
// message, verbatim, no AI call, no summarization. Callers must not await
// this on the response's critical path (see that route's own comment on
// where this is invoked).
export async function createTranscript(text: string): Promise<{ fileId: string }> {
  const client = getDriveClient();
  const folderId = await findTranscriptsFolderId();

  const now = new Date();
  const bodyWithCenterPoint = `${text}\n\n[[Transcript Memories Center Point]]`;
  const fileContent = matter.stringify(bodyWithCenterPoint, {
    date: now.toISOString(),
    source: "voice",
  });

  const { data } = await client.files.create({
    requestBody: {
      name: transcriptFileName(now),
      parents: [folderId],
      mimeType: "text/markdown",
    },
    media: {
      mimeType: "text/markdown",
      body: fileContent,
    },
  });

  if (!data.id) {
    throw new Error("Drive did not return a file ID for the newly created transcript.");
  }

  return { fileId: data.id };
}

export type StoredTranscript = {
  fileId: string;
  fileName: string;
  content: string;
};

// Feeds functions/src/transcript-batch-scan.ts's nightly submit step —
// every transcript written since the last successful run. "Since" is
// Drive's own createdTime, queried server-side (createdTime > ...) rather
// than fetched-then-filtered client-side, so this scales fine even if the
// Transcripts/ folder grows into the thousands over time.
export async function listTranscriptsSince(since: Date): Promise<StoredTranscript[]> {
  const client = getDriveClient();
  const folderId = await findTranscriptsFolderId();

  const { data } = await client.files.list({
    q: `'${folderId}' in parents and mimeType = 'text/markdown' and trashed = false and createdTime > '${since.toISOString()}'`,
    fields: "files(id, name)",
    orderBy: "createdTime",
  });

  const files = data.files ?? [];

  const results = await Promise.all(
    files.map(async (file): Promise<StoredTranscript | null> => {
      try {
        const response = await client.files.get(
          { fileId: file.id!, alt: "media" },
          { responseType: "stream" }
        );
        const raw = await readStreamAsText(response.data);
        const parsed = matter(raw);
        const content = parsed.content.trim();

        if (!content) {
          console.error(`[transcript-store] Skipping empty transcript ${file.name} (${file.id}).`);
          return null;
        }

        return { fileId: file.id!, fileName: file.name ?? file.id!, content };
      } catch (error) {
        console.error(`[transcript-store] Failed to read transcript ${file.name} (${file.id}):`, error);
        return null;
      }
    })
  );

  return results.filter((t): t is StoredTranscript => t !== null);
}
