import { AppNav } from "@/components/AppNav";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="min-h-dvh bg-app-bg">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-3 h-4 w-80" />
        <Skeleton className="mt-6 h-10 w-[26rem]" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}
