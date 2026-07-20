"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";

type ActionLogEntry = {
  id: string;
  kind: "push" | "tool_call";
  title: string;
  body: string | null;
  toolName: string | null;
  outcome: string | null;
  sessionId: string | null;
  createdAt: string | null;
};

type EngagementSummaryEntry = {
  connection: string;
  engagement: "unknown" | "engaged" | "ignored";
  surfacedAt: string | null;
};

async function fetchActivity(): Promise<{
  actions?: ActionLogEntry[];
  engagement?: EngagementSummaryEntry[];
  error?: string;
}> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch("/api/v1/activity", {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  const data = await response.json();
  if (!response.ok) return { error: typeof data.error === "string" ? data.error : "Failed to load." };
  return { actions: data.actions, engagement: data.engagement };
}

// Not linked from the sidebar — same direct-URL-only treatment as
// /tool-errors and /capability-review. #65's "what did you do today
// without me asking" — today only, most recent first.
export default function ActivityPage() {
  const [actions, setActions] = useState<ActionLogEntry[]>([]);
  const [engagement, setEngagement] = useState<EngagementSummaryEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchActivity().then(({ actions: loadedActions, engagement: loadedEngagement, error }) => {
      if (cancelled) return;
      if (error) setLoadError(error);
      else {
        setActions(loadedActions ?? []);
        setEngagement(loadedEngagement ?? []);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Diagnostics</div>
        <div className="page-title">Activity</div>
        <div className="page-meta">Everything North did on its own today — every push notification and every tool it ran during a voice turn.</div>
      </div>

      <div className="page-body">
        {isLoading && <div className="card">Loading…</div>}

        {loadError && (
          <div className="card" style={{ color: "var(--status-risk)" }}>
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && actions.length === 0 && <div className="card">Nothing logged yet today.</div>}

        {actions.map((entry) => (
          <div className="card" key={entry.id} style={{ marginBottom: 16 }}>
            <div className="section-heading">
              {entry.kind === "push" ? "Push" : "Tool call"} — {entry.toolName ?? entry.title}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{entry.createdAt ?? "unknown time"}</div>
            {entry.kind === "push" && (
              <div style={{ marginTop: 8 }}>
                <strong>{entry.title}</strong>
                {entry.body && <div style={{ marginTop: 4 }}>{entry.body}</div>}
              </div>
            )}
            {entry.kind === "tool_call" && entry.outcome && (
              <div style={{ marginTop: 8, opacity: 0.8 }}>{entry.outcome}</div>
            )}
          </div>
        ))}
      </div>

      <div className="page-header" style={{ marginTop: 32 }}>
        <div className="page-eyebrow">Diagnostics</div>
        <div className="page-title">Engagement</div>
        <div className="page-meta">#75 — whether proactive mentions (openers, proactive-update checks) actually landed or got ignored.</div>
      </div>

      <div className="page-body">
        {!isLoading && !loadError && engagement.length === 0 && <div className="card">Nothing surfaced yet.</div>}

        {engagement.map((entry, index) => (
          <div className="card" key={`${entry.surfacedAt ?? "unknown"}-${index}`} style={{ marginBottom: 16 }}>
            <div className="section-heading" style={{ textTransform: "capitalize" }}>{entry.engagement}</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{entry.surfacedAt ?? "unknown time"}</div>
            <div style={{ marginTop: 8 }}>{entry.connection}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
