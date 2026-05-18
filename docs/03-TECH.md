# 03 — Teknoloji & Mimari

**Status:** Locked | **Last Updated:** 2026-05-18 | **Owner:** Erdi

> **Bu stack Claude Code ile sağlıklı çalışmak için seçildi.** Değişiklik yapma — büyük ekleme/çıkarmadan önce mutlaka dur, düşün, gerekçelendir.

---

## Stack Özeti (Hızlı Referans)

| Katman | Teknoloji | Versiyon | Neden |
|---|---|---|---|
| Mobil | React Native + Expo | SDK 52 | Claude Code TypeScript çok iyi yazıyor, OTA updates, hızlı dev |
| Web | Next.js | 15 | App Router, RSC, en olgun React framework |
| UI (Mobil) | NativeWind v4 | latest | Tailwind for RN — utility-first |
| UI (Web) | Tailwind v4 + shadcn/ui | latest | Claude Code en iyi bildiği UI sistemleri |
| State (client) | Zustand | latest | Basit, type-safe, küçük |
| State (server) | TanStack Query | v5 | Cache + optimistic updates |
| Routing (Mobil) | Expo Router | latest | File-based, Next.js benzeri |
| Forms | React Hook Form + Zod | latest | Type-safe form + validation |
| Backend | Supabase | hosted | Postgres + Auth + Storage + Realtime + Edge Functions tek yerde |
| Vector | pgvector | latest | Supabase içinde, semantic search |
| Automation | n8n | self-hosted | Hostinger VPS + Coolify (mevcut) |
| AI | Claude API | Sonnet 4.7, Haiku 4.5 | Ana model |
| Embedding | OpenAI text-embedding-3-small | latest | pgvector için |
| Vision | Gemini Flash | latest | Ürün foto analizi (ucuz) |
| Payments TR | Iyzico | latest | Türk kart, taksit, BDDK |
| Payments EUR | Stripe | latest | Avrupa abonelik |
| Email | Resend | latest | Transactional |
| SMS | Vonage / Netgsm | latest | Türkiye SMS OTP |
| Maps | Google Maps API | latest | Harita + business scraping |
| Push | Expo Notifications | latest | Mobil push |
| Analytics | PostHog | self-hosted | Ürün analitiği |
| Errors | Sentry | hosted | Error tracking |
| Build | EAS Build | latest | Expo mobil build |
| Deploy | Vercel | latest | Next.js |
| CI/CD | GitHub Actions | latest | Test + deploy |
| Monorepo | Turborepo | latest | Tek repo, paylaşılan code |
| Package Mgr | pnpm | v9 | Hızlı, disk-efficient |
| Language | TypeScript | strict mode | Her şey |

---

## Monorepo Yapısı

