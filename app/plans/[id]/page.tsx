import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Builder } from "@/components/builder/Builder";
import { BuilderSkeleton } from "@/components/builder/BuilderSkeleton";
import { getBuilderData, getPlan } from "@/lib/db";
import type { PlanBody } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  // Skeleton streams instantly while the plan + builder banks load.
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <EditPlanData params={params} />
    </Suspense>
  );
}

async function EditPlanData({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [banks, plan] = await Promise.all([getBuilderData(), getPlan(id)]);
  if (!plan) notFound();

  return <Builder banks={banks} initial={plan.body as PlanBody} planId={plan.id} />;
}
