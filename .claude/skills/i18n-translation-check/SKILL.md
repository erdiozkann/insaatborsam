---
name: i18n-translation-check
description: Yeni UI string'i, label, button text, error message eklenirken i18n disiplinini sağlar. Hardcoded string yasak, t() fonksiyonu zorunlu. Pluralization, number/date formatting Intl API üzerinden. "new string", "label", "yeni metin", "i18n", "translation", "localization" geçen istekler için.
---

# i18n / Lokalizasyon Disiplini

Faz 1'de **sadece Türkçe** çıkıyoruz, ama altyapı **çoklu dil için hazır** olmalı. Hardcoded string = teknik borç.

## TEMEL KURAL

> Her görünen string `t('key')` üzerinden gelir. JSX'te direkt Türkçe yazma.

```tsx
// ❌ KÖTÜ
<Button>Teklif Gönder</Button>
<Text>Hoş geldiniz, {user.name}!</Text>

// ✅ İYİ
<Button>{t('rfq.submit')}</Button>
<Text>{t('welcome.greeting', { name: user.name })}</Text>
```

## TEKNOLOJİ SEÇİMİ

- **Web (Next.js):** `next-intl` (App Router uyumlu)
- **Mobile (Expo):** `i18next` + `react-i18next` + `expo-localization`

Aynı JSON yapısını paylaşırlar (`packages/i18n/locales/`).

## KLASÖR YAPISI

```
packages/i18n/
├── locales/
│   ├── tr/
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── rfq.json
│   │   ├── product.json
│   │   ├── order.json
│   │   ├── seller.json
│   │   ├── admin.json
│   │   └── errors.json
│   └── en/                # Faz 3+ için iskelet
│       └── (same structure)
├── client.ts              # i18next setup
├── server.ts              # next-intl setup (web)
└── types.ts               # Type-safe key'ler
```

## KEY NAMING CONVENTION

Hiyerarşik, **noktayla** ayrılmış:

```json
{
  "rfq": {
    "list": {
      "title": "Teklif Taleplerim",
      "empty": "Henüz teklif talebi yok",
      "create_cta": "İlk RFQ'mu Oluştur"
    },
    "detail": {
      "title": "Teklif Talebi Detayı",
      "deadline_label": "Son Teklif Tarihi",
      "offers_count": "{count} Teklif"
    },
    "actions": {
      "submit": "Teklif Gönder",
      "cancel": "İptal Et",
      "extend_deadline": "Süre Uzat"
    }
  }
}
```

Kullanım:
```tsx
t('rfq.list.title')         // "Teklif Taleplerim"
t('rfq.actions.submit')     // "Teklif Gönder"
t('rfq.detail.offers_count', { count: 5 })  // "5 Teklif"
```

## YAYGIN PATTERN'LER

### 1. Statik text
```tsx
<h1>{t('rfq.list.title')}</h1>
```

### 2. Interpolation
```tsx
<p>{t('greeting', { name: user.name })}</p>
// JSON: "greeting": "Hoş geldiniz, {{name}}!"
```

### 3. Pluralization (Türkçe basit)

Türkçe'de **tekil/çoğul ayrımı yok** ("1 ürün" / "5 ürün" — ek değişmez), ama yapı yine de kurulur:

```json
{
  "items": "{{count}} ürün"
}
```

```tsx
t('items', { count: 5 }) // "5 ürün"
```

İngilizce için aktive olduğunda:
```json
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} items"
}
```

i18next otomatik plural rule'unu seçer (`lng=tr` → tek form, `lng=en` → iki form).

### 4. Tarih formatlaması
```tsx
import { formatDate } from '@/packages/i18n/format'

formatDate(new Date(), 'tr-TR') // "15 Kasım 2026"
formatDate(new Date(), 'tr-TR', 'short') // "15.11.2026"
```

```ts
// packages/i18n/format.ts
export function formatDate(
  date: Date, 
  locale: string = 'tr-TR', 
  variant: 'long' | 'short' | 'relative' = 'long'
): string {
  if (variant === 'relative') {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    // ... relative time hesapla
  }
  
  return new Intl.DateTimeFormat(locale, 
    variant === 'long' 
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' }
  ).format(date)
}
```

### 5. Para formatlaması
```tsx
import { formatCurrency } from '@/packages/i18n/format'

formatCurrency(1250.50, 'TRY') // "₺1.250,50"
formatCurrency(99, 'EUR')      // "€99,00"
```

