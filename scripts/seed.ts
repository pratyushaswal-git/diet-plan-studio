/**
 * Idempotent seeder: loads scripts/.out/seed.json (produced by parse-plans.ts)
 * into Supabase, and creates the private storage buckets.
 *
 * Re-run safe: matches existing rows (brands by key, slots by label, recipes
 * by url, food items by name, notes by type+text) and inserts/updates only.
 *
 * Requires supabase/schema.sql to have been run first (SQL Editor).
 * Run: npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// ---- env (.env.local, no dotenv dependency) ----
for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !serviceKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const seed = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "scripts", ".out", "seed.json"), "utf8"),
);

const normKey = (s: string) =>
  s.toLowerCase().replace(/\s+/g, " ").replace(/[’‘]/g, "'").replace(/\s*([,;:/()+-])\s*/g, "$1").replace(/\.$/, "").trim();

// Brand seeds: themes from CLAUDE.md (provisional — coach confirms in Settings).
// Emails: most-common variant seen in the plans; nuvira had no plans with an
// email, so it gets a placeholder the coach must replace.
const BRANDS = [
  {
    key: "shecares",
    name: "SheCares",
    email: "shecareshelp@gmail.com",
    watermark_text: "SheCares",
    sort_order: 0,
    theme: { primary: "#C25B7A", accent: "#E89AAE", bg: "#FCF3F5", surface: "#FFFFFF", ink: "#3A2230", muted: "#8A6B76" },
  },
  {
    key: "sadhana_tribe",
    name: "Sadhana Tribe",
    email: "sadhanatribe.coaching@gmail.com",
    watermark_text: "Sadhana Tribe",
    sort_order: 1,
    theme: { primary: "#B5683F", accent: "#8A9A5B", bg: "#F7F0E6", surface: "#FFFDF8", ink: "#3B2C1F", muted: "#7A6A57" },
  },
  {
    key: "nuvira",
    name: "Nuvira Fertility",
    email: "nuvirafertility@gmail.com",
    watermark_text: "Nuvira Fertility",
    sort_order: 2,
    theme: { primary: "#4E7C4A", accent: "#8BBF6A", bg: "#F3F7EE", surface: "#FFFFFF", ink: "#233322", muted: "#6A7A63" },
  },
];

async function ensureBuckets() {
  for (const name of ["brand-assets", "plan-pdfs"]) {
    const { data } = await db.storage.getBucket(name);
    if (data) {
      console.log(`bucket ${name}: exists`);
      continue;
    }
    const { error } = await db.storage.createBucket(name, { public: false });
    if (error) throw new Error(`createBucket ${name}: ${error.message}`);
    console.log(`bucket ${name}: created (private)`);
  }
}

async function seedBrands() {
  const { error } = await db.from("brands").upsert(BRANDS, { onConflict: "key" });
  if (error) throw new Error(`brands: ${error.message}`);
  console.log(`brands: ${BRANDS.length} upserted`);
}

async function seedSlots(): Promise<Map<string, string>> {
  const { data: existing, error: selErr } = await db.from("meal_slots").select("id,label");
  if (selErr) throw new Error(`meal_slots select: ${selErr.message}`);
  const byLabel = new Map(existing!.map((r) => [normKey(r.label), r.id as string]));

  let ins = 0;
  for (const s of seed.slots) {
    const row = {
      label: s.label,
      default_time: s.default_time,
      kind: s.kind,
      sort_order: s.sort_order,
      is_default: s.is_default,
    };
    const id = byLabel.get(normKey(s.label));
    if (id) {
      const { error } = await db.from("meal_slots").update(row).eq("id", id);
      if (error) throw new Error(`meal_slots update: ${error.message}`);
    } else {
      const { data, error } = await db.from("meal_slots").insert(row).select("id").single();
      if (error) throw new Error(`meal_slots insert: ${error.message}`);
      byLabel.set(normKey(s.label), data!.id);
      ins++;
    }
  }
  console.log(`meal_slots: ${ins} inserted, ${seed.slots.length - ins} updated`);
  return byLabel;
}

