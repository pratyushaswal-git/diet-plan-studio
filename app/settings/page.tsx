import { AppNav } from "@/components/AppNav";

export default function SettingsPage() {
  return (
    <div className="min-h-dvh bg-app-bg">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-serif text-2xl text-app-ink">Settings</h1>
        <p className="mt-2 text-sm text-app-muted">
          Bank management (Brands · Slots · Food items · Recipes · Notes) lands
          in Batch 2.
        </p>
      </main>
    </div>
  );
}
