"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getDecisions, type StoredDecision } from "@/lib/decision-memory";

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<StoredDecision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getDecisions().then((records) => {
      if (cancelled) return;
      setDecisions(records);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const highConfidence = decisions.filter((d) => d.confidence === "high").length;

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Strategy Layer</div>
        <div className="page-title">Decisions</div>
        <div className="page-meta">Questions asked of the decision engine, and its recommendations · {decisions.length} recorded</div>
      </div>

      <div className="page-body">
        {isLoading ? (
          <div className="card">Loading decisions…</div>
        ) : decisions.length === 0 ? (
          <div className="card">No decisions recorded yet. Ask a question from the Sandbox or dashboard to see it here.</div>
        ) : (
          <>
            <div className="grid-4" style={{ marginBottom: 28 }}>
              <div className="card-sm"><div className="stat-value" style={{ fontSize: 26 }}>{decisions.length}</div><div className="stat-label">Total</div></div>
              <div className="card-sm"><div className="stat-value" style={{ fontSize: 26, color: "var(--status-success)" }}>{highConfidence}</div><div className="stat-label">High Confidence</div></div>
              <div className="card-sm"><div className="stat-value" style={{ fontSize: 26 }}>{decisions.reduce((s, d) => s + d.timesAsked, 0)}</div><div className="stat-label">Times Asked</div></div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {decisions.map((d) => (
                <div
                  key={d.question}
                  className="card"
                  style={{
                    borderLeft: `3px solid ${
                      d.confidence === "high" ? "var(--status-success)" : d.confidence === "medium" ? "var(--status-warning)" : "var(--slate-500)"
                    }`,
                  }}
                >
                  <div className="card-title" style={{ marginBottom: 6 }}>{d.question}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{d.recommendation}</div>

                  {d.reasons.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div className="card-label" style={{ marginBottom: 4 }}>Reasons</div>
                      {d.reasons.map((r, i) => (
                        <div key={i} style={{ fontSize: 11, color: "var(--text-faint)" }}>· {r}</div>
                      ))}
                    </div>
                  )}

                  {d.risks.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div className="card-label" style={{ marginBottom: 4 }}>Risks</div>
                      {d.risks.map((r, i) => (
                        <div key={i} style={{ fontSize: 11, color: "var(--status-warning)" }}>· {r}</div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <span className={`badge ${d.confidence === "high" ? "badge-success" : d.confidence === "medium" ? "badge-warning" : "badge-muted"}`}>
                      {d.confidence} confidence
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-faint)" }}>asked {d.timesAsked}×</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
