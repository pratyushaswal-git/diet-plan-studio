import type { CSSProperties } from "react";

import type { BrandTheme } from "@/lib/types";

// ============================================================================
// Brand theme (6 locked tokens) → the locked "Day Cards" design's extended
// palette + the CSS custom properties it expects. One source (brands.theme),
// two consumers: the live <PlanView> preview and the headless-Chrome PDF export.
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

export type Palette = {
  primary: string;
  primaryDeep: string;
  primaryTint: string;
  primaryTint2: string;
  accent: string;
  accentSoft: string;
  blush: string;
  paper: string;
  paper2: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  hair: string;
  hair2: string;
};

export function expandTheme(theme: BrandTheme): Palette {
  const { primary, accent, bg, ink, muted } = theme;
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
    ink,
    inkSoft: muted,
    inkFaint: mix(muted, WHITE, 0.35),
    hair: mix(bg, ink, 0.1),
    hair2: mix(bg, ink, 0.05),
  };
}

// The design's CSS custom properties, as an inline style object for the
// <PlanView> root. Fixed tokens (fonts/radius/shadow) live in plan-view.css.
export function themeToPlanVars(theme: BrandTheme): CSSProperties {
  const p = expandTheme(theme);
  return {
    "--primary": p.primary,
    "--primary-deep": p.primaryDeep,
    "--primary-tint": p.primaryTint,
    "--primary-tint-2": p.primaryTint2,
    "--accent": p.accent,
    "--accent-soft": p.accentSoft,
    "--blush": p.blush,
    "--paper": p.paper,
    "--paper-2": p.paper2,
    "--ink": p.ink,
    "--ink-soft": p.inkSoft,
    "--ink-faint": p.inkFaint,
    "--hair": p.hair,
    "--hair-2": p.hair2,
  } as CSSProperties;
}
