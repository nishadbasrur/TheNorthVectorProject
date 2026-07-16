"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";

type StoredScholarship = {
  id: string;
  name: string;
  description: string;
  amount: string;
  deadline: string;
  eligibilitySummary: string;
  applyUrl: string;
  source: "on_demand" | "scheduled_scan";
  discoveredAt: string;
};

async function fetchScholarships(): Promise<{ scholarships?: StoredScholarship[]; error?: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch("/api/v1/scholarships", {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  const data = await response.json();
  if (!response.ok) return { error: typeof data.error === "string" ? data.error : "Failed to load." };
  return { scholarships: data.scholarships };
}

// Not linked from the sidebar, same treatment as /tool-errors and
// /capability-review — reached directly by URL, keeps the deliberately
// collapsed Command-only nav intact. This is the "foundation" the
// research_scholarships tool and the bi-daily scan both build toward: a
// real list to review and act on later, not just a spoken answer that
// evaporates after one voice turn.
export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<StoredScholarship[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchScholarships().then(({ scholarships: loaded, error }) => {
      if (cancelled) return;
      if (error) setLoadError(error);
      else setScholarships(loaded ?? []);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Opportunities</div>
        <div className="page-title">Scholarships</div>
        <div className="page-meta">
          Found by North — research only, nothing here has been applied to.
        </div>
      </div>

      <div className="page-body">
        {isLoading && <div className="card">Loading…</div>}

        {loadError && (
          <div className="card" style={{ color: "var(--status-risk)" }}>
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && scholarships.length === 0 && (
          <div className="card">
            Nothing found yet — ask North to "find scholarships" or wait for the next scheduled scan.
          </div>
        )}

        {scholarships.map((s) => (
          <div className="card" key={s.id} style={{ marginBottom: 16 }}>
            <div className="section-heading">{s.name}</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
              {s.amount} · Due {s.deadline} · {s.source === "scheduled_scan" ? "scheduled scan" : "on-demand"}
            </div>
            <div style={{ marginTop: 8 }}>{s.description}</div>
            <div style={{ marginTop: 8, opacity: 0.8 }}>{s.eligibilitySummary}</div>
            {s.applyUrl && (
              <div style={{ marginTop: 12 }}>
                <a href={s.applyUrl} target="_blank" rel="noreferrer">
                  View details →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
