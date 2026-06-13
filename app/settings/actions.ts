"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient, createServiceClient } from "@/lib/supabase/server";

// Bank tables the settings UI can edit. Plans are managed elsewhere.
const TABLES = ["brands", "meal_slots", "recipes", "food_items", "notes"] as const;
export type BankTable = (typeof TABLES)[number];

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "must be a hex color");
const themeSchema = z.object({
  primary: hex,
  accent: hex,
  bg: hex,
  surface: hex,
  ink: hex,
  muted: hex,
});

// Per-table validation. id is optional (absent = insert).
const schemas: Record<BankTable, z.ZodTypeAny> = {
  brands: z.object({
    key: z.string().trim().min(1).regex(/^[a-z0-9_]+$/, "lowercase letters, numbers, underscore"),
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    watermark_text: z.string().trim().min(1),
    logo_url: z.string().trim().nullable().optional(),
    tagline: z.string().trim().nullable().optional(),
    website: z.string().trim().nullable().optional(),
    instagram: z.string().trim().nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    theme: themeSchema,
    sort_order: z.coerce.number().int(),
    active: z.coerce.boolean(),
  }),
  meal_slots: z.object({
    label: z.string().trim().min(1),
    default_time: z.string().trim().nullable().optional(),
    kind: z.enum(["meal", "hydration", "activity", "other"]),
    sort_order: z.coerce.number().int(),
    is_default: z.coerce.boolean(),
    active: z.coerce.boolean(),
  }),
  recipes: z.object({
    title: z.string().trim().min(1),
    url: z.string().trim().url(),
  }),
  food_items: z.object({
    name: z.string().trim().min(1),
    slot_id: z.string().uuid().nullable().optional(),
    recipe_id: z.string().uuid().nullable().optional(),
    active: z.coerce.boolean(),
  }),
  notes: z.object({
    type: z.enum(["important", "care"]),
    text: z.string().trim().min(1),
    sort_order: z.coerce.number().int(),
    is_default: z.coerce.boolean(),
    active: z.coerce.boolean(),
  }),
};

export type ActionResult = { ok: true } | { ok: false; error: string };

function assertTable(table: string): asserts table is BankTable {
  if (!TABLES.includes(table as BankTable)) throw new Error(`unknown table: ${table}`);
}

// Empty-string selects ("none") arrive from native <select>; coerce to null.
function nullifyEmpty(values: Record<string, unknown>) {
  const out = { ...values };
  for (const k of ["slot_id", "recipe_id", "default_time", "logo_url", "tagline", "website", "instagram", "phone"]) {
    if (out[k] === "" || out[k] === undefined) out[k] = null;
  }
  return out;
}

export async function saveRow(
  table: string,
  id: string | null,
  values: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    assertTable(table);
    const parsed = schemas[table].safeParse(nullifyEmpty(values));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const supabase = await createClient();
    const row = parsed.data as Record<string, unknown>;
    const { error } = id
      ? await supabase.from(table).update(row).eq("id", id)
      : await supabase.from(table).insert(row);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export async function deleteRow(table: string, id: string): Promise<ActionResult> {
  try {
    assertTable(table);
    const supabase = await createClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

// Logo upload → brand-assets (private). Stores the object path in brands.logo_url;
// previews are served via short-lived signed URLs (see signedLogoUrls in page).
export async function uploadBrandLogo(brandId: string, formData: FormData): Promise<ActionResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No file provided" };
    if (file.size > 2_000_000) return { ok: false, error: "Logo must be under 2 MB" };

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${brandId}/logo-${Date.now()}.${ext}`;
    const svc = createServiceClient();
    const { error: upErr } = await svc.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (upErr) return { ok: false, error: upErr.message };

    const { error } = await svc.from("brands").update({ logo_url: path }).eq("id", brandId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed" };
  }
}
