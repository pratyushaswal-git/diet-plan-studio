import { notFound } from "next/navigation";

import { Builder } from "@/components/builder/Builder";
import { getBuilderData, getPlan } from "@/lib/db";
import type { PlanBody } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [banks, plan] = await Promise.all([getBuilderData(), getPlan(id)]);
  if (!plan) notFound();

  return <Builder banks={banks} initial={plan.body as PlanBody} planId={plan.id} />;
}