async function seedRecipes(): Promise<Map<string, string>> {
  const { data: existing, error: selErr } = await db.from("recipes").select("id,url");
  if (selErr) throw new Error(`recipes select: ${selErr.message}`);
  const byUrl = new Map(existing!.map((r) => [r.url as string, r.id as string]));

  let ins = 0;
  for (const r of seed.recipes) {
    if (byUrl.has(r.url)) {
      const { error } = await db.from("recipes").update({ title: r.title }).eq("id", byUrl.get(r.url)!);
      if (error) throw new Error(`recipes update: ${error.message}`);
    } else {
      const { data, error } = await db.from("recipes").insert({ title: r.title, url: r.url }).select("id").single();
      if (error) throw new Error(`recipes insert: ${error.message}`);
      byUrl.set(r.url, data!.id);
      ins++;
    }
  }
  console.log(`recipes: ${ins} inserted, ${seed.recipes.length - ins} updated`);
  return byUrl;
}

async function seedFoodItems(slotIds: Map<string, string>, recipeIds: Map<string, string>) {
  const { data: existing, error: selErr } = await db.from("food_items").select("id,name");
  if (selErr) throw new Error(`food_items select: ${selErr.message}`);
  const byName = new Map(existing!.map((r) => [normKey(r.name), r.id as string]));

  let ins = 0;
  for (const f of seed.foodItems) {
    const row = {
      name: f.name,
      slot_id: f.slot_key ? (slotIds.get(f.slot_key) ?? null) : null,
      recipe_id: f.recipe_url ? (recipeIds.get(f.recipe_url) ?? null) : null,
      usage_count: f.usage_count,
    };
    const id = byName.get(normKey(f.name));
    if (id) {
      const { error } = await db.from("food_items").update(row).eq("id", id);
      if (error) throw new Error(`food_items update: ${error.message}`);
    } else {
      const { error } = await db.from("food_items").insert(row);
      if (error) throw new Error(`food_items insert: ${error.message}`);
      ins++;
    }
  }
  console.log(`food_items: ${ins} inserted, ${seed.foodItems.length - ins} updated`);
}

async function seedNotes() {
  const { data: existing, error: selErr } = await db.from("notes").select("id,type,text");
  if (selErr) throw new Error(`notes select: ${selErr.message}`);
  const byKey = new Map(existing!.map((r) => [`${r.type}|${normKey(r.text)}`, r.id as string]));

  let ins = 0;
  for (const n of seed.notes) {
    const row = { type: n.type, text: n.text, sort_order: n.sort_order, is_default: n.is_default };
    const id = byKey.get(`${n.type}|${normKey(n.text)}`);
    if (id) {
      const { error } = await db.from("notes").update(row).eq("id", id);
      if (error) throw new Error(`notes update: ${error.message}`);
    } else {
      const { error } = await db.from("notes").insert(row);
      if (error) throw new Error(`notes insert: ${error.message}`);
      ins++;
    }
  }
  console.log(`notes: ${ins} inserted, ${seed.notes.length - ins} updated`);
}

async function main() {
  console.log(`seeding ${url} from seed.json (${seed.meta.planCount} plans parsed ${seed.meta.generatedAt})`);
  await ensureBuckets();
  await seedBrands();
  const slotIds = await seedSlots();
  const recipeIds = await seedRecipes();
  await seedFoodItems(slotIds, recipeIds);
  await seedNotes();

  // verify counts
  for (const t of ["brands", "meal_slots", "recipes", "food_items", "notes"]) {
    const { count, error } = await db.from(t).select("*", { count: "exact", head: true });
    if (error) throw new Error(`count ${t}: ${error.message}`);
    console.log(`  ${t}: ${count} rows`);
  }
  console.log("done.");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