```
insaatborsam/
├── apps/
│   ├── web/                  # Next.js — insaatborsam.com + admin
│   │   ├── app/
│   │   │   ├── (marketing)/  # Public sayfalar
│   │   │   ├── (auth)/       # Login, signup
│   │   │   ├── (onboarding)/ # Satıcı onboarding funnel
│   │   │   ├── admin/        # Admin Console (auth-protected)
│   │   │   └── api/          # API routes (webhook, iyzico)
│   │   ├── components/
│   │   ├── lib/
│   │   └── public/
│   │
│   ├── buyer/                # React Native — Alıcı App
│   │   ├── app/              # Expo Router
│   │   │   ├── (tabs)/       # Tab navigator
│   │   │   ├── (auth)/       # Login
│   │   │   ├── product/[id].tsx
│   │   │   ├── rfq/[id].tsx
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── app.json
│   │
│   ├── seller/               # React Native — Satıcı App
│   │   └── (aynı yapı)
│   │
│   └── cargo/                # Faz 2 — Nakliyeci App
│       └── (aynı yapı)
│
├── packages/
│   ├── ui/                   # Paylaşılan UI components
│   │   ├── primitives/       # Button, Input, Card, etc.
│   │   ├── compounds/        # ProductCard, RFQCard, etc.
│   │   ├── tokens/           # Color, typography, spacing
│   │   └── package.json
│   │
│   ├── database/             # Supabase types & client
│   │   ├── types.ts          # Auto-generated
│   │   ├── client.ts         # Supabase client wrapper
│   │   ├── queries/          # Reusable query functions
│   │   └── package.json
│   │
│   ├── shared/               # Utils, constants, hooks
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── package.json
│   │
│   └── ai/                   # AI prompts, Edge Function clients
│       ├── prompts/
│       ├── clients/
│       └── package.json
│
├── supabase/
│   ├── config.toml
│   ├── migrations/           # SQL migrations (timestamped)
│   ├── functions/            # Edge Functions (Deno)
│   │   ├── rfq-parser/
│   │   ├── product-categorize/
│   │   ├── seller-match/
│   │   └── ...
│   └── seed/                 # Dev seed data
│
├── n8n-workflows/            # n8n workflow exports (versioned)
│   ├── whatsapp-outreach.json
│   ├── seller-discovery.json
│   └── ...
│
├── docs/                     # Bu dosyalar
├── .github/
│   └── workflows/            # CI/CD
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Geliştirme Ortamı Kurulumu

### Önkoşullar
- Node.js 20+ LTS
- pnpm 9+
- Git
- Expo CLI (`npm i -g expo-cli`)
- EAS CLI (`npm i -g eas-cli`)
- Supabase CLI (`npm i -g supabase`)
- iOS Simulator (Mac) veya Android Emulator
- VSCode önerilen — özellikle TypeScript için

### İlk Kurulum
```bash
# Repo klonla
git clone https://github.com/erdiipekci/insaatborsam.git
cd insaatborsam

# Dependencies
pnpm install

# Environment dosyaları
cp apps/web/.env.example apps/web/.env.local
cp apps/buyer/.env.example apps/buyer/.env.local
cp apps/seller/.env.example apps/seller/.env.local

# Supabase local
supabase start
supabase db reset    # Migrations + seed

# Type generation
pnpm db:types

# Geliştirme başlat
pnpm dev              # Hepsi paralel (web + buyer + seller)
# veya
pnpm dev:web
pnpm dev:buyer
pnpm dev:seller
```

### Environment Variables

**apps/web/.env.local**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Iyzico
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=

# Google Maps (server-side)
GOOGLE_MAPS_API_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# OpenAI (embeddings)
OPENAI_API_KEY=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

**apps/buyer/.env.local** (mobil)
```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_API_URL=
```

> ⚠️ **Mobil env'lerde sadece `EXPO_PUBLIC_*` prefix'li olanlar build'e gömülür.** Secret içermesin — public sayılır.

---

## Mimari Prensipler

### 1. Single Source of Truth: Supabase
- Tüm veri Supabase'de
- App'ler doğrudan Supabase JS SDK ile konuşur (REST + Realtime)
- Backend mantığı **Edge Functions** veya **Database Functions (RPC)**
- Karmaşık business logic için **n8n** (async, scheduled)

### 2. Row Level Security (RLS) Her Tabloda
- **İstisnasız.** Her tabloda RLS aktif olmalı.
- Auth check `auth.uid()` ile.
- Service role key sadece server-side (Edge Function, Next.js API routes).
- Detay: `docs/04-DATABASE.md`

### 3. Type Safety End-to-End
- Supabase'den `pnpm db:types` ile TS types üret
- Tüm sorgular type-safe
- Form validation Zod ile
- API contract Zod schema

### 4. Code Splitting by App
- Her app kendi ihtiyacı kadar kod
- Paylaşılan UI `packages/ui`'de
- Paylaşılan business logic `packages/shared`'de
- Asla "her şeyi import et" anti-pattern'i

### 5. Optimistic UI
- Mobil deneyimde her aksiyon **anında** UI güncellemesi
- Backend confirm gelince finalize
- Hata olursa rollback + toast bildirim

### 6. Offline-Friendly (Mobil)
- Read'ler cache'lenir (TanStack Query)
- Write'lar queue'ya alınır
- Network gelince retry

### 7. Mobile-First, Web Responsive
- Web mobil görünümde de çalışmalı (özellikle marketing)
- Admin Console desktop-first (data-heavy)

---

## Authentication

### Akışlar

**Mobil — Buyer / Seller (SMS OTP öncelik):**
1. Kullanıcı telefon numarası girer
2. Supabase Auth → `signInWithOtp({ phone })` → SMS gönderir (Vonage/Netgsm)
3. Kullanıcı 6 haneli kod girer
4. Doğrulanırsa: Session aktif
5. İlk kez giriyorsa: Profil tamamlama ekranı (isim, rol vs)

**Web — Admin Console:**
1. Email + şifre
2. 2FA zorunlu (TOTP — Google Authenticator)
3. Audit log: her giriş kaydedilir

**Web — Satıcı Onboarding:**
1. `/satici-ol` formu doldurur (email + telefon)
2. Email doğrulama linki gönderilir
3. Telefon SMS OTP
4. Vergi levhası upload
5. Iyzico ile ödeme
6. Hesap aktif → SMS ile mobil app linki

### Session Management
- Refresh token rotasyonu aktif
- Mobil: Expo SecureStore ile sakla
- Web: HttpOnly cookies
- Multi-device session listesi (Profil > Güvenlik)

---

## Veri Akışı (Tipik Sipariş Süreci)

Alıcı sipariş veriyor sahnesini takip edelim:

```
1. Alıcı (Buyer App) → Ürün detay açar
   ↳ Supabase SELECT products WHERE id = ? (anlık)

