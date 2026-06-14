# CLAUDE.md — Diet Plan Studio

> **Purpose:** A private, multi-brand diet-plan builder for a nutrition coach. An interactive form assembles a weekly meal plan from a reusable knowledge base and produces a beautiful, brand-themed PDF to share. Keeps a searchable history of every plan made — revisit, edit, duplicate, re-download.
> **Working title** — confirm/rename before first deploy.
> **One coach, three brands:** SheCares · Sadhana Tribe · Nuvira Fertility. The plan *format* is identical across brands; only the email, watermark, logo, and color theme change.
> **Knowledge base is seeded from real plans** — see the **Knowledge Base** section: extract everything from the PDFs in the `plans/` folder. No AI / no internet calls in the app.

---

## Working Conventions

- **First batch is repo setup.** Initialize the repo and set the git identity (repo-local, not global):
  ```bash
  git init
  git config user.name "Pratyush"
  git config user.email "pratyush.aswal@gmail.com"
  ```
  Use these for every commit in this project.
- **Work in meaningful batches, one at a time.** Implement the batches in the **Build Plan** section in order. Do not start the next batch until the current one builds, runs, and is committed. After each batch: run the build, commit with a clear descriptive message, push to the remote, then append a **Session Log** entry (scope · changes · verified · commit ref).
- Keep the Session Log and git history in sync — never leave a finished batch uncommitted.
- Don't invent brand specifics (exact hex, canonical emails, watermark text). Where unconfirmed, use the seed values here and flag them; the coach confirms in Settings.

---

## Knowledge Base — Extract Everything from `plans/`

**The single source of truth for all seed data is the set of diet-plan PDFs in the `plans/` folder at the repo root** (~20 plans). Before building the builder UI, write a parser (Python `pdfplumber`/`pypdf`, or Node `pdf-parse`) that reads **every** PDF in `plans/` and produces a normalized, deduplicated seed (`scripts/seed.ts` or a `seed.sql`) for these tables: `brands`, `meal_slots`, `food_items`, `recipes`, `notes`. Then load it into Supabase. The coach reviews/cleans the result in Settings afterward.

Every plan has the same structure: a header (`Diet Plan` + brand email), client details line, a 7-column (Mon–Sun) **Meal Schedule** table, an optional **IMPORTANT** block, a **Please take care of below** block, and a **Recipes** block (numbered list + URLs).

### What to extract

| Target | From the PDF | Notes |
|---|---|---|
| `brands.email` / brand | Header email + any watermark | Map email → brand. Some plans have **no** email (leave brand unset for manual assignment). Email may be inconsistent (`sadhanatribe.coaching@…` vs `sadhanatribe@…`) — **do not** create a brand per variant; coach confirms one canonical email per brand. |
| `meal_slots` | Left-column row labels + times | e.g. `After waking up`, `Breakfast at 9:00 am`, `Lunch`, `Evening`, `Dinner`, `Half an hour before going to sleep`. Times vary per plan → store a `default_time` on the slot; the time is a per-plan override. Include non-meal rows (`At 12 pm` salad, `Go for a 20 minute walk` → `kind = activity`/`hydration`). |
| `food_items` | Each table cell | Split a cell into discrete items where clearly separate; keep composed descriptions whole (e.g. `Fruit bowl having - 1 pomegranate, 1 apple, 1 guava (seeds removed)` is **one** item). Tag each with its `slot_id` (suggested-for). |
| `recipes` | The Recipes block (title + URL) | One row per distinct title/URL. |
| `food_items.recipe_id` | `[see the recipe below]` marker + Recipes block | Link the item to its recipe. **Strip the `[see the recipe below]` text** from the item name. |
| `notes` (`type='important'`) | IMPORTANT block lines | e.g. `Keep 1/4 parts of stomach empty…`. Section is optional/absent in some plans — that's expected. |
| `notes` (`type='care'`) | Please-take-care bullets | e.g. ghee/oil/water-intake lines. |

### Normalization rules (apply during extraction)

