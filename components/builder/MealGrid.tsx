"use client";

import { ArrowDown, ChevronDown, ChevronUp, CopyMinus, GripVertical, Plus, Repeat, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CellEditor } from "@/components/builder/CellEditor";
import { useBuilder } from "@/lib/store/builder";
import { WEEKDAYS } from "@/lib/types";
import type { FoodItem, Recipe, Weekday } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MealGrid({
  foodBank,
  recipeById,
  onAddItem,
}: {
  foodBank: FoodItem[];
  recipeById: Map<string, Recipe>;
  onAddItem: (name: string, slotId: string | null) => Promise<FoodItem | null>;
}) {
  const rows = useBuilder((s) => s.rows);
  const {
    addRow,
    removeRow,
    moveRow,
    setRowLabel,
    setRowTime,
    toggleUniform,
    setUniformCell,
    setDayCell,
    copyCellToRow,
    copyDayToWeek,
  } = useBuilder();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-app-ink">Meal schedule</h2>
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="h-4 w-4" /> Add row
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[860px] space-y-2">
          {/* Day header with "copy this day → all rows" */}
          <div className="grid grid-cols-[200px_repeat(7,minmax(86px,1fr))] gap-1.5 px-1">
            <div />
            {WEEKDAYS.map((d) => (
              <div key={d} className="flex items-center justify-between px-1 text-[11px] font-medium text-app-muted">
                {d}
                <button
                  type="button"
                  title={`Copy ${d} to every row's other days`}
                  onClick={() => copyDayToWeek(d)}
                  className="text-app-muted hover:text-app-ink"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[200px_repeat(7,minmax(86px,1fr))] gap-1.5 rounded-lg border border-app-rule bg-app-surface p-1.5"
            >
              {/* Label column */}
              <div className="flex flex-col gap-1 pr-1">
                <div className="flex items-center gap-0.5">
                  <GripVertical className="h-3.5 w-3.5 shrink-0 text-app-muted" />
                  <Input
                    value={row.label}
                    onChange={(e) => setRowLabel(idx, e.target.value)}
                    className="h-7 text-sm font-medium"
                  />
                </div>
                <Input
                  value={row.time ?? ""}
                  onChange={(e) => setRowTime(idx, e.target.value)}
                  placeholder="time"
                  className="h-6 text-[11px]"
                />
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleUniform(idx)}
                    title="Same all week"
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px]",
                      row.uniform ? "bg-brand-accent/20 text-brand-ink" : "text-app-muted hover:text-app-ink",
                    )}
                  >
                    <Repeat className="h-3 w-3" /> all week
                  </button>
                  <div className="ml-auto flex items-center">
                    <button
                      type="button"
                      onClick={() => moveRow(idx, -1)}
                      className="text-app-muted hover:text-app-ink"
                      title="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(idx, 1)}
                      className="text-app-muted hover:text-app-ink"
                      title="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-app-muted hover:text-destructive"
                      title="Remove row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cells */}
              {row.uniform ? (
                <div className="col-span-7">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-app-muted">Same all week</div>
                  <CellEditor
                    foodBank={foodBank}
                    recipeById={recipeById}
                    slotId={row.slotId}
                    items={row.uniformCell ?? []}
                    onChange={(items) => setUniformCell(idx, items)}
                    onAddItem={(name) => onAddItem(name, row.slotId)}
                  />
                </div>
              ) : (
                WEEKDAYS.map((d: Weekday) => (
                  <div key={d} className="group relative">
                    <CellEditor
                      foodBank={foodBank}
                      recipeById={recipeById}
                      slotId={row.slotId}
                      items={row.cells?.[d] ?? []}
                      onChange={(items) => setDayCell(idx, d, items)}
                      onAddItem={(name) => onAddItem(name, row.slotId)}
                    />
                    <button
                      type="button"
                      title={`Copy ${d} to the rest of this row`}
                      onClick={() => copyCellToRow(idx, d)}
                      className="absolute -top-1 right-0 hidden rounded bg-app-surface p-0.5 text-app-muted shadow-sm hover:text-app-ink group-hover:block"
                    >
                      <CopyMinus className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