```ts
export function formatCurrency(
  amount: number, 
  currency: 'TRY' | 'EUR' = 'TRY',
  locale: string = 'tr-TR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
```

### 6. Sayı formatlaması
```ts
formatNumber(12450) // "12.450" (binlik nokta)
formatNumber(0.245, 'percent') // "%24,5"
```

## TYPE SAFETY

i18n key'leri TypeScript ile **type-safe** olsun — yanlış key yazımı compile-time'da yakalansın.

```ts
// packages/i18n/types.ts
import tr from './locales/tr/index.json'

type TranslationKeys = typeof tr
type NestedKeys<T> = T extends object
  ? { [K in keyof T]: K extends string 
      ? T[K] extends object 
        ? `${K}.${NestedKeys<T[K]>}` 
        : K
      : never 
    }[keyof T]
  : never

export type I18nKey = NestedKeys<TranslationKeys>

// Augment i18next
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: TranslationKeys
  }
}
```

Bu sayede:
```tsx
t('rfq.list.title')      // ✅ Auto-complete + valid
t('rfq.list.xxx')        // ❌ TypeScript error
```

## ERROR MESAJLARI

Backend'den gelen hatalar için **error code** kullan, mesajı i18n'de tut:

```ts
// Backend
throw new ApiError({ 
  code: 'RFQ_DEADLINE_PASSED',
  // mesaj YOK — frontend i18n yapsın
})

// Frontend
catch (err) {
  toast.error(t(`errors.${err.code}`))
}

// errors.json
{
  "RFQ_DEADLINE_PASSED": "RFQ'nun teklif süresi doldu.",
  "INSUFFICIENT_QUANTITY": "Yeterli stok yok.",
  "INVALID_CREDENTIALS": "E-posta veya şifre hatalı.",
  "...": "..."
}
```

## OPSİYONEL: Server-side i18n

Email/SMS bildirimleri için **server-side** çeviri:

```ts
// Edge Function
import { t } from '@/packages/i18n/server'

async function sendOrderEmail(order: Order, user: User) {
  const locale = user.preferred_locale ?? 'tr-TR'
  
  await sendEmail({
    to: user.email,
    subject: t('emails.order.subject', { lng: locale, orderId: order.id }),
    body: t('emails.order.body', { lng: locale, ...order }),
  })
}
```

## NAMESPACE YÖNETİMİ

Büyük projeler için namespace ayır:
```ts
const { t } = useTranslation('rfq') // sadece rfq.json yüklenir

t('list.title') // "Teklif Taleplerim"
```

Default namespace `common`.

## A11y İÇİN ÖZEL ÇEVİRİLER

```json
{
  "a11y": {
    "close_modal": "Modal'ı kapat",
    "menu_open": "Menüyü aç",
    "loading": "Yükleniyor",
    "sort_by_price": "Fiyata göre sırala"
  }
}
```

Screen reader için ekstra context:
```tsx
<button aria-label={t('a11y.close_modal')}>×</button>
```

## YAZIM ÖNCESİ CHECK

UI string ekliyorsan:
- [ ] `t('key')` üzerinden mi geliyor (hardcoded değil)?
- [ ] Key hiyerarşik mi (`feature.section.element`)?
- [ ] tr/*.json dosyasına eklendi mi?
- [ ] Type generation çalıştırıldı mı (`pnpm i18n:types`)?
- [ ] Interpolation kullanılıyorsa `{{var}}` formatı doğru mu?
- [ ] Para/tarih için `formatCurrency`/`formatDate` kullanıyor muyum?
- [ ] Error code mı (string mesaj değil)?

## EKLENECEK KEY ÇOK MU?

Tek bir refactor seansında 50+ key eklediysen:
1. Mevcut yapıyı gözden geçir (namespace'leri yeniden düşün)
2. Common pattern'leri component'lere taşı (`<Loading />`, `<Empty />`)
3. JSON dosyalarını alfabetik sırala (merge conflict azalır)

## FAZ 1 KAPSAMI

Faz 1'de sadece **tr** locale aktif. Ama **kod**ı i18n-ready yaz. Faz 3'te İngilizce eklenecek (Avrupa pazara açılma).

İngilizce çevirisi henüz yapılmadıysa:
```json
// en/rfq.json
{
  "list": {
    "title": "{{__TODO__}} My RFQs"
  }
}
```

`{{__TODO__}}` markeri ile flag'le, build-time'da `npm run i18n:audit` script'i bu marker'ları rapor versin.