2. Sepete ekle butonuna basar
   ↳ Zustand store'a ekle (optimistic)
   ↳ Supabase UPSERT cart_items (async)

3. Ödeme adımına geçer → Iyzico
   ↳ Next.js API route: /api/iyzico/checkout (apps/web/app/api)
   ↳ Iyzico session oluşturulur, callback URL set
   ↳ Iyzico SDK ile in-app browser

4. Ödeme başarılı → Iyzico webhook
   ↳ Next.js API: /api/iyzico/webhook
   ↳ Supabase RPC: complete_order(order_id, payment_id)
   ↳ Order status: 'paid'
   ↳ Trigger: notify_seller (Edge Function)

5. Edge Function: notify_seller
   ↳ Satıcıya push notification
   ↳ Satıcıya email + WhatsApp (n8n webhook)
   ↳ Realtime channel'da event publish

6. Satıcı (Seller App) → realtime ile sipariş düşer
   ↳ Supabase Realtime subscribe
   ↳ TanStack Query invalidate
   ↳ UI güncellenir, badge görünür

7. Satıcı hazırlar → "Hazırlandı" butonuna basar
   ↳ Supabase UPDATE orders SET status = 'preparing'
   ↳ Realtime → Alıcıya bildirim
```

Tüm akış **<5 saniye** tamamlanır.

---

## AI Mimari (Üst Düzey)

Detay: `docs/05-AI.md`. Burada sadece nereye yerleştiği:

```
[Mobile/Web App]
       ↓ (kullanıcı RFQ açar)
[Next.js API / Edge Function]
       ↓ (RFQ parse)
[Claude Haiku 4.5 API]
       ↓ (structured JSON)
[Supabase Insert]
       ↓ (RFQ kaydedildi)
[Edge Function: seller-match]
       ↓ (en uygun 10 satıcı)
[pgvector similarity search]
       ↓ (matched seller IDs)
