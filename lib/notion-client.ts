import { Client, isFullPage } from "@notionhq/client";

// Shared with Cloud Functions (see functions/src/urgency-scan.ts) — no
// "server-only" guard, same reasoning as lib/google-calendar-client.ts.

// The exact checkbox property name confirmed with Nishad — see
// docs/integrations/calendar-notion-gmail-task.md Section 9.
const URGENT_PROPERTY_NAME = "Urgent";

let cachedClient: Client | null = null;
let cachedDataSourceId: string | null = null;

function getNotionClient(): Client {
  if (cachedClient) {
    return cachedClient;
  }

  const auth = process.env.NOTION_API_TOKEN;
  if (!auth) {
    throw new Error("NOTION_API_TOKEN must be set.");
  }

  cachedClient = new Client({ auth });
  return cachedClient;
}

// Notion's API models a database as a container of one or more "data
// sources" (the actual queryable/filterable table) — querying requires the
// data source id, not the database id from the URL, so this resolves and
// caches it once per process.
async function getDataSourceId(client: Client, databaseId: string): Promise<string> {
  if (cachedDataSourceId) {
    return cachedDataSourceId;
  }

  const database = await client.databases.retrieve({ database_id: databaseId });

  const dataSourceId = "data_sources" in database ? database.data_sources[0]?.id : undefined;

  if (!dataSourceId) {
    throw new Error(`Notion database ${databaseId} has no queryable data source.`);
  }

  cachedDataSourceId = dataSourceId;
  return dataSourceId;
}

function extractTitle(page: { properties: Record<string, unknown> }): string {
  for (const value of Object.values(page.properties)) {
    const prop = value as { type?: string; title?: Array<{ plain_text?: string }> };
    if (prop.type === "title") {
      return prop.title?.map((t) => t.plain_text ?? "").join("") || "(untitled item)";
    }
  }
  return "(untitled item)";
}

export type UrgentNotionItem = {
  id: string;
  title: string;
};

// Fetches pages from the shared database where the "Urgent" checkbox
// property is true. Read-only — never writes to Notion.
export async function getUrgentItems(): Promise<UrgentNotionItem[]> {
  const databaseId = process.env.NOTION_URGENT_DATABASE_ID;
  if (!databaseId) {
    throw new Error("NOTION_URGENT_DATABASE_ID must be set.");
  }

  const client = getNotionClient();
  const dataSourceId = await getDataSourceId(client, databaseId);

  const response = await client.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: URGENT_PROPERTY_NAME,
      checkbox: { equals: true },
    },
  });

  return response.results.filter(isFullPage).map((page) => ({
    id: page.id,
    title: extractTitle(page),
  }));
}
