"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";

type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  summary: string;
  detail: string;
  linkPath: string | null;
  read: boolean;
  createdAt: string | null;
};

async function fetchNotifications(): Promise<{ notifications?: NotificationRecord[]; error?: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch("/api/v1/notifications", {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  const data = await response.json();
  if (!response.ok) return { error: typeof data.error === "string" ? data.error : "Failed to load." };
  return { notifications: data.notifications };
}

async function markRead(id: string): Promise<void> {
  const idToken = await auth.currentUser?.getIdToken();
  await fetch(`/api/v1/notifications/${id}/read`, {
    method: "POST",
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
}

// The general landing spot for anything North surfaces unprompted — a
// Gmail watch match today, scholarship-automation triggers (missing
// info, essay ready, application ready) once that lands. Every producer
// writes a notification doc first (lib/notification-store.ts) and only
// then sends the actual push, referencing this same doc via
// /notifications/[id] as the deep-link target — see
// functions/src/gmail-webhook.ts.
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchNotifications().then(({ notifications: loaded, error }) => {
      if (cancelled) return;
      if (error) setLoadError(error);
      else setNotifications(loaded ?? []);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleToggle(entry: NotificationRecord) {
    const opening = expandedId !== entry.id;
    setExpandedId(opening ? entry.id : null);

    if (opening && !entry.read) {
      setNotifications((prev) => prev.map((n) => (n.id === entry.id ? { ...n, read: true } : n)));
      void markRead(entry.id);
    }
  }

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Signal</div>
        <div className="page-title">Notifications</div>
        <div className="page-meta">Everything North has surfaced unprompted — newest first.</div>
      </div>

      <div className="page-body">
        {isLoading && <div className="card">Loading…</div>}

        {loadError && (
          <div className="card" style={{ color: "var(--status-risk)" }}>
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && notifications.length === 0 && (
          <div className="card">Nothing surfaced yet.</div>
        )}

        {notifications.map((entry) => {
          const expanded = expandedId === entry.id;
          return (
            <div
              key={entry.id}
              className="card"
              onClick={() => handleToggle(entry)}
              style={{
                marginBottom: 12,
                cursor: "pointer",
                borderLeft: entry.read ? "1px solid var(--border-default)" : "3px solid var(--hud-cyan)",
                background: entry.read ? undefined : "rgba(58, 214, 255, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div className="section-heading" style={{ fontWeight: entry.read ? 400 : 600 }}>
                    {entry.title}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{entry.createdAt ?? "unknown time"}</div>
                </div>
                {!entry.read && (
                  <span
                    style={{
                      flexShrink: 0,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--hud-cyan)",
                      marginTop: 6,
                      boxShadow: "0 0 6px var(--hud-cyan)",
                    }}
                  />
                )}
              </div>

              <div style={{ marginTop: 8 }}>{entry.summary}</div>

              {expanded && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border-default)",
                    whiteSpace: "pre-wrap",
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  {entry.detail}

                  {entry.linkPath && (
                    <div style={{ marginTop: 10 }}>
                      <a
                        href={entry.linkPath}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="badge-cyan"
                        style={{ textDecoration: "none", display: "inline-block" }}
                      >
                        Open →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
