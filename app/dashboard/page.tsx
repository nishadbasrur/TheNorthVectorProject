import { AppShell } from "@/components/layout/app-shell";

const sections = ["Active Goals", "Active Projects", "Upcoming Tasks", "Pending Approvals", "Scheduled Reviews"];

export default function DashboardPage() {
  return (
    <AppShell>
      <h2>Chief Dashboard</h2>
      <p>Current operating view for North Vector V1.</p>
      <div>
        {sections.map((section) => (
          <section key={section}>
            <h3>{section}</h3>
            <p>No items yet.</p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
