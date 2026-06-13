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
    { key: "label", label: "Label", type: "text", w: "lg:flex-[2]" },
    { key: "default_time", label: "Default time", type: "text", placeholder: "9:00 am", w: "lg:w-28" },
    {
      key: "kind",
      label: "Kind",
      type: "select",
      options: ["meal", "hydration", "activity", "other"].map((k) => ({ value: k, label: k })),
      w: "lg:w-32",
    },
    { key: "sort_order", label: "Order", type: "number", w: "lg:w-16" },
    { key: "is_default", label: "Default-on", type: "checkbox", w: "lg:w-24" },
    { key: "active", label: "Active", type: "checkbox", w: "lg:w-20" },
  ];

  const foodFields: FieldDef[] = [
    { key: "name", label: "Name", type: "text", w: "lg:flex-[3]" },
    { key: "slot_id", label: "Slot", type: "select", options: slotOptions, w: "lg:flex-1" },
    { key: "recipe_id", label: "Recipe", type: "select", options: recipeOptions, w: "lg:flex-1" },
    { key: "active", label: "Active", type: "checkbox", w: "lg:w-20" },
  ];

  const recipeFields: FieldDef[] = [
    { key: "title", label: "Title", type: "text", w: "lg:flex-[2]" },
    { key: "url", label: "URL", type: "text", w: "lg:flex-[3]" },
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
      w: "lg:w-40",
    },
    { key: "text", label: "Text", type: "textarea", w: "lg:flex-[3]" },
    { key: "sort_order", label: "Order", type: "number", w: "lg:w-16" },
    { key: "is_default", label: "Default-on", type: "checkbox", w: "lg:w-24" },
    { key: "active", label: "Active", type: "checkbox", w: "lg:w-20" },
  ];

  return (
    <Tabs defaultValue="brands" className="mt-6">
      {/* Scrollable on mobile so all tabs stay reachable. */}
      <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <TabsList>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="slots">Slots</TabsTrigger>
          <TabsTrigger value="food">Food items</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="brands">
        <BrandsEditor brands={brands} logoUrls={logoUrls} />
      </TabsContent>

      <TabsContent value="slots">
        <BankEditor
          table="meal_slots"
          fields={slotFields}
          rows={slots as unknown as (Record<string, unknown> & { id: string })[]}
          newDefaults={{ kind: "meal", is_default: true, active: true, sort_order: slots.length }}
          description="Meal-schedule rows preloaded into a new plan."
          addLabel="Add slot"
          searchKeys={["label"]}
        />
      </TabsContent>

      <TabsContent value="food">
        <BankEditor
          table="food_items"
          fields={foodFields}
          rows={foodItems as unknown as (Record<string, unknown> & { id: string })[]}
          newDefaults={{ active: true }}
          searchKeys={["name"]}
          description="Per-slot food bank, ordered by usage."
          addLabel="Add food item"
          filters={[{ key: "slot_id", label: "Slot", options: slots.map((s) => ({ value: s.id, label: s.label })) }]}
        />
      </TabsContent>

      <TabsContent value="recipes">
        <BankEditor
          table="recipes"
          fields={recipeFields}
          rows={recipes as unknown as (Record<string, unknown> & { id: string })[]}
          searchKeys={["title", "url"]}
          description="Linked from food items; auto-listed in the PDF."
          addLabel="Add recipe"
        />
      </TabsContent>

      <TabsContent value="notes">
        <BankEditor
          table="notes"
          fields={noteFields}
          rows={notes as unknown as (Record<string, unknown> & { id: string })[]}
          newDefaults={{ type: "care", is_default: false, active: true, sort_order: notes.length }}
          searchKeys={["text"]}
          description="IMPORTANT + Please-take-care banks."
          addLabel="Add note"
          filters={[
            {
              key: "type",
              label: "Type",
              options: [
                { value: "important", label: "Important" },
                { value: "care", label: "Please take care" },
              ],
            },
          ]}
        />
      </TabsContent>
    </Tabs>
  );
}
