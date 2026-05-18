# 06 — Yol Haritası

**Status:** Locked Faz 1 | **Last Updated:** 2026-05-18 | **Owner:** Erdi

> Bu doküman **Faz 1'in scope kilidini** içerir. Burada olmayan hiçbir özellik MVP'ye eklenmez.

---

## Faz Şeması (Genel)

| Faz | Dönem | Hedef | Durum |
|---|---|---|---|
| **Faz 0** | Mayıs 2026 | Planlama, tasarım, doküman | ✅ Tamamlandı |
| **Faz 1** | Haz–Ağu 2026 (90 gün) | MVP launch — İstanbul + 3 kategori | 🔵 Aktif |
| **Faz 2** | Eyl–Ara 2026 (90 gün) | Cargo App + Otomasyon + Genişleme | 🟡 Planlı |
| **Faz 3** | Oca–Haz 2027 (180 gün) | AI Ajanlar + Fintech + Çoklu şehir | 🟡 Planlı |
| **Faz 4** | Tem–Ara 2027 | Veri ürünleri + B2B API | ⚪ Vizyon |
| **Faz 5** | 2028+ | Türkiye genelinde dominasyon + uluslararası | ⚪ Vizyon |

---

## FAZ 1 — MVP Launch (Haziran–Ağustos 2026)

### Hedefler
- **Tarihler:** 1 Haziran 2026 başla, 31 Ağustos 2026 launch
- **Lokasyon:** Sadece İstanbul
- **Kategoriler:** Sadece 3 — Seramik & Vitrifiye / Yapı Kimyasalları / Elektrik Malzemesi
- **Kullanıcı hedefi:** 50 satıcı, 200 alıcı, ilk 100 sipariş

### Faz 1 ÖZELLİKLERİ (kesin liste)

