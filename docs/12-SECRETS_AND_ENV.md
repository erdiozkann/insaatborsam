# 12 — Secret ve Environment Yönetimi

**Status:** Aktif | **Last Updated:** 2026-05-20 | **Owner:** Erdi  
**Kural:** Bu dosyadaki hiçbir gerçek key değeri repo'da bulunmaz.

---

## 1. Secret Envanteri

### apps/web (Next.js)

| Değişken | Tür | Nerede Kullanılır | Public mi |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL | Client + Server | ✅ Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT | Client + Server | ✅ Public (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT | **Sadece server** (Route Handler, Edge Fn) | ❌ **Gizli** |
| `NEXT_PUBLIC_SITE_URL` | URL | Client + Server | ✅ Public |
| `IYZICO_API_KEY` | API key | Route Handler (`/api/payments`) | ❌ **Gizli** |
| `IYZICO_SECRET_KEY` | Secret | Route Handler | ❌ **Gizli** |
| `IYZICO_BASE_URL` | URL | Route Handler | ❌ Gizli (ortam URL'i) |
| `STRIPE_PUBLIC_KEY` | Pub key | Client (Stripe.js) | ✅ Public |
| `STRIPE_SECRET_KEY` | Secret | Route Handler | ❌ **Gizli** |
| `STRIPE_WEBHOOK_SECRET` | Secret | Route Handler (`/api/webhooks/stripe`) | ❌ **Gizli** |
| `ANTHROPIC_API_KEY` | API key | Edge Function | ❌ **Gizli** |
| `OPENAI_API_KEY` | API key | Edge Function | ❌ **Gizli** |
| `RESEND_API_KEY` | API key | Edge Function / Route Handler | ❌ **Gizli** |
| `GOOGLE_MAPS_API_KEY` | API key | Server-side scraping | ❌ **Gizli** |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN | Client + Server | ✅ Public |
| `SENTRY_AUTH_TOKEN` | Auth token | CI/CD (build time) | ❌ **Gizli** |
| `NEXT_PUBLIC_POSTHOG_KEY` | API key | Client | ✅ Public |
| `NEXT_PUBLIC_POSTHOG_HOST` | URL | Client | ✅ Public |

### Supabase Edge Functions (Deno)

Edge Function'lar Supabase Vault veya `supabase secrets set` ile yönetilir:

| Secret | Kullanım |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API çağrısı |
| `OPENAI_API_KEY` | Embedding üretimi |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` | Ödeme akışı |
| `RESEND_API_KEY` | E-posta gönderimi |
| `STRIPE_SECRET_KEY` | Abonelik yönetimi |

---

## 2. Kesin Yasaklar

```
❌ SUPABASE_SERVICE_ROLE_KEY → client component, mobil app, NEXT_PUBLIC_ prefix
❌ Herhangi bir secret → git commit (açık veya şifrelenmiş)
❌ Secret → console.log, Sentry breadcrumb, PostHog event
❌ NEXT_PUBLIC_ prefix ile secret key tanımlama
❌ API key → apps/buyer veya apps/seller kod içinde hardcoded
❌ Token / key formatında örnek değer yazma (gerçek format = asıl değer gibi görünür)
❌ .env.local → git add / git commit
```

---

## 3. NEXT_PUBLIC_ Sınırı

Next.js'te `NEXT_PUBLIC_` prefix'li env değerleri **browser bundle'a gömülür** ve herkes görebilir.

| ✅ NEXT_PUBLIC_ kullanılabilir | ❌ NEXT_PUBLIC_ ile kullanılamaz |
|---|---|
| Supabase anon key | Service role key |
| Stripe publishable key | Stripe secret key |
| Site URL | Iyzico API/secret key |
| Sentry DSN | Anthropic / OpenAI key |
| PostHog key | Resend API key |

`src/lib/env.ts` sadece NEXT_PUBLIC_* değerleri `clientEnv` olarak export eder. `SUPABASE_SERVICE_ROLE_KEY` env.ts'te yoktur — doğrudan `process.env` ile server-only dosyalarda kullanılır.

---

## 4. Ortam Ayrımı

| Ortam | .env Dosyası | Supabase Projesi | Iyzico | Stripe |
|---|---|---|---|---|
| **Local dev** | `apps/web/.env.local` | Remote (production) veya local start | Sandbox | Test mode |
| **Staging** (Faz 2) | Vercel staging env | Ayrı Supabase projesi | Sandbox | Test mode |
| **Production** | Vercel dashboard env | `idhevassnehteseiepzv` | Production | Live mode |

### Local dev dikkat:
- `supabase start` ile local çalışıyorsa URL `http://127.0.0.1:54321` olur
- Production DB'ye local'den bağlanıyorsan: yanlış veri değiştirme riski — dikkatli ol

---

## 5. Secret Rotasyon Planı

| Secret | Rotasyon Sıklığı | Rotasyon Tetikleyici |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | 90 gün / leak | Dashboard → API → Rotate |
| `SUPABASE_ANON_KEY` | Gerekmez (public) | — |
| `IYZICO_SECRET_KEY` | Yıllık / leak | Iyzico dashboard |
| `STRIPE_SECRET_KEY` | Yıllık / leak | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Her endpoint değişiminde | Stripe re-register |
| `ANTHROPIC_API_KEY` | Yıllık / leak | Anthropic console |
| `OPENAI_API_KEY` | Yıllık / leak | OpenAI dashboard |
| `RESEND_API_KEY` | Yıllık / leak | Resend dashboard |
| JWT secret (Supabase Auth) | 90 gün | Supabase Dashboard → Auth |

---

## 6. GitHub Actions Secret Kullanımı

Secrets GitHub Settings → Secrets and Variables → Actions'a eklenmelidir:

```yaml
# .github/workflows/deploy.yml örnek pattern
- name: Deploy
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
    # Service role sadece migration workflow'unda
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

**Kural:** Log adımlarında secret değerleri maskele. GitHub Actions otomatik maskeler ama `echo $SECRET` gibi kullanımlardan kaçın.

---

## 7. Leak Olursa — Acil Prosedür

Detay: `docs/13-INCIDENT_RESPONSE.md` → T04 (Service Role Leak) senaryosu.

Özet adımlar:
1. **Hemen rotate** — hangi key ise dashboard'a git, invalidate et
2. Supabase için: `Settings → API → Rotate API Keys`
3. Vercel'de yeni key'i environment'a ekle
4. GitHub secret'ı güncelle
5. Leak commit'ini git history'den temizle (`git filter-repo`)
6. Incident kaydı oluştur

---

## 8. .env.local Mevcut Sorunları (Sprint 2 Tespiti)

| Sorun | Düzeltme |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` dashboard URL'i | `https://idhevassnehteseiepzv.supabase.co` olmalı |
| `SUPABASE_SERVICE_ROLE_KEY` anon key ile aynı | Dashboard → Settings → API → `service_role` key kopyalanmalı |

> Sen bu değerleri güncelleyeceksin — secret değerleri burada yazılmaz.
