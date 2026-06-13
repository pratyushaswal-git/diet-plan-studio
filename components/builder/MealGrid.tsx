"use client";

import { ArrowDown, ChevronDown, ChevronUp, CopyPlus, Plus, Repeat, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CellEditor } from "@/components/builder/CellEditor";
import { MealGridMobile } from "@/components/builder/MealGridMobile";
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
        <Button size="sm" variant="outline" onClick={addRow} className="hidden lg:inline-flex">
          <Plus className="h-4 w-4" /> Add row
        </Button>
      </div>

      {/* Mobile: day-by-day editor */}
      <MealGridMobile shared={{ foodBank, recipeById, onAddItem }} />

      {/* Desktop: 7-column table */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto rounded-xl border border-app-rule bg-app-surface shadow-card">
          <div className="min-w-[940px]">
            {/* Sticky day header */}
            <div className="sticky top-0 z-20 grid grid-cols-[190px_repeat(7,minmax(108px,1fr))] border-b border-app-rule bg-app-bg/95 backdrop-blur">
              <div className="sticky left-0 z-10 bg-app-bg/95 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                Meal
              </div>
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-center gap-1 px-2 py-2.5 text-xs font-semibold text-app-ink"
                >
                  {d}
                  <button
                    type="button"
                    title={`Copy ${d} to the other days in every row`}
                    onClick={() => copyDayToWeek(d)}
                    className="text-app-muted/50 transition-colors hover:text-app-accent"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {rows.map((row, idx) => {
              const zebra = idx % 2 === 1 ? "bg-app-bg" : "bg-app-surface";
              return (
                <div
                  key={idx}
                  className={cn(
                    "grid grid-cols-[190px_repeat(7,minmax(108px,1fr))] border-b border-app-rule last:border-b-0",
                    zebra,
                  )}
                >
                  {/* Sticky label column */}
                  <div className={cn("sticky left-0 z-10 flex flex-col gap-1.5 border-r border-app-rule p-2.5", zebra)}>
                    <Input
                      value={row.label}
                      onChange={(e) => setRowLabel(idx, e.target.value)}
                      className="h-8 font-medium"
                    />
                    <Input
                      value={row.time ?? ""}
                      onChange={(e) => setRowTime(idx, e.target.value)}
                      placeholder="time (optional)"
                      className="h-7 text-xs"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleUniform(idx)}
                        title="Edit one value for the whole week"
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                          row.uniform
                            ? "bg-app-accent-soft text-app-accent"
                            : "text-app-muted hover:bg-app-bg hover:text-app-ink",
                        )}
                      >
                        <Repeat className="h-3 w-3" /> All week
                      </button>
                      <div className="flex items-center text-app-muted">
                        <button type="button" onClick={() => moveRow(idx, -1)} className="p-0.5 hover:text-app-ink" title="Move up">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => moveRow(idx, 1)} className="p-0.5 hover:text-app-ink" title="Move down">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => removeRow(idx)} className="p-0.5 hover:text-destructive" title="Remove row">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cells */}
                  {row.uniform ? (
                    <div className="col-span-7 flex flex-col gap-1 p-2.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-app-accent/80">
                        Same all week
                      </span>
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
                      <div key={d} className="group relative border-l border-app-rule/60 p-2">
                        <CellEditor
                          foodBank={foodBank}
                          recipeById={recipeById}
                          slotId={row.slotId}
                          items={row.cells?.[d] ?? []}
                          onChange={(items) => setDayCell(idx, d, items)}
                          onAddItem={(name) => onAddItem(name, row.slotId)}
                        />
                        {(row.cells?.[d]?.length ?? 0) > 0 && (
                          <button
                            type="button"
                            title={`Copy ${d} to the rest of this row`}
                            onClick={() => copyCellToRow(idx, d)}
                            className="absolute right-1.5 top-1.5 rounded bg-app-surface/90 p-0.5 text-app-muted/50 opacity-0 shadow-sm transition-opacity hover:text-app-accent group-hover:opacity-100"
                          >
                            <CopyPlus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
