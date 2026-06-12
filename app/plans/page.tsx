import { AppNav } from "@/components/AppNav";

export default function PlansPage() {
  return (
    <div className="min-h-dvh bg-app-bg">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-serif text-2xl text-app-ink">Plans</h1>
        <p className="mt-2 text-sm text-app-muted">
          History and dashboard land here in Batch 5.
        </p>
      </main>
    </div>
  );
}
