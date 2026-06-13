"use client";

import { Select } from "@/components/ui/select";
import { useBuilder } from "@/lib/store/builder";
import { brandRowToSnapshotBrand } from "@/lib/snapshot";
import type { Brand } from "@/lib/types";

export function BrandSelector({ brands }: { brands: Brand[] }) {
  const brandKey = useBuilder((s) => s.brand.key);
  const setBrand = useBuilder((s) => s.setBrand);

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-app-ink">Brand</label>
      <Select
        value={brandKey ?? ""}
        onChange={(e) => {
          const b = brands.find((x) => x.key === e.target.value);
          if (b) setBrand(brandRowToSnapshotBrand(b));
        }}
        className="w-56"
      >
        {brands.map((b) => (
          <option key={b.id} value={b.key}>
            {b.name}
          </option>
        ))}
      </Select>
      <span className="text-xs text-app-muted">{useBuilder((s) => s.brand.email)}</span>
    </div>
  );
}