- **Dedupe across all plans.** `Avocado toast` and `Avocado toast [see the recipe below]` → one item carrying the recipe link. `Roasted makhana chat` appears many times → one item.
- **Strip recipe markers** (`[see the recipe below]`) from item names; the link lives in `recipe_id`.
- **Parameterized items** (fruit bowls, water-intake notes with "2.5 L" vs "3 L"): seed the common variants and rely on per-plan inline editing for the rest (the plan snapshot holds the final text — see Data Model).
- **Times are slot defaults, not item data** — `Breakfast at 9:00 am` (one plan) vs `8:30 am` (another) → slot `Breakfast`, `default_time` seeded from the most common, overridable per plan.
- Set `is_default = true` on the slots and notes that appear in the majority of plans so a new plan pre-loads sensibly.
- Track `usage_count` per food item (how many plans used it) to power "most-used first" ordering in the cell picker.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) | Server route for clean PDF font embedding; server components for data fetching; Vercel-native. |
| Language | **TypeScript** | Typed `PlanBody` snapshot + DB rows. |
| Styling | **Tailwind CSS** + CSS variables | Brand theme applied as CSS vars at runtime. |
| UI primitives | **shadcn/ui** (+ `cmdk`) | The cell editor needs a solid command/combobox; also dialogs, toasts. |
| Forms / state | **react-hook-form** + **zod**, **zustand** | RHF for the form; a small zustand store for the 7×N meal grid (the one gnarly piece of state). |
| Database | **Supabase** (Postgres, free tier) | Data + Auth + Storage in one. |
| Auth | **Supabase Auth** (single admin) | No public signup; created manually in dashboard. |
| Storage | **Supabase Storage** | Brand logos (`brand-assets`); optional cached PDFs (`plan-pdfs`). |
| **PDF generation** | **headless Chrome** (`puppeteer-core` + `@sparticuz/chromium`; `puppeteer` in dev) | One React `<PlanView>` HTML/CSS template → live scaled preview **and**, via `renderToStaticMarkup` → headless Chrome → a content-sized PDF, the download. Pixel-identical to the locked design (gradients, radial wash, real recipe thumbnails). Replaced `@react-pdf/renderer` in Batch 9 (its engine couldn't paint the design). |
| Toasts | **sonner** | Save/download feedback. |
| Hosting | **Vercel** (hobby) | Zero-config Next.js. |

**Free tier. No AI.** The PDF render fetches YouTube recipe thumbnails at render time (the one runtime web call); fonts are inlined base64 so typography is offline-safe. Knowledge base is local data.

---

## Design System

The app shell (admin chrome) uses a fixed neutral palette. The **builder canvas and the PDF** are themed per selected brand — six tokens, stored in `brands.theme` (JSONB), applied as CSS variables in the UI and passed as props into the react-pdf template. **One source, two consumers.**

### Brand theme tokens (provisional seeds — coach confirms; sample exact hex from each logo)

```css
/* SheCares — rose / hopeful */
--primary:#C25B7A; --accent:#E89AAE; --bg:#FCF3F5; --surface:#FFFFFF; --ink:#3A2230; --muted:#8A6B76;

/* Sadhana Tribe — clay / sage / earthy */
--primary:#B5683F; --accent:#8A9A5B; --bg:#F7F0E6; --surface:#FFFDF8; --ink:#3B2C1F; --muted:#7A6A57;

/* Nuvira Fertility — leaf / fresh */
--primary:#4E7C4A; --accent:#8BBF6A; --bg:#F3F7EE; --surface:#FFFFFF; --ink:#233322; --muted:#6A7A63;
```

The **token set is locked** (these six keys); the **values are editable** in Settings.

### Neutral app shell palette

```css
--app-bg:#F7F6F3; --app-surface:#FFFFFF; --app-ink:#1F1D1A; --app-muted:#6B6760; --app-rule:#E5E2DC;
```

### Typography

| Role | Font | Source |
|---|---|---|
| App UI | **Inter** (or DM Sans) | `next/font/google` |
| PDF headings (client name, section heads) | **Lora** (serif) | registered via `Font.register` (TTF) |
| PDF body / table | **Inter** / **DM Sans** | registered via `Font.register` (TTF) |

PDF fonts **must** be Unicode-safe — register TTFs that cover `₹`, curly quotes `’ “ ”`, `°`, `½ ¼`, en/em dashes. Do not rely on react-pdf's built-in Helvetica.

### PDF layout notes (the deliverable)

- **A4 portrait.** Brand `primary` on the title rule + section headers; `accent` on chips/dividers; `bg`/`surface` for zebra rows.
- **Header:** brand logo (optional) + `Diet Plan` title + brand email. Client details line below.
- **Watermark:** faint diagonal repeating `watermark_text` (brand), low opacity, `fixed` so it repeats on every page.
- **Meal table:** label column + 7 fixed weekday columns. Repeating header row (`fixed`); each row `wrap={false}` so cells never split mid-page. Multiple items per cell render as a tight stacked list.
- **IMPORTANT / Please take care:** bulleted lists, only the selected notes.
- **Recipes:** auto-derived numbered list with clickable links.

---

## Structure

```
/login                 → Supabase auth (single admin; no public signup)
/                      → redirect to /plans
/plans                 → history: search, filter by brand/client; edit · duplicate · download · delete
/plans/new             → builder
/plans/[id]            → builder (hydrated from saved snapshot)
/settings              → bank management (tabbed): Brands · Slots · Food items · Recipes · Notes
/api/plans/[id]/pdf    → server PDF render for final download
```

---

## Features / Build Notes

### Plan builder (`/plans/new`, `/plans/[id]`) — the core

Two-pane on desktop (form left, live PDF preview right); on mobile, form + a "Preview" tab.

- **Brand selector** (top): dropdown of active brands. Selecting one re-themes the builder UI (CSS vars) and the preview instantly, and sets the email/watermark/logo for the PDF.
- **Client details:** `name` (required), `age`, `weight`, `height`, optional `extra`. Name field autocompletes from past plans' `client_name` (no clients table). One-off typed names allowed.
- **Meal grid:**
  - Rows = meal slots (default set pre-loaded from `is_default` slots). **Add / edit / remove / reorder rows**; edit the row label and time inline.
  - **"Same all week" toggle per row** — collapses the 7 day-cells into one input (for rows like *After waking up* / *Before sleep* that repeat). Big time-saver.
  - **Cell editor** = `cmdk` combobox: searches that slot's food bank (most-used first), scoped to the slot but searchable across the whole bank; check items to include (they become chips); **add-new item inline** if not found (writes to `food_items`).
  - **Copy helpers:** "copy this day → rest of week", "copy this cell → whole row".
- **IMPORTANT notes:** checklist of `type='important'` notes (defaults pre-checked); add-new inline; each selected line is **editable inline** (e.g. tweak a number).
- **Please-take-care notes:** same pattern, `type='care'`.
- **Recipes (auto-derived, read-only preview):** distinct recipes from all included food items that carry a `recipe_id`, deduped. Shows what will appear in the PDF.
- **Save:** writes the fully-resolved `plans.body` snapshot (see Data Model). `Cmd/Ctrl+S` to save; unsaved-changes warning on navigate-away.
- **Download:** generates the PDF (server route) for the current snapshot.

### History / dashboard (`/plans`)

- Table of plans: client name · brand (pill) · date · status. Search by client; filter by brand.
- Row actions: **Edit** (hydrate snapshot) · **Duplicate** (clone snapshot into a new draft as a starting point) · **Download** · **Delete** (confirm).

### Settings — bank management (`/settings`)

Tabbed CRUD so the coach can review the extracted knowledge base and maintain it:

- **Brands:** name, email, watermark text, logo upload (→ `brand-assets`), 6 theme color pickers, active toggle, sort order.
- **Slots:** label, default time, kind, default-on toggle, order.
- **Food items:** name, suggested slot, linked recipe, active.
- **Recipes:** title, URL.
- **Notes:** type (important/care), text, default-on toggle, order.

---

## Data Model

Six tables. **Banks are normalized and editable; a saved plan freezes its fully-resolved content into `plans.body` (JSONB)** — editing a food item, note, or brand color later never mutates a past plan. Banks are *templates/suggestions*; the snapshot is the source of truth for rendering and is freely editable inline. **No `clients` table** (client data lives on the plan; name autocomplete derives from past `client_name`).

```sql
-- updated_at trigger (apply to every table)
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

-- ========== BRANDS ==========
create table brands (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,                 -- 'shecares' | 'sadhana_tribe' | 'nuvira'
  name text not null,
  email text not null,                      -- printed in PDF header
  watermark_text text not null,             -- diagonal page watermark
  logo_url text,                            -- brand-assets bucket
  theme jsonb not null default '{}'::jsonb, -- { primary, accent, bg, surface, ink, muted }
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== MEAL SLOTS (table rows) ==========
create table meal_slots (
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
create table recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== FOOD ITEMS (per-slot bank) ==========
create table food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,                       -- cell text; may be a composed description
  slot_id uuid references meal_slots(id) on delete set null,  -- suggested-for slot
  recipe_id uuid references recipes(id) on delete set null,   -- optional linked recipe
  usage_count int not null default 0,       -- powers "most used first"
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on food_items (slot_id);
create index on food_items (recipe_id);

-- ========== NOTES (Important + Please-take-care banks) ==========
create table notes (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('important','care')),
  text text not null,
  sort_order int not null default 0,
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on notes (type);

-- ========== PLANS (history; body = frozen snapshot) ==========
create table plans (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,  -- filter/relabel only
  client_name text not null,                -- denormalized for list/search
  title text,                               -- defaults to name + date
  status text not null default 'final',     -- 'draft' | 'final'
  body jsonb not null,                      -- complete render document (shape below)
  pdf_url text,                             -- optional cached export
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on plans (brand_id);
create index on plans (client_name);
create index on plans (created_at desc);

-- triggers
create trigger t_brands  before update on brands     for each row execute function set_updated_at();
create trigger t_slots   before update on meal_slots for each row execute function set_updated_at();
create trigger t_recipes before update on recipes    for each row execute function set_updated_at();
create trigger t_food    before update on food_items for each row execute function set_updated_at();
create trigger t_notes   before update on notes      for each row execute function set_updated_at();
create trigger t_plans   before update on plans      for each row execute function set_updated_at();
```

**Access rules / RLS:** Private app, fully behind auth, no public surface.

```sql
-- repeat for brands, meal_slots, recipes, food_items, notes, plans
alter table <t> enable row level security;
create policy auth_all on <t> for all to authenticated using (true) with check (true);
```

Storage buckets `brand-assets` and `plan-pdfs` are private; authenticated read/write only.

### `plans.body` shape (the render document)

The only thing the PDF reads; what the builder hydrates from on edit. Recipes are **derived** — each cell item carries its recipe inline, so the recipes list rebuilds from the snapshot alone.

```ts
type CellItem   = { text: string; recipe?: { title: string; url: string } };
type BrandTheme = { primary: string; accent: string; bg: string; surface: string; ink: string; muted: string };

type PlanBody = {
  client: { name: string; age?: string; weight?: string; height?: string; extra?: string };
  brand:  { key: string; name: string; email: string; watermarkText: string; logoUrl?: string; theme: BrandTheme };
  schedule: {
    days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    rows: Array<{
      slotId: string | null;     // bank ref for convenience; text is frozen
      label: string;             // 'Breakfast'
      time?: string;             // '9:00 am' — per-plan override
      uniform: boolean;          // "same all week" toggle
      uniformCell?: CellItem[];  // used when uniform = true
      cells?: { Mon: CellItem[]; Tue: CellItem[]; Wed: CellItem[]; Thu: CellItem[]; Fri: CellItem[]; Sat: CellItem[]; Sun: CellItem[] };
    }>;
  };
  importantNotes: string[];      // frozen, inline-edited text
  careNotes: string[];
  recipes: Array<{ title: string; url: string }>;  // derived + deduped from cells
};
```

---

## Auth / Admin / Permissions

- Single admin user — created manually in the Supabase dashboard (no public signup route).
- `/login` → email/password via `@supabase/ssr`.
- `middleware.ts` protects everything except `/login` → redirect unauthenticated to `/login`; redirect signed-in away from `/login`.
- Logout in the app nav.

---

## File Structure

```
diet-plan-studio/
├── plans/                         # ← INPUT: the ~20 source diet-plan PDFs (knowledge base)
├── app/
│   ├── layout.tsx                 # fonts, providers, toaster
│   ├── login/page.tsx
│   ├── plans/
│   │   ├── page.tsx               # history/dashboard
│   │   ├── new/page.tsx           # builder
│   │   └── [id]/page.tsx          # builder (edit)
│   ├── settings/page.tsx          # tabbed bank CRUD
│   └── api/plans/[id]/pdf/route.ts# server PDF render
├── components/
│   ├── builder/
│   │   ├── BrandSelector.tsx
│   │   ├── ClientForm.tsx
│   │   ├── MealGrid.tsx           # rows, uniform toggle, copy helpers
│   │   ├── CellEditor.tsx         # cmdk combobox + add-new
│   │   ├── NotesPicker.tsx        # important + care
│   │   └── RecipesPreview.tsx
│   ├── pdf/
│   │   ├── PlanDocument.tsx       # react-pdf <Document> (themed by brand)
│   │   ├── MealTable.tsx
│   │   └── Watermark.tsx
│   ├── settings/                  # Brands/Slots/Food/Recipes/Notes editors
│   └── ui/                        # shadcn components
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   ├── db.ts                      # typed fetchers
│   ├── theme.ts                   # brand theme → CSS vars
│   ├── snapshot.ts                # build/parse PlanBody; derive recipes
│   └── types.ts                   # PlanBody, BrandTheme, row types
├── scripts/
│   ├── parse-plans.ts             # reads plans/*.pdf → normalized seed
│   └── seed.ts                    # idempotent upsert into Supabase
├── supabase/schema.sql
├── middleware.ts
├── public/
├── .env.local                     # never commit
└── package.json
```

---

## Animations & Interactions

- Minimal — this is a tool, not a marketing site. Brand theme transitions (color vars) on brand switch; chip add/remove; debounced live-preview update (~300ms). No heavy animation libraries.

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.5",
    "@react-pdf/renderer": "^3",
    "react-hook-form": "^7",
    "zod": "^3",
    "zustand": "^4",
    "cmdk": "^1",
    "sonner": "^1",
    "date-fns": "^3"
  },
  "devDependencies": {
    "pdf-parse": "^1",
    "tsx": "^4"
  }
}
```

---

## Environment Variables

```env
# .env.local — never commit
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server PDF route + seeding
```

Add all three to **Vercel → Settings → Environment Variables** (Production + Preview + Development) before deploying.

---

## Build Plan (Batches — implement one at a time)

> After each batch: build → commit → push → append a Session Log entry. Do not start the next batch until the current one is green and committed.

- **Batch 0 — Repo & scaffold.** `git init` + git config (Pratyush / pratyush.aswal@gmail.com). Next.js + TS + Tailwind + shadcn init. Supabase clients, base layout, fonts, auth middleware shell, `.env.local`. Push to the GitHub remote.
- **Batch 1 — Schema & knowledge-base extraction.** `supabase/schema.sql`. `scripts/parse-plans.ts` reads **every PDF in `plans/`** → normalized, deduped seed per the Knowledge Base rules. `scripts/seed.ts` upserts brands/slots/food_items/recipes/notes into Supabase. Verify counts look sane.
- **Batch 2 — Settings / bank CRUD.** Tabbed editors so the coach can review + clean the seeded data (brands incl. theme + logo upload; slots; food items + recipe link; recipes; notes).
- **Batch 3 — Plan builder core.** Brand selector + theming, client form, meal grid (rows, uniform toggle, cell combobox, copy helpers), notes pickers, recipes auto-derive, save → `plans.body` snapshot.
- **Batch 4 — PDF generation.** `PlanDocument` (header/email, watermark, meal table, notes, recipes), registered fonts, brand theming, live `<PDFViewer>` preview, server download route.
- **Batch 5 — History / dashboard.** Plans list, search/filter, edit (hydrate), duplicate, download, delete.
- **Batch 6 — Polish & deploy.** Mobile responsiveness, empty states, Cmd+S / unsaved-changes guard, toasts, Vercel deploy + smoke test.

---

## Your Setup Steps (manual — do these on your end)

These are the things Claude Code can't do for you. Do **1–4 before Batch 1**; the rest as noted.

1. **Drop the diet-plan PDFs into `plans/`.** All ~20, at the repo root. This is the knowledge-base source — extraction reads from here.
2. **Create a Supabase project.** Copy the Project URL, the anon (publishable) key, and the service-role (secret) key into `.env.local`.
3. **Run the schema.** Supabase → SQL Editor → paste `supabase/schema.sql` → run. Then add the RLS policies (per-table block in Data Model).
4. **Create Storage buckets.** Supabase → Storage → create `brand-assets` and `plan-pdfs` (private).
5. **Create the admin user.** Supabase → Authentication → Users → Add user (your login email + password). No public signup exists.
6. **Confirm brand details** (in Settings after Batch 2, or tell Claude Code now): canonical **email per brand**, **watermark text** per brand, and upload each **logo**. Adjust the six theme colors if the seeded values aren't exact.
7. **Create the GitHub repo** and add it as the remote (`git remote add origin …`) so Batch 0 can push.
8. **Deploy (Batch 6).** Import the GitHub repo into Vercel → add the three env vars to all scopes → deploy. Then log in on production and make one test plan end-to-end.

---

## Session Log

<!-- Append one entry per work session. Format:
### Session N — YYYY-MM-DD — <short scope>
Scope: ...
Added / Changed: ...
Verified: ...
Out of scope (next): ...
Migrations / config applied: ... -->

### Batch 0 — Repo & scaffold (2026-06-12) · commit `a2da71e`
- **Scope:** Repo setup + Next.js scaffold.
- **Changes:** `git init` (local identity Pratyush / pratyush.aswal@gmail.com), remote added. Next.js 14.2.35 (App Router) + TS + Tailwind + shadcn primitives (button/input/label, `cn`, `components.json`). Supabase clients — `lib/supabase/{client,server,middleware}.ts` (browser/server-anon + service-role) — and `middleware.ts` gating all routes except `/login`. Brand theme tokens in `globals.css` + `lib/theme.ts` (seed themes), `PlanBody`/DB row types in `lib/types.ts`. Inter+Lora fonts in `layout.tsx`, sonner toaster. Functional `/login`, app nav with sign-out, placeholder `/plans` + `/settings`. `.env.example`; `.env.local` gitignored.
- **Verified:** `npm run build` green (8 routes, middleware compiled). `.env.local` confirmed untracked.
- **Note:** Pinned Next to 14.2.35 (patched) over scaffolded 14.2.21. Remaining npm-audit vulns are dev-only (`pdf-parse` transitive deps).

### Batch 1 — Schema & knowledge-base extraction (2026-06-12) · commit `2b94117`
- **Scope:** DB schema + extract every PDF in `plans/` → normalized seed + idempotent Supabase seeder.
- **Changes:** `supabase/schema.sql` (6 tables, `set_updated_at` triggers, RLS `authenticated`-all, storage-object policy for `brand-assets`/`plan-pdfs`). `scripts/parse-plans.ts` — positioned-text parser via pdf.js (bundled in `pdf-parse`): groups text items into visual lines (gap-aware spacing), splits label vs 7 weekday columns by x-anchor, finds each row's content-top by **multi-column line alignment** (labels are vertically centered, so a fixed offset fails), strips `[see the recipe below]` markers and links items→recipes by token overlap, dedupes/normalizes into slots/food_items/recipes/notes with usage counts and `is_default` (majority of plans). `scripts/seed.ts` — idempotent upsert of `scripts/.out/seed.json` keyed by natural keys + private bucket creation; brand themes seeded from the CLAUDE.md provisional palette.
- **Verified:** all 21 plans parse → **9 canonical slots** (After waking up · Breakfast · At 12 pm · Mid morning · Lunch · Evening · Dinner · Before sleep · 20-min walk), 198 food items (30 recipe-linked), 28 recipes, 43 notes (3 important / 40 care). 7 warnings, all benign (multi-line recipe prose without a URL — correctly skipped). `npm run build` green; `tsc --noEmit` clean. Seeder connects + creates both buckets; **blocked on schema** (see note).
- **Note:** Seeder cannot insert until the coach runs `supabase/schema.sql` in the SQL Editor (tables don't exist yet) — buckets already auto-created. Brand emails: `shecareshelp@gmail.com`, `sadhanatribe.coaching@gmail.com` (canonical of two variants seen); **Nuvira email is a placeholder** (no Nuvira plans had an email) — confirm in Settings. 5 plans had no header email (brand left unset, fine).
- **Post-batch:** Coach ran `schema.sql`; seeder loaded **281 rows** (3 brands, 9 slots, 28 recipes, 198 food items, 43 notes). Confirmed emails: Nuvira = `nuvirafertility@gmail.com`, Sadhana Tribe = `sadhanatribe.coaching@gmail.com`.

### Batch 2 — Settings / bank CRUD (2026-06-12) · commit `b10a2e3`
- **Scope:** Tabbed settings editors so the coach can review + clean the seeded knowledge base.
- **Changes:** `app/settings/actions.ts` — `saveRow`/`deleteRow` server actions with per-table zod validation (brands/meal_slots/recipes/food_items/notes) and `uploadBrandLogo` to the private `brand-assets` bucket; RLS-respecting anon+session client for data, service client only for storage + signed URLs. `app/settings/page.tsx` — `force-dynamic` server fetch of all five banks + signed logo URLs → `SettingsTabs`. `components/settings/`: `BankEditor` (generic field-driven inline-edit table — add-new row, per-row dirty-tracked save, delete-with-confirm, client search for food/recipes/notes), `BrandsEditor` (six theme color pickers + logo upload + signed preview), `SettingsTabs` (field configs per tab). New UI primitives: `tabs`, `textarea`, `select` (styled native).
- **Verified:** `tsc --noEmit` clean; `npm run build` green (`/settings` dynamic, 15.1 kB). Dev server boots; `/settings` auth-gated (307→/login). Live DB queries return all 281 rows with `theme` JSONB round-tripping (`#C25B7A` etc.).
- **Note:** Brand `key` is editable in the UI but is the upsert conflict target in the seeder — renaming a key then re-seeding would create a duplicate brand rather than update. Fine for normal use; flag if the coach renames keys. Logo previews use 1-hour signed URLs (private bucket).

