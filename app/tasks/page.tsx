import { AppShell } from "@/components/layout/app-shell";
import { mockTasks } from "@/lib/mock-data";

const priorityOrder = { high: 0, medium: 1, low: 2 };

export default function TasksPage() {
  const open = mockTasks.filter(t => t.status === "open").sort((a, b) =>
    (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 9) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 9)
  );
  const done = mockTasks.filter(t => t.status === "done");

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Execution Layer</div>
        <div className="page-title">Tasks</div>
        <div className="page-meta">Discrete actionable work · {open.length} open, {done.length} complete</div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: "Open", value: open.length, color: "var(--white)" },
            { label: "High Priority", value: open.filter(t => t.priority === "high").length, color: "var(--status-risk)" },
            { label: "Medium", value: open.filter(t => t.priority === "medium").length, color: "var(--status-warning)" },
            { label: "Done This Week", value: done.length, color: "var(--status-success)" },
          ].map(s => (
            <div key={s.label} className="card-sm">
              <div className="stat-value" style={{ fontSize: 26, color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Open tasks */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-heading">Open</div>
          <div className="card">
            {open.map(task => (
              <div key={task.id} className="task-row">
                <div className="task-check" />
                <div style={{ flex: 1 }}>
                  <div className="task-text">{task.title}</div>
                  {task.projectTitle && (
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{task.projectTitle}</div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {task.tags.slice(0, 1).map(tag => (
                    <span key={tag} className="badge badge-muted">{tag}</span>
                  ))}
                  <span className={`badge ${task.priority === "high" ? "badge-risk" : task.priority === "medium" ? "badge-warning" : "badge-muted"}`}>
                    {task.priority}
                  </span>
                  <span className="task-due">{task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed */}
        {done.length > 0 && (
          <div>
            <div className="section-heading">Completed</div>
            <div className="card" style={{ opacity: 0.6 }}>
              {done.map(task => (
                <div key={task.id} className="task-row">
                  <div className="task-check done" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 10, color: "white" }}>✓</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="task-text done">{task.title}</div>
                    {task.projectTitle && (
                      <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{task.projectTitle}</div>
                    )}
                  </div>
                  <span className="badge badge-success">done</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
