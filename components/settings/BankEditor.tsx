"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus, Save, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm";
import { cn } from "@/lib/utils";
import { saveRow, deleteRow, type BankTable } from "@/app/settings/actions";

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Desktop width classes (flex basis / fixed width). Mobile always stacks full-width. */
  w?: string;
};

export type FilterDef = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

type Row = Record<string, unknown> & { id: string };

const PAGE_SIZE = 10;

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

// One field, with a mobile-only label above it (desktop uses the header row).
function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  if (field.type === "checkbox") {
    return (
      <label className={cn("flex items-center gap-2 py-1 text-sm text-app-muted lg:py-0", field.w)}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-app-rule accent-app-accent"
        />
        {field.label}
      </label>
    );
  }

  const control =
    field.type === "select" ? (
      <Select aria-label={field.label} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    ) : field.type === "textarea" ? (
      <Textarea
        aria-label={field.label}
        placeholder={field.placeholder ?? field.label}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[40px]"
      />
    ) : (
      <Input
        aria-label={field.label}
        type={field.type === "number" ? "number" : "text"}
        placeholder={field.placeholder ?? field.label}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );

  return (
    <div className={cn("flex flex-col gap-1", field.w)}>
      <span className="text-xs font-medium text-app-muted lg:hidden">{field.label}</span>
      {control}
    </div>
  );
}

function RowShell({ fields, values, onChange, children, dashed }: {
  fields: FieldDef[];
  values: Record<string, unknown>;
  onChange: (key: string, val: unknown) => void;
  children: React.ReactNode; // action buttons
  dashed?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-app-surface p-3 lg:flex-row lg:items-center lg:gap-3 lg:py-2.5",
        dashed ? "border-dashed border-app-rule bg-app-bg/60" : "border-app-rule shadow-card",
      )}
    >
      {fields.map((f) => (
        <Field key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      ))}
      <div className="flex items-center justify-end gap-1 border-t border-app-rule pt-2 lg:border-t-0 lg:pt-0">
        {children}
      </div>
    </div>
  );
}

function EditableRow({ table, fields, row }: { table: BankTable; fields: FieldDef[]; row: Row }) {
  const confirm = useConfirm();
  const initial = useMemo(() => toFormValues(fields, row), [fields, row]);
  const [values, setValues] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  function save() {
    start(async () => {
      const res = await saveRow(table, row.id, values);
      if (res.ok) toast.success("Saved");
      else toast.error(res.error);
    });
  }
  async function remove() {
    const ok = await confirm({
      title: "Delete this entry?",
      description: "This can't be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    start(async () => {
      const res = await deleteRow(table, row.id);
      if (res.ok) toast.success("Deleted");
      else toast.error(res.error);
    });
  }

  return (
    <RowShell fields={fields} values={values} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))}>
      <Button size="sm" variant={dirty ? "default" : "ghost"} onClick={save} disabled={!dirty || pending}>
        <Save className="h-4 w-4" /> <span className="lg:hidden">Save</span>
      </Button>
      <Button size="icon" variant="ghost" onClick={remove} disabled={pending} title="Delete">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </RowShell>
  );
}

function NewRow({
  table,
  fields,
  defaults,
  onClose,
}: {
  table: BankTable;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  onClose: () => void;
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
    <RowShell fields={fields} values={values} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} dashed>
      <Button size="sm" onClick={add} disabled={pending}>
        <Plus className="h-4 w-4" /> Add
      </Button>
      <Button size="icon" variant="ghost" onClick={onClose} title="Close">
        <X className="h-4 w-4" />
      </Button>
    </RowShell>
  );
}

export function BankEditor({
  table,
  fields,
  rows,
  newDefaults = {},
  searchKeys,
  description,
  addLabel = "Add entry",
  filters,
}: {
  table: BankTable;
  fields: FieldDef[];
  rows: Row[];
  newDefaults?: Record<string, unknown>;
  searchKeys?: string[];
  description?: string;
  addLabel?: string;
  filters?: FilterDef[];
}) {
  const [q, setQ] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      for (const f of filters ?? []) {
        const sel = filterValues[f.key];
        if (sel && String(r[f.key] ?? "") !== sel) return false;
      }
      if (needle && searchKeys && !searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle)))
        return false;
      return true;
    });
  }, [rows, q, filterValues, filters, searchKeys]);

  // Reset to page 1 whenever the result set changes.
  useEffect(() => setPage(1), [q, filterValues]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-app-muted">
            {description} <span className="font-medium text-app-ink">{filtered.length}</span>
            {filtered.length === rows.length ? " entries." : ` of ${rows.length}.`}
          </p>
          <Button size="sm" onClick={() => setAdding((v) => !v)}>
            <Plus className="h-4 w-4" /> {addLabel}
          </Button>
        </div>

        {(searchKeys || filters) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {searchKeys && (
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-app-muted" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8" />
              </div>
            )}
            {filters?.map((f) => (
              <Select
                key={f.key}
                aria-label={f.label}
                value={filterValues[f.key] ?? ""}
                onChange={(e) => setFilterValues((s) => ({ ...s, [f.key]: e.target.value }))}
                className="sm:w-48"
              >
                <option value="">{f.label}: all</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            ))}
          </div>
        )}
      </div>

      {adding && (
        <NewRow table={table} fields={fields} defaults={newDefaults} onClose={() => setAdding(false)} />
      )}

      {/* Desktop column header */}
      <div className="hidden gap-3 px-3 text-xs font-medium uppercase tracking-wide text-app-muted lg:flex">
        {fields.map((f) => (
          <span key={f.key} className={cn(f.w)}>
            {f.label}
          </span>
        ))}
        <span className="w-[88px] text-right">Actions</span>
      </div>

      <div className="space-y-2">
        {pageRows.map((row) => (
          <EditableRow key={row.id} table={table} fields={fields} row={row} />
        ))}
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-sm text-app-muted shadow-none">No matches.</Card>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-app-muted">
            Page {safePage} of {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage >= pageCount}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
