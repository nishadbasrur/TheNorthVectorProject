"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getTasks, todayFocusDate, type TaskRecord } from "@/lib/task-store";

// Groups by focusDate, not createdAt or dueDate — see lib/task-store.ts's
// own comment on that field for why. Tasks with no focusDate at all
// (pre-dating this feature and not yet backfilled — see
// scripts/backfill-task-focus-date.mjs) are skipped rather than dumped
// into an "undefined" bucket.
function groupByFocusDate(tasks: TaskRecord[]): Map<string, TaskRecord[]> {
  const groups = new Map<string, TaskRecord[]>();
  for (const task of tasks) {
    if (!task.focusDate) continue;
    const existing = groups.get(task.focusDate);
    if (existing) existing.push(task);
    else groups.set(task.focusDate, [task]);
  }
  return groups;
}

// dateString is a plain YYYY-MM-DD, not a UTC instant — parsed as local
// calendar components (not `new Date(dateString)`, which JS treats as
// UTC midnight and can print as the previous day depending on the
// viewer's own timezone offset).
function formatDateHeading(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function TaskHistoryPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getTasks().then((records) => {
      if (cancelled) return;
      setTasks(records);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <AppShell>
        <div className="page-body">
          <div className="card">Loading task history…</div>
        </div>
      </AppShell>
    );
  }

  const today = todayFocusDate();
  const groups = groupByFocusDate(tasks);
  // Today lives on the Dashboard, not here — this page is specifically
  // the backward-browsable record of everything before it. Descending so
  // the most recent past day is always first.
  const pastDates = Array.from(groups.keys())
    .filter((date) => date < today)
    .sort((a, b) => (a < b ? 1 : -1));

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Execution Layer</div>
        <div className="page-title">Previous Dates</div>
        <div className="page-meta">
          Every day&apos;s focus list exactly as it stood — nothing here rolls forward or gets rewritten,
          it just stops being &quot;today.&quot; <Link href="/dashboard" style={{ color: "var(--cyan)" }}>← Back to today</Link>
        </div>
      </div>

      <div className="page-body">
        {pastDates.length === 0 && (
          <div className="card">No previous days with focused tasks yet.</div>
        )}

        {pastDates.map((date) => {
          const dayTasks = groups.get(date) as TaskRecord[];
          const doneCount = dayTasks.filter((task) => task.status === "completed").length;

          return (
            <div key={date} style={{ marginBottom: 24 }}>
              <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span>{formatDateHeading(date)}</span>
                <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>
                  {doneCount}/{dayTasks.length} done
                </span>
              </div>
              <div className="card">
                {dayTasks.map((task) => (
                  <div key={task.id} className="task-row">
                    <div className={`task-check ${task.status === "completed" ? "done" : ""}`} />
                    <div style={{ flex: 1 }}>
                      <div className={`task-text ${task.status === "completed" ? "done" : ""}`}>{task.title}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        className={`badge ${
                          task.priority === "critical" || task.priority === "high"
                            ? "badge-risk"
                            : task.priority === "medium"
                              ? "badge-warning"
                              : "badge-muted"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="badge badge-muted">{formatLabel(task.status)}</span>
                      {task.dueDate && <span className="task-due">{task.dueDate}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
