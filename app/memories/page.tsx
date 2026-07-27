"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { createMemory, getMemories } from "@/lib/memory-store";

type FirestoreMemory = {
  id: string;
  content?: string;
  domain?: string;
  type?: string;
  tier?: "general" | "distilled";
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
  const [domain, setDomain] = useState("");
  const [type, setType] = useState("");
  const [tier, setTier] = useState<"general" | "distilled">("distilled");
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
    const trimmedContent = content.trim();
    const trimmedDomain = domain.trim();
    const trimmedType = type.trim();
    if (!trimmedContent || !trimmedDomain || !trimmedType) return;

    setIsSaving(true);

    try {
      await createMemory({ content: trimmedContent, domain: trimmedDomain, type: trimmedType, tier });
      setContent("");
      setDomain("");
      setType("");
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

          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <input
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              placeholder="Domain (e.g. academic, health, finance)"
              style={{
                flex: 1,
                borderRadius: 10,
                border: "1px solid var(--border-subtle)",
                background: "rgba(4, 9, 26, 0.6)",
                color: "var(--text-primary)",
                padding: "10px 12px",
                fontSize: 13,
                outline: "none",
              }}
            />
            <input
              value={type}
              onChange={(event) => setType(event.target.value)}
              placeholder="Type (e.g. preference, fact, goal)"
              style={{
                flex: 1,
                borderRadius: 10,
                border: "1px solid var(--border-subtle)",
                background: "rgba(4, 9, 26, 0.6)",
                color: "var(--text-primary)",
                padding: "10px 12px",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Tier
            </span>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-primary)", cursor: "pointer" }}>
              <input type="radio" name="tier" checked={tier === "distilled"} onChange={() => setTier("distilled")} />
              Distilled (curated, durable)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-primary)", cursor: "pointer" }}>
              <input type="radio" name="tier" checked={tier === "general"} onChange={() => setTier("general")} />
              General (everything else)
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim() || !domain.trim() || !type.trim()}
            style={{
              border: "1px solid var(--cyan-500)",
              background: "rgba(34, 211, 238, 0.12)",
              color: "var(--cyan-300)",
              padding: "10px 16px",
              borderRadius: 999,
              fontWeight: 700,
              cursor: isSaving ? "wait" : "pointer",
              opacity: isSaving || !content.trim() || !domain.trim() || !type.trim() ? 0.55 : 1,
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
                  {(memory.domain || memory.type || memory.tier) && (
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
                      {[memory.domain, memory.type, memory.tier].filter(Boolean).join(" · ")}
                    </div>
                  )}

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