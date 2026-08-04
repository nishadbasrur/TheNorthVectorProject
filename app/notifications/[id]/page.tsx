"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
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

async function fetchNotification(id: string): Promise<{ notification?: NotificationRecord; error?: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  const response = await fetch(`/api/v1/notifications/${id}`, {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  const data = await response.json();
  if (!response.ok) return { error: typeof data.error === "string" ? data.error : "Failed to load." };
  return { notification: data.notification };
}

async function markRead(id: string): Promise<void> {
  const idToken = await auth.currentUser?.getIdToken();
  await fetch(`/api/v1/notifications/${id}/read`, {
    method: "POST",
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
}

// The real deep-link target every notification push points at
// (see functions/src/gmail-webhook.ts / public/firebase-messaging-sw.js) —
// a lockscreen tap lands directly here, on this one card's full detail,
// not the app root or the general list.
export default function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [notification, setNotification] = useState<NotificationRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchNotification(id).then(({ notification: loaded, error }) => {
      if (cancelled) return;
      if (error) {
        setLoadError(error);
      } else if (loaded) {
        setNotification(loaded);
        if (!loaded.read) void markRead(id);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Signal</div>
        <div className="page-title">Notification</div>
        <div className="page-meta">
          <Link href="/notifications">← All notifications</Link>
        </div>
      </div>

      <div className="page-body">
        {isLoading && <div className="card">Loading…</div>}

        {loadError && (
          <div className="card" style={{ color: "var(--status-risk)" }}>
            {loadError}
          </div>
        )}

        {notification && (
          <div className="card">
            <div className="section-heading">{notification.title}</div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{notification.createdAt ?? "unknown time"}</div>

            <div style={{ marginTop: 12, fontWeight: 600 }}>{notification.summary}</div>

            <div style={{ marginTop: 12, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6 }}>
              {notification.detail}
            </div>

            {notification.linkPath && (
              <div style={{ marginTop: 16 }}>
                <a
                  href={notification.linkPath}
                  target="_blank"
                  rel="noreferrer"
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
    </AppShell>
  );
}
