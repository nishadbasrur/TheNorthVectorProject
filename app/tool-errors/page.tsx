"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";

type ToolErrorLogEntry = {
  id: string;
  toolName: string;
  message: string;
  stack: string | null;
  input: string | null;
  createdAt: string | null;
};

async function fetchErrors(): Promise<{ errors?: ToolErrorLogEntry[]; error?: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch("/api/v1/tool-errors", {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  const data = await response.json();
  if (!response.ok) return { error: typeof data.error === "string" ? data.error : "Failed to load." };
  return { errors: data.errors };
}

// Not linked from the sidebar on purpose — same treatment as
// /capability-review, reached directly by URL. Keeps the deliberately
// collapsed Command-only nav (see North_Vector_Simplify plan) intact while
// still giving a real place to see what's actually failing, instead of only
// console.error output nobody without Cloud Logging access can read.
export default function ToolErrorsPage() {
  const [errors, setErrors] = useState<ToolErrorLogEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchErrors().then(({ errors: loaded, error }) => {
      if (cancelled) return;
      if (error) setLoadError(error);
      else setErrors(loaded ?? []);
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
        <div className="page-title">Tool Errors</div>
        <div className="page-meta">Most recent tool failures, logged automatically — nothing here is auto-fixed.</div>
      </div>

      <div className="page-body">
        {isLoading && <div className="card">Loading…</div>}

        {loadError && (
          <div className="card" style={{ color: "var(--status-risk)" }}>
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && errors.length === 0 && <div className="card">No tool failures logged.</div>}

        {errors.map((entry) => (
          <div className="card" key={entry.id} style={{ marginBottom: 16 }}>
            <div className="section-heading">{entry.toolName}</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{entry.createdAt ?? "unknown time"}</div>
            <div style={{ marginTop: 8 }}>{entry.message}</div>
            {entry.input && (
              <pre
                style={{
                  fontSize: 12,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 8,
                  opacity: 0.8,
                }}
              >
                input: {entry.input}
              </pre>
            )}
            {entry.stack && (
              <pre
                style={{
                  fontSize: 11,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 8,
                  opacity: 0.6,
                }}
              >
                {entry.stack}
              </pre>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
