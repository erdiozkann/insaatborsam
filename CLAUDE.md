# İnşaat Borsam — Claude Code Master Context

**Status:** Active Development | **Phase:** MVP Faz 1 | **Last Updated:** 2026-05-18 | **Owner:** Erdi

---

## Proje Tek Cümle Özeti

İnşaat Borsam, Türkiye inşaat sektörü için **AI destekli dijital tedarik borsası** — müteahhitler, yapı malzemesi satıcıları ve nakliyecileri tek mobil platformda buluşturan üç taraflı B2B marketplace.

**Domain:** insaatborsam.com  
**Hedef pazar:** Türkiye (önce İstanbul, sonra Ankara/İzmir/Bursa)  
**Dil:** Türkçe (UI tamamen Türkçe)

---

## Aktif Faz: MVP Faz 1 (0–90 gün)

Bu fazda **sadece** şu üç şey yapılır:

1. **insaatborsam.com** (Next.js) — marketing site + satıcı onboarding + admin panel
2. **Buyer App** (React Native + Expo) — alıcı mobil uygulaması, temel akışlar
3. **Seller Panel** (React Native + Expo) — satıcı mobil uygulaması, temel akışlar

**Faz 1'de yok:** Cargo App, AI Ajanlar, Escrow, Otomasyon (WhatsApp/Meta Ads), Piyasa Endeksi otomasyonu, e-Fatura entegrasyonu, Desktop versiyonlar (admin hariç).

Detay: `docs/06-ROADMAP.md`

---

## Kritik Kurallar (Asla İhlal Etme)

### Apple/Google Komisyonu Sıfır
- Üyelik **sadece insaatborsam.com web sitesinden** satılır (Iyzico/Stripe)
- Mobil uygulamalarda **"Üye Ol" butonu yok, "Üyelik Satın Al" yok, paywall yok**
- Mobil uygulama sadece **"Giriş Yap"** akışıyla açılır
- Fiziksel mal satışı uygulama içinde Iyzico ile direkt (Apple/Google istisna)
- Detay: `docs/07-BUSINESS.md` — Apple/Google Atlatma Stratejisi

### Türkçe UI
- Tüm UI metinleri **Türkçe**
- Gereksiz İngilizce kelime kullanma ("Site Manager" değil "Şantiye Şefi")
- Sektör terimlerini koru ("metraj", "hak ediş", "sevkiyat", "şantiye", "bayi")
- Tarih formatı: `15 Kasım 2026` veya `15.11.2026`
- Para birimi: `₺` (TRY) — bazı üyelik fiyatları `€` (EUR)

### Marka Kimliği & Tasarım Sistemi
- **Adı:** "İnşaat Borsam" (asla "İnsaApp", "Forge Source", "Construct-Core")
- **Tasarım sistemi:** "Industrial Precision" — Stripe meets Caterpillar
- **Sert kurallar:** 
  - Tüm köşeler **0px radius** (yuvarlatma yasak — button, card, input, chip, modal hepsi)
  - **Soft shadow yok** — derinlik border + tonal stepping ile
  - **Hard shadow** sadece modal/popover'da (4px blur, 20% opacity, 0 spread)
  - **8px grid sistemi** zorunlu — tüm spacing 4/8/16/24/32/48 katları
- **Renkler (token-bazlı, asla hex hard-code etme):**
  - Primary: `#F4B400` (hazard yellow) — sadece CTA, kritik uyarı, marka aksanı
  - Secondary: `#1E293B` (charcoal navy) — text, header, icon
  - Surface: `#FFFFFF` ana, `#F7F9FB` ikincil
  - Stokta: `#10B981` yeşil — Beklemede: `#F4B400` sarı
- **Tipografi:** Inter (tüm UI), **tabular figures** sayılarda zorunlu
- **Detay:** `docs/08-DESIGN.md` (tasarım sistemi, tokens, componentler)

### Naming Convention
- Dosya/klasör: `kebab-case` (`product-detail`, `rfq-inbox`)
- Component: `PascalCase` (`ProductCard`, `RFQOfferList`)
- Function/variable: `camelCase` (`fetchProducts`, `currentUser`)
- Supabase tablo: `snake_case` (`product_categories`, `rfq_offers`)
- Type/interface: `PascalCase` (`Product`, `OrderStatus`)

### Kod Kalitesi
- TypeScript strict mode — `any` yasak
- Tüm Supabase çağrıları için type generation kullan
- Row Level Security her tabloda zorunlu
- Hiçbir secret repo'da hard-coded yok — `.env` kullan
- Test henüz şart değil, MVP sonrası eklenecek

### "Over-engineering" Yasak
- 50 line ile çözülen şeyi 500'e çıkarma
- Premature abstraction yapma
- Yeni library eklemeden önce mevcut stack'te çözüm ara
- "İleride lazım olabilir" diye kod yazma

---

