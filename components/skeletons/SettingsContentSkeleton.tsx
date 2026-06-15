import { Skeleton } from "@/components/ui/skeleton";

// Content skeleton for Settings — the tab strip + rows that stream in while the
// banks load (shared by the page <Suspense> and loading.tsx).
export function SettingsContentSkeleton() {
  return (
    <div className="mt-6">
      <Skeleton className="h-10 w-[26rem] max-w-full" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
