# 09 — Güvenlik Politikası

**Status:** Aktif | **Last Updated:** 2026-05-20 | **Owner:** Erdi  
**Kapsam:** Tüm Faz 1 sistemleri — web, mobil, Supabase, Edge Functions, ödeme, AI  
**Referans:** Sprint 1 migration'larında uygulanan kararlar (000001–000066)

---

## 1. Temel Güvenlik Prensipleri

1. **Deny by default** — Supabase'de RLS aktif + eşleşen policy yok = erişim reddedilir. İzin verilmesi gerekiyorsa açıkça yazılır.
2. **Service role key asla client'ta** — `SUPABASE_SERVICE_ROLE_KEY` sadece server-side (Edge Function, API Route). Browser bundle'a asla girmez.
3. **Kullanıcı doğrulaması server-side** — `getUser()` kullanılır (`getSession()` değil). JWT sunucuda Supabase auth ile doğrulanır.
4. **Finansal mutasyon kullanıcıya kapalı** — `orders`, `payments`, `subscriptions` tabloları için kullanıcı UPDATE/DELETE policy'si yoktur. Tüm değişiklik Edge Function veya service_role ile yapılır.
5. **PII minimize** — Loglara kişisel veri düşmez. AI prompt'a raw PII girmez. Cache'te hash tutulur.
6. **Multi-tenant izolasyon** — Bir alıcı başka alıcının verisini, bir satıcı başka satıcının verisini göremez.

---

## 2. Auth Güvenliği

### Kullanıcı Rolleri ve Oturum

| Rol | Platform | Auth Yöntemi |
|---|---|---|
| buyer | Mobil | SMS OTP (Vonage/Netgsm) |
| seller | Mobil + Web | SMS OTP → Email doğrulama |
| staff | Web (Admin) | Email + Şifre + **2FA TOTP** zorunlu |

- Refresh token rotasyonu aktif (`jwt_expiry = 3600`, `refresh_token_reuse_interval = 10`)
- Mobil: Expo SecureStore — şifresiz yerde saklanmaz
- Web: HttpOnly cookies — JS erişemez

### `handle_new_user` Trigger Güvenliği (Migration 000062)
- `SECURITY DEFINER` + `SET search_path = public, pg_temp`
- `REVOKE ALL FROM PUBLIC` — auth trigger dışından çağrılamaz
- Consent bilgisi (KVKK) kayıt anında metadata'dan alınır; eksikse `FALSE` default

### Admin 2FA Zorunluluğu
- `staff_users.two_factor_enabled` kolon var — Faz 1.5'te enforce edilecek
- Şu an uygulama katmanı login akışında kontrol eder
- `staff_users.ip_whitelist` — opsiyonel IP kısıtlaması

---

## 3. Supabase RLS Mimarisi

### Prensip: Her tablo her zaman RLS aktif

```
28 tablo → 28 ayrı _rls.sql migration dosyası (000003–000059)
```

### Tablo Erişim Matrisi

| Tablo | Anon | Buyer | Seller | Staff | service_role |
|---|---|---|---|---|---|
| profiles | ✗ | Kendi | Kendi | ✅ SELECT | ✅ All |
| seller_profiles | Verified=TRUE | Kendi | Kendi | ✅ SELECT | ✅ All |
| buyer_profiles | ✗ | Kendi | ✗ | ✅ SELECT | ✅ All |
| products | Active=TRUE | Active=TRUE | Kendi | ✅ SELECT | ✅ All |
| orders | ✗ | Kendi | Kendi | ✅ SELECT | ✅ All |
| payments | ✗ | Kendi+Sub | Kendi+Sub | ✅ SELECT | ✅ All |
| subscriptions | ✗ | Kendi | Kendi | ✅ SELECT | ✅ All |
| rfq_offers | ✗ | Kendi RFQ | **Sadece kendi** | ✅ SELECT | ✅ All |
| webhook_events | ✗ | ✗ | ✗ | ✗ | ✅ All |
| admin_audit_logs | ✗ | ✗ | ✗ | owner/admin SELECT | ✅ All |
| ai_cache | ✗ | ✗ | ✗ | ✗ | ✅ All |
| seller_kyc | ✗ | ✗ | Kendi (status) | owner/admin/ops SELECT | ✅ All |

