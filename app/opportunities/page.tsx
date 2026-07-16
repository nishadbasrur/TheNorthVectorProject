"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";

type StoredOpportunity = {
  id: string;
  title: string;
  category: string;
  description: string;
  amount: string;
  deadline: string;
  eligibilitySummary: string;
  applyUrl: string;
  discoveredAt: string;
};

async function fetchOpportunities(): Promise<{ opportunities?: StoredOpportunity[]; error?: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch("/api/v1/opportunities", {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  const data = await response.json();
  if (!response.ok) return { error: typeof data.error === "string" ? data.error : "Failed to load." };
  return { opportunities: data.opportunities };
}

// Not linked from the sidebar, same treatment as /tool-errors and
// /capability-review — reached directly by URL, keeps the deliberately
// collapsed Command-only nav intact. Backs the bi-daily opportunity scan
// (see 03-Chief-Engine/Opportunity_Engine.md) — a real list to review and
// act on later, not just a spoken answer that evaporates after one voice
// turn.
export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<StoredOpportunity[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchOpportunities().then(({ opportunities: loaded, error }) => {
      if (cancelled) return;
      if (error) setLoadError(error);
      else setOpportunities(loaded ?? []);
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
        <div className="page-title">Found by North</div>
        <div className="page-meta">
          Research only — nothing here has been applied to or signed up for.
        </div>
      </div>

      <div className="page-body">
        {isLoading && <div className="card">Loading…</div>}

        {loadError && (
          <div className="card" style={{ color: "var(--status-risk)" }}>
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && opportunities.length === 0 && (
          <div className="card">
            Nothing found yet — ask North to "find scholarships" or "look up research opportunities," or wait for the next scheduled scan.
          </div>
        )}

        {opportunities.map((o) => (
          <div className="card" key={o.id} style={{ marginBottom: 16 }}>
            <div className="section-heading">{o.title}</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
              {o.category} · {o.amount} · Due {o.deadline}
            </div>
            <div style={{ marginTop: 8 }}>{o.description}</div>
            <div style={{ marginTop: 8, opacity: 0.8 }}>{o.eligibilitySummary}</div>
            {o.applyUrl && (
              <div style={{ marginTop: 12 }}>
                <a href={o.applyUrl} target="_blank" rel="noreferrer">
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
