import type { BrandTheme } from "./types";
import { BRAND_THEME_KEYS } from "./types";

// Provisional seed themes — coach confirms exact hex in Settings.
export const SEED_THEMES: Record<string, BrandTheme> = {
  shecares: {
    primary: "#C25B7A",
    accent: "#E89AAE",
    bg: "#FCF3F5",
    surface: "#FFFFFF",
    ink: "#3A2230",
    muted: "#8A6B76",
  },
  sadhana_tribe: {
    primary: "#B5683F",
    accent: "#8A9A5B",
    bg: "#F7F0E6",
    surface: "#FFFDF8",
    ink: "#3B2C1F",
    muted: "#7A6A57",
  },
  nuvira: {
    primary: "#4E7C4A",
    accent: "#8BBF6A",
    bg: "#F3F7EE",
    surface: "#FFFFFF",
    ink: "#233322",
    muted: "#6A7A63",
  },
};

/**
 * Brand theme → inline CSS custom properties, for the builder canvas / preview.
 * One source (brands.theme), two consumers (this for the UI, props for react-pdf).
 */
export function themeToCssVars(theme: BrandTheme): React.CSSProperties {
  const vars: Record<string, string> = {};
  for (const key of BRAND_THEME_KEYS) {
    vars[`--${key}`] = theme[key];
  }
  return vars as React.CSSProperties;
}
