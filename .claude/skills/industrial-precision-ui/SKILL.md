---
name: industrial-precision-ui
description: Industrial Precision tasarım sistemine uygun UI yazmak için. React/React Native component, sayfa, layout, styling veya Tailwind class yazıldığında otomatik tetiklenir. Sert köşeler, hazard sarı, charcoal navy, Inter font, tabular figures, 8px grid kuralları. "rounded", "shadow", "card", "button", "input", "form", "color", "style", "tailwind", "nativewind", "component", "page" geçen istekler için.
---

# Industrial Precision UI

Bu skill **08-DESIGN.md** dosyasının özetidir. Detay için `docs/08-DESIGN.md`.

## HARD BANS (Asla yapma)

| ❌ Yasak | ✅ Yerine |
|---|---|
| `rounded-md`, `rounded-full`, `rounded-*` | Hiçbir radius — köşeler hep 0px |
| `shadow-sm`, `shadow-md`, `shadow-lg` | Border + tonal stepping ile derinlik |
| Gradient background (`bg-gradient-*`) | Flat color, token kullan |
| Pastel renkler (#FBCFE8, soft pink/blue) | Marka paleti dışına çıkma |
| Inline `style={{ color: '#...' }}` | Token kullan: `text-navy`, `bg-brand` |
| Heroicons rounded, Phosphor regular | `lucide-react` (square stroke) |
| Roboto, Open Sans, başka font | Sadece **Inter** |
| Material UI, Chakra UI | shadcn/ui + NativeWind |
| `text-transform: capitalize` Türkçe metinde | Zaten doğru case yaz |
| Yuvarlak loading spinner | Yatay progress bar |
| Emoji UI'da | Sadece marketing içerikte |

## TOKEN HARITASI (hex değil, token kullan)

```ts
// Renkler
'bg-brand'              // #F4B400 — CTA, kritik aksanlar
'bg-brand-dark'         // #7A5900 — hover/pressed
'bg-brand-light'        // #FFDEA3 — soft yellow container
'text-navy' / 'bg-navy' // #2d3133 — text, header, icon
'bg-surface'            // #F7F9FB — sayfa background
'bg-surface-container-lowest' // #FFFFFF — card background (kod genelinde fiili pattern)
'bg-surface-container'  // #ECEEF0 — section container
'text-ink'              // #191C1E — primary text
'text-ink-secondary'    // #504533 — secondary text
'text-ink-muted'        // #827560 — placeholder, disabled
'border-border'         // #D4C4AC — default 1px border
'border-navy'           // active/focus state border
'bg-state-success'      // #10B981 — Stokta
'bg-state-warning'      // #F4B400 — Beklemede (sarı, brand ile aynı)
'bg-state-error'        // #BA1A1A — Hata, Tükendi
```

```ts
// Typography
'text-display-lg'       // 48px / 800 — hero başlık
'text-headline-lg'      // 32px / 700 — sayfa başlığı
'text-headline-md'      // 20px / 700 — section başlığı
'text-price-xl'         // 36px / 800 + tabular-nums — büyük fiyat
'text-body-lg'          // 18px / 400
'text-body-md'          // 16px / 400 — default
'text-body-sm'          // 14px / 400
'text-label-bold'       // 14px / 700 / uppercase / 0.05em tracking
```

```ts
// Spacing — 8px grid
gap-1=4px  gap-2=8px  gap-3=12px  gap-4=16px  gap-5=20px  
gap-6=24px gap-8=32px gap-10=40px gap-12=48px gap-16=64px
```

## COMPONENT KALIPLAR (kopyala-uyarla)

### Primary Button
```tsx
<button className="
  bg-brand text-navy 
  border-b-2 border-brand-dark
  active:translate-y-[2px] active:border-b-0 active:shadow-hard-pressed
  px-6 py-3 
  font-bold text-sm uppercase tracking-wider
  transition-all duration-75
  min-h-[44px]
">
  Teklif Gönder
</button>
```

### Input
```tsx
<div className="flex flex-col gap-2">
  <label className="text-label-bold text-navy uppercase tracking-wider">
    Ürün Adı
  </label>
  <input className="
    border-2 border-border focus:border-navy
    px-4 py-3 text-body-md text-ink
    bg-surface-container-lowest
    placeholder:text-ink-muted
    focus:outline-none
  " />
</div>
```

### Card
```tsx
<div className="bg-surface-container-lowest border border-border">
  <div className="bg-surface-container px-6 py-3 border-b border-border">
    <h3 className="text-label-bold uppercase tracking-wider text-navy">
      BAŞLIK
    </h3>
  </div>
  <div className="p-6">{/* içerik */}</div>
</div>
```

### Status Chip
```tsx
<span className="bg-state-success text-white px-3 py-1 text-label-sm uppercase tracking-wider font-bold">
  Stokta
</span>
```

### Price + Unit
```tsx
<div className="flex items-baseline gap-2">
  <span className="text-price-xl font-extrabold text-navy tabular-nums">
    ₺1.250
  </span>
  <span className="text-label-bold text-ink-secondary uppercase">/ m²</span>
</div>
```

### Table (zebra stripe)
```tsx
<table className="w-full text-body-sm">
  <thead className="bg-navy text-white">
    <tr>
      <th className="text-left px-4 py-3 text-label-bold uppercase tracking-wider">Firma</th>
      <th className="text-right px-4 py-3 text-label-bold uppercase tracking-wider tabular-nums">Fiyat</th>
    </tr>
  </thead>
  <tbody>
    <tr className="bg-surface-container-lowest border-b border-border">
      <td className="px-4 py-3">Karaköy Elektrik A.Ş.</td>
      <td className="px-4 py-3 text-right tabular-nums">₺12.450</td>
    </tr>
    <tr className="bg-surface-container-low border-b border-border">
      <td className="px-4 py-3">İkitelli Seramik</td>
      <td className="px-4 py-3 text-right tabular-nums">₺13.200</td>
    </tr>
  </tbody>
</table>
```

### Modal (hard shadow burada serbest)
```tsx
<div className="fixed inset-0 bg-navy/40 flex items-center justify-center">
  <div className="bg-surface-container-lowest border-2 border-navy shadow-hard-modal max-w-lg w-full">
    <div className="px-6 py-4 border-b border-border">
      <h2 className="text-headline-md text-navy">Başlık</h2>
    </div>
    <div className="p-6">{/* içerik */}</div>
  </div>
</div>
```

### Progress Bar (spinner DEĞİL)
```tsx
<div className="w-full bg-surface-container h-3">
  <div className="bg-brand h-full" style={{ width: '60%' }} />
</div>
```

## YAZIM ÖNCESİ CHECK

Component yazmadan önce kontrol et:
- [ ] Hiçbir `rounded-*` yok mu?
- [ ] `shadow-*` sadece modal/popover'da mı (yoksa hiç yok)?
- [ ] Tüm renkler token mı, hex hard-code yok mu?
- [ ] Sayılar `tabular-nums` mu?
- [ ] Label'lar `uppercase` + `tracking-wider` mu?
- [ ] Min touch target 44px mi (mobile button/link)?
- [ ] Focus state görünür mü (2px navy border)?
- [ ] Font sadece `Inter` mi?
- [ ] Icon `lucide-react` mı?
- [ ] 8px grid'e uyuyor mu (padding/gap 4/8/16/24/32/48)?

## ICON KURALI

```tsx
import { ShoppingCart } from 'lucide-react' // ✅
// veya
import { ShoppingCart } from 'lucide-react-native' // ✅ mobile

<ShoppingCart strokeWidth={2} className="text-navy" />
```

Stroke width default 2px, vurgu için 2.5px. Linejoin "miter", linecap "square" (lucide default).

## TÜRKÇE UPPERCASE

```html
<!-- HTML root'a -->
<html lang="tr">
```

CSS `text-transform: uppercase` ile **İ/I, i/ı** doğru çevrilir (modern browser, `lang="tr"` set edilince).

## TAILWIND CONFIG

`borderRadius.DEFAULT = '0'` ayarı kritik — yanlışlıkla `rounded` yazılsa bile yuvarlatma olmaz. Detay 08-DESIGN.md bölüm 3'te.
