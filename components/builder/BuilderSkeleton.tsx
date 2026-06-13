import { AppNav } from "@/components/AppNav";
import { Skeleton } from "@/components/ui/skeleton";

export function BuilderSkeleton() {
  return (
    <div className="min-h-dvh bg-app-bg">
      <AppNav />
      <div className="border-b border-app-rule bg-app-surface">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-2.5">
          <Skeleton className="h-9 w-72" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-[1400px] px-4 py-5">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:gap-5">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
          <Skeleton className="hidden h-[calc(100dvh-160px)] w-full lg:block" />
        </div>
      </main>
    </div>
  );
}
