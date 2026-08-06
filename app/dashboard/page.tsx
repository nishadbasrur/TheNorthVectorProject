"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getTasks, type TaskRecord } from "@/lib/task-store";
import { getGoals, type GoalRecord } from "@/lib/goal-store";
import { getProjects, type ProjectRecord } from "@/lib/project-store";
import { getDecisions, type StoredDecision } from "@/lib/decision-memory";
import { evaluateRisks } from "@/lib/risk-engine";

const userName = "Nishad";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function computeStreakDays(tasks: TaskRecord[]) {
  const completedDates = new Set(
    tasks
      .filter((task) => task.completedAt)
      .map((task) => new Date(task.completedAt as string).toDateString())
  );

  let streak = 0;
  const cursor = new Date();

  while (completedDates.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function computeWeekScore(tasks: TaskRecord[]) {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const weekTasks = tasks.filter((task) => now - new Date(task.createdAt).getTime() <= weekMs);

  if (weekTasks.length === 0) return 0;

  const completed = weekTasks.filter((task) => task.status === "completed");
  return Math.round((completed.length / weekTasks.length) * 100);
}

function computeGoalCountdowns(goals: GoalRecord[]) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return goals
    .filter((goal) => goal.status === "active" && goal.targetDate)
    .map((goal) => {
      const days = Math.max(0, Math.ceil((new Date(goal.targetDate as string).getTime() - now) / dayMs));
      const urgency = days <= 14 ? "high" : days <= 45 ? "medium" : "low";
      return { label: goal.title, days, urgency };
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [decisions, setDecisions] = useState<StoredDecision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [taskRecords, goalRecords, projectRecords, decisionRecords] = await Promise.all([
        getTasks(),
        getGoals(),
        getProjects(),
        getDecisions(),
      ]);

      if (cancelled) return;

      setTasks(taskRecords);
      setGoals(goalRecords);
      setProjects(projectRecords);
      setDecisions(decisionRecords);
      setIsLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const openTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const todayTasks = openTasks.slice(0, 5);
  const activeGoals = goals.filter((g) => g.status === "active");
  const activeProjects = projects.filter((p) => p.status === "active");
  const risks = evaluateRisks(tasks, goals);
  const highRisks = risks.filter((r) => r.severity === "high" || r.severity === "medium");
  const recentDecisions = decisions.slice(0, 3);
  const weekScore = computeWeekScore(tasks);
  const streakDays = computeStreakDays(tasks);
  const countdowns = computeGoalCountdowns(goals);

  if (isLoading) {
    return (
      <AppShell>
        <div className="page-body">
          <div className="card">Loading dashboard…</div>
        </div>
      </AppShell>
    );
  }

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
              {getGreeting()}, <em>{userName}</em>
            </div>
            <div className="page-meta" style={{ marginTop: 8 }}>
              Week score <strong style={{ color: "#f0f2f8" }}>{weekScore}%</strong>
              &nbsp;·&nbsp;{streakDays}-day execution streak&nbsp;·&nbsp;
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
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - weekScore / 100)}`}
                  transform="rotate(-90 36 36)"
                />
                <text x="36" y="40" textAnchor="middle" fill="white" fontSize="16" fontFamily="DM Serif Display, serif">
                  {weekScore}
                </text>
              </svg>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Week Score</div>
          </div>
        </div>

        {/* Countdowns */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {countdowns.map((c) => (
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
                    <div className={`task-check ${task.status === "completed" ? "done" : ""}`} />
                    <div style={{ flex: 1 }}>
                      <div className={`task-text ${task.status === "completed" ? "done" : ""}`}>{task.title}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`badge ${task.priority === "critical" || task.priority === "high" ? "badge-risk" : task.priority === "medium" ? "badge-warning" : "badge-muted"}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && <span className="task-due">{task.dueDate}</span>}
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
                      {proj.tags[0] && <span className="badge badge-navy">{proj.tags[0]}</span>}
                    </div>
                    <div className="card-sub" style={{ marginBottom: 10, fontSize: 12 }}>{proj.description}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{proj.doneCount}/{proj.taskCount} tasks</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{proj.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${proj.progress}%` }} />
                    </div>
                    {proj.nextMilestone && (
                      <div style={{ marginTop: 10, fontSize: 11, color: "var(--cyan)" }}>→ {proj.nextMilestone}</div>
                    )}
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
                      {goal.targetDate && <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>Target: {goal.targetDate}</div>}
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
                {highRisks.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-faint)" }}>No active risks detected.</div>
                )}
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

            {/* Recent Decisions */}
            <div style={{ marginBottom: 20 }}>
              <div className="section-heading">Recent Decisions</div>
              <div className="card">
                {recentDecisions.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-faint)" }}>No decisions recorded yet.</div>
                )}
                {recentDecisions.map(decision => (
                  <div key={decision.question} className="risk-item">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3 }}>{decision.question}</div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{decision.recommendation}</div>
                      <div style={{ marginTop: 5 }}>
                        <span className="badge badge-muted">{decision.confidence} confidence</span>
                        <span className="badge badge-muted" style={{ marginLeft: 6 }}>asked {decision.timesAsked}×</span>
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
                <div className="stat-value">{streakDays}</div>
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
