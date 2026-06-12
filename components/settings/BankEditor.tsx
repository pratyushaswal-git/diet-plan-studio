"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Save, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { saveRow, deleteRow, type BankTable } from "@/app/settings/actions";

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string; // grid column span on the row
};

type Row = Record<string, unknown> & { id: string };

function blankFrom(fields: FieldDef[], defaults: Record<string, unknown>): Record<string, unknown> {
  const v: Record<string, unknown> = {};
  for (const f of fields) v[f.key] = f.type === "checkbox" ? false : f.type === "number" ? 0 : "";
  return { ...v, ...defaults };
}

function toFormValues(fields: FieldDef[], row: Record<string, unknown>): Record<string, unknown> {
  const v: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = row[f.key];
    if (f.type === "checkbox") v[f.key] = Boolean(raw);
    else v[f.key] = raw == null ? "" : raw;
  }
  return v;
}

function RowFields({
  fields,
  values,
  onChange,
}: {
  fields: FieldDef[];
  values: Record<string, unknown>;
  onChange: (key: string, val: unknown) => void;
}) {
  return (
    <>
      {fields.map((f) => {
        if (f.type === "checkbox") {
          return (
            <label key={f.key} className={cn("flex items-center gap-2 text-sm text-app-muted", f.className)}>
              <input
                type="checkbox"
                checked={Boolean(values[f.key])}
                onChange={(e) => onChange(f.key, e.target.checked)}
                className="h-4 w-4 rounded border-app-rule accent-app-ink"
              />
              {f.label}
            </label>
          );
        }
        if (f.type === "select") {
          return (
            <Select
              key={f.key}
              aria-label={f.label}
              value={String(values[f.key] ?? "")}
              onChange={(e) => onChange(f.key, e.target.value)}
              className={f.className}
            >
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          );
        }
        if (f.type === "textarea") {
          return (
            <Textarea
              key={f.key}
              aria-label={f.label}
              placeholder={f.placeholder ?? f.label}
              value={String(values[f.key] ?? "")}
              onChange={(e) => onChange(f.key, e.target.value)}
              className={f.className}
            />
          );
        }
        return (
          <Input
            key={f.key}
            aria-label={f.label}
            type={f.type === "number" ? "number" : "text"}
            placeholder={f.placeholder ?? f.label}
            value={String(values[f.key] ?? "")}
            onChange={(e) => onChange(f.key, e.target.value)}
            className={f.className}
          />
        );
      })}
    </>
  );
}

function EditableRow({
  table,
  fields,
  row,
  layout,
}: {
  table: BankTable;
  fields: FieldDef[];
  row: Row;
  layout: string;
}) {
  const initial = useMemo(() => toFormValues(fields, row), [fields, row]);
  const [values, setValues] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  function onChange(key: string, val: unknown) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function save() {
    start(async () => {
      const res = await saveRow(table, row.id, values);
      if (res.ok) toast.success("Saved");
      else toast.error(res.error);
    });
  }

  function remove() {
    if (!confirm("Delete this entry? This can't be undone.")) return;
    start(async () => {
      const res = await deleteRow(table, row.id);
      if (res.ok) toast.success("Deleted");
      else toast.error(res.error);
    });
  }

  return (
    <div className={cn("grid items-center gap-2 rounded-lg border border-app-rule bg-app-surface p-3", layout)}>
      <RowFields fields={fields} values={values} onChange={onChange} />
      <div className="flex items-center justify-end gap-1">
        <Button size="icon" variant="ghost" onClick={save} disabled={!dirty || pending} title="Save">
          <Save className={cn("h-4 w-4", dirty ? "text-app-ink" : "text-app-muted")} />
        </Button>
        <Button size="icon" variant="ghost" onClick={remove} disabled={pending} title="Delete">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function NewRow({
  table,
  fields,
  defaults,
  layout,
}: {
  table: BankTable;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  layout: string;
}) {
  const blank = useMemo(() => blankFrom(fields, defaults), [fields, defaults]);
  const [values, setValues] = useState(blank);
  const [pending, start] = useTransition();

  function add() {
    start(async () => {
      const res = await saveRow(table, null, values);
      if (res.ok) {
        toast.success("Added");
        setValues(blankFrom(fields, defaults));
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className={cn("grid items-center gap-2 rounded-lg border border-dashed border-app-rule bg-app-bg p-3", layout)}>
      <RowFields fields={fields} values={values} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={add} disabled={pending}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
}

export function BankEditor({
  table,
  fields,
  rows,
  layout,
  newDefaults = {},
  searchKeys,
  description,
}: {
  table: BankTable;
  fields: FieldDef[];
  rows: Row[];
  layout: string;
  newDefaults?: Record<string, unknown>;
  searchKeys?: string[];
  description?: string;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim() || !searchKeys) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle)));
  }, [q, rows, searchKeys]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-app-muted">
          {description} <span className="text-app-ink">{rows.length}</span> entries.
        </p>
        {searchKeys && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-app-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-64 pl-8"
            />
          </div>
        )}
      </div>

      <NewRow table={table} fields={fields} defaults={newDefaults} layout={layout} />

      <div className="space-y-2">
        {filtered.map((row) => (
          <EditableRow key={row.id} table={table} fields={fields} row={row} layout={layout} />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed border-app-rule p-6 text-center text-sm text-app-muted">
            No matches.
          </p>
        )}
      </div>
    </div>
  );
}
