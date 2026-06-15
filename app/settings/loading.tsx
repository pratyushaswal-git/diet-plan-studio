import { AppShell } from "@/components/nav/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsContentSkeleton } from "@/components/skeletons/SettingsContentSkeleton";

export default function SettingsLoading() {
  return (
    <AppShell title="Settings">
      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-10">
        <Skeleton className="hidden h-8 w-32 lg:block" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <SettingsContentSkeleton />
      </main>
    </AppShell>
  );
}
