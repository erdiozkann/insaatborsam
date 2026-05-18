# @insaatborsam/shared

Tüm app'lerin paylaştığı saf TypeScript yardımcıları. React'a, Supabase'e, Next.js'e bağımlılık YOK.

## İçerik (Sprint 1+)

- `src/constants/` — APP_NAME, DEFAULT_LOCALE, kategori sabitleri, fiyat tier'ları
- `src/utils/` — `formatPrice(amount, currency)`, `formatDate(date)`, `slugify(text)`
- `src/types/` — `OrderStatus`, `UserRole`, `Currency`, ortak union'lar
- `src/hooks/` — React-only hook'lar (eğer hooks gerekirse `react` peer dep eklenir, şu an saf TS)

## Kural

Bu pakete React/RN/Next/Supabase import etmek yasak — saf TypeScript kalmalı ki Edge Function'larda da çalışabilsin.
