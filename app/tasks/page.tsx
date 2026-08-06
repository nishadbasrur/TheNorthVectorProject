"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  createTask,
  getTasks,
  updateTaskStatus,
  type TaskDomain,
  type TaskEnergy,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
} from "@/lib/task-store";

const priorities: TaskPriority[] = ["low", "medium", "high", "critical"];
const statuses: TaskStatus[] = ["scheduled", "active", "paused", "completed", "cancelled"];
const energies: TaskEnergy[] = ["low", "medium", "high"];
const domains: TaskDomain[] = ["academic", "career", "health", "personal", "north-vector"];

function formatLabel(value: string) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("scheduled");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [energy, setEnergy] = useState<TaskEnergy>("medium");
  const [domain, setDomain] = useState<TaskDomain>("north-vector");
  const [dueDate, setDueDate] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [notes, setNotes] = useState("");

  async function loadTasks() {
    const records = await getTasks();
    setTasks(records);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleCreateTask() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) return;

    setIsSaving(true);

    try {
      await createTask({
        title: trimmedTitle,
        description: description.trim(),
        status,
        priority,
        energy,
        domain,
        dueDate: dueDate || undefined,
        estimatedMinutes: Number(estimatedMinutes) || 30,
        notes: notes.trim(),
      });

      setTitle("");
      setDescription("");
      setStatus("scheduled");
      setPriority("medium");
      setEnergy("medium");
      setDomain("north-vector");
      setDueDate("");
      setEstimatedMinutes("30");
      setNotes("");

      await loadTasks();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCompleteTask(taskId: string) {
    await updateTaskStatus(taskId, "completed");
    await loadTasks();
  }

  const openTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Execution Layer</div>
        <div className="page-title">Tasks</div>
        <div className="page-meta">
          Firestore-backed execution queue · {openTasks.length} open · {completedTasks.length} completed
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-heading">Create Task</div>

          <div className="grid-2" style={{ marginTop: 12 }}>
            <input
              className="nv-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Task title"
            />

            <select
              className="nv-input"
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
            >
              {priorities.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <textarea
            className="nv-textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
          />

          <div className="grid-4" style={{ marginTop: 12 }}>
            <select
              className="nv-input"
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>

            <select
              className="nv-input"
              value={energy}
              onChange={(event) => setEnergy(event.target.value as TaskEnergy)}
            >
              {energies.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)} Energy
                </option>
              ))}
            </select>

            <select
              className="nv-input"
              value={domain}
              onChange={(event) => setDomain(event.target.value as TaskDomain)}
            >
              {domains.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>

            <input
              className="nv-input"
              value={estimatedMinutes}
              onChange={(event) => setEstimatedMinutes(event.target.value)}
              placeholder="30"
            />
          </div>

          <div className="grid-2" style={{ marginTop: 12 }}>
            <input
              className="nv-input"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />

            <input
              className="nv-input"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes"
            />
          </div>

          <button
            className="nv-button"
            onClick={handleCreateTask}
            disabled={isSaving || !title.trim()}
            style={{ marginTop: 14 }}
          >
            {isSaving ? "Creating..." : "Create Task"}
          </button>
        </div>

        <div className="section-heading">Open Tasks</div>

        <div className="card" style={{ marginBottom: 24 }}>
          {openTasks.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              No open tasks.
            </div>
          ) : (
            openTasks.map((task) => (
              <div key={task.id} className="task-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    {task.title}
                  </div>

                  {task.description ? (
                    <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 10 }}>
                      {task.description}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <span className="badge badge-navy">{formatLabel(task.status)}</span>
                    <span className="badge badge-navy">{formatLabel(task.priority)}</span>
                    <span className="badge badge-navy">{formatLabel(task.energy)} Energy</span>
                    <span className="badge badge-navy">{formatLabel(task.domain)}</span>
                    <span className="badge badge-navy">{task.estimatedMinutes} min</span>
                    {task.dueDate ? (
                      <span className="badge badge-muted">{task.dueDate}</span>
                    ) : null}
                  </div>
                </div>

                <button
                  className="nv-button-secondary"
                  onClick={() => handleCompleteTask(task.id)}
                >
                  Complete
                </button>
              </div>
            ))
          )}
        </div>

        <div className="section-heading">Completed</div>

        <div className="card">
          {completedTasks.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              No completed tasks yet.
            </div>
          ) : (
            completedTasks.map((task) => (
              <div key={task.id} className="task-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    {task.title}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <span className="badge badge-navy">{formatLabel(task.status)}</span>
                    <span className="badge badge-navy">{formatLabel(task.priority)}</span>
                    <span className="badge badge-navy">{formatLabel(task.energy)} Energy</span>
                    <span className="badge badge-navy">{formatLabel(task.domain)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