### Deny-by-Default Tabloları (Sıfır Policy)
`webhook_events`, `ai_cache` — RLS aktif, policy yok = herkes erişemez. Sadece `service_role` (RLS bypass).

### Staff Erişim Helper Fonksiyonları (Migration 000064)
```sql
-- Aktif staff kontrolü (recursive policy riski yok)
public.is_active_staff() RETURNS BOOLEAN -- SECURITY DEFINER
-- Rol bazlı kontrol
public.has_staff_role(p_role_names TEXT[]) RETURNS BOOLEAN -- SECURITY DEFINER
```

### Kritik RLS Kararları

**Gizli teklif prensibi (`rfq_offers`):** Satıcılar birbirinin teklifini göremez. `rfq_offers_select_own_seller` policy sadece `seller_id = kendi id` döndürür.

**`seller_profiles.is_verified` kilidi:** UPDATE policy içinde `WITH CHECK (is_verified = (SELECT sp.is_verified FROM seller_profiles sp WHERE sp.id = seller_profiles.id))` — kullanıcı kendi doğrulama durumunu değiştiremez.

**`orders` UPDATE kapalı:** Buyer/seller için UPDATE policy yok. Not güncellemeleri `update_buyer/seller_order_note()` SECURITY DEFINER RPC ile yapılır (Migration 000035).

---

## 4. Multi-Tenant İzolasyon

### Buyer Verisi
- `buyer_profiles` public read yok — B2B gizliliği
- Satıcı alıcı adresini sadece sipariş context'inde görür (`orders.delivery_address_id` JOIN)
- `rfqs` gizli — sadece alıcı ve davetli satıcılar

### Satıcı Verisi
- Verified satıcılar public görünür (vitrin mantığı)
- `iban_encrypted` — sadece sahip görür; Faz 1.5'te Vault
- `review_notes` (seller_kyc) — staff özel; uygulama katmanı response'dan çıkarır

### Mesajlaşma İzolasyonu
- `conversations`: buyer_id + seller_id zorunlu
- `messages`: sender_type + sender_profile_id kilidi — başkası adına mesaj gönderilemez

---

## 5. Admin Panel (RBAC)

### Rol Hiyerarşisi (Migration 000066 seed)

| Rol | Temel Yetki |
|---|---|
| owner | Tüm yetkiler (`"*": ["*"]`) |
| admin | User/order/product/seller yönetimi + ayarlar |
| operations | Sipariş/kargo yönetimi, okuma |
| sales | Satıcı acquisition + CRM |
| moderator | Ürün/yorum moderasyonu |
| support | Kullanıcı destek, read-only |
| finance | Ödeme/abonelik/payout |
| analyst | Read-only analytics |

### Admin Audit Log (Migration 000052)
- Her staff aksiyonu kayıt altında (`staff_user_id` + `action` + `resource_type` + `before/after_data`)
- `ON DELETE RESTRICT` — staff hesabı, audit logu silinmeden silinemez
- Saklama: 1 yıl (KVKK)

---

## 6. Storage Güvenliği

### Bucket Kuralları

| Bucket | Public | Kullanım |
|---|---|---|
| `product-images` | ✅ public read | Ürün görselleri |
| `seller-kyc` | ❌ private | Kimlik/vergi belgeleri — KVKK Madde 6 |

### KYC Belge Erişimi
- Path: `{seller_id}/{document_type}/{uuid}.{ext}`
- Erişim: `storage.from('seller-kyc').createSignedUrl(path, 300)` — 5 dakika TTL
- Public URL asla oluşturulmaz
- Uygulama: signed URL alınır, render edilir, TTL sonrası erişilemez hale gelir

---

## 7. Webhook Güvenliği

