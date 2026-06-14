"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Download, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandSelector } from "@/components/builder/BrandSelector";
import { ClientForm } from "@/components/builder/ClientForm";
import { MealGrid } from "@/components/builder/MealGrid";
import { NotesPicker } from "@/components/builder/NotesPicker";
import { RecipesPreview } from "@/components/builder/RecipesPreview";
import { PlanPreview } from "@/components/builder/PlanPreview";
import { useBuilder, selectPlanBody } from "@/lib/store/builder";
import { useConfirm } from "@/components/ui/confirm";
import { themeToCssVars } from "@/lib/theme";
import { addFoodItem, savePlan } from "@/app/plans/actions";
import type { BuilderData } from "@/lib/db";
import type { FoodItem, PlanBody } from "@/lib/types";

export function Builder({
  banks,
  initial,
  planId = null,
}: {
  banks: BuilderData;
  initial: PlanBody;
  planId?: string | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const hydrate = useBuilder((s) => s.hydrate);
  const markSaved = useBuilder((s) => s.markSaved);
  const brand = useBuilder((s) => s.brand);
  const dirty = useBuilder((s) => s.dirty);

  const [id, setId] = useState<string | null>(planId);
  const [foodBank, setFoodBank] = useState<FoodItem[]>(banks.foodItems);
  const [saving, startSave] = useTransition();
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const downloadingRef = useRef(false);

  const recipeById = useMemo(() => new Map(banks.recipes.map((r) => [r.id, r])), [banks.recipes]);

  // Hydrate once from the server-provided snapshot.
  useEffect(() => {
    hydrate(initial);
  }, [hydrate, initial]);

  async function onAddItem(name: string, slotId: string | null): Promise<FoodItem | null> {
    const res = await addFoodItem(name, slotId);
    if (!res.ok) {
      toast.error(res.error);
      return null;
    }
    setFoodBank((prev) => [res.item, ...prev]);
    toast.success("Added to food bank");
    return res.item;
  }

  function doSave(): Promise<string | null> {
    return new Promise((resolve) => {
      startSave(async () => {
        const body = selectPlanBody(useBuilder.getState());
        const res = await savePlan(id, body);
        if (!res.ok) {
          toast.error(res.error);
          resolve(null);
          return;
        }
        markSaved();
        if (!id) {
          setId(res.id);
          window.history.replaceState(null, "", `/plans/${res.id}`);
        }
        toast.success("Saved");
        router.refresh();
        resolve(res.id);
      });
    });
  }

  async function onBack() {
    if (useBuilder.getState().dirty) {
      const ok = await confirm({
        title: "Discard unsaved changes?",
        description: "Your edits to this plan haven't been saved.",
        confirmLabel: "Discard",
        destructive: true,
      });
      if (!ok) return;
    }
    router.push("/plans");
  }

  async function onDownload() {
    if (downloadingRef.current) return;
    downloadingRef.current = true;
    try {
      const savedId = dirty || !id ? await doSave() : id;
      if (savedId) window.open(`/api/plans/${savedId}/pdf`, "_blank");
    } finally {
      downloadingRef.current = false;
    }
  }

  // Cmd/Ctrl+S to save.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void doSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Warn before leaving (reload / close / tab switch) with unsaved changes.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!useBuilder.getState().dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const formPane = (
    <div className="space-y-4">
      <ClientForm clientNames={banks.clientNames} />
      <MealGrid foodBank={foodBank} recipeById={recipeById} onAddItem={onAddItem} />
      <NotesPicker notes={banks.notes} />
      <RecipesPreview />
    </div>
  );

  return (
    <div className="min-h-dvh bg-app-bg">
      <AppNav />

      {/* Sticky action bar (also the mobile top bar — full-screen editor, no tabs) */}
      <div className="pt-safe sticky top-0 z-20 border-b border-app-rule bg-app-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="-ml-1 p-1.5 text-app-muted lg:hidden"
              aria-label="Back to plans"
              onClick={onBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <BrandSelector brands={banks.brands} />
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile form/preview toggle */}
            <div className="flex rounded-md border border-app-rule p-0.5 lg:hidden">
              {(["form", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMobileTab(t)}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs capitalize",
                    mobileTab === t ? "bg-app-ink text-app-surface" : "text-app-muted",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            {dirty && <span className="hidden text-xs text-app-muted sm:inline">Unsaved changes</span>}
            <Button size="sm" variant="outline" onClick={onDownload} disabled={saving}>
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button size="sm" onClick={() => void doSave()} disabled={saving || !dirty}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Themed canvas */}
      <main
        className="mx-auto max-w-[1400px] px-4 py-5 transition-colors"
        style={themeToCssVars(brand.theme ?? ({} as PlanBody["brand"]["theme"]))}
      >
        {/* Form + preview each render once; CSS shows side-by-side on desktop,
            and the mobile toggle switches which is visible below lg. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:gap-5">
          <div className={cn(mobileTab === "form" ? "block" : "hidden", "lg:block")}>{formPane}</div>
          <div
            className={cn(
              mobileTab === "preview" ? "block" : "hidden",
              "lg:block lg:sticky lg:top-[60px] lg:h-[calc(100dvh-80px)]",
            )}
          >
            <div className="h-[calc(100dvh-180px)] lg:h-full">
              <PlanPreview />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
