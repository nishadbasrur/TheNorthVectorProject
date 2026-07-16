import "server-only";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Pure observability: every existing tool handler already catches its own
// errors and returns a friendly fallback string to Claude (see
// lib/tool-dispatcher.ts) — that UX contract stays exactly as-is. This just
// makes the real error visible somewhere other than console.error (which is
// invisible without Cloud Logging access, see
// North_Vector_Autonomous_Self_Extension_Plan.md's error-logging section).
// No AI/agent decision-making involved, and a logging failure here must
// never surface to the user or block the tool's own friendly-string return —
// callers fire-and-forget this with .catch(() => {}).
export async function logToolError(toolName: string, error: unknown, input: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack ?? null : null;

  let serializedInput: string | null = null;
  try {
    serializedInput = JSON.stringify(input).slice(0, 2000);
  } catch {
    serializedInput = null;
  }

  await adminDb.collection("tool_errors").add({
    toolName,
    message: message.slice(0, 2000),
    stack: stack ? stack.slice(0, 4000) : null,
    input: serializedInput,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export type ToolErrorLogEntry = {
  id: string;
  toolName: string;
  message: string;
  stack: string | null;
  input: string | null;
  createdAt: string | null;
};

// Backs the /tool-errors browse page — most recent first, capped since this
// is a debugging feed, not a paginated archive.
export async function getRecentToolErrors(maxResults = 50): Promise<ToolErrorLogEntry[]> {
  const snapshot = await adminDb
    .collection("tool_errors")
    .orderBy("createdAt", "desc")
    .limit(maxResults)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;
    return {
      id: doc.id,
      toolName: typeof data.toolName === "string" ? data.toolName : "unknown",
      message: typeof data.message === "string" ? data.message : "",
      stack: typeof data.stack === "string" ? data.stack : null,
      input: typeof data.input === "string" ? data.input : null,
      createdAt,
    };
  });
}
