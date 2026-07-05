import { AppShell } from "@/components/layout/app-shell";

export default function ReviewsPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div className="page-eyebrow">Reflection Layer</div>
        <div className="page-title">Reviews</div>
        <div className="page-meta">Structured weekly and strategic reflections</div>
      </div>

      <div className="page-body">
        <div className="card">
          No reviews recorded yet. There is no weekly-review generation feature built yet — this page will show real
          review history once that's built.
        </div>
      </div>
    </AppShell>
  );
}
