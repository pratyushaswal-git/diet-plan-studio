-- Diet Plan Studio — full schema + RLS.
-- Run once: Supabase Dashboard → SQL Editor → paste this whole file → Run.
-- Idempotent-ish: uses IF NOT EXISTS / OR REPLACE where possible.

-- ========== updated_at trigger ==========
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

-- ========== BRANDS ==========
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,                 -- 'shecares' | 'sadhana_tribe' | 'nuvira'
  name text not null,
  email text not null,                      -- printed in PDF header
  watermark_text text not null,             -- diagonal page watermark
  logo_url text,                            -- brand-assets bucket
  tagline text,                             -- PDF header/footer tagline ('Wellness & Fertility')
  website text,                             -- contact chip ('shecares.in')
  instagram text,                           -- contact chip ('@shecares_fertility')
  phone text,                               -- contact chip ('+91 …')
  theme jsonb not null default '{}'::jsonb, -- { primary, accent, bg, surface, ink, muted }
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MIGRATION (existing DBs): add the brand contact columns if the table predates them.
alter table brands add column if not exists tagline   text;
alter table brands add column if not exists website   text;
alter table brands add column if not exists instagram text;
alter table brands add column if not exists phone     text;

-- ========== MEAL SLOTS (table rows) ==========
create table if not exists meal_slots (
  id uuid primary key default gen_random_uuid(),
  label text not null,                      -- 'Breakfast', 'After waking up', 'Lunch'
  default_time text,                        -- '9:00 am' (nullable)
  kind text not null default 'meal',        -- 'meal' | 'hydration' | 'activity' | 'other'
  sort_order int not null default 0,
  is_default boolean not null default true, -- preloaded into a new plan
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== RECIPES ==========
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== FOOD ITEMS (per-slot bank) ==========
create table if not exists food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,                       -- cell text; may be a composed description
  slot_id uuid references meal_slots(id) on delete set null,  -- suggested-for slot
  recipe_id uuid references recipes(id) on delete set null,   -- optional linked recipe
  usage_count int not null default 0,       -- powers "most used first"
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists food_items_slot_id_idx on food_items (slot_id);
create index if not exists food_items_recipe_id_idx on food_items (recipe_id);

-- ========== NOTES (Important + Please-take-care banks) ==========
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('important','care')),
  text text not null,
  sort_order int not null default 0,
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_type_idx on notes (type);

-- ========== PLANS (history; body = frozen snapshot) ==========
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,  -- filter/relabel only
  client_name text not null,                -- denormalized for list/search
  title text,                               -- defaults to name + date
  status text not null default 'final',     -- 'draft' | 'final'
  body jsonb not null,                      -- complete render document (PlanBody)
  pdf_url text,                             -- optional cached export
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plans_brand_id_idx on plans (brand_id);
create index if not exists plans_client_name_idx on plans (client_name);
create index if not exists plans_created_at_idx on plans (created_at desc);

-- ========== triggers ==========
drop trigger if exists t_brands  on brands;
drop trigger if exists t_slots   on meal_slots;
drop trigger if exists t_recipes on recipes;
drop trigger if exists t_food    on food_items;
drop trigger if exists t_notes   on notes;
drop trigger if exists t_plans   on plans;
create trigger t_brands  before update on brands     for each row execute function set_updated_at();
create trigger t_slots   before update on meal_slots for each row execute function set_updated_at();
create trigger t_recipes before update on recipes    for each row execute function set_updated_at();
create trigger t_food    before update on food_items for each row execute function set_updated_at();
create trigger t_notes   before update on notes      for each row execute function set_updated_at();
create trigger t_plans   before update on plans      for each row execute function set_updated_at();

-- ========== RLS: private app — authenticated users get everything ==========
alter table brands     enable row level security;
alter table meal_slots enable row level security;
alter table recipes    enable row level security;
alter table food_items enable row level security;
alter table notes      enable row level security;
alter table plans      enable row level security;

drop policy if exists auth_all on brands;
drop policy if exists auth_all on meal_slots;
drop policy if exists auth_all on recipes;
drop policy if exists auth_all on food_items;
drop policy if exists auth_all on notes;
drop policy if exists auth_all on plans;
create policy auth_all on brands     for all to authenticated using (true) with check (true);
create policy auth_all on meal_slots for all to authenticated using (true) with check (true);
create policy auth_all on recipes    for all to authenticated using (true) with check (true);
create policy auth_all on food_items for all to authenticated using (true) with check (true);
create policy auth_all on notes      for all to authenticated using (true) with check (true);
create policy auth_all on plans      for all to authenticated using (true) with check (true);

-- ========== Storage: private buckets, authenticated read/write ==========
-- Buckets themselves are created by scripts/seed.ts (or manually in Dashboard → Storage).
drop policy if exists auth_storage_all on storage.objects;
create policy auth_storage_all on storage.objects
  for all to authenticated
  using (bucket_id in ('brand-assets', 'plan-pdfs'))
  with check (bucket_id in ('brand-assets', 'plan-pdfs'));
