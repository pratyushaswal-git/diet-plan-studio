"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CopyPlus, Plus, Repeat, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CellEditor } from "@/components/builder/CellEditor";
import { useBuilder } from "@/lib/store/builder";
import { WEEKDAYS } from "@/lib/types";
import type { FoodItem, Recipe, ScheduleRow, Weekday } from "@/lib/types";
import { cn } from "@/lib/utils";

type Shared = {
  foodBank: FoodItem[];
  recipeById: Map<string, Recipe>;
  onAddItem: (name: string, slotId: string | null) => Promise<FoodItem | null>;
};

function RowCard({
  row,
  idx,
  day,
  shared,
}: {
  row: ScheduleRow;
  idx: number;
  day: Weekday; // ignored when row.uniform
  shared: Shared;
}) {
  const { removeRow, moveRow, setRowLabel, setRowTime, toggleUniform, setUniformCell, setDayCell, copyCellToRow } =
    useBuilder();

  return (
    <div className="space-y-2 rounded-xl border border-app-rule bg-app-surface p-3">
      <div className="flex items-center gap-2">
        <Input
          value={row.label}
          onChange={(e) => setRowLabel(idx, e.target.value)}
          className="h-9 flex-1 text-base font-medium"
          placeholder="Meal"
        />
        <div className="flex items-center text-app-muted">
          <button type="button" onClick={() => moveRow(idx, -1)} className="p-1.5" aria-label="Move up">
            <ChevronUp className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => moveRow(idx, 1)} className="p-1.5" aria-label="Move down">
            <ChevronDown className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => removeRow(idx)} className="p-1.5" aria-label="Remove row">
            <Trash2 className="h-5 w-5 text-destructive" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={row.time ?? ""}
          onChange={(e) => setRowTime(idx, e.target.value)}
          placeholder="time (optional)"
          className="h-9 w-32 text-base"
        />
        <button
          type="button"
          onClick={() => toggleUniform(idx)}
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs",
            row.uniform ? "bg-brand-accent/20 text-brand-ink" : "border border-app-rule text-app-muted",
          )}
        >
          <Repeat className="h-3.5 w-3.5" /> Same all week
        </button>
      </div>

      <CellEditor
        foodBank={shared.foodBank}
        recipeById={shared.recipeById}
        slotId={row.slotId}
        items={row.uniform ? (row.uniformCell ?? []) : (row.cells?.[day] ?? [])}
        onChange={(items) => (row.uniform ? setUniformCell(idx, items) : setDayCell(idx, day, items))}
        onAddItem={(name) => shared.onAddItem(name, row.slotId)}
      />

      {!row.uniform && (
        <button
          type="button"
          onClick={() => copyCellToRow(idx, day)}
          className="inline-flex items-center gap-1 text-xs text-brand-primary"
        >
          <CopyPlus className="h-3.5 w-3.5" /> Copy {day} to every day
        </button>
      )}
    </div>
  );
}

export function MealGridMobile({ shared }: { shared: Shared }) {
  const rows = useBuilder((s) => s.rows);
  const addRow = useBuilder((s) => s.addRow);
  const copyDayToWeek = useBuilder((s) => s.copyDayToWeek);
  const [day, setDay] = useState<Weekday>("Mon");

  const indexed = rows.map((row, idx) => ({ row, idx }));
  const uniformRows = indexed.filter((x) => x.row.uniform);
  const perDayRows = indexed.filter((x) => !x.row.uniform);

  return (
    <div className="space-y-4 lg:hidden">
      {/* Day switcher */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={cn(
                "rounded-md py-1.5 text-xs font-medium transition-colors",
                day === d ? "bg-app-ink text-app-surface" : "bg-app-surface text-app-muted border border-app-rule",
              )}
            >
              {d.slice(0, 1)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => copyDayToWeek(day)}
          className="text-xs text-brand-primary"
        >
          Copy {day}&rsquo;s meals to the whole week
        </button>
      </div>

      {/* Same-all-week rows */}
      {uniformRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-app-muted">Every day</p>
          {uniformRows.map(({ row, idx }) => (
            <RowCard key={idx} row={row} idx={idx} day={day} shared={shared} />
          ))}
        </div>
      )}

      {/* Per-day rows for the selected day */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-app-muted">{day}</p>
        {perDayRows.map(({ row, idx }) => (
          <RowCard key={idx} row={row} idx={idx} day={day} shared={shared} />
        ))}
      </div>

      <Button variant="outline" onClick={addRow} className="w-full">
        <Plus className="h-4 w-4" /> Add row
      </Button>
    </div>
  );
}
