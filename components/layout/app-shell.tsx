import Link from "next/link";

const navItems = [
  ["Dashboard", "/dashboard"],
  ["Memories", "/memories"],
  ["Goals", "/goals"],
  ["Projects", "/projects"],
  ["Tasks", "/tasks"],
  ["Plans", "/plans"],
  ["Decisions", "/decisions"],
  ["Reviews", "/reviews"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>
        <h1>North Vector</h1>
        <nav>
          {navItems.map(([label, href]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
