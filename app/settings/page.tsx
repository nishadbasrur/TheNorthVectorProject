"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Account</div>
        <div className="page-title">Settings</div>
        <div className="page-meta">Signed in as {auth.currentUser?.email}</div>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 480 }}>
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
