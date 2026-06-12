import { AppNav } from "@/components/AppNav";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Brand, FoodItem, MealSlot, Note, Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [brandsRes, slotsRes, foodRes, recipesRes, notesRes] = await Promise.all([
    supabase.from("brands").select("*").order("sort_order"),
    supabase.from("meal_slots").select("*").order("sort_order"),
    supabase.from("food_items").select("*").order("usage_count", { ascending: false }).order("name"),
    supabase.from("recipes").select("*").order("title"),
    supabase.from("notes").select("*").order("type").order("sort_order"),
  ]);

  const brands = (brandsRes.data ?? []) as Brand[];
  const slots = (slotsRes.data ?? []) as MealSlot[];
  const foodItems = (foodRes.data ?? []) as FoodItem[];
  const recipes = (recipesRes.data ?? []) as Recipe[];
  const notes = (notesRes.data ?? []) as Note[];

  // Resolve short-lived signed URLs for brand logos (brand-assets is private).
  const logoUrls: Record<string, string | null> = {};
  const svc = createServiceClient();
  await Promise.all(
    brands
      .filter((b) => b.logo_url)
      .map(async (b) => {
        const { data } = await svc.storage.from("brand-assets").createSignedUrl(b.logo_url!, 3600);
        logoUrls[b.id] = data?.signedUrl ?? null;
      }),
  );

  const loadError = brandsRes.error || slotsRes.error || foodRes.error || recipesRes.error || notesRes.error;

  return (
    <div className="min-h-dvh bg-app-bg">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-serif text-2xl text-app-ink">Settings</h1>
        <p className="mt-2 text-sm text-app-muted">
          Review and maintain the knowledge base extracted from past plans.
        </p>

        {loadError ? (
          <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load data: {loadError.message}
          </p>
        ) : (
          <SettingsTabs
            brands={brands}
            slots={slots}
            foodItems={foodItems}
            recipes={recipes}
            notes={notes}
            logoUrls={logoUrls}
          />
        )}
      </main>
    </div>
  );
}
