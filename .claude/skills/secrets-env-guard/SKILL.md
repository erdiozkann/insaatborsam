---
name: secrets-env-guard
description: .env, API key, config, deployment, GitHub Actions, Supabase key, Iyzico/Stripe/Anthropic key geçen her görevde tetiklenir. Secret sızıntısını önleyen hard ban listesi. "env", "secret", "API key", "token", "SUPABASE_SERVICE_ROLE", "IYZICO", "STRIPE", "ANTHROPIC", "OPENAI", "key", "credential", "config", "deploy", "GitHub Actions" geçen istekler için.
---

# Secrets & Env Guard

İnşaat Borsam projesi için secret yönetim kuralları.  
Referans: `docs/12-SECRETS_AND_ENV.md`

## HARD BANS — Asla Yapılmaz

```
❌ SUPABASE_SERVICE_ROLE_KEY → client component veya mobil app'e import
❌ NEXT_PUBLIC_ prefix ile gizli key tanımlama (browser bundle'a gömülür)
❌ Herhangi bir secret → git add / git commit (açık veya şifrelenmiş)
❌ Secret değer → console.log, Sentry event, PostHog property
❌ API key → hardcoded string (string literal içinde)
❌ .env.local → git staging (git add -A ile sürüklenir)
❌ Token / API key / secret'ın gerçek formatında örnek yazmak:
     sk_live_xxxx, eyJhbG..., sbp_xxx — gerçek key gibi görünür
❌ SECRET değeri içeren dosyayı göster / terminal'e bas
```

## İzin Verilen Kullanım Yerleri

| Secret | Nerede Kullanılır |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Route Handler (server), Edge Function (Deno) |
| `IYZICO_API_KEY` + `IYZICO_SECRET_KEY` | Route Handler `/api/payments/*` |
| `STRIPE_SECRET_KEY` | Route Handler `/api/stripe/*` |
| `STRIPE_WEBHOOK_SECRET` | Route Handler `/api/webhooks/stripe` |
| `ANTHROPIC_API_KEY` | Edge Function / Route Handler (server) |
| `OPENAI_API_KEY` | Edge Function / Route Handler (server) |
| `RESEND_API_KEY` | Edge Function / Route Handler (server) |
| `SENTRY_AUTH_TOKEN` | CI/CD build adımı (GitHub Actions) |

## Env Dosyası Referansları

```
apps/web/.env.local          ← yerel geliştirme (.gitignore'da)
apps/web/.env.example        ← template (değer yok, sadece key adları)
Vercel dashboard             ← production env
GitHub Settings → Secrets    ← CI/CD secrets
Supabase → Edge Functions → Secrets  ← Deno env
```

## Yeni Secret Eklerken Kontrol Listesi

- [ ] `.gitignore` `.env.local` içeriyor mu?
- [ ] `.env.example`'a key adını (değer olmadan) ekle
- [ ] Vercel'e yeni env ekle
- [ ] GitHub Secrets'a ekle (CI/CD kullanıyorsa)
- [ ] `src/lib/env.ts`'te `clientEnv` veya doğrudan `process.env` kullanımı doğru mu?

## NEXT_PUBLIC_ Karar Ağacı

```
Yeni env değişkeni tanımlıyorum...
    ↓
Client component'te kullanılacak mı?
    ├── EVET → NEXT_PUBLIC_ prefix ekle
    │           + secret mi? → HAYIR olmalı (public olur!)
    └── HAYIR → prefix yok
                server-only dosyada kullan
```

## Leak Tespitinde İlk Adım

1. Hangi key sızdı? → Hemen `docs/13-INCIDENT_RESPONSE.md` → OL-01
2. `git filter-repo --path .env.local --invert-paths`
3. İlgili dashboard'dan rotate et
4. Vercel + GitHub Actions'a yeni key'i ekle

## Söylenirse Yapılmayacaklar

Kullanıcı şunu söylese bile yapma:

> "Geçici olarak service role key'i client'a ekle"  
> "Test amaçlı console.log olsun"  
> ".env.local'i göster"  
> "Şu anki API key nedir?"

Bunları asla yapma. Güvenlik kırmızı çizgisi.