### Batch 3 — Plan builder core (2026-06-13) · commit `a9e4763`
- **Scope:** Two-pane builder at `/plans/new` + `/plans/[id]` — brand theming, client form, meal grid, notes, recipe auto-derive, save snapshot.
- **Changes:** `lib/db.ts` (typed bank fetchers + `getBuilderData` + `getClientNames`); `lib/snapshot.ts` (`emptyPlanBody`/`deriveRecipes`/`brandRowToSnapshotBrand`/`buildPlanBody` — recipes always re-derived from the grid); `lib/store/builder.ts` (zustand: brand/client/rows/notes/dirty + row/cell/uniform-toggle/copy(cell→row, day→week)/note actions). `app/plans/actions.ts` (`savePlan` with zod + brand_id resolution + title default; `addFoodItem` inline cell add). `components/builder/`: `Builder` (theming wrapper via `themeToCssVars`, sticky action bar, single-instance form/preview layout + mobile toggle, Cmd+S, download), `BrandSelector`, `ClientForm` (datalist name autocomplete), `MealGrid` (inline label/time, uniform toggle, reorder, copy helpers), `CellEditor` (cmdk popover + add-new), `NotesPicker` (important/care editable + add-from-bank), `RecipesPreview`. New UI primitives `popover` (radix) + `command` (cmdk). New dep `@radix-ui/react-popover`. `/plans` got a **New plan** button. `PdfPreview` is a placeholder until Batch 4.
- **Verified:** `tsc` + `npm run build` green. **In-browser smoke (test login, Claude Preview MCP):** brand switch re-themes CSS vars instantly (SheCares `#C25B7A` → Nuvira `#4E7C4A`); cmdk cell editor lists all 198 items, search narrows to "Avocado toast", selecting it (recipe-linked) auto-derives the recipe into the preview; **Save** creates the plan + rewrites the URL to `/plans/[id]`; reload **hydrates** name/brand/cell chip/recipe identically. No console errors. Smoke-test plan deleted afterward.
- **Note:** Found + fixed a duplicate-element-id bug (form was rendered twice — desktop pane + mobile tabs); now rendered once with CSS/`mobileTab` toggle. Default non-meal rows (water, walk) seed `uniform=true`. Download button wired but the PDF route + live preview arrive in Batch 4.

