import { AppShell } from "@/components/layout/app-shell";
import { mockWeeklyReview, mockTasks, mockGoals } from "@/lib/mock-data";

export default function WeeklyReviewPage() {
  const done = mockTasks.filter(t => t.status === "done");
  const open = mockTasks.filter(t => t.status === "open");

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Weekly Command</div>
        <div className="page-title">Weekly Review</div>
        <div className="page-meta">Draft and record your structured weekly reflection · {mockWeeklyReview.weekOf}</div>
      </div>

      <div className="page-body">
        <div className="grid-main-side">
          <div>
            {/* Score header */}
            <div className="card" style={{ marginBottom: 20, background: "linear-gradient(135deg, rgba(59,91,219,0.12), rgba(77,202,188,0.06))", borderColor: "rgba(59,91,219,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="card-label" style={{ marginBottom: 6 }}>Week of {mockWeeklyReview.weekOf}</div>
                  <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 44, color: "var(--white)", lineHeight: 1 }}>
                    {mockWeeklyReview.score}<span style={{ fontSize: 18, color: "var(--text-faint)" }}>/100</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                    {done.length} tasks completed · {open.length} still open
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 4 }}>Completion rate</div>
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(59,91,219,0.15)" strokeWidth="4"/>
                    <circle cx="32" cy="32" r="26" fill="none" stroke="var(--cyan)" strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - done.length / (done.length + open.length))}`}
                      transform="rotate(-90 32 32)"
                    />
                    <text x="32" y="37" textAnchor="middle" fill="white" fontSize="13" fontFamily="DM Serif Display,serif">
                      {Math.round(done.length / (done.length + open.length) * 100)}%
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Wins */}
            <div className="review-block">
              <div className="review-block-header">
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>Wins</span>
                <span className="badge badge-success">{mockWeeklyReview.wins.length} captured</span>
              </div>
              {mockWeeklyReview.wins.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < mockWeeklyReview.wins.length - 1 ? "1px solid rgba(60,80,130,0.15)" : "none" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "var(--status-success)" }}>✓</span>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{w}</span>
                </div>
              ))}
            </div>

            {/* Misses */}
            <div className="review-block">
              <div className="review-block-header">
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>Misses & Gaps</span>
                <span className="badge badge-warning">{mockWeeklyReview.misses.length} noted</span>
              </div>
              {mockWeeklyReview.misses.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < mockWeeklyReview.misses.length - 1 ? "1px solid rgba(60,80,130,0.15)" : "none" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "var(--status-warning)" }}>△</span>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{m}</span>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div className="review-block">
              <div className="review-block-header">
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>Insights</span>
              </div>
              {mockWeeklyReview.insights.map((ins, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < mockWeeklyReview.insights.length - 1 ? "1px solid rgba(60,80,130,0.15)" : "none" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: "rgba(77,202,188,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "var(--cyan)" }}>◆</span>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ins}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div>
            {/* Next week */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-label" style={{ marginBottom: 14 }}>Next Week — Priority Queue</div>
              {mockWeeklyReview.nextWeekPriorities.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < mockWeeklyReview.nextWeekPriorities.length - 1 ? "1px solid rgba(60,80,130,0.12)" : "none", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "var(--navy-accent)", fontWeight: 600, paddingTop: 1, minWidth: 20 }}>0{i + 1}</div>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", flex: 1 }}>{p}</span>
                </div>
              ))}
            </div>

            {/* Goal health */}
            <div className="card">
              <div className="card-label" style={{ marginBottom: 14 }}>Goal Health Check</div>
              {mockGoals.map(goal => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
