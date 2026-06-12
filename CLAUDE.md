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
| **PDF generation** | **`@react-pdf/renderer`** | One component tree → live `<PDFViewer>` preview **and** the download. No headless browser; free; watermark + fonts first-class. |
| Toasts | **sonner** | Save/download feedback. |
| Hosting | **Vercel** (hobby) | Zero-config Next.js. |

**All free tier. No AI / no web calls at runtime — the knowledge base is local data.**

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

<!-- No build sessions yet — spec authored. First entry will be Batch 0. -->

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
