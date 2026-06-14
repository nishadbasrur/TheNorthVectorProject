"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navGroups = [
  {
    label: "Command",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "⊞" },
      { label: "Weekly Review", href: "/weekly-review", icon: "◈" },
    ],
  },
  {
    label: "Strategy",
    items: [
      { label: "Goals", href: "/goals", icon: "◎" },
      { label: "Projects", href: "/projects", icon: "▦" },
      { label: "Plans", href: "/plans", icon: "≡" },
      { label: "Decisions", href: "/decisions", icon: "◇" },
    ],
  },
  {
    label: "Execution",
    items: [
      { label: "Tasks", href: "/tasks", icon: "✓" },
      { label: "Reviews", href: "/reviews", icon: "◉" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Memories", href: "/memories", icon: "◐" },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">N</div>
          <div>
            <div className="sidebar-brand-text">North Vector</div>
            <div className="sidebar-brand-sub">Chief of Staff</div>
          </div>
        </div>

        {navGroups.map((group) => (
          <div key={group.label} className="sidebar-section">
            <div className="sidebar-section-label">{group.label}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? "active" : ""}`}
              >
                <span style={{ fontSize: 13, width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">NB</div>
            <div>
              <div className="user-name">Nishad Basrur</div>
              <div className="user-role">Pre-Med · UConn 2029</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
