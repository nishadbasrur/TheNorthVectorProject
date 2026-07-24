import { createServer } from "http";
import { randomUUID, timingSafeEqual } from "crypto";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execFileSync } from "child_process";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Options, SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Standalone Cloud Run service (same reasoning as stt-stream-service): the
// Agent SDK needs a genuine writable filesystem to git-clone a target repo
// and let Claude Code read/write/run Bash against a real working tree —
// Firebase Functions v2's ephemeral, framework-managed request lifecycle
// isn't a fit for that, per the "Toward a Full Claude Platform" plan's own
// stated reasoning (kept after being offered the Managed Agents
// alternative — see that conversation for the explicit choice).

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

function getServiceAccount(envVar: string): ServiceAccount {
  const raw = process.env[envVar];
  if (!raw) throw new Error(`${envVar} must be set.`);
  return JSON.parse(raw) as ServiceAccount;
}

if (!getApps().length) {
  const firebaseServiceAccount = getServiceAccount("FIREBASE_SERVICE_ACCOUNT_KEY");
  initializeApp({
    credential: cert({
      projectId: firebaseServiceAccount.project_id,
      clientEmail: firebaseServiceAccount.client_email,
      privateKey: firebaseServiceAccount.private_key,
    }),
  });
}

const db = getFirestore();

type RunAgentTaskBody = {
  task: string;
  targetRepo?: string; // "owner/repo", cloned fresh into a scratch dir per run
};

// Two independent auth layers, deliberately not sharing a header:
// 1. Cloud Run platform IAM (roles/run.invoker) already validated the
//    standard `Authorization: Bearer <Google ID token>` header before this
//    process ever sees the request — the service is deployed WITHOUT
//    --allow-unauthenticated, unlike stt-stream-service.
// 2. This app-level shared secret, in its own header, as defense in depth
//    on top of that — same "narrow scoped token" treatment as
//    GITHUB_DISPATCH_TOKEN in functions/src/capability-gap-dispatch.ts.
function isAuthorized(sharedSecretHeader: string | undefined): boolean {
  const expected = process.env.AGENT_RUNNER_SHARED_SECRET;
  if (!expected) throw new Error("AGENT_RUNNER_SHARED_SECRET must be set.");
  const provided = sharedSecretHeader ?? "";
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

function sseWrite(res: import("http").ServerResponse, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Every run gets its own scratch clone — cloned fresh, wiped in `finally`.
// No run reuses another run's working directory.
async function runAgentTask(
  runId: string,
  body: RunAgentTaskBody,
  onMessage: (message: SDKMessage) => void
): Promise<{ status: "completed" | "failed"; result?: string; error?: string }> {
  const workDir = mkdtempSync(join(tmpdir(), "agent-run-"));

  try {
    if (body.targetRepo) {
      const token = process.env.AGENT_GITHUB_TOKEN;
      if (!token) throw new Error("AGENT_GITHUB_TOKEN must be set to clone a target repo.");
      const authedUrl = `https://x-access-token:${token}@github.com/${body.targetRepo}.git`;
      execFileSync("git", ["clone", "--depth", "1", authedUrl, workDir], { stdio: "pipe" });
    }

    const options: Options = {
      cwd: workDir,
      tools: { type: "preset", preset: "claude_code" },
      // Headless service, nobody at a keyboard to approve prompts — the
      // user explicitly chose the maximally-permissive options (any
      // repo/directory, Bash by default, full outbound network) for this
      // capability, so bypassPermissions (the only mode that doesn't hang
      // waiting for an approval that will never come) matches that choice.
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    };

    let finalResult: string | undefined;
    let sawError: string | undefined;

    for await (const message of query({ prompt: body.task, options })) {
      onMessage(message);
      if (message.type === "result") {
        if (message.subtype === "success") {
          finalResult = message.result;
        } else {
          sawError = message.subtype;
        }
      }
    }

    if (sawError) {
      return { status: "failed", error: sawError };
    }
    return { status: "completed", result: finalResult };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

const httpServer = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/run-agent-task") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  if (!isAuthorized(req.headers["x-agent-runner-secret"] as string | undefined)) {
    res.writeHead(401, { "Content-Type": "text/plain" });
    res.end("Unauthorized.");
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  let body: RunAgentTaskBody;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Invalid JSON body.");
    return;
  }

  if (!body.task || typeof body.task !== "string") {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Missing required field: task (string).");
    return;
  }

  const runId = randomUUID();
  const runRef = db.collection("agent_runs").doc(runId);
  await runRef.set({
    task: body.task,
    targetRepo: body.targetRepo ?? null,
    status: "running",
    createdAt: FieldValue.serverTimestamp(),
  });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  sseWrite(res, "run", { runId });

  try {
    const outcome = await runAgentTask(runId, body, (message) => {
      sseWrite(res, "message", message);
      runRef.collection("events").add({
        message,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    await runRef.update({
      status: outcome.status,
      result: outcome.result ?? null,
      error: outcome.error ?? null,
      completedAt: FieldValue.serverTimestamp(),
    });
    sseWrite(res, "done", outcome);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await runRef.update({ status: "failed", error, completedAt: FieldValue.serverTimestamp() });
    sseWrite(res, "error", { error });
  } finally {
    res.end();
  }
});

httpServer.listen(PORT, () => {
  console.log(`agent-runner-service listening on ${PORT}`);
});
