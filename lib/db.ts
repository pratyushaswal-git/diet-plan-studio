import { createClient } from "@/lib/supabase/server";
import type { Brand, BrandTheme, FoodItem, MealSlot, Note, Plan, PlanStatus, Recipe } from "@/lib/types";

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

// Lean row for the history table — joins the brand for the pill/filter.
export type PlanListItem = {
  id: string;
  client_name: string;
  title: string | null;
  status: PlanStatus;
  created_at: string;
  brand: { key: string; name: string; theme: BrandTheme } | null;
};

export async function getPlansList(): Promise<PlanListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("id, client_name, title, status, created_at, brand:brands(key, name, theme)")
    .order("created_at", { ascending: false });
  // Supabase types the embedded relation as an array; collapse to a single object.
  return ((data ?? []) as unknown as RawPlanRow[]).map((r) => ({
    id: r.id,
    client_name: r.client_name,
    title: r.title,
    status: r.status,
    created_at: r.created_at,
    brand: Array.isArray(r.brand) ? (r.brand[0] ?? null) : (r.brand ?? null),
  }));
}

type RawPlanRow = Omit<PlanListItem, "brand"> & {
  brand: PlanListItem["brand"] | PlanListItem["brand"][];
};

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
