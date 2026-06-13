import { create } from "zustand";

import { WEEKDAYS } from "@/lib/types";
import type { CellItem, PlanBody, ScheduleRow, Weekday } from "@/lib/types";
import { buildPlanBody, emptyDayCells } from "@/lib/snapshot";

type NoteType = "important" | "care";

type BuilderState = {
  brand: PlanBody["brand"];
  client: PlanBody["client"];
  rows: ScheduleRow[];
  importantNotes: string[];
  careNotes: string[];
  dirty: boolean;

  hydrate: (body: PlanBody) => void;
  markSaved: () => void;

  setBrand: (brand: PlanBody["brand"]) => void;
  setClientField: (field: keyof PlanBody["client"], value: string) => void;

  addRow: () => void;
  removeRow: (index: number) => void;
  moveRow: (index: number, dir: -1 | 1) => void;
  setRowLabel: (index: number, label: string) => void;
  setRowTime: (index: number, time: string) => void;
  toggleUniform: (index: number) => void;

  setUniformCell: (index: number, items: CellItem[]) => void;
  setDayCell: (index: number, day: Weekday, items: CellItem[]) => void;
  copyCellToRow: (index: number, day: Weekday) => void;
  copyDayToWeek: (day: Weekday) => void;

  addNote: (type: NoteType, text: string) => void;
  removeNoteAt: (type: NoteType, index: number) => void;
  editNoteAt: (type: NoteType, index: number, text: string) => void;
};

const noteKey = (t: NoteType): "importantNotes" | "careNotes" =>
  t === "important" ? "importantNotes" : "careNotes";

// Replace one row immutably via an updater.
function updateRow(rows: ScheduleRow[], index: number, fn: (r: ScheduleRow) => ScheduleRow): ScheduleRow[] {
  return rows.map((r, i) => (i === index ? fn(r) : r));
}

export const useBuilder = create<BuilderState>((set) => ({
  brand: {} as PlanBody["brand"],
  client: { name: "" },
  rows: [],
  importantNotes: [],
  careNotes: [],
  dirty: false,

  hydrate: (body) =>
    set({
      brand: body.brand,
      client: body.client,
      rows: body.schedule.rows,
      importantNotes: body.importantNotes,
      careNotes: body.careNotes,
      dirty: false,
    }),
  markSaved: () => set({ dirty: false }),

  setBrand: (brand) => set({ brand, dirty: true }),
  setClientField: (field, value) =>
    set((s) => ({ client: { ...s.client, [field]: value }, dirty: true })),

  addRow: () =>
    set((s) => ({
      rows: [
        ...s.rows,
        { slotId: null, label: "New row", uniform: false, cells: emptyDayCells() },
      ],
      dirty: true,
    })),
  removeRow: (index) => set((s) => ({ rows: s.rows.filter((_, i) => i !== index), dirty: true })),
  moveRow: (index, dir) =>
    set((s) => {
      const j = index + dir;
      if (j < 0 || j >= s.rows.length) return s;
      const rows = [...s.rows];
      [rows[index], rows[j]] = [rows[j], rows[index]];
      return { rows, dirty: true };
    }),
  setRowLabel: (index, label) =>
    set((s) => ({ rows: updateRow(s.rows, index, (r) => ({ ...r, label })), dirty: true })),
  setRowTime: (index, time) =>
    set((s) => ({ rows: updateRow(s.rows, index, (r) => ({ ...r, time })), dirty: true })),
  toggleUniform: (index) =>
    set((s) => ({
      rows: updateRow(s.rows, index, (r) => {
        if (r.uniform) {
          // expand: every day gets the uniform cell's items
          const items = r.uniformCell ?? [];
          const cells = emptyDayCells();
          for (const d of WEEKDAYS) cells[d] = [...items];
          return { ...r, uniform: false, uniformCell: undefined, cells };
        }
        // collapse: seed the uniform cell from Monday
        return { ...r, uniform: true, uniformCell: r.cells?.Mon ?? [], cells: undefined };
      }),
      dirty: true,
    })),

  setUniformCell: (index, items) =>
    set((s) => ({ rows: updateRow(s.rows, index, (r) => ({ ...r, uniformCell: items })), dirty: true })),
  setDayCell: (index, day, items) =>
    set((s) => ({
      rows: updateRow(s.rows, index, (r) => ({
        ...r,
        cells: { ...(r.cells ?? emptyDayCells()), [day]: items },
      })),
      dirty: true,
    })),
  copyCellToRow: (index, day) =>
    set((s) => ({
      rows: updateRow(s.rows, index, (r) => {
        if (r.uniform || !r.cells) return r;
        const src = r.cells[day];
        const cells = emptyDayCells();
        for (const d of WEEKDAYS) cells[d] = src.map((it) => ({ ...it }));
        return { ...r, cells };
      }),
      dirty: true,
    })),
  copyDayToWeek: (day) =>
    set((s) => ({
      rows: s.rows.map((r) => {
        if (r.uniform || !r.cells) return r;
        const src = r.cells[day];
        const cells = emptyDayCells();
        for (const d of WEEKDAYS) cells[d] = src.map((it) => ({ ...it }));
        return { ...r, cells };
      }),
      dirty: true,
    })),

  addNote: (type, text) =>
    set((s) => ({ [noteKey(type)]: [...s[noteKey(type)], text], dirty: true } as Partial<BuilderState>)),
  removeNoteAt: (type, index) =>
    set(
      (s) =>
        ({ [noteKey(type)]: s[noteKey(type)].filter((_, i) => i !== index), dirty: true }) as Partial<BuilderState>,
    ),
  editNoteAt: (type, index, text) =>
    set(
      (s) =>
        ({
          [noteKey(type)]: s[noteKey(type)].map((t, i) => (i === index ? text : t)),
          dirty: true,
        }) as Partial<BuilderState>,
    ),
}));

// Assemble the current snapshot (recipes re-derived from the grid).
export function selectPlanBody(s: BuilderState): PlanBody {
  return buildPlanBody({
    client: s.client,
    brand: s.brand,
    importantNotes: s.importantNotes,
    careNotes: s.careNotes,
    rows: s.rows,
  });
}
