import { AppShell } from "@/components/layout/app-shell";
import { mockProjects } from "@/lib/mock-data";

export default function ProjectsPage() {
  const active = mockProjects.filter(p => p.status === "active");
  const planning = mockProjects.filter(p => p.status === "planning");

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Execution Layer</div>
        <div className="page-title">Projects</div>
        <div className="page-meta">Multi-step efforts advancing your strategic goals · {active.length} active, {planning.length} planning</div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: "Active", value: active.length },
            { label: "Planning", value: planning.length },
            { label: "Total Tasks", value: mockProjects.reduce((s, p) => s + p.taskCount, 0) },
            { label: "Done Tasks", value: mockProjects.reduce((s, p) => s + p.doneCount, 0) },
          ].map(s => (
            <div key={s.label} className="card-sm">
              <div className="stat-value" style={{ fontSize: 26 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {active.length > 0 && (
          <>
            <div className="section-heading" style={{ marginBottom: 14 }}>Active</div>
            <div className="grid-2" style={{ marginBottom: 24 }}>
              {active.map(proj => (
                <div key={proj.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div className="card-title">{proj.title}</div>
                      <div style={{ fontSize: 11, color: "var(--cyan)", marginTop: 2 }}>↑ {proj.goalTitle}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {proj.tags.map(t => (
                        <span key={t} className="badge badge-navy">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="card-sub" style={{ marginBottom: 14 }}>{proj.description}</div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{proj.doneCount} of {proj.taskCount} tasks</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--white)" }}>{proj.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${proj.progress}%` }} />
                  </div>

                  <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--cyan)" }}>→ {proj.nextMilestone}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{proj.lastActivity}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {planning.length > 0 && (
          <>
            <div className="section-heading" style={{ marginBottom: 14 }}>Planning</div>
            <div className="grid-2">
              {planning.map(proj => (
                <div key={proj.id} className="card" style={{ opacity: 0.75 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div className="card-title">{proj.title}</div>
                    <span className="badge badge-muted">planning</span>
                  </div>
                  <div className="card-sub" style={{ marginBottom: 12 }}>{proj.description}</div>
                  <div style={{ fontSize: 11, color: "var(--cyan)" }}>→ {proj.nextMilestone}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
