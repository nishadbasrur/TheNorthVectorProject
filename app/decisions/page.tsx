import { AppShell } from "@/components/layout/app-shell";
import { mockDecisions } from "@/lib/mock-data";

export default function DecisionsPage() {
  const open = mockDecisions.filter(d => d.status === "open");
  const resolved = mockDecisions.filter(d => d.status === "resolved");

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Strategy Layer</div>
        <div className="page-title">Decisions</div>
        <div className="page-meta">Unresolved questions and resolved choices · {open.length} open</div>
      </div>

      <div className="page-body">
        <div className="grid-4" style={{ marginBottom: 28 }}>
          <div className="card-sm"><div className="stat-value" style={{ fontSize: 26 }}>{open.length}</div><div className="stat-label">Open</div></div>
          <div className="card-sm"><div className="stat-value" style={{ fontSize: 26, color: "var(--status-success)" }}>{resolved.length}</div><div className="stat-label">Resolved</div></div>
          <div className="card-sm"><div className="stat-value" style={{ fontSize: 26 }}>{mockDecisions.length}</div><div className="stat-label">Total</div></div>
          <div className="card-sm"><div className="stat-value" style={{ fontSize: 26, color: "var(--status-warning)" }}>3</div><div className="stat-label">Domains</div></div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="section-heading">Open — Needs Resolution</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {open.map(d => (
              <div key={d.id} className="card" style={{ borderLeft: "3px solid var(--status-warning)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div className="card-title" style={{ marginBottom: 6 }}>{d.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>{d.context}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span className="badge badge-muted">{d.domain}</span>
                      <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Opened {d.openedDate}</span>
                    </div>
                  </div>
                  <span className="badge badge-warning">open</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {resolved.length > 0 && (
          <div>
            <div className="section-heading">Resolved</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, opacity: 0.65 }}>
              {resolved.map(d => (
                <div key={d.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div className="card-title" style={{ marginBottom: 4, textDecoration: "line-through" }}>{d.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.context}</div>
                    </div>
                    <span className="badge badge-success">resolved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
