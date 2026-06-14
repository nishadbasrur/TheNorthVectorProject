import { AppShell } from "@/components/layout/app-shell";
import { mockWeeklyReview } from "@/lib/mock-data";

export default function ReviewsPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Reflection Layer</div>
        <div className="page-title">Reviews</div>
        <div className="page-meta">Structured weekly and strategic reflections</div>
      </div>

      <div className="page-body">
        {/* Latest review preview */}
        <div className="section-heading" style={{ marginBottom: 14 }}>Latest — Week of {mockWeeklyReview.weekOf}</div>

        <div className="grid-main-side">
          <div>
            <div className="review-block">
              <div className="review-block-header">
                <div className="card-label">Wins</div>
                <span className="badge badge-success">+{mockWeeklyReview.wins.length}</span>
              </div>
              {mockWeeklyReview.wins.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < mockWeeklyReview.wins.length - 1 ? "1px solid rgba(60,80,130,0.15)" : "none" }}>
                  <span style={{ color: "var(--status-success)", fontSize: 12, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{w}</span>
                </div>
              ))}
            </div>

            <div className="review-block">
              <div className="review-block-header">
                <div className="card-label">Misses</div>
                <span className="badge badge-warning">{mockWeeklyReview.misses.length}</span>
              </div>
              {mockWeeklyReview.misses.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < mockWeeklyReview.misses.length - 1 ? "1px solid rgba(60,80,130,0.15)" : "none" }}>
                  <span style={{ color: "var(--status-warning)", fontSize: 12, marginTop: 2, flexShrink: 0 }}>△</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{m}</span>
                </div>
              ))}
            </div>

            <div className="review-block">
              <div className="review-block-header">
                <div className="card-label">Insights</div>
              </div>
              {mockWeeklyReview.insights.map((ins, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < mockWeeklyReview.insights.length - 1 ? "1px solid rgba(60,80,130,0.15)" : "none" }}>
                  <span style={{ color: "var(--cyan)", fontSize: 12, marginTop: 2, flexShrink: 0 }}>◆</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ins}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score sidebar */}
          <div>
            <div className="card" style={{ textAlign: "center", marginBottom: 16 }}>
              <div className="card-label" style={{ marginBottom: 12 }}>Week Score</div>
              <div className="review-score-display" style={{ justifyContent: "center" }}>
                <div className="review-score-num">{mockWeeklyReview.score}</div>
                <div className="review-score-denom">/100</div>
              </div>
              <div className="progress-bar" style={{ marginTop: 16 }}>
                <div className={`progress-fill ${mockWeeklyReview.score >= 80 ? "success" : mockWeeklyReview.score >= 60 ? "warning" : "risk"}`}
                  style={{ width: `${mockWeeklyReview.score}%` }} />
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-faint)" }}>
                {mockWeeklyReview.completedTasks} of {mockWeeklyReview.totalTasks} tasks completed
              </div>
            </div>

            <div className="card">
              <div className="card-label" style={{ marginBottom: 12 }}>Next Week Priorities</div>
              {mockWeeklyReview.nextWeekPriorities.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < mockWeeklyReview.nextWeekPriorities.length - 1 ? "1px solid rgba(60,80,130,0.12)" : "none" }}>
                  <span style={{ fontSize: 11, color: "var(--navy-accent)", fontWeight: 700, marginTop: 1, flexShrink: 0 }}>0{i + 1}</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
