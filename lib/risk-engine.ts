export type RiskSeverity = "low" | "medium" | "high";

export interface RiskRecord {
  id: string;
  title: string;
  severity: RiskSeverity;
  domain: string;
  note: string;
}

// Structural, dependency-free input shapes — deliberately not imported from
// task-store.ts/goal-store.ts (which pull in the client Firestore SDK), so
// this file can be safely imported from any runtime, including Cloud
// Functions. TaskRecord/GoalRecord already satisfy these shapes.
export interface RiskEvaluationTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  domain: string;
  dueDate?: string;
}

export interface RiskEvaluationGoal {
  id: string;
  title: string;
  status: string;
  horizon: string;
  progress: number;
  targetDate?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function hoursUntil(dateString: string) {
  return (new Date(dateString).getTime() - Date.now()) / HOUR_MS;
}

function daysUntil(dateString: string) {
  return (new Date(dateString).getTime() - Date.now()) / DAY_MS;
}

function evaluateTaskRisks(tasks: RiskEvaluationTask[]): RiskRecord[] {
  return tasks
    .filter((task) => task.status !== "completed" && task.status !== "cancelled")
    .filter((task) => task.priority === "high" || task.priority === "critical")
    .filter((task) => task.dueDate !== undefined && hoursUntil(task.dueDate) <= 48)
    .map((task) => ({
      id: `task-${task.id}`,
      title: `High-priority task due soon: ${task.title}`,
      severity: task.priority === "critical" ? "high" : "medium",
      domain: task.domain,
      note: `Due ${task.dueDate}, priority ${task.priority}, not yet completed.`,
    }));
}

function evaluateGoalRisks(goals: RiskEvaluationGoal[]): RiskRecord[] {
  const risks: RiskRecord[] = [];

  for (const goal of goals) {
    if (goal.status !== "active" || !goal.targetDate) continue;

    const days = daysUntil(goal.targetDate);
    if (days < 0) continue;

    if (days <= 30 && goal.progress < 50) {
      risks.push({
        id: `goal-${goal.id}`,
        title: `Goal at risk: ${goal.title}`,
        severity: "high",
        domain: goal.horizon,
        note: `${goal.progress}% complete with ${Math.round(days)} days until target (${goal.targetDate}).`,
      });
    } else if (days <= 90 && goal.progress < 30) {
      risks.push({
        id: `goal-${goal.id}`,
        title: `Goal progress lagging: ${goal.title}`,
        severity: "medium",
        domain: goal.horizon,
        note: `${goal.progress}% complete with ${Math.round(days)} days until target (${goal.targetDate}).`,
      });
    }
  }

  return risks;
}

export function evaluateRisks(tasks: RiskEvaluationTask[], goals: RiskEvaluationGoal[]): RiskRecord[] {
  return [...evaluateTaskRisks(tasks), ...evaluateGoalRisks(goals)];
}
