import { AppShell } from "@/components/nav/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { PlansListSkeleton } from "@/components/skeletons/PlansListSkeleton";

export default function PlansLoading() {
  return (
    <AppShell title="Plans">
      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-10">
        <div className="flex items-center justify-between">
          <Skeleton className="hidden h-8 w-24 lg:block" />
          <Skeleton className="h-9 w-28 max-lg:w-full" />
        </div>
        <PlansListSkeleton />
      </main>
    </AppShell>
  );
}
