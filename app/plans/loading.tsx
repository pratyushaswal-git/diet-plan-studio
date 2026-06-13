import { AppNav } from "@/components/AppNav";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlansLoading() {
  return (
    <div className="min-h-dvh bg-app-bg">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}
