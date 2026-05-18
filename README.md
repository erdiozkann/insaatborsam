# İnşaat Borsam

Türkiye inşaat sektörü için AI destekli dijital tedarik borsası. Üç taraflı B2B marketplace — müteahhitler, satıcılar ve nakliyeciler tek mobil platformda.

**Detay:** [`CLAUDE.md`](./CLAUDE.md) — proje master context  
**Dokümantasyon:** [`docs/`](./docs/) — vizyon, spec, tech, database, AI, roadmap, business, design

## Monorepo Yapısı

```
apps/
  web/      — Next.js 15 (insaatborsam.com + admin)
  buyer/    — React Native + Expo (alıcı uygulaması)
  seller/   — React Native + Expo (satıcı uygulaması)
packages/
  ui/       — Industrial Precision tasarım sistemi + componentler
  database/ — Supabase types + client + queries
  shared/   — Utils, hooks, constants
  ai/       — Claude promptları + Edge Function clientları
supabase/
  migrations/ — Postgres schema
  functions/  — Edge Functions (Deno)
```

## Geliştirme

```bash
pnpm install            # Bağımlılıkları yükle
pnpm dev                # Tüm app'leri paralel başlat
pnpm dev-web            # Sadece web
pnpm dev-buyer          # Sadece buyer
pnpm dev-seller         # Sadece seller
pnpm typecheck          # TS check
pnpm lint               # Lint check
```

## Stack

Mobil: React Native + Expo SDK 52 • Web: Next.js 15 + Tailwind v4 + shadcn/ui • Backend: Supabase (Postgres + pgvector + Auth + Storage + Realtime + Edge Functions) • AI: Claude Sonnet 4.7 + Haiku 4.5 • Ödeme: Iyzico (TR) + Stripe (EUR) • State: Zustand + TanStack Query.

## Token Yönetimi

Renk, tipografi, spacing tokenları `packages/ui/src/tokens/` altında. Değişiklik yapmak için sadece o dosyaları düzenle — Tailwind theme bloğu otomatik senkronize edilir (`predev` + `prebuild` hook). Manuel olarak çalıştırmak için: `pnpm theme:sync`

## Faz 1 Durumu

MVP launch hedefi **31 Ağustos 2026**. Aktif çalışma alanı: `docs/06-ROADMAP.md` Sprint listesinde.
