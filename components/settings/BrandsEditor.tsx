"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/ui/confirm";
import { cn } from "@/lib/utils";
import { BRAND_THEME_KEYS, type Brand, type BrandTheme } from "@/lib/types";
import { saveRow, deleteRow, uploadBrandLogo } from "@/app/settings/actions";

const DEFAULT_THEME: BrandTheme = {
  primary: "#4E7C4A",
  accent: "#8BBF6A",
  bg: "#F3F7EE",
  surface: "#FFFFFF",
  ink: "#233322",
  muted: "#6A7A63",
};

type Editable = Pick<Brand, "key" | "name" | "email" | "watermark_text" | "sort_order" | "active"> & {
  theme: BrandTheme;
};

function ColorField({ k, value, onChange }: { k: keyof BrandTheme; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs capitalize text-app-muted">{k}</Label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 shrink-0 cursor-pointer rounded border border-app-rule bg-transparent p-0.5"
          aria-label={`${k} color`}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 font-mono text-xs" />
      </div>
    </div>
  );
}

function BrandCard({
  brand,
  logoUrl,
}: {
  brand: (Editable & { id: string }) | null;
  logoUrl?: string | null;
}) {
  const isNew = brand === null;
  const init: Editable = brand ?? {
    key: "",
    name: "",
    email: "",
    watermark_text: "",
    sort_order: 0,
    active: true,
    theme: DEFAULT_THEME,
  };
  const confirm = useConfirm();
  const [v, setV] = useState<Editable>(init);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(v) !== JSON.stringify(init);

  function set<K extends keyof Editable>(key: K, val: Editable[K]) {
    setV((s) => ({ ...s, [key]: val }));
  }
  function setColor(k: keyof BrandTheme, val: string) {
    setV((s) => ({ ...s, theme: { ...s.theme, [k]: val } }));
  }

  function save() {
    start(async () => {
      const res = await saveRow("brands", brand?.id ?? null, { ...v, logo_url: brand?.id ? undefined : null });
      if (res.ok) {
        toast.success(isNew ? "Brand added" : "Saved");
        if (isNew) setV(init);
      } else toast.error(res.error);
    });
  }
  async function remove() {
    if (!brand) return;
    const ok = await confirm({
      title: `Delete "${v.name}"?`,
      description: "This brand will be removed. Plans already saved keep their frozen copy.",
      confirmLabel: "Delete brand",
      destructive: true,
    });
    if (!ok) return;
    start(async () => {
      const res = await deleteRow("brands", brand.id);
      if (res.ok) toast.success("Deleted");
      else toast.error(res.error);
    });
  }
  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !brand) return;
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      const res = await uploadBrandLogo(brand.id, fd);
      if (res.ok) toast.success("Logo uploaded");
      else toast.error(res.error);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border bg-app-surface p-5",
        isNew ? "border-dashed border-app-rule bg-app-bg" : "border-app-rule",
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs text-app-muted">Key</Label>
          <Input value={v.key} onChange={(e) => set("key", e.target.value)} placeholder="nuvira" className="font-mono" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-app-muted">Name</Label>
          <Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Nuvira Fertility" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-app-muted">Email</Label>
          <Input value={v.email} onChange={(e) => set("email", e.target.value)} placeholder="hello@brand.com" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-app-muted">Watermark text</Label>
          <Input value={v.watermark_text} onChange={(e) => set("watermark_text", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {BRAND_THEME_KEYS.map((k) => (
          <ColorField key={k} k={k} value={v.theme[k]} onChange={(val) => setColor(k, val)} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-app-muted">Sort</Label>
            <Input
              type="number"
              value={v.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
              className="w-20"
            />
          </div>
          <label className="flex items-center gap-2 pt-5 text-sm text-app-muted">
            <input
              type="checkbox"
              checked={v.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 rounded border-app-rule accent-app-ink"
            />
            Active
          </label>
          {!isNew && (
            <div className="flex items-center gap-2 pt-5">
              {logoUrl ? (
                <Image src={logoUrl} alt="logo" width={36} height={36} className="h-9 w-9 rounded object-contain" />
              ) : (
                <span className="text-xs text-app-muted">No logo</span>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={onLogo} className="hidden" />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={pending}>
                <Upload className="h-4 w-4" /> Logo
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={pending || (!isNew && !dirty)}>
            {isNew ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isNew ? "Add brand" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BrandsEditor({
  brands,
  logoUrls,
}: {
  brands: Brand[];
  logoUrls: Record<string, string | null>;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-app-muted">
        Theme colors apply to the builder canvas and the PDF. <span className="text-app-ink">{brands.length}</span> brands.
      </p>
      {brands.map((b) => (
        <BrandCard
          key={b.id}
          brand={{
            id: b.id,
            key: b.key,
            name: b.name,
            email: b.email,
            watermark_text: b.watermark_text,
            sort_order: b.sort_order,
            active: b.active,
            theme: { ...DEFAULT_THEME, ...b.theme },
          }}
          logoUrl={logoUrls[b.id]}
        />
      ))}
      <BrandCard brand={null} />
    </div>
  );
}
