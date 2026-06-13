"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Copy, Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { deletePlan, duplicatePlan } from "@/app/plans/actions";
import type { PlanListItem } from "@/lib/db";

function BrandPill({ brand }: { brand: PlanListItem["brand"] }) {
  if (!brand) return <span className="text-xs text-app-muted">—</span>;
  const color = brand.theme?.primary ?? "#888";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {brand.name}
    </span>
  );
}

function usePlanActions(plan: PlanListItem) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onDuplicate() {
    start(async () => {
      const res = await duplicatePlan(plan.id);
      if (res.ok) {
        toast.success("Duplicated — opening the copy");
        router.push(`/plans/${res.id}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  function onDelete() {
    if (!confirm(`Delete the plan for "${plan.client_name}"? This can't be undone.`)) return;
    start(async () => {
      const res = await deletePlan(plan.id);
      if (res.ok) {
        toast.success("Deleted");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return { pending, onDuplicate, onDelete };
}

function ActionButtons({ plan, pending, onDuplicate, onDelete }: {
  plan: PlanListItem;
  pending: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <Button asChild size="icon" variant="ghost" title="Edit">
        <Link href={`/plans/${plan.id}`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button size="icon" variant="ghost" title="Duplicate" onClick={onDuplicate} disabled={pending}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button asChild size="icon" variant="ghost" title="Download PDF">
        <a href={`/api/plans/${plan.id}/pdf`} target="_blank" rel="noreferrer">
          <Download className="h-4 w-4" />
        </a>
      </Button>
      <Button size="icon" variant="ghost" title="Delete" onClick={onDelete} disabled={pending}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </>
  );
}

function StatusBadge({ status }: { status: PlanListItem["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs capitalize",
        status === "final" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
      )}
    >
      {status}
    </span>
  );
}

function PlanCard({ plan }: { plan: PlanListItem }) {
  const { pending, onDuplicate, onDelete } = usePlanActions(plan);
  return (
    <div className={cn("rounded-xl border border-app-rule bg-app-surface p-3 transition-opacity", pending && "opacity-50")}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/plans/${plan.id}`} className="font-medium text-app-ink">
          {plan.client_name}
        </Link>
        <StatusBadge status={plan.status} />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <BrandPill brand={plan.brand} />
        <span className="text-xs text-app-muted">{format(new Date(plan.created_at), "d MMM yyyy")}</span>
      </div>
      <div className="mt-2 flex items-center justify-end gap-0.5 border-t border-app-rule pt-1.5">
        <ActionButtons plan={plan} pending={pending} onDuplicate={onDuplicate} onDelete={onDelete} />
      </div>
    </div>
  );
}

function PlanRow({ plan }: { plan: PlanListItem }) {
  const { pending, onDuplicate, onDelete } = usePlanActions(plan);

  return (
    <tr className={cn("border-b border-app-rule transition-opacity", pending && "opacity-50")}>
      <td className="py-2.5 pl-3 pr-2">
        <Link href={`/plans/${plan.id}`} className="font-medium text-app-ink hover:underline">
          {plan.client_name}
        </Link>
      </td>
      <td className="px-2">
        <BrandPill brand={plan.brand} />
      </td>
      <td className="px-2 text-sm text-app-muted">{format(new Date(plan.created_at), "d MMM yyyy")}</td>
      <td className="px-2">
        <StatusBadge status={plan.status} />
      </td>
      <td className="py-2 pl-2 pr-3">
        <div className="flex items-center justify-end gap-0.5">
          <ActionButtons plan={plan} pending={pending} onDuplicate={onDuplicate} onDelete={onDelete} />
        </div>
      </td>
    </tr>
  );
}

export function PlansDashboard({ plans }: { plans: PlanListItem[] }) {
  const [q, setQ] = useState("");
  const [brandKey, setBrandKey] = useState("");

  const brands = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of plans) if (p.brand) map.set(p.brand.key, p.brand.name);
    return [...map.entries()];
  }, [plans]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return plans.filter((p) => {
      if (brandKey && p.brand?.key !== brandKey) return false;
      if (needle && !p.client_name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [plans, q, brandKey]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-app-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by client…"
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={brandKey} onChange={(e) => setBrandKey(e.target.value)} className="flex-1 sm:w-48">
            <option value="">All brands</option>
            {brands.map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </Select>
          <span className="shrink-0 text-sm text-app-muted sm:ml-auto">
            {filtered.length} of {plans.length}
          </span>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-app-rule p-12 text-center">
          <p className="text-sm text-app-muted">No plans yet.</p>
          <Button asChild className="mt-3">
            <Link href="/plans/new">
              <Plus className="h-4 w-4" /> Create your first plan
            </Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-app-rule p-8 text-center text-sm text-app-muted">
          No plans match your filters.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-app-rule bg-app-surface lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app-rule text-left text-xs uppercase tracking-wide text-app-muted">
                  <th className="py-2 pl-3 pr-2 font-medium">Client</th>
                  <th className="px-2 font-medium">Brand</th>
                  <th className="px-2 font-medium">Date</th>
                  <th className="px-2 font-medium">Status</th>
                  <th className="py-2 pl-2 pr-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <PlanRow key={p.id} plan={p} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 lg:hidden">
            {filtered.map((p) => (
              <PlanCard key={p.id} plan={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
