import "server-only";

// A DIFFERENT credential from GITHUB_DISPATCH_TOKEN (functions/src/capability-gap-dispatch.ts)
// on purpose. That token can only trigger a workflow run — deliberately
// scoped so a leak of it can't touch code or PRs at all. Approving/denying
// a capability draft is a different kind of action (merging or closing a
// real PR), so it needs its own token with its own narrow scope: Pull
// requests: write (merge/close) and Contents: read (fetch the diff) on
// this one repo, nothing else. See
// North_Vector_Autonomous_Self_Extension_Plan.md Section 4 for the setup
// walkthrough. Used only by owner-gated routes under
// app/api/v1/capability-gap/ — never reachable without Nishad's own
// Firebase Auth session.
const GITHUB_REPO = "nishadbasrur/TheNorthVectorProject";
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;

function getToken(): string {
  const token = process.env.GITHUB_MERGE_TOKEN;
  if (!token) {
    throw new Error("GITHUB_MERGE_TOKEN is not set.");
  }
  return token;
}

function authHeaders(accept: string): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: accept,
    "Content-Type": "application/json",
  };
}

export async function getPrDiff(prNumber: number): Promise<string> {
  const response = await fetch(`${GITHUB_API_BASE}/pulls/${prNumber}`, {
    headers: authHeaders("application/vnd.github.v3.diff"),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PR #${prNumber} diff: ${response.status}`);
  }

  return response.text();
}

export async function mergePr(prNumber: number): Promise<void> {
  const response = await fetch(`${GITHUB_API_BASE}/pulls/${prNumber}/merge`, {
    method: "PUT",
    headers: authHeaders("application/vnd.github+json"),
    body: JSON.stringify({ merge_method: "squash" }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to merge PR #${prNumber}: ${response.status} ${detail}`);
  }
}

export async function closePr(prNumber: number): Promise<void> {
  const response = await fetch(`${GITHUB_API_BASE}/pulls/${prNumber}`, {
    method: "PATCH",
    headers: authHeaders("application/vnd.github+json"),
    body: JSON.stringify({ state: "closed" }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to close PR #${prNumber}: ${response.status} ${detail}`);
  }
}
