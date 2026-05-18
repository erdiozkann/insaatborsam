// Industrial Precision tipografi — Inter, ağır kontrastlı hiyerarşi, tabular figures sayılarda.
// DESIGN.md frontmatter tipografi scale'i + skill description'da ek headline-md/body-sm.

export const fontFamily = {
  sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
  mono: ["JetBrains Mono", "ui-monospace", "monospace"],
} as const;

// Font weight'lar — bold/extrabold ağırlığa dayalı kontrast için.
export const fontWeight = {
  regular: "400",
  medium: "500",
  bold: "700",
  extrabold: "800",
} as const;

// Type scale — DESIGN.md M3 frontmatter + skill'deki ek varyantlar.
// Her giriş: fontSize / lineHeight / fontWeight / letterSpacing (em).
export const typeScale = {
  "display-lg": {
    fontSize: "48px",
    lineHeight: "56px",
    fontWeight: fontWeight.extrabold,
    letterSpacing: "-0.02em",
  },
  "headline-lg": {
    fontSize: "32px",
    lineHeight: "40px",
    fontWeight: fontWeight.bold,
    letterSpacing: "-0.01em",
  },
  "headline-lg-mobile": {
    fontSize: "24px",
    lineHeight: "32px",
    fontWeight: fontWeight.bold,
    letterSpacing: "-0.01em",
  },
  "headline-md": {
    fontSize: "20px",
    lineHeight: "28px",
    fontWeight: fontWeight.bold,
    letterSpacing: "-0.005em",
  },
  "price-xl": {
    fontSize: "36px",
    lineHeight: "44px",
    fontWeight: fontWeight.extrabold,
    letterSpacing: "0em",
    fontVariantNumeric: "tabular-nums",
  },
  "body-lg": {
    fontSize: "18px",
    lineHeight: "28px",
    fontWeight: fontWeight.regular,
    letterSpacing: "0em",
  },
  "body-md": {
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: fontWeight.regular,
    letterSpacing: "0em",
  },
  "body-sm": {
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: fontWeight.regular,
    letterSpacing: "0em",
  },
  "label-bold": {
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: fontWeight.bold,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  "label-sm": {
    fontSize: "12px",
    lineHeight: "16px",
    fontWeight: fontWeight.medium,
    letterSpacing: "0.03em",
  },
} as const;

export type TypeScaleToken = keyof typeof typeScale;
