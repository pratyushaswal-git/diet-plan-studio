import { redirect } from "next/navigation";

import { Builder } from "@/components/builder/Builder";
import { getBuilderData } from "@/lib/db";
import { brandRowToSnapshotBrand, emptyPlanBody } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

export default async function NewPlanPage() {
  const banks = await getBuilderData();
  if (banks.brands.length === 0) redirect("/settings");

  const brand = brandRowToSnapshotBrand(banks.brands[0]);
  const initial = emptyPlanBody(brand, banks.slots, banks.notes);

  return <Builder banks={banks} initial={initial} />;
}
