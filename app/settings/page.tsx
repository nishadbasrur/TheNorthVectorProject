"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";
import { enableUrgentAlerts, type PushEnableFailureReason } from "@/lib/push-client";

const PUSH_ERROR_MESSAGES: Record<PushEnableFailureReason, string> = {
  unsupported: "Push notifications aren't supported in this browser.",
  "permission-denied": "Notification permission was denied — check this site's permission in your browser settings.",
  "not-signed-in": "You need to be signed in to enable alerts.",
  error: "Something went wrong enabling alerts.",
};

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "enabling" | "enabled" | "error">("idle");
  const [pushError, setPushError] = useState<string | null>(null);

  const handleEnableAlerts = async () => {
    setPushStatus("enabling");
    setPushError(null);

    const result = await enableUrgentAlerts();

    if (result.ok) {
      setPushStatus("enabled");
    } else {
      setPushStatus("error");
      setPushError(result.error ?? PUSH_ERROR_MESSAGES[result.reason]);
    }
  };

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Account</div>
        <div className="page-title">Settings</div>
        <div className="page-meta">Signed in as {auth.currentUser?.email}</div>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card-label">Notifications</div>
          <div className="card-title">Urgent alerts</div>
          <div className="card-sub">
            Push notifications for upcoming meetings, Notion items marked urgent, and time-sensitive
            email — the stand-in for haptic alerts until North hardware exists.
          </div>
          <button
            className="nv-button-secondary"
            style={{ marginTop: 12 }}
            onClick={handleEnableAlerts}
            disabled={pushStatus === "enabling" || pushStatus === "enabled"}
          >
            {pushStatus === "enabled" ? "Enabled on this device" : pushStatus === "enabling" ? "Enabling…" : "Enable urgent alerts"}
          </button>
          {pushError && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--status-warning)" }}>{pushError}</div>
          )}
        </div>

        <div className="card" style={{ maxWidth: 480, marginTop: 16 }}>
          <div className="card-label">Developer</div>
          <div className="card-title">Copy ID token</div>
          <div className="card-sub">For manually testing authenticated API routes.</div>
          <button
            className="nv-button-secondary"
            style={{ marginTop: 12 }}
            onClick={async () => {
              const token = await auth.currentUser?.getIdToken();
              if (token) {
                await navigator.clipboard.writeText(token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
          >
            {copied ? "Copied" : "Copy ID Token"}
          </button>
        </div>

        <div className="card" style={{ maxWidth: 480, marginTop: 16 }}>
          <div className="card-label">Session</div>
          <div className="card-title">Sign out</div>
          <div className="card-sub">Ends your session on this device.</div>
          <button
            className="nv-button-secondary"
            style={{ marginTop: 12 }}
            onClick={() => signOut(auth)}
          >
            Sign Out
          </button>
        </div>
      </div>
    </AppShell>
  );
}
