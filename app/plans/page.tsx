import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { PlansDashboard } from "@/components/plans/PlansDashboard";
import { PlansListSkeleton } from "@/components/skeletons/PlansListSkeleton";
import { getPlansList } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function PlansPage() {
  // Instant shell + header; the list streams in (skeleton shows meanwhile).
  return (
    <AppShell title="Plans">
      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-10">
        <div className="flex items-center justify-between">
          <h1 className="hidden font-serif text-2xl text-app-ink lg:block">Plans</h1>
          <Button asChild className="max-lg:w-full">
            <Link href="/plans/new">
              <Plus className="h-4 w-4" /> New plan
            </Link>
          </Button>
        </div>
        <Suspense fallback={<PlansListSkeleton />}>
          <PlansData />
        </Suspense>
      </main>
    </AppShell>
  );
}

async function PlansData() {
  const plans = await getPlansList();
  return <PlansDashboard plans={plans} />;
}
