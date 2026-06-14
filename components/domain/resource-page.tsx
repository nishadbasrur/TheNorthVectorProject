import { AppShell } from "@/components/layout/app-shell";

type ResourcePageProps = {
  title: string;
  description: string;
};

export function ResourcePage({ title, description }: ResourcePageProps) {
  return (
    <AppShell>
      <h2>{title}</h2>
      <p>{description}</p>
      <section>
        <h3>Records</h3>
        <p>No records yet.</p>
      </section>
      <section>
        <h3>Create</h3>
        <p>Form implementation will be added after API validation.</p>
      </section>
    </AppShell>
  );
}
