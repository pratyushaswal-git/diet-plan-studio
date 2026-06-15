import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Builder } from "@/components/builder/Builder";
import { BuilderSkeleton } from "@/components/builder/BuilderSkeleton";
import { getBuilderData } from "@/lib/db";
import { brandRowToSnapshotBrand, emptyPlanBody } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export default function NewPlanPage() {
  // Skeleton streams instantly while the (heavy) builder banks load.
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <NewPlanData />
    </Suspense>
  );
}

async function NewPlanData() {
  const banks = await getBuilderData();
  if (banks.brands.length === 0) redirect("/settings");

  const brand = brandRowToSnapshotBrand(banks.brands[0]);
  const initial = emptyPlanBody(brand, banks.slots, banks.notes);

  return <Builder banks={banks} initial={initial} />;
}
