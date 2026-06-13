"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Plus, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { CellItem, FoodItem, Recipe } from "@/lib/types";

export function CellEditor({
  foodBank,
  recipeById,
  slotId,
  items,
  onChange,
  onAddItem,
}: {
  foodBank: FoodItem[];
  recipeById: Map<string, Recipe>;
  slotId: string | null;
  items: CellItem[];
  onChange: (items: CellItem[]) => void;
  onAddItem: (name: string) => Promise<FoodItem | null>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  // Slot-scoped items first (bank is already most-used-first), then the rest.
  const ordered = useMemo(() => {
    const inSlot = foodBank.filter((f) => f.slot_id === slotId);
    const rest = foodBank.filter((f) => f.slot_id !== slotId);
    return [...inSlot, ...rest];
  }, [foodBank, slotId]);

  const selectedTexts = useMemo(() => new Set(items.map((i) => i.text)), [items]);

  function cellItemFor(food: FoodItem): CellItem {
    const recipe = food.recipe_id ? recipeById.get(food.recipe_id) : undefined;
    return { text: food.name, recipe: recipe ? { title: recipe.title, url: recipe.url } : undefined };
  }

  function toggle(food: FoodItem) {
    if (selectedTexts.has(food.name)) onChange(items.filter((i) => i.text !== food.name));
    else onChange([...items, cellItemFor(food)]);
  }

  function removeAt(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function addNew() {
    const name = query.trim();
    if (!name) return;
    start(async () => {
      const created = await onAddItem(name);
      if (created) {
        onChange([...items, cellItemFor(created)]);
        setQuery("");
      }
    });
  }

  const exactExists = ordered.some((f) => f.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-[2.25rem] w-full flex-col gap-1 rounded-md border border-app-rule bg-brand-surface p-1.5 text-left text-xs transition-colors hover:border-brand-primary/40",
            items.length === 0 && "items-center justify-center text-app-muted",
          )}
        >
          {items.length === 0 ? (
            <span className="inline-flex items-center gap-1 py-1 text-[11px]">
              <Plus className="h-3 w-3" /> add
            </span>
          ) : (
            items.map((it, idx) => (
              <span
                key={`${it.text}-${idx}`}
                className="group inline-flex items-start gap-1 rounded bg-brand-bg px-1.5 py-1 text-brand-ink"
              >
                <span className="leading-snug">{it.text}</span>
                <X
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer text-app-muted opacity-100 lg:h-3 lg:w-3 lg:opacity-0 lg:group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(idx);
                  }}
                />
              </span>
            ))
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command shouldFilter>
          <CommandInput placeholder="Search food bank…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>
              {query.trim() ? (
                <button
                  type="button"
                  onClick={addNew}
                  disabled={pending}
                  className="mx-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-brand-primary hover:underline"
                >
                  <Plus className="h-4 w-4" /> Add “{query.trim()}”
                </button>
              ) : (
                "No items."
              )}
            </CommandEmpty>
            {ordered.map((food) => {
              const checked = selectedTexts.has(food.name);
              return (
                <CommandItem key={food.id} value={food.name} onSelect={() => toggle(food)}>
                  <Check className={cn("h-4 w-4 shrink-0", checked ? "text-brand-primary" : "opacity-0")} />
                  <span className="flex-1">{food.name}</span>
                  {food.recipe_id && <span className="text-[10px] text-app-muted">recipe</span>}
                </CommandItem>
              );
            })}
            {query.trim() && !exactExists && (
              <CommandItem value={`__add__${query}`} onSelect={addNew}>
                <Plus className="h-4 w-4 shrink-0 text-brand-primary" />
                <span>Add “{query.trim()}”</span>
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
