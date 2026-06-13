import Link from "next/link";
import { Plus } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { PlansDashboard } from "@/components/plans/PlansDashboard";
import { getPlansList } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const plans = await getPlansList();

  return (
    <div className="min-h-dvh bg-app-bg">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-app-ink">Plans</h1>
          <Button asChild>
            <Link href="/plans/new">
              <Plus className="h-4 w-4" /> New plan
            </Link>
          </Button>
        </div>
        <PlansDashboard plans={plans} />
      </main>
    </div>
  );
}
