// Industrial Precision SHARP CORNERS — tüm köşeler 0px. Tek istisna: modal kabul edilir 0 değil ise burada explicit eklenir.
// Tailwind preset bu değerlerle rounded-* sınıflarını override eder; yanlışlıkla rounded-md yazılsa bile 0px üretir.

export const radius = {
  none: "0px",
  xs: "0px",
  sm: "0px",
  md: "0px",
  lg: "0px",
  xl: "0px",
  "2xl": "0px",
  "3xl": "0px",
  full: "0px",
  DEFAULT: "0px",
} as const;

export type RadiusToken = keyof typeof radius;
