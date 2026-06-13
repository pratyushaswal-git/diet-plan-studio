import { WEEKDAYS } from "@/lib/types";
import type { Brand, CellItem, DayCells, MealSlot, Note, PlanBody, ScheduleRow } from "@/lib/types";

export function emptyDayCells(): DayCells {
  return { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
}

// The PDF/snapshot brand block, frozen from a brand bank row.
// logoUrl is passed in resolved (signed/public) form — a storage path isn't renderable.
export function brandRowToSnapshotBrand(brand: Brand, logoUrl?: string): PlanBody["brand"] {
  return {
    key: brand.key,
    name: brand.name,
    email: brand.email,
    watermarkText: brand.watermark_text,
    logoUrl: logoUrl ?? undefined,
    tagline: brand.tagline ?? undefined,
    website: brand.website ?? undefined,
    instagram: brand.instagram ?? undefined,
    phone: brand.phone ?? undefined,
    theme: brand.theme,
  };
}

// A fresh row from a slot bank entry. Non-meal rows (water, walk) default to
// "same all week" since they almost always repeat — a real time-saver.
export function slotToEmptyRow(slot: MealSlot): ScheduleRow {
  const uniform = slot.kind !== "meal";
  return {
    slotId: slot.id,
    label: slot.label,
    time: slot.default_time ?? undefined,
    uniform,
    uniformCell: uniform ? [] : undefined,
    cells: uniform ? undefined : emptyDayCells(),
  };
}

// Initial render document for a new plan: default slots preloaded, default
// notes pre-checked.
export function emptyPlanBody(brand: PlanBody["brand"], slots: MealSlot[], notes: Note[]): PlanBody {
  const defaultSlots = slots.filter((s) => s.is_default);
  return {
    client: { name: "" },
    brand,
    schedule: {
      days: WEEKDAYS,
      rows: defaultSlots.map(slotToEmptyRow),
    },
    importantNotes: notes.filter((n) => n.type === "important" && n.is_default).map((n) => n.text),
    careNotes: notes.filter((n) => n.type === "care" && n.is_default).map((n) => n.text),
    recipes: [],
  };
}

// Every cell item that carries a recipe, across uniform + per-day cells.
export function rowCellItems(row: ScheduleRow): CellItem[] {
  if (row.uniform) return row.uniformCell ?? [];
  if (!row.cells) return [];
  return WEEKDAYS.flatMap((d) => row.cells![d]);
}

// Derived, deduped recipes list (the single source for the PDF recipes block).
// Dedupe by URL, preserving first-seen order.
export function deriveRecipes(rows: ScheduleRow[]): PlanBody["recipes"] {
  const seen = new Map<string, { title: string; url: string }>();
  for (const row of rows) {
    for (const item of rowCellItems(row)) {
      if (item.recipe && !seen.has(item.recipe.url)) seen.set(item.recipe.url, item.recipe);
    }
  }
  return [...seen.values()];
}

// Assemble the final snapshot from working state (recipes always re-derived).
export function buildPlanBody(parts: Omit<PlanBody, "recipes" | "schedule"> & {
  rows: ScheduleRow[];
}): PlanBody {
  const { rows, ...rest } = parts;
  return {
    ...rest,
    schedule: { days: WEEKDAYS, rows },
    recipes: deriveRecipes(rows),
  };
}
