import { AppShell } from "@/components/layout/app-shell";
import { mockGoals } from "@/lib/mock-data";

const horizonOrder = { now: 0, mid: 1, long: 2 };

export default function GoalsPage() {
  const sorted = [...mockGoals].sort((a, b) =>
    (horizonOrder[a.horizon as keyof typeof horizonOrder] ?? 9) - (horizonOrder[b.horizon as keyof typeof horizonOrder] ?? 9)
  );

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Strategic Layer</div>
        <div className="page-title">Goals</div>
        <div className="page-meta">Long-term outcomes and strategic direction · {mockGoals.length} active</div>
      </div>

      <div className="page-body">
        {/* Summary row */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: "Total Goals", value: mockGoals.length, color: "var(--white)" },
            { label: "Now", value: mockGoals.filter(g => g.horizon === "now").length, color: "var(--cyan)" },
            { label: "Mid-Term", value: mockGoals.filter(g => g.horizon === "mid").length, color: "#93a8f4" },
            { label: "Long-Range", value: mockGoals.filter(g => g.horizon === "long").length, color: "var(--gold)" },
          ].map(s => (
            <div key={s.label} className="card-sm">
              <div className="stat-value" style={{ color: s.color, fontSize: 26 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Goals list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sorted.map(goal => (
            <div key={goal.id} className="card" style={{ borderLeft: `3px solid ${goal.risk === "high" ? "var(--status-risk)" : goal.risk === "medium" ? "var(--status-warning)" : "var(--navy-accent)"}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className={`horizon-tag ${goal.horizon === "long" ? "horizon-long" : goal.horizon === "mid" ? "horizon-mid" : "horizon-now"}`}>
                      {goal.horizon === "long" ? "Long-Range" : goal.horizon === "mid" ? "Mid-Term" : "Now"}
                    </span>
                    {goal.risk === "high" && <span className="badge badge-risk">at risk</span>}
                    {goal.risk === "medium" && <span className="badge badge-warning">watch</span>}
                    {goal.risk === "low" && <span className="badge badge-success">on track</span>}
                  </div>
                  <div className="card-title" style={{ fontSize: 16, marginBottom: 6 }}>{goal.title}</div>
                  <div className="card-sub">{goal.description}</div>

                  {/* Key results */}
                  <div style={{ marginTop: 14 }}>
                    <div className="card-label" style={{ marginBottom: 8 }}>Key Results</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {goal.keyResults.map((kr, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                          <span style={{ color: "var(--navy-accent)", fontSize: 10 }}>◆</span>
                          {kr}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ textAlign: "right", minWidth: 100 }}>
                  <div style={{ fontSize: 32, fontFamily: "DM Serif Display, serif", color: "var(--white)", lineHeight: 1 }}>{goal.progress}%</div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>complete</div>
                  <div className="progress-bar" style={{ width: 100, marginTop: 10 }}>
                    <div className="progress-fill" style={{ width: `${Math.max(goal.progress, 3)}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 10 }}>Target</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{goal.targetDate}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
