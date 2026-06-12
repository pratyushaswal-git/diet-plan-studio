"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankEditor, type FieldDef } from "@/components/settings/BankEditor";
import { BrandsEditor } from "@/components/settings/BrandsEditor";
import type { Brand, FoodItem, MealSlot, Note, Recipe } from "@/lib/types";

export function SettingsTabs({
  brands,
  slots,
  foodItems,
  recipes,
  notes,
  logoUrls,
}: {
  brands: Brand[];
  slots: MealSlot[];
  foodItems: FoodItem[];
  recipes: Recipe[];
  notes: Note[];
  logoUrls: Record<string, string | null>;
}) {
  const slotOptions = [
    { value: "", label: "— no slot —" },
    ...slots.map((s) => ({ value: s.id, label: s.label })),
  ];
  const recipeOptions = [
    { value: "", label: "— no recipe —" },
    ...recipes.map((r) => ({ value: r.id, label: r.title })),
  ];

  const slotFields: FieldDef[] = [
    { key: "label", label: "Label", type: "text", className: "col-span-2" },
    { key: "default_time", label: "Default time", type: "text", placeholder: "9:00 am" },
    {
      key: "kind",
      label: "Kind",
      type: "select",
      options: ["meal", "hydration", "activity", "other"].map((k) => ({ value: k, label: k })),
    },
    { key: "sort_order", label: "Order", type: "number" },
    { key: "is_default", label: "Default-on", type: "checkbox" },
    { key: "active", label: "Active", type: "checkbox" },
  ];

  const foodFields: FieldDef[] = [
    { key: "name", label: "Name", type: "text", className: "col-span-3" },
    { key: "slot_id", label: "Slot", type: "select", options: slotOptions },
    { key: "recipe_id", label: "Recipe", type: "select", options: recipeOptions },
    { key: "active", label: "Active", type: "checkbox" },
  ];

  const recipeFields: FieldDef[] = [
    { key: "title", label: "Title", type: "text", className: "col-span-2" },
    { key: "url", label: "URL", type: "text", className: "col-span-3" },
  ];

  const noteFields: FieldDef[] = [
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { value: "important", label: "Important" },
        { value: "care", label: "Please take care" },
      ],
    },
    { key: "text", label: "Text", type: "textarea", className: "col-span-3" },
    { key: "sort_order", label: "Order", type: "number" },
    { key: "is_default", label: "Default-on", type: "checkbox" },
    { key: "active", label: "Active", type: "checkbox" },
  ];

  return (
    <Tabs defaultValue="brands" className="mt-6">
      <TabsList>
        <TabsTrigger value="brands">Brands</TabsTrigger>
        <TabsTrigger value="slots">Slots</TabsTrigger>
        <TabsTrigger value="food">Food items</TabsTrigger>
        <TabsTrigger value="recipes">Recipes</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="brands">
        <BrandsEditor brands={brands} logoUrls={logoUrls} />
      </TabsContent>

      <TabsContent value="slots">
        <BankEditor
          table="meal_slots"
          fields={slotFields}
          rows={slots as unknown as (Record<string, unknown> & { id: string })[]}
          layout="grid-cols-[2fr_1fr_1fr_70px_auto_auto_auto] max-lg:grid-cols-2"
          newDefaults={{ kind: "meal", is_default: true, active: true, sort_order: slots.length }}
          description="Meal-schedule rows preloaded into a new plan."
        />
      </TabsContent>

      <TabsContent value="food">
        <BankEditor
          table="food_items"
          fields={foodFields}
          rows={foodItems as unknown as (Record<string, unknown> & { id: string })[]}
          layout="grid-cols-[3fr_1fr_1fr_auto_auto] max-lg:grid-cols-1"
          newDefaults={{ active: true }}
          searchKeys={["name"]}
          description="Per-slot food bank, ordered by usage."
        />
      </TabsContent>

      <TabsContent value="recipes">
        <BankEditor
          table="recipes"
          fields={recipeFields}
          rows={recipes as unknown as (Record<string, unknown> & { id: string })[]}
          layout="grid-cols-[2fr_3fr_auto] max-lg:grid-cols-1"
          searchKeys={["title", "url"]}
          description="Linked from food items; auto-listed in the PDF."
        />
      </TabsContent>

      <TabsContent value="notes">
        <BankEditor
          table="notes"
          fields={noteFields}
          rows={notes as unknown as (Record<string, unknown> & { id: string })[]}
          layout="grid-cols-[140px_3fr_70px_auto_auto_auto] max-lg:grid-cols-1"
          newDefaults={{ type: "care", is_default: false, active: true, sort_order: notes.length }}
          searchKeys={["text"]}
          description="IMPORTANT + Please-take-care banks."
        />
      </TabsContent>
    </Tabs>
  );
}
