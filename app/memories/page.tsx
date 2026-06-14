import { AppShell } from "@/components/layout/app-shell";
import { mockMemories } from "@/lib/mock-data";

export default function MemoriesPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Intelligence Layer</div>
        <div className="page-title">Memories</div>
        <div className="page-meta">Captured insights, facts, lessons, and context · {mockMemories.length} records</div>
      </div>

      <div className="page-body">
        {/* Type summary */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: "Insights", value: mockMemories.filter(m => m.type === "insight").length },
            { label: "Facts", value: mockMemories.filter(m => m.type === "fact").length },
            { label: "Lessons", value: mockMemories.filter(m => m.type === "lesson").length },
            { label: "Contacts", value: mockMemories.filter(m => m.type === "contact").length },
          ].map(s => (
            <div key={s.label} className="card-sm">
              <div className="stat-value" style={{ fontSize: 26 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="section-heading">All Records</div>
        <div className="card">
          {mockMemories.map(mem => (
            <div key={mem.id} className="memory-row">
              <div className="memory-icon">{mem.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{mem.title}</span>
                  <span className="badge badge-muted">{mem.type}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{mem.content}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {mem.tags.map(tag => (
                    <span key={tag} className="badge badge-navy">{tag}</span>
                  ))}
                  <span style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: "auto" }}>{mem.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
