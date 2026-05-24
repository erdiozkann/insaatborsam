# 11 — Uyumluluk (Teknik Notlar)

**Status:** Aktif | **Last Updated:** 2026-05-20 | **Owner:** Erdi  
**Uyarı:** Bu dosya **teknik uyum notlarıdır**, hukuki tavsiye değildir.  
Resmi KVKK / hukuk konuları için uzman danışmanlık alınmalıdır.

---

## 1. KVKK — Kişisel Veri Sınıfları

### Genel Kişisel Veri

| Veri | Tablo | Saklama Süresi | Silme Yöntemi |
|---|---|---|---|
| Ad Soyad | `profiles.full_name` | Hesap + 30 gün | Soft delete → hard delete |
| E-posta | `profiles.email` | Hesap + 30 gün | Hard delete |
| Telefon | `profiles.phone` | Hesap + 30 gün | Hard delete |
| Adres | `addresses.*` | Kullanıcı silinceye | Hard delete (CASCADE) |
| IP adresi | `staff_users.last_login_ip` | 1 yıl | Cron ile temizle |
| Mesajlar | `messages.*` | 2 yıl | Soft delete → hard delete |
| Bildirimler | `notifications.*` | Belirsiz (Faz 2 cron) | Hard delete |

### Özel Nitelikli Kişisel Veri (KVKK Madde 6)

| Veri | Tablo | Risk |
|---|---|---|
| TC Kimlik / Pasaport | `seller_kyc.id_document_path` | Çok yüksek |
| Vergi kimlik belgesi | `seller_kyc.tax_certificate_path` | Yüksek |
| İmza sirküleri | `seller_kyc.signature_circular_path` | Yüksek |
| IBAN | `seller_profiles.iban_encrypted` | Yüksek |

**KYC belgesi kuralları:**
- Storage bucket `seller-kyc` private=true — public URL asla üretilmez
- Signed URL TTL: 300 saniye
- KYC onaylandıktan sonra belgeler minimum süre tutulur (TTK: 10 yıl ticari belge)
- `review_notes` uygulama katmanında response'dan çıkarılır (satıcıya gösterilmez)

### Finansal Veri (Yasal Saklama)

| Veri | Tablo | Saklama Süresi | Sebep |
|---|---|---|---|
| Sipariş bilgileri | `orders.*` | 10 yıl | TTK |
| Ödeme kayıtları | `payments.*` | 10 yıl | TTK |
| Abonelik kayıtları | `subscriptions.*` | 10 yıl | TTK |
| Webhook logları | `webhook_events.*` | 6 ay → payload temizle | KVKK minimize |
| AI cache | `ai_cache.*` | expires_at (max 30 gün) | KVKK minimize |
| Admin audit | `admin_audit_logs.*` | 1 yıl | Güvenlik |

---

## 2. KVKK Açık Rıza

Kayıt akışında iki ayrı onay checkbox'ı zorunlu:

| Rıza | Kolon | Zorunlu mu |
|---|---|---|
| KVKK aydınlatma metni | `profiles.consent_kvkk` | ✅ Zorunlu — olmadan hesap açılamaz |
| Pazarlama iletişimi | `profiles.consent_marketing` | ❌ İsteğe bağlı |

`handle_new_user` trigger `consent_kvkk_at` timestamp'ini metadata'dan alır. `consent_kvkk = FALSE` ise profil oluşur ama hesap eksik sayılır — onboarding tamamlama ekranına yönlendirme.

---

## 3. Kullanıcı Hakları

| Hak | Teknik Uygulama | Durum |
|---|---|---|
| Erişim hakkı | Profile page — kendi verisi | ✅ RLS ile |
| Düzeltme hakkı | Profile update | ✅ RLS update policy |
| Silme hakkı (unutulma) | Soft delete → 30 gün → hard delete | 🟡 CRON Faz 1.5 |
| Taşınabilirlik | JSON export endpoint | 🔴 Faz 2 |
| İtiraz hakkı | Pazarlama opt-out | ✅ consent_marketing = FALSE |
| Kısıtlama hakkı | Hesap dondurma (is_active = FALSE) | ✅ Manuel |

