"use client";

import { use, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";

type CapabilityGap = {
  kind: "capability" | "bug_fix";
  request: string;
  capability: string;
  status: "pending_gap" | "pending_review" | "approved" | "denied";
  prNumber: number | null;
  prUrl: string | null;
  toolName: string | null;
  targetFile: string | null;
  summary: string | null;
  diff: string | null;
};

async function fetchGap(gapId: string): Promise<{ gap?: CapabilityGap; error?: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(`/api/v1/capability-gap/${gapId}`, {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  const data = await response.json();
  if (!response.ok) return { error: typeof data.error === "string" ? data.error : "Failed to load." };
  return { gap: data };
}

async function postAction(gapId: string, action: "approve" | "deny"): Promise<{ ok: boolean; error?: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(`/api/v1/capability-gap/${gapId}/${action}`, {
    method: "POST",
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  const data = await response.json();
  if (!response.ok) return { ok: false, error: typeof data.error === "string" ? data.error : "Action failed." };
  return { ok: true };
}

// The one screen in the whole self-extension pipeline where a human
// actually looks at what North wrote before it can ship. Everything before
// this (drafting, typecheck, build, opening the PR) happened autonomously;
// this page is the checkpoint, not a formality — the diff is shown in
// full, not just the AI-generated summary, specifically so Approve isn't a
// blind tap.
export default function CapabilityReviewPage({ params }: { params: Promise<{ gapId: string }> }) {
  const { gapId } = use(params);

  const [gap, setGap] = useState<CapabilityGap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionState, setActionState] = useState<"idle" | "approving" | "denying">("idle");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGap(gapId).then(({ gap: loaded, error }) => {
      if (cancelled) return;
      if (error) setLoadError(error);
      else setGap(loaded ?? null);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [gapId]);

  async function handleAction(action: "approve" | "deny") {
    setActionState(action === "approve" ? "approving" : "denying");
    setActionError(null);

    const result = await postAction(gapId, action);

    setActionState("idle");

    if (!result.ok) {
      setActionError(result.error ?? "Action failed.");
      return;
    }

    setGap((current) => (current ? { ...current, status: action === "approve" ? "approved" : "denied" } : current));
  }

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">
          {gap?.kind === "bug_fix" ? "Autonomous Bug Fix" : "Autonomous Capability Draft"}
        </div>
        <div className="page-title">{gap?.toolName ?? "Review"}</div>
        <div className="page-meta">Drafted by North — nothing is live until you approve.</div>
      </div>

      <div className="page-body">
        {isLoading && <div className="card">Loading…</div>}

        {loadError && (
          <div className="card" style={{ color: "var(--status-risk)" }}>
            {loadError}
          </div>
        )}

        {gap && (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-heading">{gap.kind === "bug_fix" ? "Tool" : "Asked"}</div>
              <div>{gap.request}</div>

              <div className="section-heading" style={{ marginTop: 12 }}>
                {gap.kind === "bug_fix" ? "Error" : "Missing capability"}
              </div>
              <div>{gap.capability}</div>

              {gap.summary && (
                <>
                  <div className="section-heading" style={{ marginTop: 12 }}>
                    {gap.kind === "bug_fix" ? "What this fixes" : "What this adds"}
                  </div>
                  <div>{gap.summary}</div>
                </>
              )}

              {gap.targetFile && (
                <>
                  <div className="section-heading" style={{ marginTop: 12 }}>
                    File touched
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{gap.targetFile}</div>
                </>
              )}

              <div className="section-heading" style={{ marginTop: 12 }}>
                Status
              </div>
              <div>{gap.status.replace("_", " ")}</div>

              {gap.prUrl && (
                <div style={{ marginTop: 12 }}>
                  <a href={gap.prUrl} target="_blank" rel="noreferrer">
                    View on GitHub →
                  </a>
                </div>
              )}
            </div>

            {gap.diff ? (
              <div className="card" style={{ marginBottom: 16, overflowX: "auto" }}>
                <div className="section-heading">Diff</div>
                <pre
                  style={{
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginTop: 8,
                  }}
                >
                  {gap.diff}
                </pre>
              </div>
            ) : gap.prNumber ? (
              <div className="card" style={{ marginBottom: 16 }}>
                Diff unavailable right now — view the PR on GitHub directly before deciding.
              </div>
            ) : (
              <div className="card" style={{ marginBottom: 16 }}>
                No PR yet — this capability is still being drafted, or was judged infeasible. Check back shortly.
              </div>
            )}

            {gap.status === "pending_review" && (
              <div style={{ display: "flex", gap: 12 }}>
                <button className="nv-button" disabled={actionState !== "idle"} onClick={() => handleAction("approve")}>
                  {actionState === "approving" ? "Merging…" : "Approve & Merge"}
                </button>
                <button
                  className="nv-button-secondary"
                  disabled={actionState !== "idle"}
                  onClick={() => handleAction("deny")}
                >
                  {actionState === "denying" ? "Closing…" : "Deny"}
                </button>
              </div>
            )}

            {gap.status === "approved" && <div className="card">Approved and merged — deploying now.</div>}
            {gap.status === "denied" && <div className="card">Denied — PR closed, nothing shipped.</div>}
            {actionError && (
              <div style={{ marginTop: 12, color: "var(--status-risk)" }}>{actionError}</div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
