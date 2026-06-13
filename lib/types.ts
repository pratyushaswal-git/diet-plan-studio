// ===== Brand theme: the six locked tokens (values editable in Settings) =====
export type BrandTheme = {
  primary: string;
  accent: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
};

export const BRAND_THEME_KEYS: (keyof BrandTheme)[] = [
  "primary",
  "accent",
  "bg",
  "surface",
  "ink",
  "muted",
];

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

// ===== plans.body — the render document (the only thing the PDF reads) =====
export type CellItem = {
  text: string;
  recipe?: { title: string; url: string };
};

export type DayCells = Record<Weekday, CellItem[]>;

export type ScheduleRow = {
  slotId: string | null; // bank ref for convenience; text is frozen
  label: string; // 'Breakfast'
  time?: string; // '9:00 am' — per-plan override
  uniform: boolean; // "same all week" toggle
  uniformCell?: CellItem[]; // used when uniform = true
  cells?: DayCells; // used when uniform = false
};

export type PlanBody = {
  client: {
    name: string;
    age?: string;
    weight?: string;
    height?: string;
    extra?: string;
  };
  brand: {
    key: string;
    name: string;
    email: string;
    watermarkText: string;
    logoUrl?: string;
    tagline?: string;
    website?: string;
    instagram?: string;
    phone?: string;
    theme: BrandTheme;
  };
  schedule: {
    days: typeof WEEKDAYS;
    rows: ScheduleRow[];
  };
  importantNotes: string[]; // frozen, inline-edited text
  careNotes: string[];
  recipes: Array<{ title: string; url: string }>; // derived + deduped from cells
};

// ===== DB row types =====
export type SlotKind = "meal" | "hydration" | "activity" | "other";
export type NoteType = "important" | "care";
export type PlanStatus = "draft" | "final";

export type Brand = {
  id: string;
  key: string;
  name: string;
  email: string;
  watermark_text: string;
  logo_url: string | null;
  tagline: string | null;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  theme: BrandTheme;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type MealSlot = {
  id: string;
  label: string;
  default_time: string | null;
  kind: SlotKind;
  sort_order: number;
  is_default: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Recipe = {
  id: string;
  title: string;
  url: string;
  created_at: string;
  updated_at: string;
};

export type FoodItem = {
  id: string;
  name: string;
  slot_id: string | null;
  recipe_id: string | null;
  usage_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  type: NoteType;
  text: string;
  sort_order: number;
  is_default: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Plan = {
  id: string;
  brand_id: string | null;
  client_name: string;
  title: string | null;
  status: PlanStatus;
  body: PlanBody;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
};
