"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { FoodItem, PlanBody } from "@/lib/types";

const cellItemSchema = z.object({
  text: z.string(),
  recipe: z.object({ title: z.string(), url: z.string() }).optional(),
});

const rowSchema = z.object({
  slotId: z.string().nullable(),
  label: z.string(),
  time: z.string().optional(),
  uniform: z.boolean(),
  uniformCell: z.array(cellItemSchema).optional(),
  cells: z.record(z.array(cellItemSchema)).optional(),
});

const bodySchema = z.object({
  client: z.object({
    name: z.string().trim().min(1, "Client name is required"),
    age: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional(),
    extra: z.string().optional(),
  }),
  brand: z.object({
    key: z.string(),
    name: z.string(),
    email: z.string(),
    watermarkText: z.string(),
    logoUrl: z.string().optional(),
    theme: z.record(z.string()),
  }),
  schedule: z.object({ days: z.array(z.string()), rows: z.array(rowSchema) }),
  importantNotes: z.array(z.string()),
  careNotes: z.array(z.string()),
  recipes: z.array(z.object({ title: z.string(), url: z.string() })),
});

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

export async function savePlan(
  id: string | null,
  body: PlanBody,
  status: "draft" | "final" = "final",
): Promise<SaveResult> {
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid plan" };

  const supabase = await createClient();

  // Resolve brand_id from the snapshot's brand key (filter/relabel only).
  let brandId: string | null = null;
  if (body.brand.key) {
    const { data: brand } = await supabase.from("brands").select("id").eq("key", body.brand.key).maybeSingle();
    brandId = brand?.id ?? null;
  }

  const row = {
    brand_id: brandId,
    client_name: body.client.name.trim(),
    title: `${body.client.name.trim()} — ${format(new Date(), "d MMM yyyy")}`,
    status,
    body,
  };

  if (id) {
    const { error } = await supabase.from("plans").update(row).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/plans");
    revalidatePath(`/plans/${id}`);
    return { ok: true, id };
  }

  const { data, error } = await supabase.from("plans").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/plans");
  return { ok: true, id: data.id as string };
}

export type AddFoodResult = { ok: true; item: FoodItem } | { ok: false; error: string };

// Inline "add new item" from the cell editor → persists to the food bank and
// returns the new row so the cell can select it immediately.
export async function addFoodItem(name: string, slotId: string | null): Promise<AddFoodResult> {
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Name required" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_items")
    .insert({ name: clean, slot_id: slotId, usage_count: 0 })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true, item: data as FoodItem };
}