### Batch 4 — PDF generation + loading skeletons (2026-06-13) · commit `b57f47e`
- **Scope:** One `@react-pdf/renderer` tree → live `<PDFViewer>` preview + server download route. Plus folded-in loading skeletons.
- **Changes:** `components/pdf/`: `PlanDocument` (header/email, client line, meal table, Important/care notes, numbered recipes with clickable `<Link>`s — themed entirely from `body.brand.theme`), `MealTable` (`fixed` repeating header, `wrap={false}` rows, zebra, uniform-row spans 7 cols), `Watermark` (`fixed` diagonal tiled, 0.05 opacity), `fonts.ts` (`registerPdfFonts` — env-aware `src`: same-origin `/fonts/*.ttf` in browser, `process.cwd()/public/fonts` on server). `public/fonts/`: bundled Inter 400/500/700 + Lora 400/600 static TTFs (no runtime web calls). `components/builder/PdfPreview.tsx`: `dynamic(ssr:false)` `<PDFViewer>`, 300 ms debounce from the store (replaces the B3 placeholder). `app/api/plans/[id]/pdf/route.tsx`: `GET` → `renderToBuffer` → `application/pdf` attachment (RLS-gated, `runtime="nodejs"`). Skeletons: `ui/skeleton` + `loading.tsx` for `/settings`, `/plans`, and the builder (shared `BuilderSkeleton`).
- **Verified:** `tsc` + `npm run build` green. **In-browser (test login, Claude Preview MCP):** server route returns a valid **21.8 KB** PDF (`%PDF-` magic, `application/pdf`, filename `PDF Smoke - 13 Jun 2026.pdf`); client `<PDFViewer>` iframe mounts with no console errors. Test plans deleted.
- **Note:** **Key fix** — `@react-pdf/renderer` moved from `transpilePackages` to `experimental.serverComponentsExternalPackages` in `next.config.mjs`; transpiling pulled react-pdf's reconciler into the RSC React subset → `TypeError: ba.Component is not a constructor` on the server route. As external package it `require`s the real Node React. Client preview still imports it dynamically. Headless Chromium can't paint the native PDF plugin (preview shows black in screenshots) — verified via the server route bytes + no-error iframe mount instead. The fonts cover `₹`/curly-quotes/dashes (Inter). The two dev-cache wipes (`rm -rf .next`) were needed after the dependency churn.
- **Follow-up fix · commit `b185cbb`:** the `next/dynamic` `<PDFViewer>` boundary threw `Element type is invalid` during SSR and recovered on the client (dev-overlay flash). Fixed in `PdfPreview.tsx` — return the canonical `{ default }` shape from the dynamic import **and** gate the viewer behind a client-mount check so the react-pdf lazy boundary never enters the SSR tree. (User confirmed the live preview + output PDF render correctly on their machine — themed header, diagonal watermark, 7-day table, notes, recipe links.) Reminder logged: the `Cannot read properties of undefined (reading 'call')` the user saw was a stale `.next` cache from a dev server left running across the dep/config changes — cure is stop dev → `rm -rf .next` → `npm run dev`.

