---
name: dependency-safety-check
description: Yeni npm paketi, SDK, plugin, external API, library eklenirken tetiklenir. Güvenlik, lisans, bundle size ve PII riski kontrolü. "npm install", "pnpm add", "yarn add", "import", "require", "package.json", "dependency", "library", "SDK", "plugin" geçen istekler için.
---

# Dependency Safety Check

İnşaat Borsam'da yeni bağımlılık eklemek dikkat ister.  
Stack: `docs/03-TECH.md`. Anti-pattern: "Yeni library eklemek için PR açma — önce konuş."

## Kontrol Listesi

### 1. Gereklilik

- [ ] Bu pakete gerçekten ihtiyaç var mı?
- [ ] Mevcut stack'te (Supabase, TanStack Query, Zustand, Zod, shadcn) çözüm yok mu?
- [ ] Kaç satır kod ile kendin yazabilirsin? (50 satır → kütüphane gerekmiyor)

### 2. Güvenilirlik

- [ ] npm weekly downloads: <10K → şüphelenin
- [ ] Son commit tarihi: >1 yıl önce → bakımsız
- [ ] GitHub yıldız: <500 → dikkat (popüler alanda)
- [ ] Known vulnerabilities: `npm audit` koşulacak
- [ ] `package.json` bağımlılıklarında şüpheli paket var mı?

### 3. Server / Client Ayrımı

- [ ] Server-only mi, client bundle'a giriyor mu?
- [ ] Client bundle'a giriyorsa bundle size etkisi nedir? (>50KB → soru işareti)
- [ ] `next.config.ts` `transpilePackages`'a eklemek gerekiyor mu?

### 4. Secret / Credential İsteği

- [ ] Paket API key / secret istiyor mu?
- [ ] Bu secret'ı nerede tutacaksın? (`docs/12-SECRETS_AND_ENV.md` kuralına uygun mu?)
- [ ] Server-side secret client component'e sızmıyor mu?

### 5. Kişisel Veri (PII)

- [ ] Paket veriyi dış sunucuya gönderiyor mu? (analytics, monitoring, error tracking)
- [ ] Kullanıcı verisi (isim, telefon, e-posta) bu paketle işlenecek mi?
- [ ] KVKK: yurt dışı transfer oluyor mu? (`docs/11-COMPLIANCE.md` → AI provider)

### 6. Lisans

- [ ] MIT / Apache 2.0 / BSD → ✅ güvenli
- [ ] GPL → ⚠️ copyleft etkisi olabilir — hukuk danışmanı
- [ ] Commercial / proprietary → ❌ soru sor

### 7. Apple / Google Uyumu (Mobil Paketler)

- [ ] Paket Apple in-app purchase zorunluluğu içeriyor mu?
- [ ] `apps/buyer` veya `apps/seller`'a ekleniyorsa: kullanıcı verisi veya ödeme işliyor mu?

---

## Karar

### ✅ Ekle

Tüm kontroller geçtiyse, şu sırayla ekle:

1. `pnpm --filter @insaatborsam/web add paket` (veya ilgili app)
2. `apps/web/package.json` → gözden geçir
3. Gerekirse `next.config.ts` → `transpilePackages`
4. `pnpm --filter @insaatborsam/web typecheck`

### ⚠️ Dikkatli Ekle

Sorun yok ama dikkat: `docs/03-TECH.md` Decision Log'una neden eklendiğini yaz.

### ❌ Ekleme

- Known vulnerability → alternatif ara veya kendin yaz
- GPL lisans → önce sor
- PII dışarı → KVKK onayı olmadan ekleme
- Bundle size +200KB → önce sor
- Bakımsız paket → alternatif ara
