"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getGoals, type GoalRecord } from "@/lib/goal-store";

export default function WeeklyReviewPage() {
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getGoals().then((records) => {
      if (cancelled) return;
      setGoals(records);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Weekly Command</div>
        <div className="page-title">Weekly Review</div>
        <div className="page-meta">Draft and record your structured weekly reflection</div>
      </div>

      <div className="page-body">
        <div className="grid-main-side">
          <div>
            <div className="card">
              No weekly-review generation feature is built yet — there is no scoring, wins/misses, or next-week
              priority draft to show. This will populate once that feature exists.
            </div>
          </div>

          {/* Right column: real goal health, derived from Firestore */}
          <div>
            <div className="card">
              <div className="card-label" style={{ marginBottom: 14 }}>Goal Health Check</div>
              {isLoading ? (
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Loading…</div>
              ) : goals.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>No goals recorded yet.</div>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1, marginRight: 8, lineHeight: 1.3 }}>{goal.title}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--white)", flexShrink: 0 }}>{goal.progress}%</span>
                    </div>
                    <div className="progress-bar" style={{ marginTop: 0 }}>
                      <div className={`progress-fill ${goal.risk === "high" ? "risk" : goal.risk === "medium" ? "warning" : ""}`}
                        style={{ width: `${Math.max(goal.progress, 3)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
