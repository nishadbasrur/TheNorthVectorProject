import "server-only";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Lazy admin-app init guarded by getApps().length, same lazy-singleton shape
// other lib/*-admin.ts stores in this codebase rely on (createTaskAsAdmin,
// logCapabilityGap) — if one of those has already initialized the default
// app in this process, we reuse it rather than double-initializing.
function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}

export interface TechnicalErrorLogEntry {
  summary: string;
  details?: string;
  source?: string;
}

// Secure review area for backend errors / technical issues, separate from
// the user-facing capability-gap log (lib/capability-gap-store.ts) — this is
// for things that are already broken and need fixing, not missing features.
export async function logTechnicalError(entry: TechnicalErrorLogEntry): Promise<void> {
  ensureAdminApp();
  const db = getFirestore();
  await db.collection("technical_error_log").add({
    summary: entry.summary,
    details: entry.details ?? "",
    source: entry.source ?? "unknown",
    createdAt: new Date().toISOString(),
  });
}