### İdempotency (Migration 000042)
- `webhook_events` tablosu — `UNIQUE(provider, event_id)`
- Aynı event_id ikinci kez gelirse `processing_status = 'skipped'`
- payload JSONB PII içerebilir — 6 ay saklama, sonra cron ile temizlenir

### Webhook İmza Doğrulaması
- Stripe: `STRIPE_WEBHOOK_SECRET` ile HMAC doğrulama (api route'ta)
- Iyzico: `conversationId` + hash kontrolü
- Doğrulanmamış webhook işlenmez

---

## 8. Ödeme Güvenliği

- **Kart bilgisi hiç saklanmaz** — Iyzico/Stripe'ta kalır
- `card_last_four` + `card_brand` sadece son 4 hane (payments tablosu)
- **3D Secure zorunlu** (`is_3d_secure = TRUE DEFAULT`) — BDDK kuralı
- `idempotency_key` partial unique index — aynı checkout iki kez kaydedilmez
- Para BIGINT cent — float hatası yoktur

### Apple/Google Komisyon Atlatma (CLAUDE.md kural)
- Üyelik satın alımı **sadece web** — Iyzico/Stripe
- Mobil app'te `subscription` INSERT/UPDATE policy yok — kullanıcı yapamaz
- `subscriptions_rls.sql`: yalnızca SELECT policy

---

## 9. AI Cache Güvenliği (Migration 000054-000055)

- `input_hash` — SHA256 hash; ham metin saklanmaz (PII koruması)
- `expires_at TIMESTAMPTZ NOT NULL` — zorunlu TTL (embedding: 7 gün, completion: 1 gün)
- Sıfır policy — deny-by-default; sadece service_role erişir
- Cron: `DELETE FROM ai_cache WHERE expires_at < NOW()`

---

## 10. SECURITY DEFINER Fonksiyonlar

Her SECURITY DEFINER fonksiyon şunları içerir:

```sql
SET search_path = public, pg_temp  -- injection önlemi
REVOKE ALL FROM PUBLIC             -- sadece izinliye grant
GRANT EXECUTE TO authenticated     -- veya daha kısıtlı
```

Mevcut SECURITY DEFINER fonksiyonlar:

| Fonksiyon | Migration | Amaç |
|---|---|---|
| `update_buyer_order_note()` | 000035 | orders.buyer_notes güncelle |
| `update_seller_order_note()` | 000035 | orders.seller_notes güncelle |
| `handle_new_user()` | 000062 | auth.users → profiles trigger |
| `update_seller_rating_on_review()` | 000063 | seller rating cache |
| `is_active_staff()` | 000064 | staff RLS helper |
| `has_staff_role(TEXT[])` | 000064 | rol-bazlı staff kontrolü |

---

## 11. Yasaklar Listesi

- ❌ `service_role` key client bundle'a giremez
- ❌ `any` TypeScript tipi güvenlik kodu yazarken
- ❌ `getSession()` (server-side auth) — `getUser()` kullan
- ❌ RLS bypass (`service_role` client-side) — sadece Edge Function
- ❌ `SECURITY DEFINER` + `SET search_path` eksik
- ❌ Webhook imza doğrulaması atlanması
- ❌ Public storage bucket'ta KYC belgesi
- ❌ AI prompt'a ham PII girme (adres, TC no, IBAN)
- ❌ `DELETE FROM admin_audit_logs` (saklama zorunlu)
- ❌ `TIMESTAMP` (timezone'suz) — hep `TIMESTAMPTZ`
- ❌ `NUMERIC` para kolonu — `BIGINT cent` kullan
- ❌ Hardcoded secret — `.env` kullan
- ❌ Mobil app'te üyelik satın alma akışı
- ❌ Dynamic SQL (SQL injection riski)

---

**Referanslar:**  
`docs/10-THREAT_MODEL.md` · `docs/11-COMPLIANCE.md` · `docs/12-SECRETS_AND_ENV.md` · `docs/13-INCIDENT_RESPONSE.md`