## Yön Bulma: Hangi Dosyaya Bakmalısın?

| Görev | Oku |
|---|---|
| Yeni özellik geliştirme | `docs/02-SPEC.md` |
| Veritabanı değişikliği | `docs/04-DATABASE.md` |
| Yeni library/servis eklemek | `docs/03-TECH.md` |
| AI özelliği eklemek | `docs/05-AI.md` |
| Sprint/timeline planlama | `docs/06-ROADMAP.md` |
| Fiyat/satış/yasal | `docs/07-BUSINESS.md` |
| **UI/component/styling/renk/spacing** | **`docs/08-DESIGN.md`** |
| Stratejik karar | `docs/01-VISION.md` |

---

## Proje Yapısı (Monorepo)

```
insaatborsam/
├── apps/
│   ├── web/              # Next.js — insaatborsam.com (marketing + admin + onboarding)
│   ├── buyer/            # React Native + Expo — alıcı mobil uygulama
│   ├── seller/           # React Native + Expo — satıcı mobil uygulama
│   └── cargo/            # (Faz 2) Nakliyeci mobil uygulama
├── packages/
│   ├── ui/               # Paylaşılan UI componentler (NativeWind + shadcn)
│   ├── database/         # Supabase types, schemas, migrations
│   ├── shared/           # Utils, hooks, constants
│   └── ai/               # AI prompt'lar, Edge Function client'lar
├── supabase/
│   ├── migrations/       # SQL migrations
│   ├── functions/        # Edge Functions (Deno)
│   └── seed/             # Geliştirme için seed data
└── docs/                 # Bu klasör — proje dokümanları
```

Monorepo manager: **Turborepo**. Paket yöneticisi: **pnpm**.

---

## Tech Stack Özeti

- **Mobile:** React Native + Expo SDK 52, Expo Router, NativeWind, Zustand, TanStack Query
- **Web:** Next.js 15, shadcn/ui, Tailwind v4
- **Backend:** Supabase (Postgres + pgvector + Auth + Storage + Realtime + Edge Functions)
- **Automation:** n8n (self-hosted, Hostinger VPS + Coolify)
- **AI:** Claude API (Sonnet 4.7 + Haiku 4.5), OpenAI Embeddings, pgvector
- **Payments:** Iyzico (TR ana), Stripe (EUR abonelikler)
- **Devops:** EAS Build, Vercel, GitHub Actions, Sentry, PostHog

Detay: `docs/03-TECH.md`

---

## Üç Kullanıcı + Bir Yönetici

| Tip | Platform | Üyelik | Aktif Faz |
|---|---|---|---|
| **Alıcı** (müteahhit, usta) | Mobil | Ücretsiz / €49 Pro / €99 Business | Faz 1 ✅ |
| **Satıcı** (nalbur, bayi) | Mobil + Web | €99 / €199 / €599 | Faz 1 ✅ |
| **Nakliyeci** (kamyoncu) | Mobil | Ücretsiz (5 iş) / €49 / €99 | Faz 2 🟡 |
| **Yönetici** (sen + ekibin) | Web | Internal | Faz 1 ✅ |

---

## Geliştirme Akışı

1. Görevi al → ilgili `docs/` dosyalarını oku
2. Önce `apps/web` veya `apps/buyer`/`apps/seller`'da feature branch aç
3. Supabase migration gerekiyorsa önce `supabase/migrations/` yaz
4. Type generation çalıştır (`pnpm db:types`)
5. Component'i yaz, `packages/ui`'ye taşınabilirse oraya koy
6. Test et (gerçek Supabase, gerçek Iyzico sandbox)
7. PR → GitHub Actions → Vercel preview / EAS Update preview

---

## Acil Durum / Karar Anları

Eğer şu sorulardan biriyle karşılaşırsan:

- **"Bu özellik MVP'de olmalı mı?"** → `docs/06-ROADMAP.md` Faz 1 listesine bak. Listede yoksa **YAPMA**, ileri bırak.
- **"Bunu nasıl Türkçe çevireyim?"** → `docs/02-SPEC.md` sözlüğüne bak.
- **"Bu ödeme uygulama içinde mi olmalı?"** → Fiziksel mal/hizmet ise EVET (Iyzico). Üyelik ise HAYIR (web).
- **"Bu component nereye gitmeli?"** → Birden fazla app'te kullanılacaksa `packages/ui`, app'e özelse `apps/X/components/`.

---

## İletişim & Karar Verici

Tek karar verici: **Erdi** (Avusturya'dan uzaktan yönetim).  
Dil: Türkçe.  
İletişim tarzı: Net, kısa, doğrudan. Bürokrasi yok.

---

**Sonsöz:** Bu dosya kısa olmak zorunda — her oturumda okunur. Detay diğer dokümanlarda. Bir şey ekleyeceğinde önce buraya **özet**, ilgili `docs/` dosyasına **detay** yaz.