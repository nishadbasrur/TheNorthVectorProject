"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  {
    label: "Finance",
    items: [
      { label: "Accounts", href: "/accounts", icon: "$" },
    ],
  },
  {
    label: "Experimental",
    items: [
      { label: "Sandbox (beta)", href: "/sandbox", icon: "⚠" },
    ],
  },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {navGroups.map((group) => (
        <div key={group.label} className="sidebar-section">
          <div className="sidebar-section-label">{group.label}</div>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? "active" : ""}`}
              onClick={onNavigate}
            >
              <span style={{ fontSize: 13, width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}

function BrandBlock() {
  return (
    <div className="sidebar-brand">
      <div className="sidebar-brand-mark">N</div>
      <div>
        <div className="sidebar-brand-text">North Vector</div>
        <div className="sidebar-brand-sub">Chief of Staff</div>
      </div>
    </div>
  );
}

function UserChip() {
  return (
    <div className="sidebar-footer">
      <Link href="/settings" className="user-chip">
        <div className="user-avatar">NB</div>
        <div>
          <div className="user-name">Nishad Basrur</div>
          <div className="user-role">Pre-Med · UConn 2029</div>
        </div>
      </Link>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="app-layout">
      <div className="mobile-topbar">
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
        >
          ☰
        </button>
        <div className="mobile-topbar-brand">North Vector</div>
      </div>

      <aside className="sidebar">
        <BrandBlock />

        <button
          type="button"
          className="rail-toggle-btn"
          onClick={() => setNavOpen(true)}
          aria-label="Expand navigation"
        >
          ☰
        </button>

        <NavLinks pathname={pathname} />

        <UserChip />
      </aside>

      {navOpen && (
        <>
          <div className="nav-drawer-backdrop" onClick={() => setNavOpen(false)} />
          <aside className="nav-drawer">
            <button
              type="button"
              className="nav-drawer-close"
              onClick={() => setNavOpen(false)}
              aria-label="Close navigation"
            >
              ✕
            </button>

            <BrandBlock />

            <NavLinks pathname={pathname} onNavigate={() => setNavOpen(false)} />

            <UserChip />
          </aside>
        </>
      )}

      <main className="main-content">{children}</main>
    </div>
  );
}
