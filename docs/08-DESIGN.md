---
name: Industrial Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#504533'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#827560'
  outline-variant: '#d4c4ac'
  surface-tint: '#7a5900'
  primary: '#7a5900'
  on-primary: '#ffffff'
  primary-container: '#f4b400'
  on-primary-container: '#654800'
  inverse-primary: '#fdbc13'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#006c49'
  on-tertiary: '#ffffff'
  tertiary-container: '#44d69b'
  on-tertiary-container: '#00593b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea3'
  primary-fixed-dim: '#fdbc13'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4200'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  price-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
spacing:
  base: 8px
  gutter-desktop: 24px
  gutter-mobile: 16px
  margin-desktop: 48px
  margin-mobile: 20px
  container-max: 1280px
---

## Brand & Style
The design system is engineered for the heavy-duty demands of the construction sourcing industry. It adopts a "Stripe meets Caterpillar" aesthetic—fusing the streamlined efficiency of modern fintech with the rugged, structural reliability of industrial machinery. 

The visual language is unapologetically masculine, professional, and precise. It utilizes a **Modern Industrial** style, characterized by high-contrast interfaces, rigid structural grids, and zero-radius corners. The UI should evoke the feeling of a high-end physical control panel: durable, legible under pressure, and functionally dense. Every element is designed to convey stability and authority, ensuring users feel they are operating a professional-grade tool rather than a consumer app.

## Colors
The palette is rooted in the functional visual cues of a construction site. 

- **Primary (Hazard Yellow):** Used strictly for primary actions, critical alerts, and brand accents. It provides the highest level of visual prominence against the dark navy.
- **Secondary (Charcoal Navy):** The foundational color for text, iconography, and structural headers. It replaces black to provide a more sophisticated, "blueprint" feel.
- **Backgrounds:** The primary interface uses clean white (#FFFFFF) to maintain a high-contrast environment for readability. Secondary containers and layout sections use a cool light gray (#F8FAFC) to define hierarchy without adding visual weight.
- **Functional Colors:** Success and warning states use high-visibility green and amber, mimicking safety signal lights.

## Typography
This design system utilizes **Inter** for its neutral, technical character and exceptional legibility at small sizes. 

The hierarchy is built on extreme weight contrast. Headlines are heavy and tight to mimic architectural lettering. A specialized `price-xl` style is defined for monetary values and material quantities, utilizing **tabular figures** (monospaced numbers) to ensure columns of data align perfectly for quick scanning. Labels should often use uppercase with slight letter spacing to act as "tags" or "serial numbers" on the interface. Given the Turkish language requirements, the typography scale accounts for the height of accented characters (İ, ş, ğ) to prevent line-height clipping.

## Layout & Spacing
The layout follows a rigid **8px grid system**. The spacing philosophy is "Logical Density"—grouping related technical data tightly while using large margins between major sections to prevent cognitive overload.

- **Desktop:** A 12-column fixed-width grid (1280px max) with 24px gutters. Use 48px margins to frame the content, providing a sense of focus.
- **Mobile:** A 4-column fluid grid with 16px gutters and 20px margins.
- **Spacing Rhythm:** Use multiples of 8px for all internal padding. For data-heavy tables or material lists, the spacing can drop to 4px (base/2) to increase the information density expected by professional users.

## Elevation & Depth
This design system rejects soft shadows and ambient blurs in favor of **Structural Layering**. 

Depth is communicated through **Bold Borders** and **Tonal Stepping**. Surfaces do not "float"; they are stacked. 
- **Level 0 (Background):** #F8FAFC.
- **Level 1 (Cards/Sections):** #FFFFFF with a 1px solid border (#E2E8F0).
- **Active State:** When an element is focused or active, it should use a 2px stroke of #1E293B or #F4B400.
- **Shadows:** Use only for high-priority modals. These should be "Hard Shadows"—low blur radius (4px), high opacity (20%), and zero spread, mimicking the sharp shadow cast by industrial equipment under overhead lighting.

## Shapes
The shape language is strictly **Sharp (0px radius)**. 

Every UI element—from buttons and input fields to cards and notification toasts—must have 90-degree corners. This reinforces the industrial, rugged nature of the brand. Rounded elements are considered "too soft" for this design system and should be avoided entirely, including in iconography where possible (use straight-edged or geometric icons).

## Components

- **Buttons:** Large, blocky, and high-contrast. The primary button is #F4B400 with #1E293B text. Use a thick 2px bottom border (shade darker) to give a "mechanical" feel when pressed.
- **Inputs:** Thick 2px borders using #CBD5E1. Labels sit strictly above the input in `label-bold` style. Placeholder text should be muted but legible.
- **Chips/Status Tags:** Rectangular blocks with solid background colors. Use uppercase text. Green (#10B981) for "Stokta" (In Stock), Yellow (#F4B400) for "Beklemede" (Pending).
- **Cards:** White background, 1px border, no shadow. Header of the card should often have a subtle light gray top-bar to separate it from the body.
- **Lists:** Material lists should use alternating row colors (Zebra striping) for high readability in data-dense tables.
- **Progress Indicators:** Use thick, solid bars. Avoid circular loaders; use horizontal "loading bars" that resemble construction site barriers or progress meters.
- **Data Callouts:** Pricing and quantity selectors should be oversized, emphasizing the "Unit" (e.g., m3, Ton, Adet) in a smaller, bold label next to the value.