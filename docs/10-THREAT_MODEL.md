# 10 — Tehdit Modeli

**Status:** Aktif | **Last Updated:** 2026-05-20 | **Owner:** Erdi  
**Metodoloji:** STRIDE (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation)  
**Kapsam:** Faz 1 sistemleri

---

## Saldırgan Profilleri

| Profil | Motivasyon | Teknik Seviye |
|---|---|---|
| **Rakip satıcı** | Başka satıcının fiyatını/teklifini öğrenmek | Düşük–orta |
| **Kötü niyetli alıcı** | Ücretsiz ürün, chargeback | Düşük |
| **Kötü niyetli satıcı** | Sahte doğrulama, komisyon kaçırma | Orta |
| **Sızıntı arayan** | Kullanıcı verisi, IBAN, KYC belgesi | Orta–yüksek |
| **Otomasyon botu** | Veri kazıma, fiyat izleme | Düşük–orta |
| **İçeriden tehdit** | Eski çalışan, kötü niyetli staff | Yüksek |

---

## Tehdit Kataloğu

### T01 — Satıcı Başka Satıcının Teklifini Görür (IDOR)

**Senaryo:** Satıcı A, kendi teklifini sunarken Satıcı B'nin fiyatını öğrenmek için API'yi dener.

| Alan | Detay |
|---|---|
| Risk | Gizli teklif prensibi ihlali → rekabet avantajı kaybı, platform güveni çöker |
| Etki | Yüksek (iş modeli hasarı) |
| Mevcut koruma | `rfq_offers_select_own_seller` policy — `seller_id = auth.uid()`'nin seller_profile'ı ile kısıtlı; başka satıcının satırı döndürülmez |
| Eksik | Uygulama katmanında da `seller_id` filtresi zorunlu |
| Önerilen kontrol | Penetrasyon testi: farklı satıcı JWT ile GET `/rfq-offers?rfq_id=X` çağrısı → 0 sonuç beklenir |

---

### T02 — Alıcı Başka Alıcının Siparişini Görür (IDOR)

**Senaryo:** Alıcı A, URL'deki `order_id`'yi değiştirerek Alıcı B'nin siparişini açmaya çalışır.

| Alan | Detay |
|---|---|
| Risk | Teslimat adresi, alınan ürünler, ödeme durumu ifşası |
| Etki | Yüksek (KVKK ihlali) |
| Mevcut koruma | `orders_select_buyer` policy — `buyer_id IN (SELECT id FROM buyer_profiles WHERE user_id = auth.uid())` |
| Eksik | — |
| Önerilen kontrol | Auth middleware'de `order.buyer_id === currentUser.buyer_profile_id` kontrolü |

---

### T03 — Satıcı Kendini Verified Yapabilir

**Senaryo:** Satıcı, `seller_profiles.is_verified = true` UPDATE yapmaya çalışır.

| Alan | Detay |
|---|---|
| Risk | Doğrulanmamış satıcı verified görünür → alıcılar sahte satıcıyla muhatap olur |
| Etki | Çok yüksek (platform güveni) |
| Mevcut koruma | `seller_profiles_update_own` WITH CHECK: `is_verified = (SELECT sp.is_verified FROM seller_profiles sp WHERE sp.id = ...)` — mevcut değere kilitli |
| Eksik | Faz 1.5'te trigger ile pekiştirilecek |
| Önerilen kontrol | Test: `UPDATE seller_profiles SET is_verified=true WHERE user_id=auth.uid()` → satır değişmemeli |

---

### T04 — Service Role Key Sızması

**Senaryo:** Bir geliştirici `SUPABASE_SERVICE_ROLE_KEY`'i commit'e dahil eder veya client bundle'a gömülür.

| Alan | Detay |
|---|---|
| Risk | Tüm RLS bypass — tüm veritabanı okunabilir/yazılabilir; KVKK felaket |
| Etki | Kritik |
| Mevcut koruma | `.gitignore` → `.env.local`; `NEXT_PUBLIC_` olmayan env'ler Next.js'te client bundle'a girmez |
| Eksik | Pre-commit hook yok (gizlilik taraması) |
| Önerilen kontrol | `git-secrets` veya `truffleHog` CI entegrasyonu; GitHub secret scanning aktive et |

---

### T05 — Webhook Replay / Duplicate Event

**Senaryo:** Saldırgan, başarılı ödeme webhook'unu tekrar göndererek siparişi iki kez "ödendi" işaretlemeye çalışır.

| Alan | Detay |
|---|---|
| Risk | Stok düşer, satıcıya bildirim gider; muhasebe tutarsızlığı |
| Etki | Orta |
| Mevcut koruma | `webhook_events` UNIQUE(provider, event_id) → duplicate `processing_status = 'skipped'` |
| Eksik | İmza doğrulama kodu henüz Route Handler'da yazılmadı (Sprint 3) |
| Önerilen kontrol | `stripe.webhooks.constructEvent()` / Iyzico HMAC doğrulama Sprint 3'te |

---

### T06 — AI Cache Poisoning

**Senaryo:** Saldırgan, kötü amaçlı içerik cache'e enjekte eder; sonraki kullanıcılar zararlı yanıt alır.

