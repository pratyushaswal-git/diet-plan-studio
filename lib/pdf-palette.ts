import type { BrandTheme } from "@/lib/types";

// ============================================================================
// Brand theme (6 locked tokens) → the design's extended palette.
// The locked "Day Cards" design (Claude Design handoff) uses a richer token set
// — primary-deep, primary-tint, paper, hair, etc. We derive all of it from each
// brand's six tokens so SheCares / Sadhana Tribe / Nuvira each render in their
// own colours. One source (brands.theme), one expander, every PDF subcomponent.
// ============================================================================

const WHITE = "#FFFFFF";
const BLACK = "#000000";

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

function parseHex(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
}

// Linear blend: t=0 → a, t=1 → b.
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

export const lighten = (hex: string, t: number) => mix(hex, WHITE, t);
export const darken = (hex: string, t: number) => mix(hex, BLACK, t);

export type PdfPalette = {
  primary: string;
  primaryDeep: string;
  primaryTint: string;
  primaryTint2: string;
  accent: string;
  accentSoft: string;
  blush: string;
  paper: string; // page background (warm cream)
  paper2: string; // tinted panels / day-card header fallback
  surface: string; // white cards
  ink: string;
  inkSoft: string;
  inkFaint: string;
  hair: string; // hairlines / dashed separators
};

export function expandTheme(theme: BrandTheme): PdfPalette {
  const { primary, accent, bg, surface, ink, muted } = theme;
  return {
    primary,
    primaryDeep: darken(primary, 0.28),
    primaryTint: mix(primary, WHITE, 0.92),
    primaryTint2: mix(primary, WHITE, 0.85),
    accent,
    accentSoft: mix(accent, WHITE, 0.82),
    blush: mix(primary, WHITE, 0.9),
    paper: bg,
    paper2: mix(bg, primary, 0.06),
    surface,
    ink,
    inkSoft: muted,
    inkFaint: mix(muted, WHITE, 0.35),
    hair: mix(bg, ink, 0.1),
  };
}