#### insaatborsam.com (Web)
- ✅ Hero + 3 değer önerisi + CTA
- ✅ /nasil-calisir (3 kullanıcı tipi için)
- ✅ /fiyatlar (sekmeli)
- ✅ /satici-ol funnel (5 step)
- ✅ Stripe abonelik checkout
- ✅ Iyzico abonelik checkout (TRY isteyen için)
- ✅ /yasal/* (KVKK, kullanım koşulları, gizlilik, mesafeli satış)
- ✅ /iletisim
- ✅ Auth: SMS OTP + email/şifre
- ✅ Blog altyapısı (içerik sonradan eklenir)
- ❌ /alici-ol web (mobile yeterli)
- ❌ /nakliyeci-ol (Faz 2)

#### Buyer App
- ✅ Onboarding (3 slide + giriş)
- ✅ Ana Sayfa (search + kategoriler + fiyat endeksi widget — manuel veri)
- ✅ Arama / Keşfet (filtre, sort, semantic search)
- ✅ Ürün Detay
- ✅ RFQ oluşturma (3 step wizard) + AI parser
- ✅ RFQ takibi (aktif + geçmiş)
- ✅ RFQ teklif karşılaştırma + kabul
- ✅ Sepet & Ödeme (Iyzico)
- ✅ Sipariş Takibi (status timeline)
- ✅ Mesajlaşma (basit text + image)
- ✅ Profil & Ayarlar
- ✅ Push notifications
- ❌ Projelerim / BOM (Faz 2)
- ❌ AI BOM Generator (Faz 2)
- ❌ Canlı kamyon takibi (Faz 2)
- ❌ Wishlist (Faz 2)

#### Seller App / Panel
- ✅ Onboarding (sadece giriş — kayıt web'de)
- ✅ Yönetim Paneli (4 metrik + 30 günlük chart)
- ✅ Ürün Yönetimi (CRUD + bulk action)
- ✅ Ürün ekle (5 step wizard) + AI kategorize
- ✅ RFQ Inbox + hızlı teklif gönderme
- ✅ Sipariş yönetimi (kanban)
- ✅ Mesajlaşma
- ✅ Profil & Üyelik
- ❌ Detaylı analitik (Pro tier'a özel — Faz 2)
- ❌ Otomasyon paneli (Faz 2)
- ❌ Web versiyonu (Faz 2 — mobile yeterli MVP'de)

#### Admin Console
- ✅ Mission Control (temel — top stats + chart + telemetry)
- ✅ Kullanıcı Yönetimi (CRUD + tier değişikliği)
- ✅ Satıcı Kazanım Aracı **MUTLAKA** — bu olmadan sahaya çıkmak imkansız
- ✅ İçerik Moderasyonu (basit kuyruk)
- ✅ CRM & Outreach (basit kampanya + email/WA)
- ✅ Mali İşlemler (Iyzico/Stripe işlem listesi)
- ✅ Destek talep listesi
- ✅ RBAC (Owner, Admin, Sales, Support rolleri — diğerleri Faz 2)
- ✅ Audit log
- ❌ Detaylı pazar zekası (Faz 2)
- ❌ AI Ajan paneli (Faz 3)
- ❌ Sistem sağlığı dashboard'u (Faz 2)

#### Backend & AI
- ✅ Supabase tüm tablolar (Faz 1 kapsamındakiler)
- ✅ RLS policies
- ✅ Iyzico entegrasyonu (sipariş + abonelik)
- ✅ Stripe entegrasyonu (sadece web abonelik)
- ✅ SMS OTP (Vonage veya Netgsm)
- ✅ Email (Resend)
- ✅ AI: RFQ Parser (Haiku 4.5)
- ✅ AI: Ürün Kategorize (Haiku 4.5 + vision)
- ✅ AI: Semantic Search (OpenAI embedding + pgvector)
- ✅ AI: Satıcı Eşleştirme (kural tabanlı)
- ✅ n8n: temel webhook'lar (welcome email, sipariş bildirimi)
- ❌ WhatsApp Business API (Faz 2)
- ❌ Google Maps scraping otomasyonu (Faz 2 — Faz 1'de manuel girilir)
- ❌ E-Fatura entegrasyonu (Faz 3)

### Faz 1'de KESİNLİKLE YOK

Liste kısa olsun diye:

- ❌ Cargo App (nakliyeci uygulaması)
- ❌ Müzayede / canlı açık artırma
- ❌ Escrow / vadeli ödeme / kredi
- ❌ Şantiye yönetimi (BOM, proje takip)
- ❌ AI Ajanlar (Hera, Apollo vs.)
- ❌ Otomasyon (WhatsApp/Meta Ads)
- ❌ Pazar zekası dashboard
- ❌ Mobile push for admin
- ❌ Çoklu dil
- ❌ Çoklu para birimi (sadece TRY)
- ❌ B2B API
- ❌ ERP entegrasyonları (Logo, Mikro)

### Faz 1 Sprint Planı (12 hafta)

**Sprint 0 — Kurulum (1 hafta, 1-7 Haziran)**
- Monorepo kurulumu (Turborepo + pnpm)
- Supabase projesi açma
- Expo apps oluşturma (buyer, seller)
- Next.js web app
- Tasarım tokenları (`packages/ui/tokens`)
- CI/CD (GitHub Actions + Vercel + EAS)
- Env şablonları
- `pnpm dev` çalışır halde

**Sprint 1 — Database & Auth (1 hafta, 8-14 Haziran)**
- Tüm Faz 1 migrations
- RLS policies
- Auth flow (SMS OTP + email/şifre)
- Profile creation flow
- Type generation

**Sprint 2 — Marketing Web (1 hafta, 15-21 Haziran)**
- Hero, /nasil-calisir, /fiyatlar
- SEO temel
- Mobile responsive
- /yasal/* sayfaları

**Sprint 3 — Satıcı Onboarding Web (1 hafta, 22-28 Haziran)**
- /satici-ol 5 step funnel
- Iyzico + Stripe checkout
- Vergi levhası upload
- Welcome email (n8n)

**Sprint 4 — Buyer App Core (2 hafta, 29 Haziran – 12 Temmuz)**
- Onboarding
- Tab navigator
- Ana Sayfa
- Arama (basic + semantic)
- Ürün Detay
- Profil

**Sprint 5 — RFQ Sistemi (1 hafta, 13-19 Temmuz)**
- RFQ form (Buyer)
- AI parser (Haiku)
- Satıcı eşleştirme
- RFQ Inbox (Seller)
- Teklif gönder/al
- Realtime notifications

**Sprint 6 — Seller Panel (1 hafta, 20-26 Temmuz)**
- Yönetim paneli
- Ürün CRUD + AI kategorize
- Sipariş kanban
- Mesajlaşma

**Sprint 7 — Sipariş & Ödeme (1 hafta, 27 Temmuz – 2 Ağustos)**
- Sepet (Buyer)
- Iyzico ödeme entegrasyonu
- Sipariş takibi
- Status transitions
- Email/SMS bildirimleri

**Sprint 8 — Admin Console Temel (1 hafta, 3-9 Ağustos)**
- Mission Control
- Kullanıcı yönetimi
- Satıcı kazanım aracı
- Audit log + RBAC
- 2FA

**Sprint 9 — Polish & QA (1 hafta, 10-16 Ağustos)**
- Bug fixes
- UI polish
- Performance optimizasyon
- Sentry + PostHog kurulumu
- Beta test (10 satıcı + 30 alıcı manuel davet)

**Sprint 10 — Soft Launch (1 hafta, 17-23 Ağustos)**
- Beta test geri bildirimleriyle düzeltmeler
- App Store + Google Play submission
- Production deploy
- 50 satıcı sahada kayıt
- Pre-launch içerik (blog, Instagram)

**Sprint 11 — Public Launch (1 hafta, 24-31 Ağustos)**
- 🎉 Halka açık launch
- PR campaign
- Meta Ads (NodeWorks deneyimiyle)
- İlk 100 sipariş hedefi
- Daily metric review

---

## FAZ 2 — Cargo App + Otomasyon + Genişleme (Eylül–Aralık 2026)

### Hedefler
- **Tarihler:** 1 Eylül – 31 Aralık 2026 (90 gün)
- **Şehirler:** İstanbul + Ankara + Bursa + İzmir (Kocaeli opsiyonel)
- **Kategori:** 3 → 8 (boya, izolasyon, hırdavat, vitrifiye, çelik eklenir)
- **Kullanıcı hedefi:** 300 satıcı, 1,000 alıcı, 50 nakliyeci, €50K MRR

### Faz 2 ÖZELLİKLERİ

#### Yeni: Cargo App
- Onboarding (giriş only)
- İş feed (uydu harita + liste)
- İş detay + teklif verme
- Aktif teslimat (GPS + fotoğraf)
- Kazançlarım
- Profil & üyelik (web'den yükseltme)

#### Buyer App eklemeler
- ✅ Projelerim (BOM, bütçe)
- ✅ AI BOM Generator (Sonnet 4.7)
- ✅ Canlı kamyon takibi
- ✅ Wishlist
- ✅ Karşılaştır (3 ürün yan yana)
- ✅ Ürün soru-cevap (satıcıya direkt soru)

#### Seller eklemeler
- ✅ Web versiyon (`insaatborsam.com/satici`)
- ✅ Detaylı analitik (Pro+)
- ✅ Otomasyon paneli (Enterprise)
- ✅ WhatsApp Business API entegrasyonu
- ✅ Meta Ads otomasyonu (Enterprise)
- ✅ Promo / kampanya yönetimi
- ✅ Toplu ürün import (Excel/CSV)

#### Admin eklemeler
- ✅ Detaylı pazar zekası (canlı endeks)
- ✅ Sistem sağlığı dashboard'u
- ✅ İleri analitik (cohort, retention)
- ✅ Tüm 8 rol RBAC

#### AI eklemeler
- ✅ AI BOM Generator (Sonnet 4.7)
- ✅ WhatsApp AI Asistan (satıcı için)
- ✅ Fiyat anomali tespiti
- ✅ Müşteri destek chatbot
- ✅ Google Maps scraping otomasyonu (Hera ajanı v1)

#### Operasyonel
- ✅ E-Fatura entegrasyonu (GİB)
- ✅ İade & iptal akışı tamamı
- ✅ Şikayet & dispute sistemi
- ✅ Multi-device session yönetimi

---

## FAZ 3 — AI Ajanlar + Fintech (Ocak–Haziran 2027)

### Hedefler
- **Tarihler:** Q1-Q2 2027 (180 gün)
- **Şehirler:** Türkiye genelinde 20+ şehir
- **Kullanıcı hedefi:** 1,500 satıcı, 10,000 alıcı, 300 nakliyeci, €500K MRR

### Faz 3 ÖZELLİKLERİ

#### AI Ajanlar Sahada
- 🤖 **Hera** — Otomatik satıcı keşfi (Google Maps + Trade Registry)
- 🤖 **Apollo** — Kişiselleştirilmiş outreach (email + WhatsApp)
- 🤖 **Hermes** — Tier 1 müşteri destek (chat + email)
- 🤖 **Argos** — İçerik moderasyonu
- 🤖 **Athena** — Sahtekarlık tespiti
- 🤖 **Demeter** — Fiyat istihbaratı (canlı endeks otomasyonu)
- Admin Console'da AI Ajan paneli

#### Fintech Bacağı
- ✅ Escrow ödeme (paranın güvence altında tutulması)
- ✅ Vadeli ödeme (15/30/45/60 gün)
- ✅ Erken ödeme indirimi
- ✅ Kredi skoru sistemi (alıcı + satıcı için)
- ✅ Bayilik sigortası (partner ile)

#### Diğer
- ✅ Çoklu dil (TR + EN ilk olarak)
- ✅ B2B API ürün (read-only başlangıçta)
- ✅ Mobile push for admin
- ✅ Şikayet medyasyon (3. taraf hakem)

---

## FAZ 4 — Veri Ürünleri & B2B API (Tem–Ara 2027)

### Hedefler
- **Şehirler:** Tüm Türkiye
- **Kullanıcı hedefi:** 3,000 satıcı, 25,000 alıcı, €1M MRR
- **Yeni gelir kalemi:** Veri satışı (sektör raporları, API erişim)

### Faz 4 ÖZELLİKLERİ
- ✅ Sektör raporları (aylık PDF)
- ✅ B2B veri API (read+write)
- ✅ ERP entegrasyonları (Logo, Mikro, Netsis)
- ✅ Beyaz etiket (white-label) seçeneği — büyük firmaların kendi alt-platform'u
- ✅ Usta/işçi marketplace (dördüncü taraf)
- ✅ AI fiyat tahmini (Iris ajanı)
- ✅ Şantiye yönetimi v2 (mimar/mühendis araçları)

---

## FAZ 5 — Türkiye Dışı (2028+)

### Vizyon
- Türk inşaatçıların yoğun olduğu pazarlar: DACH (NodeWorks köprüsü), Körfez, Orta Asya
- Lokal partner ile joint venture modeli
- Türkçe + İngilizce + Arapça + Rusça

---

## Karar Çerçevesi: "Bu Hangi Faz?"

Yeni özellik fikri geldiğinde şu soruları sor:

| Soru | Cevap → Faz |
|---|---|
| MVP launch için **şart** mı? Olmadan ürün eksik kalır mı? | Evet → Faz 1 |
| Validation sonrası genişleme mi? | Evet → Faz 2 |
| AI/Fintech derinleşmesi mi? | Evet → Faz 3 |
| Veri monetizasyonu mu? | Evet → Faz 4 |
| Uluslararası mı? | Evet → Faz 5 |
| Hiçbiri net değilse? | **YAPMA** — kararı erteleyene kadar yaz, sonra konuş |

---

## Risk & Bağımlılıklar

### Faz 1 Risk Listesi

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| Apple/Google üyelik kuralı reddi | Orta | Yüksek | Sıkı uygulama: mobil hiç paywall yok, sadece giriş |
| Iyzico entegrasyon sorunları | Düşük | Orta | Sandbox'ta erkenden test, fallback olarak Stripe |
| 50 satıcı saha kazanım zor | Yüksek | Yüksek | NodeWorks satış DNA'sı, kişisel ağ, demo + reklam |
| AI maliyeti beklediğimden yüksek | Düşük | Düşük | Rate limit + tier sınırlama |
| KVKK/yasal denetim | Düşük | Yüksek | Hukuk danışman, baştan uyumlu altyapı |
| Yatırımsız cash flow yetmemesi | Orta | Yüksek | Önce nakit akışı (satıcı abonelik) sonra büyüme |

### Bağımlılıklar
- **Logo + favicon:** Faz 1'in başında yapılmalı (sen halledersin)
- **Stitch HTML → "İnşaat Borsam" rebrand:** Faz 1 başında (sen)
- **Vergi danışmanı:** Faz 1 ortasında, fatura akışı için
- **Hukuk danışmanı:** Faz 1 başında, KVKK + sözleşmeler için
- **Hosting/CDN:** Vercel + Supabase Pro plan (önceden)

---

## North Star Metric Takibi

Her hafta Pazartesi 09:00 review:

| Metrik | Faz 1 Hedef (sonu) | Nasıl Ölçülür |
|---|---|---|
| **GMV** | ₺2M | Supabase aggregate |
| Aktif satıcı | 50 | Son 30 gün ≥1 sipariş |
| Aktif alıcı | 200 | Son 30 gün ≥1 sipariş |
| Sipariş sayısı | 100 | Tamamlanmış (status='delivered') |
| Ortalama sipariş tutarı | ₺20K | GMV / sipariş sayısı |
| RFQ → sipariş dönüşüm | %30 | RFQ'lerin %30'u siparişe dönsün |
| Satıcı abonelik MRR | ₺25K (~€800) | Stripe + Iyzico abonelik |
| Buyer App DAU/MAU | %25 | PostHog |
| Crash-free session | >%99 | Sentry |

---

## "Sıkıştığında Sor" Listesi

Faz 1 sırasında karar gereken anlar — buraya gelince mutlaka Erdi'ye sor, varsayım yapma:

1. **Logo + brand assets final form?** — Sen kendin yapacaksın, kim ne zaman?
2. **Hangi banka hesabı?** — Iyzico/Stripe payout için
3. **Vergi danışmanı kim?** — Faz 1 ortasında lazım
4. **Hukuk danışmanı kim?** — KVKK aydınlatma metni için
5. **İlk 10 satıcı kim olacak?** — Tanıdık veya sahada bulduğun
6. **Lokasyon stratejisi: ofis var mı?** — Yoksa tamamen uzaktan
7. **Yatırım arıyor muyuz?** — Faz 2 öncesi karar gerek
8. **Ekip büyüklüğü ne?** — Sen + kim?

---

**Sonraki adım:** İş modeli ve para için `07-BUSINESS.md`.