| Alan | Detay |
|---|---|
| Risk | Yanlış RFQ parse → yanlış sipariş; yanlış kategori eşleştirme |
| Etki | Orta |
| Mevcut koruma | `ai_cache` sıfır policy → authenticated kullanıcı INSERT yapamaz; sadece service_role |
| Eksik | — |
| Önerilen kontrol | Cache değerleri tür/format validation'dan geçmeli (Edge Function'da) |

---

### T07 — KYC Belge Sızıntısı (Storage)

**Senaryo:** Saldırgan, `seller-kyc` bucket URL'ini tahmin etmeye veya başka satıcının signed URL'ini ele geçirmeye çalışır.

| Alan | Detay |
|---|---|
| Risk | TC Kimlik, vergi levhası, IBAN belgesi ifşası → KVKK Madde 6 ihlali |
| Etki | Çok yüksek (yasal yaptırım riski) |
| Mevcut koruma | Bucket private=true; signed URL 300 saniye TTL; path'de `{seller_id}` prefix |
| Eksik | Storage RLS politikası henüz yazılmadı (Sprint 3) |
| Önerilen kontrol | Supabase Storage → `seller-kyc` bucket için RLS: `auth.uid()::text = (storage.foldername(name))[1]` |

---

### T08 — Admin Hesabı Ele Geçirilmesi (Account Takeover)

**Senaryo:** Phishing veya şifre doldurma ile staff hesabına erişim.

| Alan | Detay |
|---|---|
| Risk | Tüm kullanıcı verisi, siparişler, ödemeler erişilebilir; fraud |
| Etki | Kritik |
| Mevcut koruma | 2FA TOTP (`staff_users.two_factor_enabled`); `ip_whitelist`; `last_login_ip` audit |
| Eksik | Faz 1.5'te 2FA enforce edilecek; şu an uygulama katmanında |
| Önerilen kontrol | Login başarısız denemeler için rate limiting + alert; anormal IP'de force 2FA |

---

### T09 — RLS Bypass

**Senaryo:** Supabase'de henüz bilinmeyen RLS bypass tekniği veya yanlış yazılmış policy.

| Alan | Detay |
|---|---|
| Risk | Veri sızıntısı |
| Etki | Yüksek |
| Mevcut koruma | Her tabloda ayrı `_rls.sql`; supabase-rls-validator skill ile yazıldı |
| Eksik | Automated RLS test suite yok |
| Önerilen kontrol | `pgTAP` ile her policy için test; Supabase'in yerleşik policy tester |

---

### T10 — Storage Signed URL Sızıntısı

**Senaryo:** Geçerli bir signed URL log'a düşer veya başkasına iletilir.

| Alan | Detay |
|---|---|
| Risk | 300 saniye içinde belgeye erişilebilir |
| Etki | Orta |
| Mevcut koruma | TTL 300 saniye; HTTPS transport |
| Eksik | URL'nin log'a yazılmaması için Edge Function'da dikkat gerekli |
| Önerilen kontrol | Signed URL asla loglanmaz, response'da sadece geçici URL döndürülür |

---

### T11 — App Store Anti-Steering İhlali

**Senaryo:** Geliştirici hata ile mobil app'e üyelik satın alma butonu ekler.

| Alan | Detay |
|---|---|
| Risk | App Store / Play Store reddi; Apple commission claim |
| Etki | Yüksek (deploy block) |
| Mevcut koruma | `subscriptions` tablosuna INSERT/UPDATE policy yok; apple-google-compliance skill |
| Eksik | Automated UI test: "buy" butonu bul — yoksa geç |
| Önerilen kontrol | `apple-google-compliance` skill her mobil component değişikliğinde tetiklenir |

---

### T12 — SQL Injection (Edge Function)

**Senaryo:** Kullanıcı girdisi Edge Function'da doğrudan SQL string'e eklenir.

| Alan | Detay |
|---|---|
| Risk | Veri sızıntısı, veri silme |
| Etki | Kritik |
| Mevcut koruma | Supabase JS SDK parametreli sorgular; RLS USING clause kullanıcı inputu almaz |
| Eksik | SECURITY DEFINER fonksiyonlarda `SET search_path` zorunlu |
| Önerilen kontrol | Kod review'da tüm `query(` kullanımları parametreli sorgu pattern'ı ile |

---

## Risk Özeti

| ID | Tehdit | Etki | Olasılık | Öncelik |
|---|---|---|---|---|
| T03 | Satıcı self-verify | Çok yüksek | Düşük | 🔴 P1 |
| T04 | Service role leak | Kritik | Düşük | 🔴 P1 |
| T07 | KYC storage sızıntısı | Çok yüksek | Orta | 🔴 P1 |
| T08 | Admin takeover | Kritik | Düşük | 🔴 P1 |
| T01 | Teklif IDOR | Yüksek | Orta | 🟠 P2 |
| T02 | Sipariş IDOR | Yüksek | Orta | 🟠 P2 |
| T05 | Webhook replay | Orta | Orta | 🟠 P2 |
| T09 | RLS bypass | Yüksek | Düşük | 🟠 P2 |
| T11 | Anti-steering ihlali | Yüksek | Düşük | 🟠 P2 |
| T06 | AI cache poison | Orta | Düşük | 🟡 P3 |
| T10 | Signed URL sızıntısı | Orta | Düşük | 🟡 P3 |
| T12 | SQL injection | Kritik | Çok düşük | 🟡 P3 |

---

**Referans:** `docs/09-SECURITY.md` · `docs/13-INCIDENT_RESPONSE.md`
