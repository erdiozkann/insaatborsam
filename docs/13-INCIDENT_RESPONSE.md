# 13 — Olay Müdahale Planı

**Status:** Aktif | **Last Updated:** 2026-05-20 | **Owner:** Erdi  
**Sorumlu:** Erdi (Avusturya'dan uzaktan). Kritik olaylarda → Supabase support + hukuk danışmanı.

---

## Genel Kurallar

1. **Önce durdur, sonra araştır** — şüpheli durum tespitinde sistemi kısıtla
2. **Her olay kayıt altında** — tarih, süre, etkilenen veri, yapılan aksiyon
3. **Kullanıcı bilgilendirmesi** — KVKK kapsamında 72 saat içinde (ilgili kurumlar)
4. **Commit mesajı yok** — incident boyunca git geçmişi temiz tut

---

## OL-01 — Secret / API Key Sızması

### Örnek senaryolar
- `SUPABASE_SERVICE_ROLE_KEY` commit'e girdi
- `STRIPE_SECRET_KEY` log'a düştü
- `.env.local` GitHub'a push edildi

### İlk 15 dakika
- [ ] Hangi key sızdı? (git history, log, Slack mesajı)
- [ ] Supabase: Dashboard → Settings → API → **Rotate API Keys** (service role + anon)
- [ ] Stripe: Dashboard → Developers → API keys → **Roll**
- [ ] Anthropic/OpenAI: Console → API keys → **Delete + Create**
- [ ] Commit'i git history'den sil: `git filter-repo --path .env.local --invert-paths`

### İlk 1 saat
- [ ] Yeni key'leri Vercel environment'a ekle
- [ ] GitHub Actions secrets güncelle
- [ ] Supabase auth log tara — anormal giriş var mı?
- [ ] Stripe/Iyzico → son 2 saatteki işlemleri kontrol et

### İlk 24 saat
- [ ] Etkilenen key ile yapılmış tüm işlemleri audit et
- [ ] Eğer DB erişimi olduysa `admin_audit_logs` + Supabase log'ları incele
- [ ] Incident raporu oluştur (tarih, etkilenen sistemler, düzeltme adımları)
- [ ] Varsa hukuk danışmanına ilet (KVKK 72 saat bildirimi)

**Kim sorumlu:** Erdi (key rotation + incident raporu)  
**Loglar:** Supabase Dashboard → Logs → API; GitHub audit log

---

## OL-02 — Veritabanı Veri Sızıntısı

### Örnek senaryolar
- RLS bug — başka kullanıcı verisi görüntülenmiş
- SQL injection (Edge Function'da parametresiz sorgu)

### İlk 15 dakika
- [ ] Hangi tablo, hangi kullanıcılar etkilendi?
- [ ] Supabase Dashboard → Database → Logs → şüpheli sorgular
- [ ] Edge Function'ı dondur (Supabase → Edge Functions → **Unpublish**)
- [ ] Etkilenen tabloyu RLS ile tamamen kilitle: `CREATE POLICY "lockdown" ON x FOR ALL USING (false)`

### İlk 1 saat
- [ ] Etkilenen kullanıcıları tespit et (hangi `auth.uid()` verilere erişti)
- [ ] Supabase support'a ticket aç (Pro plan → priority support)
- [ ] Erişilen veri türüne göre KVKK değerlendirmesi (özel nitelikli veri mi?)

### İlk 24 saat
- [ ] RLS bug'ı düzelt, test et, re-deploy
- [ ] Etkilenen kullanıcılara bildirim (KVKK gerektiriyorsa)
- [ ] KVK Kurumu'na 72 saat içinde bildirim (etkilenen veri kişisel ise)

**Loglar:** Supabase → Logs → PostgREST; `admin_audit_logs`

---

## OL-03 — RLS Bug Tespiti

### Örnek senaryo
- Satıcı başka satıcının teklifini görebilir (T01 tehdit modeli)

### İlk 15 dakika
- [ ] Hangi policy kusurlu? Hangi endpoint?
- [ ] Geçici: etkilenen tabloyu kısıtla → `CREATE POLICY "emergency_deny" ON rfq_offers FOR SELECT USING (false)`
- [ ] Emergency deny tüm authenticated kullanıcıyı kilitler — feature durur, güvenlik kazanır

### İlk 1 saat
- [ ] Kusurlu policy'yi düzelt + test et (pgTAP veya Supabase policy tester)
- [ ] New migration: fix policy + `DROP` eski
- [ ] `supabase db push` ile production'a uygula
- [ ] `DROP POLICY "emergency_deny"` (kısıtlamayı kaldır)

### İlk 24 saat
- [ ] Kaç kullanıcı kaç satırı görüntüledi? (Supabase logs)
- [ ] Etkilenen satıcılara gizlilik ihlali bildirimi gerekir mi?

**Loglar:** Supabase → Logs → PostgREST; query parametrelerini incele

---

## OL-04 — Yanlış Ödeme / Duplicate Sipariş

### Örnek senaryolar
- Webhook iki kez işlendi → müşteri iki kez ücretlendirildi
- `order.status = 'paid'` ama ödeme gerçekte alınmadı

### İlk 15 dakika
- [ ] `webhook_events` tablosunda `event_id` ile duplicate var mı?
- [ ] `payments` tablosunda `provider_payment_id` unique ihlali?
- [ ] Stripe/Iyzico dashboard'dan ödeme durumunu teyit et

### İlk 1 saat
- [ ] Etkilenen `order_id` + `payment_id` listele
- [ ] Duplicate sipariş varsa: `UPDATE orders SET status='cancelled'` (service_role ile)
- [ ] Müşteriye iade başlat (Stripe: refund API; Iyzico: refund endpoint)
- [ ] Satıcıya bildirim: ilgili siparişin iptal olduğu

### İlk 24 saat
- [ ] Webhook endpoint'ine idempotency fix uygula
- [ ] `payments.idempotency_key` doğru set ediliyor mu kontrol et

**Loglar:** `webhook_events`; `payments`; Stripe/Iyzico dashboard

---

## OL-05 — Admin Hesabı Ele Geçirilmesi

### İlk 15 dakika
- [ ] Şüpheli oturumu sonlandır: Supabase → Auth → Users → invalidate sessions
- [ ] Hesabı kısıtla: `UPDATE staff_users SET is_active = FALSE WHERE user_id = X`
- [ ] `admin_audit_logs`'u son 24 saate incele — ne yapıldı?

### İlk 1 saat
- [ ] Ele geçirilen hesap hangi role'e sahipti? (owner/admin = kritik)
- [ ] Bu hesapla hangi tablolara erişildi/değiştirildi?
- [ ] Şifre resetle, 2FA sıfırla, yeni oturum aç

### İlk 24 saat
- [ ] Hasarlı veriyi geri al (Supabase point-in-time recovery — Pro plan)
- [ ] Tüm staff'a 2FA enforce et
- [ ] Incident raporu: erişilen veriler + etkilenen kullanıcılar

**Loglar:** `admin_audit_logs`; `staff_users.last_login_ip`; Supabase auth log

---

## OL-06 — KYC Belge Sızıntısı

### İlk 15 dakika
- [ ] Hangi belge yolu ifşa edildi?
- [ ] Supabase Storage → `seller-kyc` bucket → erişim logları (Pro plan)
- [ ] Signed URL'yi hemen geçersiz kıl (TTL zaten 300s ama izleme devam et)
- [ ] Bucket'ı geçici olarak devre dışı bırak (Supabase → Storage → Policies → deny all)

### İlk 1 saat
- [ ] Etkilenen satıcıyı tespit et (path'den `seller_id`)
- [ ] KVKK: özel nitelikli kişisel veri (Madde 6) — KVK Kurumu bildirimi zorunlu (72 saat)
- [ ] Satıcıya bildirim

### İlk 24 saat
- [ ] Storage RLS policy'sini gözden geçir / düzelt
- [ ] Incident raporu + hukuk danışmanı

**Loglar:** Supabase Storage logs (Pro plan)

---

## OL-07 — AI Provider Yanlış Veri Gönderimi

### Örnek senaryo
- Edge Function hata ile kullanıcı adı / TC no içeren prompt gönderdi

### İlk 15 dakika
- [ ] Edge Function'ı dondur (Supabase → Edge Functions → Unpublish)
- [ ] Anthropic / OpenAI API Key'i rotate et (ihtiyat)

### İlk 1 saat
- [ ] Hangi prompt gönderildi? Edge Function log'u incele
- [ ] Anthropic: `privacy@anthropic.com` ile iletişime geç — veriyi sil talebi

### İlk 24 saat
- [ ] Prompt'tan PII temizleme kodu yaz ve test et
- [ ] Re-deploy

---

## OL-08 — App Store / Play Store Reddi

### İlk 15 dakika
- [ ] Red gerekçesini oku (App Store Connect / Google Play Console)
- [ ] Eğer in-app purchase ihlali: mobil app'teki üyelik/ödeme ekranlarını kontrol et

### İlk 1 saat
- [ ] Gerekçeye göre düzeltme planı (CLAUDE.md → apple-google-compliance kuralları)
- [ ] EAS Build ile yeni binary yayınla

### İlk 24 saat
- [ ] Düzeltilmiş versiyonu gönder
- [ ] `apple-google-compliance` skill ile tekrar review

---

## Incident Log Şablonu

```markdown
## Incident #XXX — YYYY-MM-DD

**Başlangıç:** HH:MM UTC
**Tespit:** Nasıl fark edildi?
**Etki:** Etkilenen kullanıcı sayısı / tablo / sistem
**Kök Neden:** Neden oldu?
**Uygulanan Düzeltme:** Adımlar
**Önleyici Tedbirler:** Tekrar olmaması için ne yapıldı?
**Kapanış:** HH:MM UTC
**Durum:** Kapalı / Açık
```

Tüm incident logları `docs/incidents/` klasörüne eklenir (repo'da, gizli değil).
