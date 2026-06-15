import { Skeleton } from "@/components/ui/skeleton";

// Content skeleton for the plans list — the body that streams in while
// getPlansList resolves (shared by the page <Suspense> and loading.tsx).
export function PlansListSkeleton() {
  return (
    <div className="mt-6 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
