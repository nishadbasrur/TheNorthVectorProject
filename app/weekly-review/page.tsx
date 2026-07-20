"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getGoals, type GoalRecord } from "@/lib/goal-store";
import { auth } from "@/lib/firebase";

type WeeklyRetrospective = {
  weekId: string;
  summary: string;
  wins: string[];
  misses: string[];
  nextWeekSuggestion: string;
};

async function fetchRetrospective(): Promise<WeeklyRetrospective | null> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch("/api/v1/weekly-review", {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.retrospective ?? null;
}

export default function WeeklyReviewPage() {
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retrospective, setRetrospective] = useState<WeeklyRetrospective | null>(null);
  const [isRetrospectiveLoading, setIsRetrospectiveLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getGoals().then((records) => {
      if (cancelled) return;
      setGoals(records);
      setIsLoading(false);
    });

    fetchRetrospective().then((loaded) => {
      if (cancelled) return;
      setRetrospective(loaded);
      setIsRetrospectiveLoading(false);
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
            {isRetrospectiveLoading && <div className="card">Loading…</div>}

            {!isRetrospectiveLoading && !retrospective && (
              <div className="card">
                No retrospective yet — North generates one automatically every Sunday morning. Check back after
                the first run.
              </div>
            )}

            {retrospective && (
              <>
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-label" style={{ marginBottom: 10 }}>This Week</div>
                  <div>{retrospective.summary}</div>
                </div>

                {retrospective.wins.length > 0 && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-label" style={{ marginBottom: 10 }}>Wins</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {retrospective.wins.map((win, i) => (
                        <li key={i}>{win}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {retrospective.misses.length > 0 && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-label" style={{ marginBottom: 10 }}>Misses</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {retrospective.misses.map((miss, i) => (
                        <li key={i}>{miss}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {retrospective.nextWeekSuggestion && (
                  <div className="card">
                    <div className="card-label" style={{ marginBottom: 10 }}>Next Week</div>
                    <div>{retrospective.nextWeekSuggestion}</div>
                  </div>
                )}
              </>
            )}
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
