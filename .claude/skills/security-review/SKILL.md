---
name: security-review
description: Her yeni feature, API route, Edge Function, admin action, payment flow, auth flow, webhook handler yazılırken otomatik tetiklenir. Güvenlik kontrol listesi. "auth", "route", "edge function", "payment", "webhook", "admin", "api", "rls", "storage", "KYC", "staff", "service_role", "güvenlik", "erişim" geçen istekler için.
---

# Security Review Kontrol Listesi

İnşaat Borsam B2B marketplace — her yeni kod parçasında bu listeyi çalıştır.  
Referans: `docs/09-SECURITY.md` · `docs/10-THREAT_MODEL.md`

## ÇALIŞMA KURALI

Bu skill tetiklendiğinde, kodu yazmadan veya yazdıktan sonra aşağıdaki soruları yanıtla. Tüm yanıtları kısaca yaz ve açık sorunları işaretle.

---

## 1. Kimlik Doğrulama

- [ ] Endpoint korunuyor mu? Kim erişebilir? (anon / buyer / seller / staff / service_role)
- [ ] Server-side: `getUser()` kullanılıyor mu? (`getSession()` değil — JWT server doğrulama zorunlu)
- [ ] JWT doğrulama olmadan işleme devam edilmez mi?
- [ ] Sadece authenticated erişmeli ama anon policy yazılmış mı? → Hata

## 2. Yetkilendirme (RLS + App Katmanı)

- [ ] Supabase sorgusu RLS'e güveniyor mu? (evet = doğru)
- [ ] App katmanında ek filtre var mı? (örn. `WHERE buyer_id = currentUser.buyerProfileId`)
- [ ] Multi-tenant izolasyon: başka bir buyer/seller'ın verisine erişim mümkün mü? → T01/T02
- [ ] `seller_profiles.is_verified` değiştirilebilir mi? → T03

## 3. Service Role Kullanımı

- [ ] `SUPABASE_SERVICE_ROLE_KEY` sadece server-side dosyada mı? (Route Handler, Edge Function)
- [ ] Client component'te import var mı? → **Kırmızı çizgi**
- [ ] `NEXT_PUBLIC_` prefix'li olmayan env client'a sızdı mı?

## 4. Kişisel Veri (PII)

- [ ] İşlenen veri KVKK kapsamında mı? (ad, e-posta, telefon, adres, kimlik, IBAN)
- [ ] Özel nitelikli veri var mı? (TC kimlik, vergi belgesi, sağlık verisi) → Ekstra koruma
- [ ] Log'a PII düşüyor mu? (`console.log`, Sentry, PostHog)
- [ ] AI prompt'a raw PII giriyor mu? → Yasak; hash veya anonimize

## 5. Loglama

- [ ] Secret / API key log'a yazılıyor mu? → Kırmızı çizgi
- [ ] Error mesajı kullanıcıya döndürülüyor mu? (stack trace, SQL hata, key adı) → Maskele
- [ ] `webhook_events.payload` loglanıyor mu? → 6 ay max, sonra temizle

## 6. Ödeme / Webhook

- [ ] Webhook endpoint imza doğrulaması var mı? (Stripe: `constructEvent`, Iyzico: HMAC)
- [ ] İdempotency key set ediliyor mu? (`payments.idempotency_key`)
- [ ] `webhook_events` tablosuna kayıt düşüyor mu? (duplicate event koruması)
- [ ] Ödeme tutarı server-side hesaplanıyor mu? (client'tan gelen tutar kabul edilemez)

## 7. Admin / Staff

- [ ] Staff aksiyonu `admin_audit_logs`'a yazılıyor mu?
- [ ] `is_active_staff()` veya `has_staff_role()` kullanılıyor mu? (recursive policy riski yok)
- [ ] Staff INSERT/UPDATE/DELETE policy'si yanlışlıkla eklendi mi? → Default SELECT only

## 8. App Store Uyumu

- [ ] Mobil app'te üyelik satın alma / fiyat / "Üye Ol" butonu var mı? → T11
- [ ] Webview üzerinden üyelik sayfasına yönlendirme var mı? → Steering kuralı ihlali
- [ ] Fiziksel mal satışı mı? → In-app purchase zorunluluğu yok (istisna)

## 9. Storage

- [ ] KYC belgesi yükleme/okuma için `seller-kyc` private bucket kullanılıyor mu?
- [ ] Signed URL TTL 300 saniye mi?
- [ ] Dosya path'inde `{seller_id}` prefix var mı? (izolasyon)
- [ ] Storage URL response'a koyulmuyor mu? (sadece geçici signed URL döndür)

## 10. Dependency

- [ ] Yeni bir npm paketi eklendi mi? → `dependency-safety-check` skill'i çalıştır
- [ ] Paket secret istiyor mu? Server-side mi, client-side mi?

---

## SONUÇ FORMATI

Review tamamlandığında şunu yaz:

```
## Security Review Sonucu

✅ Geçen kontroller: X/10
⚠️ Dikkat gerektiren: [açıkla]
❌ Bloklayıcı sorunlar: [açıkla — kod yazılmadan önce çözülmeli]
```

Bloklayıcı sorun varsa → kodu yazmadan önce Erdi'ye sor.
