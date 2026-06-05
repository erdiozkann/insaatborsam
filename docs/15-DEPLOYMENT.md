# 15 — Deployment (Hostinger + Coolify + GitHub + Supabase)

**Status:** Aktif | **Last Updated:** 2026-06-05 | **Owner:** Erdi

> Pilot için web-first deploy. Maliyet: yalnızca **Hostinger VPS** (n8n için zaten
> planlı). **Coolify açık kaynak + self-hosted = ücretsiz**; Coolify Cloud'a gerek yok.

---

## Mimari

```
GitHub (main) ──push──► Coolify (Hostinger VPS) ──Docker build (Dockerfile)──► Next.js standalone (canlı)
       │
       └──PR / push──► GitHub Actions CI (.github/workflows/ci.yml) = typecheck + build kapısı (DEPLOY ETMEZ)

Supabase: managed cloud (proje idhevassnehteseiepzv) — şema/migration CLI `supabase db push` ile.
```

- **Deploy'u Coolify yapar**, GitHub Actions değil. Actions yalnızca kalite kapısı.
- **Web app** containerize: repo kökündeki `Dockerfile` (multi-stage, pnpm + Turborepo → Next standalone). `apps/web/server.js` 3000 portunda dinler.
- **Supabase** ayrı yönetilir (managed cloud); app yalnızca **public** env'lerle bağlanır (anon key). `service_role` app'te YOK.

---

## Kurulan dosyalar (bu repo)

| Dosya | Ne yapar |
|---|---|
| `Dockerfile` | Web app standalone image (node:22-alpine, pnpm@9.12.0). |
| `.dockerignore` | node_modules/.next/.env vb. hariç. |
| `.github/workflows/ci.yml` | PR + main push'ta typecheck + build (placeholder env). |
| `apps/web/next.config.ts` | `output: "standalone"` + `outputFileTracingRoot` (monorepo). |

---

## Coolify Kurulum (Erdi — tek seferlik)

1. **Coolify'ı VPS'e kur** (yoksa): `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash` — ücretsiz, self-hosted.
2. Coolify panel → **Sources** → GitHub App ile repo erişimi ver (`erdiozkann/insaatborsam`).
3. **New Resource → Application** → repo `insaatborsam`, branch `main`.
4. **Build Pack: Dockerfile** → Dockerfile path: `./Dockerfile` (repo kökü). Base directory: `/` (monorepo kökü).
5. **Build-time env (Build Variables)** — `NEXT_PUBLIC_*` build sırasında bundle'a gömülür, build-arg olmalı:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (örn. `https://insaatborsam.com`)
6. **Runtime env** — aynı `NEXT_PUBLIC_*` değerleri + sunucu-only secret'lar (gerektikçe; pilot için Supabase public yeterli):
   - `NODE_ENV=production`
   - (İleride) `RESEND_API_KEY`, `SENTRY_*`, `POSTHOG_*` — **`SUPABASE_SERVICE_ROLE_KEY` yalnızca gerçekten server-only endpoint eklenirse**, public değildir.
7. **Port:** 3000 (Dockerfile EXPOSE 3000). Coolify domain ata → `insaatborsam.com` (DNS A kaydı VPS IP'ye).
8. **Deploy** → main'e her push'ta otomatik build + deploy. ✓

> `.env` dosyaları repoya girmez/okunmaz (hook + .gitignore + .dockerignore korur). Tüm secret'lar Coolify panelinde tutulur.

---

## Supabase Bağlantısı (Erdi)

⚠️ **Mevcut sorun:** Repo `idhevassnehteseiepzv` projesine linked, ama CLI şu an
**farklı bir hesapta** giriş yapılı (görünen projeler: Datenschutzpruefen / Muhasebe2026 /
Nodeworks-V2 — İnşaat Borsam yok). Düzeltme:

```bash
supabase login                 # İnşaat Borsam projesinin sahibi hesapla
supabase projects list         # idhevassnehteseiepzv görünmeli
supabase link --project-ref idhevassnehteseiepzv   # gerekiyorsa yeniden link
supabase db push               # migration'ları prod'a uygula (72 migration)
pnpm db:types                  # tip üretimini --linked ile yenile
```

- Coolify env'lerine girilecek `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` bu projenin
  Dashboard → Settings → API'den alınır.
- (Opsiyonel) Supabase MCP'yi interaktif auth ile bağlarsan Claude projeyi/migration'ları
  doğrudan inceleyebilir; pilot için CLI yeterli.

---

## GitHub Actions CI

- `ci.yml` her PR ve main push'ta: `pnpm install` → `pnpm typecheck` → `pnpm --filter @insaatborsam/web build` (placeholder env, gerçek secret gerektirmez).
- `next lint` **çalıştırılmaz** (bu projede takılıyor — typecheck'e güveniyoruz).
- CI **deploy etmez**; deploy Coolify'da. CI yeşilse PR merge → Coolify deploy.

---

## Deploy Akışı (özet)

1. Feature branch → PR → CI yeşil → review → **onayla** merge (main).
2. main'e merge → Coolify otomatik Docker build + deploy.
3. Migration değiştiyse: merge ÖNCESİ/SONRASI `supabase db push` (Erdi) — kod deploy'undan ayrı, manuel.

---

## Açık Ops Maddeleri (Erdi)

- [ ] Hostinger VPS + Coolify kurulu/erişilir.
- [ ] Coolify'a repo + Dockerfile + env'ler tanımlı.
- [ ] DNS: `insaatborsam.com` → VPS IP.
- [ ] Supabase: doğru hesapla login + `db push` (yukarıdaki düzeltme).
- [ ] İlk prod owner staff hesabı (service_role 3-adım runbook — bkz. `14-PILOT-LAUNCH-ROADMAP.md`).