### Batch 5 — History dashboard (2026-06-13) · commit `061d91e`
- **Scope:** Searchable plans history with edit / duplicate / download / delete.
- **Changes:** `lib/db.ts` `getPlansList` (lean row + `brand:brands(...)` join, newest first; collapses Supabase's array-typed embed to one object) + `PlanListItem` type. `app/plans/actions.ts`: `deletePlan(id)` and `duplicatePlan(id)` (clones the frozen `body` into a new `draft`, returns new id). `components/plans/PlansDashboard.tsx`: client-side search by client name + brand filter, table with themed brand pill, Final/Draft status badge, row actions (Edit link, Duplicate→open, Download → `/api/plans/[id]/pdf`, Delete with `confirm`), empty + no-match states. `app/plans/page.tsx`: `force-dynamic` fetch → `PlansDashboard` (replaced the placeholder + New plan button kept).
- **Verified:** `tsc` + clean `npm run build` green (`/plans` dynamic, 9.7 kB). **In-browser (test login, Claude Preview MCP):** seeded 3 plans across all brands → table shows pills + statuses; brand filter → 1 brand; search "rahul" → 1 row; **Duplicate** clones + navigates to the copy; **Delete** confirms + removes (toast, 4→3). Test plans deleted after.
- **Note:** Brand pill tints from `brand.theme.primary` (`${color}1a` bg). `confirm()` blocks the headless preview — overrode `window.confirm` to test delete. Did the production build with the dev server stopped (it shares `.next`) and restarted dev after, to avoid re-triggering the stale-cache error.

### Batch 6 — Installable PWA + native-feeling mobile app (2026-06-13) · commits `b972f51`·`96b54f2`·`f288eb0`·`56939e7`
- **Scope:** Turn the responsive site into an installable PWA that feels like a real mobile app: app icon + manifest + service worker, bottom-tab shell, a day-by-day mobile meal editor, mobile polish, install affordance, unsaved-changes guard. Desktop left untouched (everything branches at `lg`).
- **6.1 PWA foundation (`b972f51`):** `assets/icon.svg` (sage leaf mark) + `scripts/gen-icons.mjs` (sharp, devDep) → `public/icons/{192,512,maskable-512}.png` + `app/icon.png` + `app/apple-icon.png`. `app/manifest.ts` → `/manifest.webmanifest` (standalone/portrait/maskable). `viewport` (viewportFit cover, themeColor `#F7F6F3`) + `appleWebApp` meta in layout. **Hand-rolled `public/sw.js`** (network-first navigations → `/~offline`, stale-while-revalidate static, never caches `/api` or cross-origin Supabase) registered prod-only via `ServiceWorkerRegister`. **Chose hand-rolled over `@serwist/next`** to avoid build-integration risk on the Vercel deploy — same UX, no `next.config` coupling. `app/~offline/page.tsx`. Middleware excludes `sw.js`/`manifest.webmanifest` and makes `/~offline` public. App-feel CSS (no tap-highlight, no overscroll bounce) + safe-area utilities.
- **6.2 App shell (`96b54f2`):** `components/nav/`: `MobileTabBar` (fixed bottom Plans/New/Settings, active via `usePathname`, safe-area), `MobileAppBar` (slim top: title + sign-out), `AppShell` (desktop `AppNav` + mobile bars). `AppNav` → `hidden lg:block`. `/plans` + `/settings` use `AppShell`. Builder stays full-screen (no tabs) + gains a mobile back chevron.
- **6.3 Day-by-day meal editor (`f288eb0`):** `components/builder/MealGridMobile` — Mon–Sun letter switcher, "Every day" section for `uniform` rows, per-day cards for the selected day, all controls always-visible tap targets (no hover), copy day→week / cell→week. `MealGrid` renders the desktop 7-col grid `hidden lg:block` + `MealGridMobile` below `lg` (shares the `useBuilder` store — no new state). `CellEditor` chip-remove always visible on mobile; `ui/command` search 16px on mobile.
- **6.4 Mobile polish (`56939e7`):** `ui/input`+`select`+`textarea` → 16px on mobile (`lg:text-sm`) to kill iOS focus-zoom everywhere. `PlansDashboard` → desktop table `hidden lg:block` + mobile card list (shared `usePlanActions`/`ActionButtons`/`StatusBadge`). `SettingsTabs` tab strip horizontally scrollable on mobile.
- **6.5 Install + guard (`56939e7`):** `components/pwa/useInstallPrompt` + `InstallButton` (Install on Chromium/Android; iOS Add-to-Home-Screen instructions; hidden when standalone) in Settings. Builder `beforeunload` when `dirty` + mobile back-chevron confirm.
- **Verified:** `tsc` + clean `npm run build` green throughout. **Mobile 375px (test login, Claude Preview MCP):** bottom-tab shell with desktop nav hidden; builder day view with **no 860px horizontal scroll**, picker opens (198 items, 16px input, always-visible chip remove); dashboard mobile cards; settings tabs scroll + fields stack. **Production server (`npm start`):** `/manifest.webmanifest` (200, `application/manifest+json`), `/sw.js` (200), `/~offline` (200) all served un-gated; **service worker registers** (scope `/`) and **precaches the offline shell** (`/~offline` + icons, `offlineCached: true`); `theme-color` + apple meta + manifest/icon links all present. **Desktop unchanged** at `lg+` (top nav block, 7-col grid visible, two-pane preview iframe).
- **Note:** Install prompt + `beforeunload` aren't exercisable headless (no real install banner; `InstallButton` renders null when not installable) — verified by code + the prod SW/manifest checks. Added a `prod` entry to `.claude/launch.json` for `next start` PWA testing. **Batch 6.6 deploy is coach-driven** (see below) — not yet done.
- **Fix:** `useInstallPrompt`/`InstallButton` were created in 6.5 but not staged (`git commit -a` skips untracked) — added in commit `6d3fa31`.

### Batch 7 — SaaS-grade UI overhaul (2026-06-13) · commits `be088ce`·`ee0a319`·`f7c6410`·`7b0e6f2`·`0aabfbc`(+7.6)
- **Scope:** Design-led polish to premium SaaS quality (direction: *calm wellness / editorial*, light-only) + the coach's 6 fixes (no nav feedback, no active nav state, no confirm dialogs, long un-paginated lists, congested meal grid, broken mobile Food-items). Shell stays neutral; **brand `--primary/*` tokens untouched** so the builder + PDF still theme per brand.
- **7.1 Foundation (`be088ce`):** `globals.css` warmer neutrals + fixed **evergreen shell accent** (`--app-accent` + tints, from the app icon) + soft elevation vars (`--shadow-card/-hover/pop`); repointed shadcn `--primary-hsl`/`--ring` to the accent (separate from brand `--primary`); reduced-motion guard. Tailwind `app.accent` + `boxShadow` scale + `rounded-xl`. Polished Button (accent default, soft shadow, focus ring, active press), Input/Select/Textarea (accent focus ring), new `ui/card.tsx`.
- **7.2 Nav & feedback (`ee0a319`):** `AppNav` now client with **active-state pill** (`usePathname`) + leaf logo lockup; `RouteProgress` 2px accent bar (starts on internal-link click via capture listener, completes on pathname commit) — fixes "no feedback on click"; mobile tab active → accent.
- **7.3 Confirm dialogs (`f7c6410`):** `ui/dialog.tsx` (radix-dialog, no new dep) + `ui/confirm.tsx` (`ConfirmProvider`/`useConfirm` promise-based, destructive=red). Replaced **all** native `confirm()` (BankEditor, BrandsEditor, PlansDashboard, Builder discard) + **sign-out confirmation** via `SignOutButton`.
- **7.4 Lists at scale (`7b0e6f2`):** rebuilt `BankEditor` — dropped the fragile grid-template `layout` (root cause of the **mobile break**); fields carry a `w` width, rows are aligned table rows + column header on desktop, **stacked labeled cards on mobile**. Added **pagination (10/page)**, generic `filters` (Food→Slot, Notes→Type), collapsible "+ Add".
- **7.5 Meal grid (`0aabfbc`):** desktop grid → Card "table" with **sticky day-header + sticky label column**, zebra rows, roomy cells, "All week" accent pill, discoverable copy buttons (tooltips); empty cell = dashed "+ add" tile. Contained in-card horizontal scroll (no more page-level congestion).
- **7.6 Cross-screen polish:** login elevated (Card + leaf logo + warm radial wash + spinner); dashboard polished empty state (accent-soft icon badge) + table `shadow-card` + row hover; builder section cards → `rounded-xl shadow-card` for cohesion.
- **Verified:** `tsc` + clean `npm run build` green per sub-part. **Prod + Preview MCP:** evergreen accent + warm canvas; active "Plans" pill; sign-out + delete dialogs open/cancel cleanly (no native confirm); **Settings Food items** desktop = paginated table (Page 1 of 20) + working Slot filter (→ 7 of 198), **mobile = labeled cards, no break, no horizontal overflow**; meal grid roomy & sticky; polished empty state. No console/hydration errors on clean prod loads (the dev "1 error" badges were HMR artifacts from repeated layout edits). Desktop unchanged structurally; builder/PDF still brand-themed.

### Batch 8 — "Day Cards" PDF redesign (locked design) (2026-06-13)
- **Scope:** Replaced the 7-column grid-table PDF with the coach's locked **day-cards** design from the Claude Design handoff (`diet-plan-template`). One react-pdf tree drives both the live `<PDFViewer>` preview and the download; **colors derive per selected brand** from the six `theme` tokens.
- **Fonts:** bundled **Cormorant Garamond** (400/500/600/700 + italic 500/600) + **Mulish** (300–800) static TTFs into `public/fonts/` (via google-webfonts-helper); `components/pdf/fonts.ts` registers them (Inter/Lora retired from the PDF).
- **Palette:** new `lib/pdf-palette.ts` — hex `mix/lighten/darken` + `expandTheme(BrandTheme)` deriving the design's extended tokens (primaryDeep, primaryTint(2), accentSoft, blush, paper(2), inkSoft/Faint, hair) from our 6 brand tokens. One source, every PDF subcomponent.
- **Document:** rewrote `components/pdf/PlanDocument.tsx` + new `DayCards.tsx`, `RecipeCards.tsx`, `icons.tsx` (inline SVG glyphs); **deleted `MealTable.tsx`**. Header logo/tagline + contact-chip bar (web/insta/mail/phone) + serif eyebrow/H1; solid brand-color client band with stat chips; 2-up day cards (header `Monday 01…`, dashed meal rows, recipe pills, `wrap={false}` so cards don't split); "A gentle reminder" + "Please take care of" note pair; **text/offline recipe cards** (Short/Video tag derived from URL, no fetched thumbnails); themed footer; faint `<Watermark>` kept (now Mulish).
- **Gradients:** attempted react-pdf SVG `<LinearGradient>` for the client band + day headers but percentage-sized `<Svg>` doesn't paint (rendered stray green rects, white text invisible) — **switched to solid brand-color fills** (the plan's sanctioned fallback). Fixed-size icon SVGs render fine.
- **Brand contacts:** added optional `tagline`/`website`/`instagram`/`phone` across `brands` (schema + `ALTER TABLE … add column if not exists` migration), `lib/types.ts` (`Brand` + `PlanBody["brand"]`), `lib/snapshot.ts`, settings zod + `BrandsEditor` inputs, and **`app/plans/actions.ts` `bodySchema.brand`** (strict zod silently strips unknown keys → would never persist otherwise). `select("*")` flows the new columns through reads. Old plans omit empty chips gracefully.
- **Verified:** `tsc` + `npm run build` green. **PDF rendered to buffer (renderToBuffer) for all 3 brands → valid `%PDF-` (~42 KB), rasterized w/ PyMuPDF + visually inspected:** day-cards layout, solid client band + stat chips, `Monday 01…Sunday 07` headers, recipe pills, notes pair w/ spark/check icons, recipe cards (Short/Video), footer, faint watermark; `₹ ½ ¼` + curly quotes render (Cormorant/Mulish coverage). **SheCares (rose) vs Nuvira (green) confirm per-brand re-theming.** (Headless can't paint the native PDF plugin, so verified via server bytes per prior batches.)
- **⚠ Coach action:** run the `alter table brands add column …` snippet (top of `supabase/schema.sql`) in the Supabase SQL editor, then fill each brand's tagline + website/instagram/phone in **Settings → Brands** so the header/footer chips appear.

### Batch 9 — Pixel-perfect output via headless-Chrome HTML render (2026-06-14)
- **Scope:** The coach confirmed plans are **shared online as a downloadable file, never printed**, and wanted the output to match the Claude Design page *exactly*. react-pdf's engine can't paint gradients / the radial header wash / thumbnails, so **dropped react-pdf** and now render the **real HTML/CSS design** with **headless Chrome** → a content-sized PDF. Same template drives the live builder preview. Reverses two Batch-8 fallbacks (now real): **gradients + real YouTube recipe thumbnails**; **watermark removed** (design has none).
- **Template:** `components/plan-view/PlanView.tsx` (the day-cards design as a presentational, server-renderable React component; inline SVG icons; brand CSS vars on the root via `themeToPlanVars`; YouTube id/short parsed from recipe URL → `img.youtube.com` thumbnail, tinted placeholder otherwise). CSS ported from the handoff `styles.css` and kept as a **string** in `components/plan-view/plan-view-css.ts` (scoped under `.plan-view`) so it serves both the preview `<style>` and the standalone export doc — no global-CSS-import restriction, no runtime fs read.
- **Palette:** renamed `lib/pdf-palette.ts` → **`lib/brand-palette.ts`**; `expandTheme` unchanged + new `themeToPlanVars()` mapping the 6 brand tokens → the design's `--primary/-deep/-tint(-2)`, `--accent/-soft`, `--blush`, `--paper(-2)`, `--ink/-soft/-faint`, `--hair(-2)`.
- **Render pipeline:** `lib/render-pdf.ts` — `getBrowser()` (Vercel: `puppeteer-core` + `@sparticuz/chromium`; dev: the `puppeteer` devDep's bundled Chromium, else system Chrome) + `htmlToPdf()` (`setContent` → wait fonts+images capped 8 s → measure `scrollHeight` → `page.pdf({width:"980px", height:contentPx, printBackground, pageRanges:"1"})`) + `fontFaceBase64()` (inlines the 13 TTFs). Route `app/api/plans/[id]/pdf/route.tsx` rewritten: `renderToStaticMarkup(<PlanView>)` (dynamic import — Next blocks static `react-dom/server` in routes) + base64 fonts + `PLAN_VIEW_CSS` → `htmlToPdf` → `application/pdf` (same path/filename, so Builder + dashboard download links unchanged). `maxDuration = 60`.
- **Preview:** `components/builder/PlanPreview.tsx` replaces `PdfPreview` — renders `<PlanView>` scaled (`transform: scale(paneW/980)`, ResizeObserver) inside the builder pane; injects `PLAN_VIEW_CSS` via `<style>`. `Builder.tsx` swapped.
- **Config/removals:** `next.config.mjs` externalizes the three puppeteer pkgs + `outputFileTracingIncludes` `./public/fonts/**` for the route; removed `@react-pdf/renderer`; deleted `components/pdf/*`, `PdfPreview.tsx`, `lib/pdf-palette.ts`, unused `public/fonts/Inter-*`/`Lora-*` TTFs.
- **Verified:** `tsc` + `npm run build` green (builder pages dropped ~595 kB → ~164 kB First-Load JS with react-pdf gone). **Standalone headless render (full `puppeteer`) for all 3 brands → valid `%PDF-` (~469 KB, single 2615 px page), rasterized w/ PyMuPDF + visually inspected:** **exact match to the design** — radial header wash, real plum/green **gradient** client band + day-card headers (`Monday 01…Sunday 07`), contact chips, recipe pills, "gentle reminder" gradient box + check-dot care list, **recipe cards with real YouTube thumbnails**, footer; `₹ ½ ¼` + curly quotes; **SheCares (rose) vs Nuvira (green) confirm per-brand re-theming**. Live `PlanPreview` shares the same component+CSS (verified by build; left for live confirm).
- **⚠ Deploy risk (flag to coach):** `@sparticuz/chromium` must fit Vercel hobby limits (~50 MB function, ~1 GB memory, 60 s). Standard combo, generally fine, but confirm on first deploy; fall back to an external render service if it exceeds limits.

### Batch 9.1 — Brand logo wiring (2026-06-14)
- **Bug:** Coach uploaded a logo + saved → it showed in Settings (signed-URL preview) but **not** in the builder preview or the exported PDF. Cause: `BrandSelector` + the builder pages built the snapshot via `brandRowToSnapshotBrand(b)` with **no** logo URL, so `body.brand.logoUrl` was `undefined`; and `brands.logo_url` is a storage path in a **private** bucket (not a renderable URL).
- **Fix:** brand logos belong on the shared plan, so serve them from a **stable public URL**. New `lib/logo.ts` `brandLogoUrl(path)` builds the deterministic public object URL (works sync in client + server + headless Chrome, and is stable when frozen in the snapshot; passes through full URLs for back-compat). `brandRowToSnapshotBrand` now defaults `logoUrl` to `brandLogoUrl(brand.logo_url)`. `supabase/schema.sql` migration sets `brand-assets` bucket **public** (plan-pdfs stays private); authenticated-write policy unchanged. Settings preview untouched (signed URLs still work).
- **Verified:** `tsc` + build green; standalone headless render with a logo → the circular brandmark renders in the header + footer per the design; `brandLogoUrl` URL shapes confirmed.
- **⚠ Coach action:** run `update storage.buckets set public = true where id = 'brand-assets';` in the Supabase SQL editor (or toggle the bucket to Public in Dashboard → Storage). Then the already-uploaded logo appears in new plans; older saved plans pick it up on re-save / brand re-select.

---

## Backlog

Legend: **🔥** high-impact / do-soon · **📦** quality-of-life · **🌱** nice-to-have

### Features
- 📦 Named **presets / templates** (PCOS, fertility, weight-loss) that pre-fill the grid + notes — beyond plain "duplicate past plan".
- 📦 **Condition tag** on plans for filtering history.
- 🌱 Lightweight **clients** table if re-planning for the same person becomes common (currently one-off names).
- 🌱 Bulk "regenerate PDF" after a brand re-theme.

### UI / UX
- 📦 Reorder rows via drag handles (not just up/down).
- 📦 "Most-used food items" quick chips per slot.
- 🌱 Keyboard nav across grid cells.

### PDF
- 📦 Optional **A4 landscape** variant for very dense weeks (compare legibility with the coach).
- 🌱 Per-brand cover/footer flourish.

### Reliability / Dev experience
- 📦 Cache rendered PDFs to `plan-pdfs` + invalidate on edit.
- 🌱 One smoke test per route (Playwright).
- 🌱 Re-run-safe extraction script with a diff report (what changed vs. current bank).

### Security
- 📦 Sanitize any rich text before it reaches the PDF (belt-and-suspenders).
- 🌱 2FA on the Supabase admin login.
