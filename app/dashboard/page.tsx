import { AppShell } from "@/components/layout/app-shell";
import { mockUser, mockGoals, mockProjects, mockTasks, mockRisks, mockCountdowns } from "@/lib/mock-data";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DashboardPage() {
  const openTasks = mockTasks.filter(t => t.status === "open");
  const todayTasks = openTasks.slice(0, 5);
  const activeGoals = mockGoals.filter(g => g.status === "active");
  const activeProjects = mockProjects.filter(p => p.status === "active");
  const highRisks = mockRisks.filter(r => r.severity === "high" || r.severity === "medium");

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header" style={{ paddingBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div className="greeting-time">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div className="greeting-text">
              {getGreeting()}, <em>{mockUser.name}</em>
            </div>
            <div className="page-meta" style={{ marginTop: 8 }}>
              Week score <strong style={{ color: "#f0f2f8" }}>{mockUser.weekScore}%</strong>
              &nbsp;·&nbsp;{mockUser.streakDays}-day execution streak&nbsp;·&nbsp;
              <span style={{ color: "var(--status-success)" }}>{openTasks.length} open tasks</span>
            </div>
          </div>
          {/* Score ring */}
          <div style={{ textAlign: "right" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(59,91,219,0.15)" strokeWidth="4" />
                <circle
                  cx="36" cy="36" r="30"
                  fill="none"
                  stroke="var(--cyan)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - mockUser.weekScore / 100)}`}
                  transform="rotate(-90 36 36)"
                />
                <text x="36" y="40" textAnchor="middle" fill="white" fontSize="16" fontFamily="DM Serif Display, serif">
                  {mockUser.weekScore}
                </text>
              </svg>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Week Score</div>
          </div>
        </div>

        {/* Countdowns */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {mockCountdowns.map(c => (
            <div key={c.label} className="countdown-chip">
              <div className="countdown-number">{c.days}</div>
              <div className="countdown-unit">days</div>
              <div className="countdown-label">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-body">
        <div className="grid-main-side">
          {/* Left: main column */}
          <div>
            {/* Today's tasks */}
            <div style={{ marginBottom: 24 }}>
              <div className="section-heading">
                Today&apos;s Focus
              </div>
              <div className="card">
                {todayTasks.map(task => (
                  <div key={task.id} className="task-row">
                    <div className={`task-check ${task.status === "done" ? "done" : ""}`} />
                    <div style={{ flex: 1 }}>
                      <div className={`task-text ${task.status === "done" ? "done" : ""}`}>{task.title}</div>
                      {task.projectTitle && (
                        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{task.projectTitle}</div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`badge ${task.priority === "high" ? "badge-risk" : task.priority === "medium" ? "badge-warning" : "badge-muted"}`}>
                        {task.priority}
                      </span>
                      <span className="task-due">{task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Projects */}
            <div style={{ marginBottom: 24 }}>
              <div className="section-heading">Active Projects</div>
              <div className="grid-2">
                {activeProjects.slice(0, 4).map(proj => (
                  <div key={proj.id} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div className="card-title">{proj.title}</div>
                      <span className="badge badge-navy">{proj.tags[0]}</span>
                    </div>
                    <div className="card-sub" style={{ marginBottom: 10, fontSize: 12 }}>{proj.description}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{proj.doneCount}/{proj.taskCount} tasks</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{proj.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${proj.progress}%` }} />
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: "var(--cyan)" }}>→ {proj.nextMilestone}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <div className="section-heading">Strategic Goals</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activeGoals.map(goal => (
                  <div key={goal.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span className={`horizon-tag ${goal.horizon === "long" ? "horizon-long" : goal.horizon === "mid" ? "horizon-mid" : "horizon-now"}`}>
                          {goal.horizon === "long" ? "Long-Range" : goal.horizon === "mid" ? "Mid-Term" : "Now"}
                        </span>
                        {goal.risk === "high" && <span className="badge badge-risk">at risk</span>}
                        {goal.risk === "medium" && <span className="badge badge-warning">watch</span>}
                      </div>
                      <div className="card-title" style={{ fontSize: 14 }}>{goal.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>Target: {goal.targetDate}</div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 60 }}>
                      <div style={{ fontSize: 22, fontFamily: "DM Serif Display, serif", color: "var(--white)" }}>{goal.progress}%</div>
                      <div className="progress-bar" style={{ width: 60 }}>
                        <div className="progress-fill" style={{ width: `${Math.max(goal.progress, 4)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: sidebar column */}
          <div>
            {/* Risks */}
            <div style={{ marginBottom: 20 }}>
              <div className="section-heading">Active Risks</div>
              <div className="card">
                {highRisks.map(risk => (
                  <div key={risk.id} className="risk-item">
                    <div className={`risk-indicator ${risk.severity}`} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3 }}>{risk.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{risk.note}</div>
                      <div style={{ marginTop: 5 }}>
                        <span className="badge badge-muted">{risk.domain}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="card-sm">
                <div className="stat-value">{activeGoals.length}</div>
                <div className="stat-label">Active Goals</div>
              </div>
              <div className="card-sm">
                <div className="stat-value">{activeProjects.length}</div>
                <div className="stat-label">Projects</div>
              </div>
              <div className="card-sm">
                <div className="stat-value">{openTasks.length}</div>
                <div className="stat-label">Open Tasks</div>
              </div>
              <div className="card-sm">
                <div className="stat-value">{mockUser.streakDays}</div>
                <div className="stat-label">Day Streak</div>
              </div>
            </div>

            {/* Quick add */}
            <div className="card-sm" style={{ textAlign: "center", borderStyle: "dashed", opacity: 0.6 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>+</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Quick capture</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>Coming soon</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
