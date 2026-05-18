// Industrial Precision renk paleti — Material 3 semantic tokens + pratik alias'lar.
// Hex değerlerinin tek doğru kaynağı bu dosya. CLAUDE.md tablosu marketing iletişimi için.

export const colorsLight = {
  // ----- Surfaces -----
  background: "#f7f9fb",
  surface: "#f7f9fb",
  "surface-dim": "#d8dadc",
  "surface-bright": "#f7f9fb",
  "surface-container-lowest": "#ffffff",
  "surface-container-low": "#f2f4f6",
  "surface-container": "#eceef0",
  "surface-container-high": "#e6e8ea",
  "surface-container-highest": "#e0e3e5",
  "surface-variant": "#e0e3e5",
  "inverse-surface": "#2d3133",
  "inverse-on-surface": "#eff1f3",

  // ----- On-surface (text/icon) -----
  "on-background": "#191c1e",
  "on-surface": "#191c1e",
  "on-surface-variant": "#504533",

  // ----- Outline -----
  outline: "#827560",
  "outline-variant": "#d4c4ac",

  // ----- Primary (hazard yellow ailesi) -----
  primary: "#7a5900",
  "on-primary": "#ffffff",
  "primary-container": "#f4b400",
  "on-primary-container": "#654800",
  "inverse-primary": "#fdbc13",
  "primary-fixed": "#ffdea3",
  "primary-fixed-dim": "#fdbc13",
  "on-primary-fixed": "#261900",
  "on-primary-fixed-variant": "#5d4200",
  "surface-tint": "#7a5900",

  // ----- Secondary (charcoal navy ailesi) -----
  secondary: "#545f73",
  "on-secondary": "#ffffff",
  "secondary-container": "#d5e0f8",
  "on-secondary-container": "#586377",
  "secondary-fixed": "#d8e3fb",
  "secondary-fixed-dim": "#bcc7de",
  "on-secondary-fixed": "#111c2d",
  "on-secondary-fixed-variant": "#3c475a",

  // ----- Tertiary (success green ailesi) -----
  tertiary: "#006c49",
  "on-tertiary": "#ffffff",
  "tertiary-container": "#44d69b",
  "on-tertiary-container": "#00593b",
  "tertiary-fixed": "#6ffbbe",
  "tertiary-fixed-dim": "#4edea3",
  "on-tertiary-fixed": "#002113",
  "on-tertiary-fixed-variant": "#005236",

  // ----- Error -----
  error: "#ba1a1a",
  "on-error": "#ffffff",
  "error-container": "#ffdad6",
  "on-error-container": "#93000a",
} as const;

export const colorsDark = {
  // ----- Surfaces -----
  background: "#111416",
  surface: "#111416",
  "surface-dim": "#111416",
  "surface-bright": "#37393c",
  "surface-container-lowest": "#0b0e10",
  "surface-container-low": "#191c1e",
  "surface-container": "#1d2022",
  "surface-container-high": "#272a2c",
  "surface-container-highest": "#323537",
  "surface-variant": "#4a4639",
  "inverse-surface": "#e2e2e5",
  "inverse-on-surface": "#2d3133",

  // ----- On-surface -----
  "on-background": "#e2e2e5",
  "on-surface": "#e2e2e5",
  "on-surface-variant": "#d4c4ac",

  // ----- Outline -----
  outline: "#9d8e72",
  "outline-variant": "#4f4633",

  // ----- Primary -----
  primary: "#fdbc13",
  "on-primary": "#402d00",
  "primary-container": "#5d4200",
  "on-primary-container": "#ffdea3",
  "inverse-primary": "#7a5900",
  "primary-fixed": "#ffdea3",
  "primary-fixed-dim": "#fdbc13",
  "on-primary-fixed": "#261900",
  "on-primary-fixed-variant": "#5d4200",
  "surface-tint": "#fdbc13",

  // ----- Secondary -----
  secondary: "#bcc7de",
  "on-secondary": "#263141",
  "secondary-container": "#3c475a",
  "on-secondary-container": "#d8e3fb",
  "secondary-fixed": "#d8e3fb",
  "secondary-fixed-dim": "#bcc7de",
  "on-secondary-fixed": "#111c2d",
  "on-secondary-fixed-variant": "#3c475a",

  // ----- Tertiary -----
  tertiary: "#4edea3",
  "on-tertiary": "#003822",
  "tertiary-container": "#005236",
  "on-tertiary-container": "#6ffbbe",
  "tertiary-fixed": "#6ffbbe",
  "tertiary-fixed-dim": "#4edea3",
  "on-tertiary-fixed": "#002113",
  "on-tertiary-fixed-variant": "#005236",

  // ----- Error -----
  error: "#ffb4ab",
  "on-error": "#690005",
  "error-container": "#93000a",
  "on-error-container": "#ffdad6",
} as const;

// Brand alias katmanı — DESIGN.md M3 tokenlarına bağlı pratik isimler.
// Kod tarafında M3 semantic ismi tercih, alias'lar marketing/eski referans uyumu için.
export const brandAlias = {
  brand: colorsLight["primary-container"], // #f4b400 hazard yellow
  "brand-dark": colorsLight.primary, // #7a5900
  "brand-light": colorsLight["primary-fixed"], // #ffdea3
  navy: colorsLight["inverse-surface"], // #2d3133 (CLAUDE.md narrative'deki "charcoal navy")
  ink: colorsLight["on-surface"], // #191c1e
  "ink-secondary": colorsLight["on-surface-variant"], // #504533
  "ink-muted": colorsLight.outline, // #827560
  border: colorsLight["outline-variant"], // #d4c4ac
  "border-strong": colorsLight["inverse-surface"], // active/focus
} as const;

// State colors — Industrial Precision UI'da durum chip'leri için.
// CLAUDE.md'deki #10B981 success green tutuluyor (M3 tertiary'den farklı, daha canlı).
export const stateColors = {
  "state-success": "#10b981",
  "state-warning": "#f4b400",
  "state-error": "#ba1a1a",
  "state-info": "#0ea5e9",
  "state-neutral": "#64748b",
} as const;

export type ColorToken = keyof typeof colorsLight;
export type AliasToken = keyof typeof brandAlias;
export type StateToken = keyof typeof stateColors;

export const colors = {
  light: { ...colorsLight, ...brandAlias, ...stateColors },
  dark: { ...colorsDark, ...brandAlias, ...stateColors },
} as const;

// CSS custom property üretici — scripts/sync-theme.ts tarafından tüketilir.
// Verilen renk map'inden `--color-<key>: <value>;` satırları üretir.
// Geri dönüş: iki boşlukla indent edilmiş satırların array'i (CSS bloğu içinde join'lenir).
export function cssTheme(theme: Record<string, string>): string[] {
  return Object.entries(theme).map(([key, value]) => `  --color-${key}: ${value};`);
}
