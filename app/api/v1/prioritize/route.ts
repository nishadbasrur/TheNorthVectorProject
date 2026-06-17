import { NextResponse } from "next/server";
import { prioritizeTasks, type TaskCandidate } from "@/lib/task-prioritizer";

type RawTask = {
  id?: unknown;
  title?: unknown;
  domain?: unknown;
  status?: unknown;
  dueDate?: unknown;
  importance?: unknown;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tasks: RawTask[] = Array.isArray(body.tasks) ? body.tasks : [];

    const sanitizedTasks: TaskCandidate[] = tasks
      .filter((task): task is RawTask => {
        return (
          typeof task.id === "string" &&
          typeof task.title === "string" &&
          typeof task.domain === "string" &&
          typeof task.status === "string"
        );
      })
      .map((task) => ({
        id: task.id as string,
        title: task.title as string,
        domain: task.domain as string,
        status: task.status as string,
        dueDate: typeof task.dueDate === "string" ? task.dueDate : undefined,
        importance:
          typeof task.importance === "number" ? task.importance : undefined,
      }));

    const prioritizedTasks = prioritizeTasks(sanitizedTasks);

    return NextResponse.json({
      count: prioritizedTasks.length,
      records: prioritizedTasks,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}