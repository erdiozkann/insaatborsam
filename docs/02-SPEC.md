# 02 — Ürün Spesifikasyonu

**Status:** Active | **Last Updated:** 2026-05-18 | **Owner:** Erdi

---

## Genel Mimari

İnşaat Borsam **4 ayrı arayüz** içerir, hepsi tek backend (Supabase) ile çalışır:

| # | Arayüz | Platform | Faz |
|---|---|---|---|
| 1 | **insaatborsam.com** | Web (Next.js) | Faz 1 ✅ |
| 2 | **Buyer App** | Mobil (React Native) | Faz 1 ✅ |
| 3 | **Seller App** | Mobil + Web Panel | Faz 1 ✅ |
| 4 | **Cargo App** | Mobil (React Native) | Faz 2 🟡 |
| 5 | **Admin Console** | Web (Next.js) | Faz 1 ✅ (web ile aynı domain) |

---

## Marka Kimliği

### Adı
**İnşaat Borsam** — tüm UI'da bu kullanılır. "İnsaApp", "Forge Source", "Construct-Core" geçici Stitch çıktılarındadır, düzeltilecek.

### Slogan
- Ana: "İnşaatın dijital borsası."
- Pazarlama: "30 dakikada teklif al."

### Tasarım Sistemi: Industrial Precision

Stitch'in oluşturduğu, onaylanmış tasarım sistemi:

**Renk paleti:**
```
Primary (Hazard Yellow):   #F4B400  ← CTA, marka vurgu, kritik bildirim
Secondary (Charcoal Navy): #1E293B  ← Text, header, ikon
Background:                #FFFFFF  ← Ana yüzey
Surface Light:             #F8FAFC  ← Section background
Success Green:             #10B981  ← Stokta, başarılı, onay
Warning Amber:             #F59E0B  ← Beklemede, uyarı
Error Red:                 #BA1A1A  ← Hata, iptal
Border Default:            #E2E8F0  ← 1px border
```

**Tipografi:**
- Font ailesi: **Inter** (her şey)
- Sayılar: **tabular figures** (kolonlarda hizalı dursun diye)
- Türkçe karakter desteği için line-height optimize

**Görsel dil:**
- **Sıfır radius** — sharp corners (sektörel sertlik)
- Soft shadow yok — bold border + tonal stepping
- 8px grid sistemi
- Yüksek kontrast (gün ışığında okunabilir)

Detaylı tokenlar için: `packages/ui/tokens/`.

### Sektörel Sözlük (Türkçe UI Tutarlılığı İçin)

| İngilizce / Yanlış | Doğru Türkçe |
|---|---|
| Site Manager | Şantiye Şefi / Proje Yöneticisi |
| User | Kullanıcı |
| Profile | Profil |
| Settings | Ayarlar |
| Dashboard | Yönetim Paneli / Ana Sayfa |
| Inventory | Stok / Envanter |
| RFQ (kalır) | Teklif Talebi (TT) — RFQ kabul edilir, "Teklif Talebi" uzun |
| BOM | Malzeme Listesi |
| Logout | Çıkış Yap |
| Cart | Sepet |
| Checkout | Ödeme |
| Order | Sipariş |
| Shipment | Sevkiyat |
| Delivery | Teslimat |
| Quote | Teklif |
| Pending | Beklemede |
| Approved | Onaylandı |
| Rejected | Reddedildi |
| In Stock | Stokta |
| Out of Stock | Stokta Yok |
| Categories | Kategoriler |
| Pricing | Fiyatlandırma |
| Subscription | Üyelik |
| Premium | Profesyonel / Pro |
| Verified | Doğrulanmış |
| Reviews | Değerlendirmeler |
| Filters | Filtreler |

---

## 1. insaatborsam.com (Web — Next.js)

### Genel Amaç
- Marka tanıtım sitesi (SEO, content marketing)
- **Üyelik satış noktası** (Apple/Google atlatma stratejisi — kritik!)
- Admin Console (sen + ekibin)
- Satıcı/nakliyeci onboarding funnel'ı

### Sayfa Yapısı

