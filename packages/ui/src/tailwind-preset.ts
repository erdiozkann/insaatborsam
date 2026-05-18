// Tailwind v3-uyumlu preset. Tailwind v4 kullananlar @theme CSS bloğunu globals.css'te import etsin —
// preset yine de typegen, IDE autocompletion ve potansiyel v3 fallback için tutulur.
// Web app: tailwind.config.ts → presets: [require('@insaatborsam/ui/tailwind-preset')]
// Web app v4: app/globals.css → @theme block (cssTheme helper'ı ile generate edilir)

import { colorsLight, brandAlias, stateColors } from "./tokens/colors";
import { typeScale, fontFamily } from "./tokens/typography";
import { spacing, layout } from "./tokens/spacing";
import { radius } from "./tokens/radius";
import { shadow } from "./tokens/shadow";

// Type-only — Tailwind config tipini import etmiyoruz (peer dep şişmesin).
type PartialTailwindConfig = {
  theme: {
    extend: Record<string, unknown>;
    container?: Record<string, unknown>;
  };
  corePlugins?: Record<string, boolean>;
};

// Type scale'i Tailwind fontSize formatına çevir: ['size', { lineHeight, letterSpacing, fontWeight }]
const fontSize = Object.fromEntries(
  Object.entries(typeScale).map(([key, value]) => [
    key,
    [
      value.fontSize,
      {
        lineHeight: value.lineHeight,
        letterSpacing: "letterSpacing" in value ? value.letterSpacing : "0em",
        fontWeight: value.fontWeight,
      },
    ],
  ]),
);

export const tailwindPreset: PartialTailwindConfig = {
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: layout["margin-mobile"],
        md: layout["gutter-desktop"],
        lg: layout["margin-desktop"],
      },
      screens: {
        xl: layout["container-max"],
      },
    },
    extend: {
      colors: {
        ...colorsLight,
        ...brandAlias,
        ...stateColors,
      },
      fontFamily: {
        sans: fontFamily.sans,
        mono: fontFamily.mono,
      },
      fontSize,
      spacing,
      borderRadius: radius,
      boxShadow: shadow,
      maxWidth: {
        container: layout["container-max"],
      },
      minHeight: {
        touch: layout["touch-target-min"],
      },
    },
  },
};

// Tailwind v4 @theme block — CSS-first config için string olarak inject.
// app/globals.css içinde: import { cssTheme } from '@insaatborsam/ui/tailwind-preset'; (build script ile)
// Veya manuel olarak globals.css'e kopyalanır.
export function cssTheme(): string {
  const lines: string[] = ["@theme {"];

  for (const [key, value] of Object.entries({ ...colorsLight, ...brandAlias, ...stateColors })) {
    lines.push(`  --color-${key}: ${value};`);
  }

  for (const [key, value] of Object.entries(spacing)) {
    lines.push(`  --spacing-${key}: ${value};`);
  }

  for (const [key, value] of Object.entries(radius)) {
    if (key === "DEFAULT") continue;
    lines.push(`  --radius-${key}: ${value};`);
  }

  for (const [key, value] of Object.entries(shadow)) {
    lines.push(`  --shadow-${key}: ${value};`);
  }

  lines.push(`  --font-sans: ${fontFamily.sans.join(", ")};`);
  lines.push(`  --font-mono: ${fontFamily.mono.join(", ")};`);

  lines.push("}");
  return lines.join("\n");
}

export default tailwindPreset;
