"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { createMemory, getMemories } from "@/lib/memory-store";

type FirestoreMemory = {
  id: string;
  content?: string;
  createdAt?: string;
};

type LocalMemory = {
  id: string;
  status: string;
  created_at: string;
  type: string;
  domain: string;
  content: string;
  confidence: number;
};

export default function MemoriesPage() {
  const [memories, setMemories] = useState<FirestoreMemory[]>([]);
  const [localMemories, setLocalMemories] = useState<LocalMemory[]>([]);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadMemories() {
    const records = await getMemories();
    setMemories(records as FirestoreMemory[]);
  }

  async function loadLocalMemories() {
    const response = await fetch("/api/v1/memories/local");
    const data = await response.json();
    setLocalMemories(data.records ?? []);
  }

  useEffect(() => {
    loadMemories();
    loadLocalMemories();
  }, []);

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed) return;

    setIsSaving(true);

    try {
      await createMemory(trimmed);
      setContent("");
      await loadMemories();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Intelligence Layer</div>
        <div className="page-title">Memories</div>
        <div className="page-meta">
          Persistent Firestore memory store · {memories.length} stored records ·{" "}
          {localMemories.length} local curated records
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-heading">Create Memory</div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write something North Vector should remember..."
            style={{
              width: "100%",
              minHeight: 120,
              borderRadius: 14,
              border: "1px solid var(--border-subtle)",
              background: "rgba(4, 9, 26, 0.6)",
              color: "var(--text-primary)",
              padding: 16,
              fontSize: 14,
              resize: "vertical",
              outline: "none",
              marginTop: 12,
              marginBottom: 12,
            }}
          />

          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            style={{
              border: "1px solid var(--cyan-500)",
              background: "rgba(34, 211, 238, 0.12)",
              color: "var(--cyan-300)",
              padding: "10px 16px",
              borderRadius: 999,
              fontWeight: 700,
              cursor: isSaving ? "wait" : "pointer",
              opacity: isSaving || !content.trim() ? 0.55 : 1,
            }}
          >
            {isSaving ? "Saving..." : "Save Memory"}
          </button>
        </div>

        <div className="section-heading">Local Curated Memories</div>

        <div className="card" style={{ marginBottom: 24 }}>
          {localMemories.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              No local curated memories found.
            </div>
          ) : (
            localMemories.map((memory) => (
              <div key={memory.id} className="memory-row">
                <div className="memory-icon">🧭</div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--cyan-300)",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {memory.domain} · {memory.type} ·{" "}
                    {Math.round(memory.confidence * 100)}%
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 6,
                    }}
                  >
                    {memory.content}
                  </div>

                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
                    {memory.status} · {memory.id}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="section-heading">Stored Memories</div>

        <div className="card">
          {memories.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              No memories stored yet.
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="memory-row">
                <div className="memory-icon">🧠</div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 6,
                    }}
                  >
                    {memory.content}
                  </div>

                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
                    {memory.createdAt
                      ? new Date(memory.createdAt).toLocaleString()
                      : "No timestamp"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}