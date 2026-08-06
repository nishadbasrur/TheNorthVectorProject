import { logger } from "firebase-functions";

// Fires GitHub's workflow_dispatch API to kick off the
// autonomous-capability-draft workflow (.github/workflows/autonomous-capability-draft.yml).
//
// Deliberately workflow_dispatch, not the simpler-looking repository_dispatch
// (`/repos/{owner}/{repo}/dispatches`) — that endpoint requires a token with
// Contents:write, which can push code directly via the Git API, defeating
// the entire point of a narrowly-scoped trigger-only credential.
// workflow_dispatch (`/repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches`)
// only needs Actions:write, which can start/cancel workflow runs but cannot
// touch repo contents at all. This function's token is scoped to exactly
// that — it never pushes code or opens PRs itself. The actual code-writing
// and branch-push happen inside the GitHub Actions run, using that run's
// own short-lived, repo-scoped GITHUB_TOKEN, which this function never
// sees and which expires when the run ends. See
// North_Vector_Autonomous_Self_Extension_Plan.md Section 3.
const GITHUB_REPO = "nishadbasrur/TheNorthVectorProject";
const WORKFLOW_FILE = "autonomous-capability-draft.yml";
const GITHUB_DISPATCH_URL = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;

// kind mirrors lib/capability-gap-store.ts's CapabilityGap["kind"] — passed
// through as a workflow input so the single Draft step in
// autonomous-capability-draft.yml knows whether to run
// scripts/draft-capability.js (new tool, additions-only scope fence) or
// scripts/draft-bugfix.js (existing tool, single-allowlisted-file rewrite
// scope fence). request/capability are reused for both kinds: for
// "capability" they're the user's ask and the missing capability
// description; for "bug_fix" they're the failing tool's name and its real
// error message (see functions/src/index.ts's onToolError).
export async function dispatchCapabilityDraft(
  githubToken: string,
  gapId: string,
  kind: "capability" | "bug_fix",
  request: string,
  capability: string
): Promise<boolean> {
  try {
    const response = await fetch(GITHUB_DISPATCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { gapId, kind, request, capability },
      }),
    });

    if (!response.ok) {
      logger.error(`GitHub dispatch failed: ${response.status} ${await response.text()}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error("GitHub dispatch request failed:", error);
    return false;
  }
}
