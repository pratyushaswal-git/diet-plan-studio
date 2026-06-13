"use client";

import { useBuilder } from "@/lib/store/builder";
import { deriveRecipes } from "@/lib/snapshot";

export function RecipesPreview() {
  const rows = useBuilder((s) => s.rows);
  const recipes = deriveRecipes(rows);

  return (
    <div className="space-y-2 rounded-lg border border-app-rule bg-app-surface p-4">
      <h3 className="font-serif text-base text-app-ink">Recipes</h3>
      <p className="text-xs text-app-muted">Auto-derived from the items you picked. Read-only — this is what prints.</p>
      {recipes.length === 0 ? (
        <p className="text-sm text-app-muted">No recipes linked yet.</p>
      ) : (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-app-ink">
          {recipes.map((r) => (
            <li key={r.url}>
              <span>{r.title}</span>{" "}
              <a href={r.url} target="_blank" rel="noreferrer" className="text-brand-primary underline">
                link
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
