// 8px grid sistemi — tüm spacing 4/8/16/24/32/48 katları. Yarım step (4px) data-dense tablolar için.

export const spacing = {
  "0": "0px",
  px: "1px",
  "0.5": "2px",
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "7": "28px",
  "8": "32px",
  "10": "40px",
  "12": "48px",
  "14": "56px",
  "16": "64px",
  "20": "80px",
  "24": "96px",
  "32": "128px",
} as const;

// Layout sabitleri — DESIGN.md frontmatter'dan.
export const layout = {
  "gutter-desktop": "24px",
  "gutter-mobile": "16px",
  "margin-desktop": "48px",
  "margin-mobile": "20px",
  "container-max": "1280px",
  "touch-target-min": "44px",
} as const;

export type SpacingToken = keyof typeof spacing;
export type LayoutToken = keyof typeof layout;
