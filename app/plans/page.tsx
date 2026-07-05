"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getGoals, type GoalRecord } from "@/lib/goal-store";
import { getProjects, type ProjectRecord } from "@/lib/project-store";

export default function PlansPage() {
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getGoals(), getProjects()]).then(([goalRecords, projectRecords]) => {
      if (cancelled) return;
      setGoals(goalRecords);
      setProjects(projectRecords);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Strategy Layer</div>
        <div className="page-title">Plans</div>
        <div className="page-meta">How active goals map to the projects executing them</div>
      </div>

      <div className="page-body">
        {isLoading ? (
          <div className="card">Loading plans…</div>
        ) : goals.length === 0 ? (
          <div className="card">
            No structured execution plan yet — a plan needs at least one goal. There is no dedicated timeline/roadmap
            feature built yet; this page currently just maps goals to the projects working toward them.
          </div>
        ) : (
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-label" style={{ marginBottom: 14 }}>Goal → Project Map</div>
            {goals.map(goal => {
              const linked = projects.filter(p => p.goalId === goal.id);
              return (
                <div key={goal.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(60,80,130,0.12)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>{goal.title}</div>
                  {linked.length > 0 ? linked.map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: "rgba(59,91,219,0.07)", borderRadius: 5, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "var(--navy-accent)" }}>↳</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.title}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-faint)" }}>{p.progress}%</span>
                    </div>
                  )) : (
                    <div style={{ fontSize: 11, color: "var(--text-faint)", paddingLeft: 8 }}>No linked projects</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
