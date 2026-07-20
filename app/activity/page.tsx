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

async function fetchActions(): Promise<{ actions?: ActionLogEntry[]; error?: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch("/api/v1/activity", {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  const data = await response.json();
  if (!response.ok) return { error: typeof data.error === "string" ? data.error : "Failed to load." };
  return { actions: data.actions };
}

// Not linked from the sidebar — same direct-URL-only treatment as
// /tool-errors and /capability-review. #65's "what did you do today
// without me asking" — today only, most recent first.
export default function ActivityPage() {
  const [actions, setActions] = useState<ActionLogEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchActions().then(({ actions: loaded, error }) => {
      if (cancelled) return;
      if (error) setLoadError(error);
      else setActions(loaded ?? []);
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
    </AppShell>
  );
}