#### Public (Marketing) Sayfalar
- `/` — Ana sayfa (hero + 3 değer önerisi + sosyal kanıt + CTA)
- `/nasil-calisir` — Alıcı, satıcı, nakliyeci için "nasıl çalışır" akışı
- `/fiyatlar` — Üyelik planları (alıcı / satıcı / nakliyeci sekmeli)
- `/kategoriler/[slug]` — Kategori sayfası (SEO için)
- `/satici-ol` — Satıcı onboarding (kritik dönüşüm sayfası)
- `/alici-ol` — Alıcı onboarding (Faz 2'de premium için)
- `/nakliyeci-ol` — Nakliyeci onboarding (Faz 2)
- `/blog` — Sektör içerikleri (SEO + thought leadership)
- `/blog/[slug]` — Blog post
- `/iletisim` — İletişim
- `/hakkimizda` — Hakkımızda
- `/yasal/kvkk` — KVKK aydınlatma metni
- `/yasal/kullanim-kosullari` — Kullanım koşulları
- `/yasal/gizlilik` — Gizlilik politikası
- `/yasal/mesafeli-satis` — Mesafeli satış sözleşmesi

#### Auth Sayfalar
- `/giris` — E-posta / telefon ile giriş
- `/sifremi-unuttum` — Şifre sıfırlama
- `/sms-dogrula` — SMS OTP doğrulama

#### Onboarding Funnel (Satıcı için)
- `/satici-ol` — Step 1: Firma bilgileri
- `/satici-ol/dogrulama` — Step 2: Vergi levhası + ticaret sicil
- `/satici-ol/plan` — Step 3: Plan seçimi
- `/satici-ol/odeme` — Step 4: Iyzico ödeme
- `/satici-ol/tebrikler` — Step 5: Onay + app indirme yönlendirme

#### Admin Console (yetkili kullanıcılara açık)
`/admin` altında. Detay aşağıda **Admin Console** bölümünde.

### Kritik UX Kuralları (Web)
- Mobil-first responsive (Türk kullanıcılarının çoğu mobilden açar)
- Türkçe SEO optimizasyonu (h1, meta description, structured data)
- Iyzico ödeme: 3D Secure zorunlu (BDDK)
- KVKK uyumlu çerez yönetimi (banner + tercih)
- E-Fatura kesilebilir formda fatura bilgisi (KDV, vergi no, adres)

---

## 2. Buyer App (Mobile — React Native)

### Genel Amaç
Müteahhit, usta, mühendis, mimarın **cebindeki tedarik ekibi.** Malzeme arar, teklif alır, sipariş verir, takip eder.

### Ekran Listesi (Stitch ile uyumlu)

#### Onboarding (Sadece İlk Kullanımda)
1. **Splash + Logo** (1 saniye)
2. **Hoş Geldiniz** — 3 slide carousel
   - "Hızlı teklif al"
   - "En iyi fiyatı bul"
   - "Güvenli teslimat"
3. **Giriş Yap** — telefon SMS OTP (öncelik) veya e-posta

**Önemli:** "Üye Ol" butonu **yok.** Sadece "Giriş Yap" var. Hesabı yoksa SMS OTP ile direkt hesap açılır (basit telefon doğrulama yeterli, premium için sonra web'e yönlendirilir).

#### Ana Akış (Tab Bar)
**Tab 1 — Ana Sayfa (`/`)**
- Üst bar: konum + bildirim ikonu
- Search input (büyük, sticky): "Hangi malzeme lazım?"
- **Piyasa Endeksi** widget (yatay scroll):
  - Çimento ton: ₺2,450 ↑3%
  - Demir kg: ₺18.50 ↓1%
  - Tuğla adet: ₺4.20 →
- "Hızlı Teklif Al" hero card (sarı arka plan)
- Kategori grid (2x4): Seramik, Yapı Kimyasalları, Elektrik, Hırdavat, Vitrifiye, İzolasyon, Boya, Çelik
- "Sana Özel" — kişiselleştirilmiş ürün önerileri (yatay scroll)
- "Yakındaki Bayiler" — harita preview + liste

**Tab 2 — Arama / Keşfet (`/search`)**
- Search bar (sticky)
- Filter chips: "Yakınımdakiler", "En Ucuz", "Stokta Olanlar", "Premium Bayiler"
- View toggle: Liste / Harita / Grid
- Sonuç sayısı: "234 ürün bulundu"
- Sort dropdown: Önerilen, Fiyat artan/azalan, Mesafe, Puan
- Ürün card listesi (vertical)
- Floating "Karşılaştır (3)" butonu (çoklu seçim aktifse)

**Tab 3 — Teklif Al / RFQ (`/rfq`)**
- "Yeni RFQ Oluştur" CTA
- "Aktif RFQ'larım" listesi (sayım: kaç teklif geldi, kalan süre)
- "Geçmiş RFQ'lar"

**Tab 4 — Projelerim (`/projects`)**
- Tab bar: Aktif / Tamamlanan / Taslak
- Proje listesi:
  - Her card: isim, adres, başlama tarihi, ilerleme barı, bütçe (toplam/harcanan)
- FAB: "+ Yeni Proje"

**Tab 5 — Profil (`/profile`)**
- Avatar + isim + rol
- Üyelik durumu (Ücretsiz / Pro / Business)
- Kullanım istatistikleri (Aylık arama: 17/20 — limit görünür)
- Ayarlar
- Bildirim tercihleri
- Yardım & Destek
- KVKK / Yasal
- Çıkış Yap

#### Detay Ekranlar (Tab dışı)

**Ürün Detay (`/product/[id]`)**
- Image carousel (aspect 1:1, swipe)
- Back button overlay (sol üst)
- Wishlist heart (sağ üst)
- Ürün adı (h2)
- Marka + SKU
- **Fiyat bloğu:** price-xl style + birim (e.g., "₺245/m²")
- Stok durumu: yeşil nokta + "Stokta: 1,200 m²"
- Bayi card (tıklanabilir):
  - Logo + isim + trust score (4.8/5 ★)
  - "Doğrulanmış" rozeti
  - "Mağazaya Git" linki
- Teknik özellikler accordion
- Değerlendirmeler bölümü
- Benzer ürünler (yatay scroll)
- **Sticky bottom bar:**
  - "Teklif İste" (secondary) + "Sepete Ekle" (primary) + "Hemen Al" (primary)

**RFQ Form (`/rfq/new`)**
- Step indicator: 1/3, 2/3, 3/3
- Step 1: Ne?
  - Kategori dropdown
  - Ürün açıklaması (textarea)
  - Marka tercihi (opsiyonel)
  - Foto upload (örnek/numune)
- Step 2: Ne kadar / nereye?
  - Miktar + birim
  - Teslimat adresi (harita picker)
  - Teslim deadline (date picker)
- Step 3: Gözden geçir + gönder
  - Özet card
  - "12 satıcıya gönderilecek" tahmini
  - "Teklif İste" CTA

**RFQ Aktif Durum (`/rfq/[id]`)**
- Header: Geri sayım "23 saat 14 dk kaldı"
- Stats: "12 gönderildi / 5 teklif geldi / 7 görüntülendi"
- Teklif listesi (sıralı, en iyi eşleşme önce):
  - Her offer card:
    - Satıcı bilgileri + trust score
    - Toplam fiyat (price-xl)
    - Teslim süresi
    - Not preview
    - [Detay] [Kabul Et] butonları
- Floating "Karşılaştır" butonu (multi-select)

**Proje Detay (`/projects/[id]`)**
- Hero: proje görseli + isim
- Stats grid (4 kart): Malzeme / Tedarikçi / Sipariş / Gün
- BOM (Malzeme Listesi) bölümü:
  - Kategori-bazlı grup
  - Her item: durum (Sipariş Verildi / Teslim Edildi / Bekliyor)
- Zaman çizelgesi
- AI önerisi card: "Bu projeye benzer projelerde ortalama X harcanmış"
- **"AI Malzeme Listesi Oluştur"** CTA (Faz 2)

**Sepet & Ödeme (`/cart`)**
- Item'lar satıcıya göre gruplanır (collapsible)
- Her satıcı için nakliye seçimi:
  - "Satıcının kendi nakliyesi: ₺250"
  - "Platform nakliye: ₺180 (3 teklif)" (Faz 2)
- Toplam dökümü (subtotal, KDV, kargo)
- Ödeme yöntemi seçimi: Iyzico (kart) / Havale / Escrow (Faz 3)
- Promo kod input
- Sticky bottom: Total + "Sipariş Ver" butonu

**Sipariş Takibi (`/orders/[id]`)**
- Sipariş header: ID + status pill
- Status timeline (vertical):
  - ● Onaylandı (12:34)
  - ● Hazırlanıyor (13:45)
  - ● Yola Çıktı (15:20)
  - ○ Teslim Edildi
- Canlı harita: kamyon ikonu + ETA (Faz 2)
- Sürücü/Nakliyeci card (Faz 2)
- Items listesi (collapsed)
- "Yardım / Sorun Bildir" butonu

### Buyer App Kritik UX Kuralları
- **Hız:** Her ekran < 1 saniye yükleme (Supabase realtime + optimistic update)
- **Offline-tolerant:** Form taslakları local olarak kaydedilsin
- **Push notification:** RFQ'ye teklif geldi, sipariş güncellendi, mesaj geldi
- **Telefon araması:** Bayi telefonu tek tıkla aranabilsin
- **WhatsApp:** Bayi WhatsApp'ına tek tıkla gidebilsin (deep link)

---

## 3. Seller App / Panel (Mobile + Web)

### Genel Amaç
Nalbur, bayi, toptancı için **dijital mağaza yöneticisi.** Ürün ekler, sipariş yönetir, RFQ'lara teklif verir.

**Hem mobil hem web** — satıcılar PC'den de bakar (sipariş yoğunluğunda PC daha pratik).

### Ekran Listesi

#### Onboarding (Mobil)
1. **Splash + Logo**
2. **Giriş Yap** — sadece giriş. **Üyelik yoksa metin:**
   > "İnşaat Borsam satıcı paneli, mevcut hesap sahipleri içindir."
   
   **Web sitesi linki YOK** (Apple/Google anti-steering kuralı). Bunun yerine: "Satıcı olmak için insaatborsam.com adresini ziyaret edin." metni — link değil, sadece metin.

#### Ana Akış (Tab Bar — Mobile)

**Tab 1 — Yönetim Paneli (`/`)**
- Bugünkü metrikler (4 kart):
  - Görüntülenme: 234 ↑12%
  - Aktif Teklifler: 8
  - Yeni Siparişler: 3
  - Aylık Ciro: ₺45.2K
- 30 günlük ciro grafiği
- Acil RFQ'lar widget (en urgent 3'ü)
- Son aktivite feed'i
- Hızlı aksiyon butonları: Ürün ekle / Stok güncelle / Promo gönder

**Tab 2 — Ürünler (`/products`)**
- "+ Yeni Ürün" butonu
- Filtreler: kategori, stok durumu, fiyat aralığı
- Bulk action toolbar (item seçildiğinde):
  - Toplu fiyat güncelle
  - Toplu stok güncelle
  - Toplu sil
  - Toplu kategori değiştir
- Ürün tablo:
  - Checkbox | Fotoğraf | İsim | SKU | Fiyat | Stok | Durum | Aksiyonlar

**Tab 3 — Teklifler (RFQ Inbox) (`/rfq`)**
- Sekmeler: Yeni / Yanıt Bekliyor / Kazanılan / Kaybedilen
- RFQ card listesi:
  - Alıcı bilgisi (anonim, kabul edene kadar)
  - Ürün spesifikasyonu
  - Miktar + deadline
  - Kalan süre (< 2h ise urgent rozeti)
  - "Yanıtla" butonu
- Hızlı teklif formu (slide-in panel):
  - Fiyat input
  - Teslim tarihi
  - Notlar
  - "Teklif Ver" CTA

**Tab 4 — Siparişler (`/orders`)**
- Kanban-style pipeline:
  - Yeni (3) | Hazırlanıyor (5) | Sevk Edildi (8) | Teslim Edildi (47)
- Her card draggable
- Card detay:
  - Sipariş ID + müşteri
  - Toplam tutar
  - Item sayısı
  - Aşamada geçen gün

**Tab 5 — Mesajlar (`/messages`)**
- WhatsApp-style chat interface
- Sol: konuşma listesi (sortable, search)
- Sağ: chat penceresi
- Üst: müşteri bilgisi + sipariş context'i
- Alt: input + template menu + ek
- Template dropdown: "Fiyat teklifi gönder", "Stok bilgisi", "Teslimat süresi"

**Tab 6 — Profil & Ayarlar**
- Şirket bilgileri
- Vergi/fatura bilgileri
- Banka bilgileri (payout)
- Üyelik durumu (Başlangıç / Pro / Enterprise)
- Üyelik yükseltme: web'e yönlendirme (TEXT olarak — "insaatborsam.com'dan yükseltebilirsin")
- Bildirim tercihleri
- Çıkış Yap

#### Sadece Pro / Enterprise Ekranlar

**Analizler (Pro+) (`/analytics`)**
- Tabs: Genel / Rakip Analizi / Müşteri / Bölgesel
- Charts:
  - Kategori bazlı satış (pie)
  - En çok satan ürünler (bar)
  - Rakip fiyat takibi (line — senin fiyat vs piyasa ortalaması)
  - Türkiye bölgesel ısı haritası
- AI insight cards:
  - "Weber yapı kimyasallarında rakiplerinden %8 pahalısın"
  - "İstanbul Anadolu yakasında talep %23 arttı"

**Otomasyon (Enterprise) (`/automation`) — Faz 2**
- WhatsApp Business API entegrasyonu toggle
- Katalog sync durumu
- Meta Ads kampanya yöneticisi
- AI-üretilen reklam görselleri

#### Detay Ekranlar (Mobil)

**Ürün Ekle / Düzenle**
Multi-step wizard:
- Step 1: Fotoğraflar (drag-drop, 8 max)
- Step 2: Detaylar (isim, kategori, marka, SKU)
- Step 3: Fiyatlama (perakende / toptan / bayi tier'ları)
- Step 4: Stok & nakliye (stok adedi, min sipariş, nakliye bölgeleri)
- Step 5: Gözden geçir & yayınla

**Sipariş Detay**
- Müşteri bilgisi
- Items listesi
- Nakliye seçimi
- Ödeme durumu
- "Sevk irsaliyesi yazdır" / "e-Fatura kes" butonları (Faz 3'te otomatik)

### Seller Panel Kritik UX Kuralları
- **Çoklu cihaz sync:** Mobil ve web aynı veriye anlık erişim
- **Bulk operations:** Yüzlerce ürünü tek tek yönetmek imkansız, bulk edit zorunlu
- **WhatsApp-tier mesajlaşma:** Türk satıcı WhatsApp'a alışkın, deneyim aynı olmalı
- **Hızlı stok güncelleme:** Sayfa açmadan tek tıkla stok güncellenebilsin

---

## 4. Admin Console (Web — Next.js)

### Genel Amaç
Sen ve ekibinin platformu yönettiği kontrol merkezi. Stitch'in "Mission Control" tasarımı bunu tam yansıtıyor.

`insaatborsam.com/admin` altında, role-based access ile korunur.

### Ekran Listesi

#### 1. Mission Control / Yönetici Özeti (`/admin`)
- Top stats row (5–6 kart):
  - GMV (Gross Merchandise Value) ₺12.4M
  - MRR (Monthly Recurring Revenue) ₺850K
  - Aktif Kullanıcı (30 gün) — alıcı/satıcı/nakliyeci ayrı
  - Sipariş Sayısı 4,892
  - Churn Rate 2.1%
- 365 günlük volume growth chart (büyük)
- Subscription distribution (donut chart) — tier'lara göre MRR
- Live telemetry feed (sağ sidebar):
  - "Yeni satıcı kaydı: Demiray Yapı A.Ş."
  - "RFQ Oluşturuldu — Değer: ₺45,000"
  - "Premium Yükseltme: Yıldız Lojistik"
- Zaman aralığı: Bugün / 7G / 30G / 1Y

#### 2. Satıcı Kazanım (`/admin/seller-acquisition`) ⭐ KRİTİK
Stitch'in en güçlü ekranı bu. Erdi'nin orijinal "Karaköy elektrikçilerini bul" fikri burada gerçekleşiyor.

**Layout:**
- Sol filtreler:
  - Kategori (sektör) dropdown — Tümü / Elektrikçi / Nalbur / Seramikçi / Tesisatçı...
  - Lokasyon (ilçe) dropdown
  - Veri kaynağı — Karma (Google Maps + Ticaret Sicili)
  - "Filtrele" butonu
- Orta: Bölgesel yoğunluk haritası (uydu görüntüsü)
  - Sarı pin: platformda değil
  - Yeşil pin: kayıtlı
- Sağ: İşletme listesi (4,102 bulundu)
  - Toplu aksiyon butonları:
    - **E-Posta Gönder** (bulk email kampanyası)
    - **WA Kampanyası** (WhatsApp toplu mesaj)
    - **CRM'e Ekle**
  - Liste:
    - Checkbox | Firma adı | İletişim (email + tel) | Kategori | Platform durumu
- Alt: Kazanım Hunisi (Funnel) — son 30 gün
  - Bulundu → İletişim Kuruldu → Demo → Kayıt → Aktif → Premium

**Email Composer Modal:**
- Template seçici (kategori bazlı hazır mesajlar)
- Subject + body (rich text editor)
- Variable insertion: `{firma_adi}`, `{kategori}`, `{ilce}`
- Preview + Send

#### 3. Kullanıcı Yönetimi (`/admin/users`)
- Tabs: Alıcılar / Satıcılar / Nakliyeciler / Personel
- Filter sidebar: tier, durum, kayıt tarihi, lokasyon
- Data table: Avatar | İsim | Tip | Tier | Kayıt | LTV | Durum
- Bulk actions: doğrula, askıya al, refund, manuel yükselt
- Kullanıcı detay drawer (sağdan kayar):
  - Tam profil
  - Aktivite zaman çizelgesi
  - Üyelik geçmişi
  - Destek talepleri
  - Manuel aksiyonlar (yükselt, dondur, sil, anonimleştir)

#### 4. İçerik Moderasyonu (`/admin/moderation`)
- Bekleyen ürün onayları kuyruğu
- Şikayet bildirimleri
- Yorum moderasyonu
- Bulk approve/reject

#### 5. CRM & Outreach (`/admin/crm`)
- Kampanya yöneticisi
- Template kütüphanesi (kategori bazlı)
- Kampanya performans metrikleri
- Lead funnel: Cold → Contacted → Demo → Converted

#### 6. Mali Operasyonlar (`/admin/finance`)
- Tier bazlı üyelik geliri
- Nakliye komisyonu takibi
- Satıcı/nakliyeci payout yönetimi
- Refund & dispute
- Vergi raporları
- Iyzico/Stripe işlem geçmişi

#### 7. Pazar Zekası (`/admin/market-intel`)
- Canlı fiyat endeksi dashboard:
  - Çimento, seramik, çelik, bakır tickers
  - 24h değişim %
- Türkiye bölgesel ısı haritası:
  - Renk yoğunluğu = işlem hacmi
  - Hover: şehir istatistikleri
- Trend chart:
  - Kategori bazlı talep trendi
  - Fiyat volatilite endeksi
- AI insight paneli:
  - "İzmir bölgesinde elektrik malzemesi talebi %34 arttı. 23 yeni satıcı kazanma fırsatı."
- Export: PDF rapor / API erişim / CSV

#### 8. Destek (`/admin/support`)
- Üç tipten gelen ticket'lar
- Öncelik sıralama
- Hızlı yanıt template'leri
- Atama sistemi (ekip büyürse)

#### 9. Sistem Sağlığı (`/admin/system`)
- API status
- Database performance
- Background job queue'ları
- Error log'ları

#### 10. AI Ajanlar (`/admin/agents`) — Faz 2+
Şimdilik boş veya "Çok yakında" sayfası. İleride:
- Aktif/pasif ajan listesi
- Performance metrikleri (Apollo: 156/gün, %23 yanıt)
- Maliyet takibi (Claude API token kullanımı)
- Log'lar / geçmiş eylemler

### Admin Rol Sistemi (RBAC)

Baştan kurulmalı (sonradan eklenmesi acı verir):

| Rol | Yetki |
|---|---|
| **Owner** (Erdi) | Her şey. Rol atama, finansal, silme |
| **Admin** | Owner hariç her şey |
| **Operations Manager** | Sipariş, destek, kullanıcı yardımı |
| **Sales / Acquisition** | Satıcı kazanım, outreach, CRM, demo |
| **Content Moderator** | Ürün onayı, yorum moderasyonu |
| **Support Agent** | Destek talepleri, basit refund (limit dahilinde) |
| **Finance** | Sadece muhasebe, payout, e-Fatura |
| **Analyst** | Sadece raporlama (read-only) |

Her admin için:
- 2FA zorunlu
- Audit log (kim ne zaman ne yaptı)
- IP whitelist opsiyonel

---

## 5. Cargo App (Mobile — React Native) — Faz 2

Faz 1'de **yok.** Nakliye yönetimi Faz 1'de manuel: satıcı kendi nakliyesini ayarlar, alıcı kabul eder. Platform sadece sipariş kaydını tutar.

Faz 2'de Cargo App tam özellik:
- İş feed (uydu görünüm + harita)
- İş detay (Stitch'te tasarlandı, kayıtlı)
- Teklif verme
- Aktif teslimat (GPS, "yükü aldım" foto, teslim foto)
- Kazançlarım
- Profil & üyelik (Gold/Premium upgrade web'den)

---

## Ortak Özellikler (Tüm Apps)

### Authentication
- Telefon SMS OTP (öncelik) — Türk kullanıcı bunu sever
- E-posta + şifre (alternatif)
- Supabase Auth backend
- Refresh token rotasyonu
- Multi-device session yönetimi

### Push Notifications
- Expo Notifications
- Tipler: yeni RFQ, teklif geldi, sipariş güncellendi, mesaj geldi, ödeme onayı
- Quiet hours (gece bildirim yok, opt-in)

### Offline Tolerance
- Form taslakları local kaydedilir (AsyncStorage)
- Senkronizasyon network gelince
- Optimistic UI updates (TanStack Query)

### Realtime
- Mesajlaşma anlık
- RFQ teklif geldiğinde anlık
- Sipariş status değişikliği anlık
- Supabase Realtime channels kullan

### Search
- pgvector ile semantic search (Faz 1'den itibaren)
- Klasik full-text search backup
- Trigram (pg_trgm) fuzzy match Türkçe için

### Görsel
- Image upload: Expo Camera + Expo ImagePicker
- Compress before upload (1024px max width)
- Supabase Storage'a yükleme
- Image CDN: Supabase'in built-in transformation

### Multi-language Hazırlığı
Faz 1'de **sadece Türkçe** — ama i18n altyapısı baştan kurulmalı (`react-i18next`). Faz 3'te eklenecek: Kürtçe (Güneydoğu), Arapça (Suriyeli işçiler), Rusça (Antalya/Bodrum yatırımcıları).

---

## Edge Case'ler & Iş Kuralları

### Stok Kontrolü
- Satıcı stok girer, alıcı sipariş verirken kontrol yapılır
- Race condition için Supabase row-level lock veya optimistic update
- Stok bittiyse "Stokta yok" görünür, "Bana haber ver" butonu

### RFQ İptal
- Alıcı RFQ açtıktan sonra 1 saat içinde ücretsiz iptal edebilir
- Sonra teklif gelmişse, teklif kabul edilmediyse iptal edilebilir
- Kabul edilen teklif iptal sadece satıcı onayı ile

### Sipariş İptal
- Satıcı "Hazırlanıyor" statüsünden önce iptal edebilir (alıcıya iade)
- "Sevk edildi" sonrası iade ürünü geri alma süreci başlar
- Iyzico ile otomatik iade

### Şikayet & Dispute
- Alıcı veya satıcı şikayet açabilir
- Platform 48 saat içinde inceler
- Çözüm: refund / yeniden gönderim / cancel / dispute kapatma

### Üyelik Limit Aşımı
- Ücretsiz alıcı 20 aramayı aştığında: "Pro'ya yükselt" ekranı → web'e text yönlendirme
- Ücretsiz nakliyeci 5 işi tamamladığında: "Gold/Premium üyelik için web sitemizi ziyaret edin"

### KVKK Uyumluluğu
- Hesap silme: kullanıcı kendisi silebilir
- Veri export: kullanıcı kendi verisini indirebilir
- Veri silme: 30 gün soft delete, sonra hard delete
- Audit log: kim hangi veriyi ne zaman değiştirdi

---

## Erişilebilirlik (a11y)

- Tüm metin için 4.5:1 minimum kontrast
- Dokunma alanı min 44x44pt
- Screen reader desteği (VoiceOver / TalkBack)
- Renk körü desteği (sadece renkle bilgi verme)
- Dynamic type desteği (kullanıcı font boyutu büyütebilsin)

---

**Sonraki adımlar:** Tech kararları için `03-TECH.md`, veritabanı şeması için `04-DATABASE.md`.
