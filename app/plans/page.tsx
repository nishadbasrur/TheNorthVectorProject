import { AppShell } from "@/components/layout/app-shell";
import { mockProjects, mockGoals } from "@/lib/mock-data";

export default function PlansPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Strategy Layer</div>
        <div className="page-title">Plans</div>
        <div className="page-meta">Structured roadmaps and execution timelines</div>
      </div>

      <div className="page-body">
        {/* Timeline view */}
        <div className="section-heading" style={{ marginBottom: 16 }}>Q3 2025 Execution Plan</div>

        <div className="grid-main-side">
          <div>
            {[
              {
                month: "June 2025",
                status: "current",
                items: [
                  { label: "North Vector dashboard complete", domain: "tech", done: false },
                  { label: "ArbScore Cloud Run scout stable", domain: "tech", done: true },
                  { label: "Confirm Dr. Bala tutoring schedule", domain: "academic", done: false },
                  { label: "Book Italy trip logistics", domain: "personal", done: false },
                ],
              },
              {
                month: "July 2025",
                status: "upcoming",
                items: [
                  { label: "Gen Chem tutoring begins (Dr. Bala)", domain: "academic", done: false },
                  { label: "EMT Chapters 7–12 complete", domain: "clinical", done: false },
                  { label: "Italy trip", domain: "personal", done: false },
                  { label: "Khan Academy pre-calc complete", domain: "academic", done: false },
                ],
              },
              {
                month: "August 2025",
                status: "upcoming",
                items: [
                  { label: "EMT National Registry exam", domain: "clinical", done: false },
                  { label: "UConn move-in", domain: "academic", done: false },
                  { label: "North Vector v1 deployed", domain: "tech", done: false },
                  { label: "ArbScore August revenue target: $500", domain: "revenue", done: false },
                ],
              },
            ].map(phase => (
              <div key={phase.month} className="review-block" style={{ borderLeft: `3px solid ${phase.status === "current" ? "var(--cyan)" : "var(--border-default)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: phase.status === "current" ? "var(--cyan)" : "var(--text-secondary)" }}>{phase.month}</span>
                  {phase.status === "current" && <span className="badge badge-cyan">now</span>}
                </div>
                {phase.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < phase.items.length - 1 ? "1px solid rgba(60,80,130,0.12)" : "none" }}>
                    <div style={{ width: 16, height: 16, border: `1.5px solid ${item.done ? "var(--status-success)" : "var(--slate-500)"}`, borderRadius: 4, flexShrink: 0, background: item.done ? "var(--status-success)" : "transparent", marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {item.done && <span style={{ fontSize: 9, color: "white" }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: item.done ? "var(--text-faint)" : "var(--text-secondary)", textDecoration: item.done ? "line-through" : "none", flex: 1 }}>{item.label}</span>
                    <span className="badge badge-muted">{item.domain}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Sidebar: Goal → Project links */}
          <div>
            <div className="card">
              <div className="card-label" style={{ marginBottom: 14 }}>Goal → Project Map</div>
              {mockGoals.slice(0, 4).map(goal => {
                const linked = mockProjects.filter(p => p.goalId === goal.id);
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