**KVKK silme akışı (Faz 1.5):**
1. Kullanıcı talep gönderir
2. Edge Function: `UPDATE profiles SET deleted_at = NOW()`
3. 30 gün sonra cron: sipariş kaydı anonimleştirilir, profile hard delete
4. `admin_audit_logs`: silme aksiyonu kayıt altına alınır

---

## 4. AI Provider Veri Aktarımı

### Anthropic (Claude)

| Konu | Durum |
|---|---|
| Veri lokasyonu | ABD sunucuları |
| KVKK yurt dışı transfer | Article 9 — ilgili kişi rızası veya yeterlilik kararı gerekebilir |
| Prompt'ta PII | **Yasak** — `ai_cache` için hash; prompt'a raw PII girmez |
| Model training | API Terms: Anthropic API'si ile gönderilen veri default model training'e dahil edilmez |

### OpenAI (Embedding)

| Konu | Durum |
|---|---|
| Kullanılan veri | Ürün adı, açıklama, RFQ başlığı — kimlik bilgisi değil |
| Zero Data Retention | API endpoint `v1/embeddings` için aktif |

**Teknik önlem:** Embedding API'sine giden metin: ürün adı + açıklama (PII içermez). Kullanıcıya ait serbest metin (RFQ açıklaması) gönderilmeden önce kişisel veriden arındırılmalı.

---

## 5. Supabase Veri Lokasyonu

- Proje region: `eu-central-1` (Frankfurt) — kontrol et
- Gerçek proje URL: `idhevassnehteseiepzv.supabase.co`
- EU region tercih et: GDPR / KVKK AB transfer uyumu kolaylaşır
- Supabase SOC2 Type II sertifikalı

> **Aksiyon:** Supabase Dashboard → Settings → General → Region doğrulanmalı.

---

## 6. Ödeme Uyumu

### Iyzico

| Konu | Durum |
|---|---|
| BDDK lisansı | ✅ Lisanslı ödeme kuruluşu |
| 3DS zorunlu | ✅ `is_3d_secure = TRUE` default |
| Kart verisi | İyzico'da kalır — bizde sadece `card_last_four` |
| PCI DSS | Iyzico sorumlu |

### Stripe

| Konu | Durum |
|---|---|
| Kullanım | Sadece web üyelik — EUR abonelik |
| PCI DSS | Stripe sorumlu |
| SCA (Strong Customer Auth) | Stripe Elements ile otomatik |

---

## 7. Apple / Google Uyumu

- **App Store Review Guidelines 3.1.1:** Dijital içerik/abonelik → in-app purchase zorunlu. **İstisna:** Fiziksel mal satışı (bizim ürünlerimiz).
- **Üyelik kuralı:** Üyelik satın alımı **sadece web** (`insaatborsam.com`). Mobil app'te üyelik ekranı/butonu yok.
- **Webview**: Üyelik sayfasına yönlendirme mobil uygulamadan yapılmamalı (steering kuralı ihlali).
- Detay: `.claude/skills/apple-google-compliance/SKILL.md`

---

## 8. Loglama Kuralları

| Log Tipi | PII Dahil mi | Aksiyon |
|---|---|---|
| Supabase auth log | E-posta/telefon | Supabase kontrol — log retention ayarla |
| Edge Function log | Mümkün | PII maskele; ham webhook body loglanmaz |
| Sentry error | Stack trace | Kullanıcı ID log'a girebilir; ad/soyad/telefon girilmez |
| PostHog analytics | Anonymized user_id | Tam PII gönderilmez |
| `admin_audit_logs` | before/after_data | Erişim owner/admin — 1 yıl |
| `webhook_events.payload` | PII içerebilir | 6 ay → cron temizle |

---

**Referans:** `docs/09-SECURITY.md` · `docs/12-SECRETS_AND_ENV.md` · `docs/13-INCIDENT_RESPONSE.md`
