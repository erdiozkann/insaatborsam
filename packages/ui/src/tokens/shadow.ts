// Soft shadow YOK. Derinlik = border + tonal stepping. İstisna: modal/popover için hard shadow.
// 4px blur, 20% opacity, 0 spread — endüstriyel ekipman gölgesi.

export const shadow = {
  none: "none",
  // Modal/popover için tek izinli shadow ailesi.
  "hard-modal": "0px 4px 0px 0px rgba(25, 28, 30, 0.20)",
  "hard-popover": "0px 2px 0px 0px rgba(25, 28, 30, 0.15)",
  // Button pressed state — 2px aşağı + alt border kaybolur hissi.
  "hard-pressed": "inset 0px 2px 0px 0px rgba(25, 28, 30, 0.10)",
} as const;

export type ShadowToken = keyof typeof shadow;
