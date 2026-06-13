import { createClient } from "@/lib/supabase/server";
import type { Brand, FoodItem, MealSlot, Note, Plan, Recipe } from "@/lib/types";

// Typed bank fetchers. All use the session client so RLS applies.

export async function getBrands(activeOnly = true): Promise<Brand[]> {
  const supabase = await createClient();
  let q = supabase.from("brands").select("*").order("sort_order");
  if (activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as Brand[];
}

export async function getSlots(): Promise<MealSlot[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("meal_slots").select("*").eq("active", true).order("sort_order");
  return (data ?? []) as MealSlot[];
}

export async function getFoodItems(): Promise<FoodItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("food_items")
    .select("*")
    .eq("active", true)
    .order("usage_count", { ascending: false })
    .order("name");
  return (data ?? []) as FoodItem[];
}

export async function getRecipes(): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("recipes").select("*").order("title");
  return (data ?? []) as Recipe[];
}

export async function getNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("notes").select("*").eq("active", true).order("type").order("sort_order");
  return (data ?? []) as Note[];
}

export async function getPlan(id: string): Promise<Plan | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").eq("id", id).maybeSingle();
  return (data as Plan) ?? null;
}

// Distinct past client names — powers the name autocomplete (no clients table).
export async function getClientNames(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("client_name").order("created_at", { ascending: false });
  const seen = new Set<string>();
  for (const r of data ?? []) {
    const n = (r as { client_name: string }).client_name?.trim();
    if (n) seen.add(n);
  }
  return [...seen];
}

export type BuilderData = {
  brands: Brand[];
  slots: MealSlot[];
  foodItems: FoodItem[];
  recipes: Recipe[];
  notes: Note[];
  clientNames: string[];
};

// One bundle for the builder server pages.
export async function getBuilderData(): Promise<BuilderData> {
  const [brands, slots, foodItems, recipes, notes, clientNames] = await Promise.all([
    getBrands(),
    getSlots(),
    getFoodItems(),
    getRecipes(),
    getNotes(),
    getClientNames(),
  ]);
  return { brands, slots, foodItems, recipes, notes, clientNames };
}