[Realtime notify sellers]
```

**Kritik AI noktalar:**
- Hiçbir AI çağrısı client-side değil — hep Edge Function veya API route
- API key'ler asla mobil app'e gömülmez
- Streaming UX: Claude streaming response → UI canlı yazar

---

## n8n Workflow Mimari

Mevcut Hostinger VPS + Coolify üzerindeki n8n kullanılır.

**n8n'in görevleri:**
- Email kampanyaları (Resend)
- WhatsApp toplu mesaj (WhatsApp Business API)
- Scheduled jobs:
  - Günlük: fiyat endeksi güncelleme
  - Saatlik: satıcı keşfetme (Google Maps scraping)
  - Haftalık: satıcı performance raporu
- Webhook handler:
  - Supabase → n8n (yeni satıcı kaydoldu → welcome email)
  - Iyzico → n8n (ödeme alındı → fatura yarat)

n8n workflow'ları JSON olarak versiyonlanır: `n8n-workflows/` klasöründe.

---

## Ödeme Mimari

### Iyzico (Türkiye, TRY)

**Kullanım alanları:**
- Buyer App içi sipariş ödemeleri (fiziksel mal — komisyon yok)
- Web'de satıcı/alıcı üyelik ödemeleri (TL ile öderse)
- Nakliye ödemeleri (Faz 2)

**Akış:**
1. Next.js API route: `/api/payments/iyzico/init`
2. Iyzico session oluştur
3. Mobil app: in-app browser ile Iyzico checkout aç (`react-native-iyzipay-checkout` veya WebView)
4. Ödeme tamamlanınca callback URL → Next.js API: `/api/payments/iyzico/callback`
5. Webhook → Supabase'e yansıt

**Önemli:**
- 3D Secure zorunlu (BDDK kuralı)
- Taksit seçenekleri: 2/3/6/9 ay (kartına göre)
- KDV hesaplama: %20 (genel), bazı mallar farklı (kontrol et)

### Stripe (EUR, abonelik)

**Kullanım alanları:**
- Sadece **web'de** üyelik abonelikleri
- €49, €99, €199, €599 planlar

**Akış:**
- Stripe Checkout (hosted) — minimum entegrasyon
- Subscription webhook → Supabase'e yansıt
- İptal: Stripe portal link

---

## Performance Hedefleri

| Metrik | Hedef |
|---|---|
| Mobil app first render | < 1.5s |
| Buyer App: arama sonucu yükle | < 800ms |
| Buyer App: ürün detay açma | < 600ms |
| RFQ teklif geldi → satıcıya bildirim | < 3s |
| Sipariş status değişiklik → alıcıya bildirim | < 2s |
| Web admin: Mission Control yükle | < 2s |
| API: ortalama response | < 200ms |
| Supabase query: p95 | < 500ms |

---

## Güvenlik

### Hassas Veri
- Telefon numarası, email: KVKK kapsamında — sadece gerekli yerde
- Vergi levhası, kimlik: Supabase Storage (private bucket)
- Ödeme bilgisi: **asla bizde saklanmaz** — Iyzico/Stripe'da
- IBAN: encrypted at rest (Supabase Vault)

### API Güvenliği
- Tüm endpoint'ler RLS arkasında
- Rate limiting: Vercel + Cloudflare
- CORS: sadece kendi domain'lerimiz
- CSRF: Next.js built-in

### Mobil Güvenlik
- Certificate pinning (Faz 2)
- Jailbreak/root detection (Faz 2)
- Sensitive data SecureStore'da

### Audit Log
- Admin Console'da her aksiyon log'lanır
- 1 yıl saklanır
- Tablo: `admin_audit_logs`

---

## Deploy Süreçleri

### Web (apps/web)
- Push to `main` → Vercel otomatik deploy
- Preview deploy her PR için
- Production env vars Vercel dashboard'da

### Mobile (apps/buyer, apps/seller)
- Development: `pnpm dev:buyer` → Expo Go
- Internal testing: `eas update --channel preview`
- Production: `eas build --profile production && eas submit`
- OTA Update: `eas update --channel production` (App Store onayı beklemeden bug fix)

### Supabase
- Local: `supabase start`
- Migrations: `supabase migration new <name>` → SQL yaz → `supabase db push`
- Production: GitHub Action ile auto-push

### n8n
- Manuel: Coolify dashboard
- Workflow export: `n8n-workflows/` repo'ya commit

---

## Monitoring & Observability

### Sentry
- Hem web hem mobil
- Error tracking + performance
- Release tracking (her deploy bir release)

### PostHog
- Ürün analitiği — user behavior
- Feature flags (Faz 2'de A/B testing)
- Self-hosted (mevcut Hostinger VPS) — KVKK uyumu

### Supabase Logs
- Built-in log explorer
- API request, DB query, Auth events

### Custom Metrics
- `metrics` tablosunda business metrics
- Cron job ile günlük rapor:
  - Yeni kayıt, yeni sipariş, GMV
  - Slack webhook (kurulduğunda)

---

## Bilinmesi Gereken Sınırlar

### Supabase Free Tier Sınırları
Faz 1 için yeterli ama hızlıca **Pro** plan ($25/ay):
- 8GB database, 100GB bandwidth, 250K monthly active users
- Daily backups

### Expo Free Tier
- EAS Build: aylık 30 build
- EAS Update: sınırsız
- Production'da paid plan ($99/ay) gerekecek (Faz 2)

### Claude API
- Sonnet 4.7: $3 input / $15 output per 1M tokens
- Haiku 4.5: ucuz, çoğu işe yetiyor
- Aylık tahmin: ~$200-500 (Faz 1)

### Iyzico
- İşlem başı: %1.5–2.5 (kart tipine göre)
- Aylık sabit: yok
- Komisyon hesabı: `docs/07-BUSINESS.md`

---

## Kararlar Geçmişi (Decision Log)

### Neden Flutter değil React Native?
- Claude Code TypeScript'i Dart'tan **çok daha iyi** yazıyor
- Senin web stack'inle uyumlu
- OTA updates kritik (App Store onayı 7 gün, OTA anında)
- New Architecture (Fabric, JSI) ile performans yeterli

### Neden Supabase, Firebase değil?
- Postgres (relational data için kritik)
- pgvector built-in (AI için)
- SQL = type-safe, predictable
- Open source, vendor lock-in az
- Self-host opsiyonu var (gerekirse)

### Neden NativeWind, StyleSheet değil?
- Tailwind ekosistemi (Stitch çıktıları zaten Tailwind)
- Web ile aynı tasarım sistemi
- Daha hızlı yazım

### Neden Monorepo, ayrı repo'lar değil?
- 4 ayrı app — paylaşılan kod çok
- Atomic commit (UI değişikliği aynı PR'da hem mobil hem web)
- Turborepo build cache hızı

### Neden Zustand, Redux değil?
- Çok daha basit
- Type-safe out of the box
- Boilerplate yok
- TanStack Query server state'i hallettiği için client state minimal

### Neden Expo Router, React Navigation değil?
- File-based routing — daha kolay anlaşılır
- Web ile aynı pattern (Next.js)
- Deep linking otomatik

---

## Yapma Listesi (Anti-Patterns)

- ❌ `any` type — strict mode, `unknown` kullan
- ❌ Service role key client-side — sadece server
- ❌ Hardcoded secret — `.env` kullan
- ❌ Untyped Supabase query — her zaman `pnpm db:types` ile yenile
- ❌ Global state'e iş mantığı koyma — Zustand sadece UI state
- ❌ Component içinde direkt API call — TanStack Query veya custom hook kullan
- ❌ Magic numbers — `packages/shared/constants` kullan
- ❌ Inline styles (Tailwind kullan) — exception: dinamik value (örn. width: `${progress}%`)
- ❌ Premature optimization — önce çalışsın, sonra ölç, sonra optimize et
- ❌ Yeni library eklemek için PR açma — önce konuş

---

**Sonraki adım:** Veritabanı şeması için `04-DATABASE.md`, AI detayları için `05-AI.md`.
