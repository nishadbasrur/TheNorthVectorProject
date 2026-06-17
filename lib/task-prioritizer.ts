export interface TaskCandidate {
  id: string;
  title: string;
  domain: string;
  status: string;
  dueDate?: string;
  importance?: number;
}

export interface PrioritizedTask extends TaskCandidate {
  priorityScore: number;
  reasons: string[];
}

export function prioritizeTasks(tasks: TaskCandidate[]): PrioritizedTask[] {
  return tasks
    .map((task) => {
      const reasons: string[] = [];
      let priorityScore = 0;

      if (task.status === "pending" || task.status === "active") {
        priorityScore += 20;
        reasons.push("Task is currently active.");
      }

      if (task.importance) {
        priorityScore += task.importance * 10;
        reasons.push(`Importance score contributes ${task.importance * 10} points.`);
      }

      if (task.dueDate) {
        const due = new Date(task.dueDate).getTime();
        const now = Date.now();
        const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 1) {
          priorityScore += 40;
          reasons.push("Task is due within 24 hours.");
        } else if (daysUntilDue <= 3) {
          priorityScore += 25;
          reasons.push("Task is due within 3 days.");
        } else if (daysUntilDue <= 7) {
          priorityScore += 10;
          reasons.push("Task is due within 7 days.");
        }
      }

      if (task.domain === "education" || task.domain === "career") {
        priorityScore += 15;
        reasons.push("Task supports education or career priorities.");
      }

      return {
        ...task,
        priorityScore,
        reasons,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}