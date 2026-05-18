# 07 — İş Modeli ve Operasyon

**Status:** Locked Faz 1 | **Last Updated:** 2026-05-18 | **Owner:** Erdi

> Para nereden gelir, nereye gider, nasıl yasal kalırız, nasıl müşteri buluruz.

---

## İçindekiler
1. Gelir Modeli
2. Fiyatlandırma Detayı
3. Apple/Google Komisyonu Atlatma Stratejisi
4. Ödeme Altyapısı (Iyzico vs Stripe)
5. Go-to-Market Stratejisi
6. İlk 100 Satıcı Acquisition Planı
7. Türkiye Yasal & Regülasyon
8. Finans & Cash Flow
9. Birim Ekonomisi
10. Riskler ve Azaltma

---

## 1. Gelir Modeli

İnşaat Borsam **çoklu gelir akışı** çalışır — tek bir kaynağa bağımlı değil. Faz 1'de sadece (a) ve kısmen (b) aktiftir.

| # | Gelir Kaynağı | Faz | Açıklama |
|---|---|---|---|
| a | **Satıcı abonelik** | Faz 1 | Aylık SaaS — Başlangıç/Pro/Enterprise |
| b | **İşlem komisyonu** | Faz 1 | %3-5 sipariş tutarı üzerinden (sadece platform içi ödemeler) |
| c | **Alıcı Pro abonelik** | Faz 1 | İsteğe bağlı — pro arama özellikleri |
| d | **Nakliye komisyonu** | Faz 2 | %5-8 nakliye ücreti üzerinden |
| e | **Reklam / Öne Çıkar** | Faz 2 | Sponsorlu ürün listeleme |
| f | **Veri ürünleri** | Faz 3 | Fiyat endeksi API erişimi (Kurum/B2B) |
| g | **Fintech (Escrow)** | Faz 3 | Güvenli ödeme komisyonu + fonlama |
| h | **Otomasyon eklentileri** | Faz 3 | WhatsApp Bot, Meta Ads, e-Fatura — aylık eklenti |

### Faz 1 hedefi (90 gün sonu)
- **MRR ~₺25K (€800)** — 50 aktif satıcı × ortalama ₺500/ay
- **Komisyon ~₺40K (€1,300)** — ₺2M GMV × %2 efektif komisyon
- **Toplam aylık gelir hedefi:** ~₺65K (€2,100)

> Faz 1'de **kar değil, validasyon** hedef. Cash flow planı için bkz. Bölüm 8.

---

## 2. Fiyatlandırma Detayı

### Genel Prensip
- **Tüm fiyatlar Euro cinsinden gösterilir** (TRY enflasyon volatilitesi için)
- Türk müşteriye **TRY ödeme seçeneği** sunulur (Iyzico üzerinden, anlık kur)
- Avrupa/yurt dışı müşteri Stripe ile EUR öder
- Yıllık ödeme **%20 indirim** (2 ay bedava mantığı)
- KDV dahil/hariç **net belirtilir** — B2B olduğu için genelde KDV hariç

### 2.1 Satıcı Planları (CORE GELİR)

| Özellik | **Başlangıç** | **Pro** | **Enterprise** |
|---|---|---|---|
| Aylık fiyat | **€99** | **€199** | **€599** |
| Yıllık fiyat | €948 (€79/ay) | €1,908 (€159/ay) | €5,748 (€479/ay) |
| Ürün sayısı | 50 | 500 | Sınırsız |
| RFQ teklif/ay | 30 | 200 | Sınırsız |
| Komisyon oranı | %5 | %4 | %3 |
| WhatsApp Business entegrasyonu | ❌ | ✅ | ✅ |
| Otomatik fiyat güncelleme | ❌ | ✅ | ✅ |
| Çoklu kullanıcı (ekip) | 1 | 3 | 10 |
| API erişimi | ❌ | ❌ | ✅ |
| Öne çıkan rozet | ❌ | "Pro Satıcı" | "Enterprise" |
| Hesap yöneticisi | ❌ | ❌ | ✅ Dedicated |
| Aylık satış raporu | Basit | Detaylı | Custom + API |

### 2.2 Alıcı Planları

| Özellik | **Ücretsiz** | **Pro €49/ay** | **Business €99/ay** |
|---|---|---|---|
| Arama / gün | 20 | Sınırsız | Sınırsız |
| RFQ oluşturma | 5/ay | 50/ay | Sınırsız |
| Fiyat geçmişi görüntüleme | Son 7 gün | Son 90 gün | Son 12 ay |
| Çoklu proje yönetimi | 1 proje | 5 proje | Sınırsız |
| Toplu RFQ (Excel) | ❌ | ✅ | ✅ |
| Ekip üyeleri | 1 | 3 | 10 |
| AI BOM Generator | ❌ | ❌ | ✅ (Faz 2) |

> **Strateji:** Alıcılar Faz 1'de **ücretsizdir** — sadece satıcılardan abonelik alıyoruz. Pro/Business planları Faz 1'de katalogda durur, **agresif satılmaz**. Alıcı kalabalığı = satıcı çekim gücü.

### 2.3 Nakliyeci Planları (Faz 2'den itibaren)

| Özellik | **Ücretsiz** | **Gold €49/ay** | **Premium €99/ay** |
|---|---|---|---|
| Aylık iş alma limiti | 5 iş | Sınırsız | Sınırsız |
| Komisyon oranı | %8 | %6 | %5 |
| Öncelikli iş gösterimi | ❌ | ✅ | ✅ |
| Rota optimizasyonu | ❌ | ❌ | ✅ |
| API entegrasyon | ❌ | ❌ | ✅ |

### 2.4 İşlem Komisyonu

Sipariş platform içinde ödenirse:
- **Başlangıç planı:** %5
- **Pro plan:** %4
- **Enterprise plan:** %3

Sipariş **platform dışı** (WhatsApp/telefon/havale) gerçekleşirse:
- Komisyon **alınmaz** ama satıcı abonelik ücretini öder
- Bu sayede satıcı kaçırmaya çalışmaz — abonelik zaten ödeniyor

---

## 3. Apple/Google Komisyonu Atlatma Stratejisi (KRİTİK)

### Sorun
Apple App Store ve Google Play, **dijital içerik aboneliklerinden %15-30 komisyon** alır. Buna uymazsak uygulamamız mağazadan kalır.

### Çözüm: "Web-First Subscription Model"

#### Kural #1: Mobil uygulamada üyelik satışı **YOK**
- ❌ Hiçbir "Üye Ol" butonu yok
- ❌ Hiçbir plan/fiyat ekranı yok
- ❌ Hiçbir "Yükselt" / "Pro'ya Geç" CTA'sı yok
- ✅ Sadece "Giriş Yap" akışı var

#### Kural #2: Web tarafında satış serbest
- ✅ insaatborsam.com'da plan ekranları
- ✅ Stripe/Iyzico checkout web'de
- ✅ Üyelik webde aktifleşince mobil uygulama açılır

#### Kural #3: Mobil → Web yönlendirme YASAK
- ❌ Pop-up yok ("hesabınızı yükseltmek için web sitemize gidin")
- ❌ WebView yok
- ❌ QR kod yok
- ❌ Anti-steering metni yok
- ✅ Sadece sessiz "premium özellik" ekranı: "Bu özellik aktif değil" — başka bir şey değil

#### Kural #4: Fiziksel mal satışı uygulamada serbest
- ✅ İçinde Iyzico ile sipariş ve ödeme tamamlanır
- Sebep: Apple/Google **fiziksel mal** komisyonu almıyor (sadece dijital içerik)
- İnşaat malzemesi = fiziksel mal ✅

### Onboarding Akışı (Komisyondan Kaçınma)

```
1. Saha satışçı / WhatsApp dış toplum kanalı → satıcıyı bulur
2. WhatsApp'tan "İnşaat Borsam'a hoş geldiniz" mesajı
3. Mesajda link: insaatborsam.com/davet/xxx (magic link)
4. Satıcı web'de:
   - Plan seçer (Başlangıç/Pro/Enterprise)
   - Iyzico ile öder
   - Hesabı oluşur
5. SMS/Email: "Hesabınız aktif. Uygulamayı indir → giriş yap"
6. App Store / Play'den indir → SMS OTP ile giriş
```

**Tüm para webde yatar, mobil uygulama sadece operasyonel araçtır.**

### Apple/Google'a karşı pozisyon
- App Store metadata: "İnşaat Borsam — B2B Tedarik Marketplace"
- Tanım: "Fiziksel inşaat malzemesi alım-satım platformu"
- Hiçbir yerde "abonelik", "premium plan" geçmez
- Apple sorarsa: "Üyelik kurumsal SaaS'tır, web üzerinden satılır. Mobil uygulama operasyonel araçtır."

> **Referans:** Bu model **Spotify, Netflix, Kindle, Amazon Marketplace** ile aynı. Tümü web-first subscription. Yasal ve test edilmiş.

---

## 4. Ödeme Altyapısı (Iyzico vs Stripe)

### Karar: **Her ikisi de aktif**

| Senaryo | Platform | Sebep |
|---|---|---|
| Türk satıcı abonelik | **Iyzico** | TRY ödeme, anlaşmalı POS, yerel kart desteği |
| AB/yurt dışı satıcı abonelik | **Stripe** | EUR, kredi kartı, SEPA |
| Türk alıcı platform içi sipariş | **Iyzico** | TRY, taksit imkanı (Faz 2) |
| AB alıcı (Faz 3) | **Stripe** | EUR |
| Satıcıya payout | **IBAN havale** | Iyzico/Stripe payout API'leri |

### Iyzico Detayları
- **Anlaşma türü:** Marketplace (alt-üyelik sistemi)
- **Komisyon:** %2.49 + 0.25 TL/işlem (B2B kart)
- **Hesap açma:** Vergi levhası + imza sirküleri + ticaret sicil + iban
- **Payout:** T+2 iş günü
- **Iyzico Marketplace özelliği:** Alt-üyelere otomatik komisyon kesip kalan tutarı transfer eder
- **Vergi:** Iyzico KDV'siz kesilen komisyonu ay sonunda faturalar

### Stripe Detayları
- **Anlaşma türü:** Stripe Connect (Express)
- **Komisyon:** %1.4 + €0.25 (EU kart), %2.9 + €0.25 (uluslararası)
- **Hesap açma:** Avusturya firması (Erdi'nin Einzelunternehmen) için kolay
- **Payout:** T+7 iş günü (ilk ay), sonra T+2
- **KYC:** Stripe halleder, alt-satıcılar Stripe'a doğrudan bağlanır

### Hangi durumda hangisi?
- Satıcı **TR mukim** → Iyzico zorunlu (TCMB para çıkış kısıtı)
- Satıcı **AB mukim** → Stripe avantajlı
- Alıcı **TR mukim** → Iyzico (TRY ödeme)
- Alıcı **yurt dışı** → Stripe

### Faz 1'de
- Iyzico **Marketplace anlaşması başvuru** — 1 Haziran 2026
- Stripe Connect **direkt kurulum** — 1 hafta

---

## 5. Go-to-Market Stratejisi

### Faz 1: "Karaköy Operasyonu"

**Hedef:** İlk 50 satıcı + 200 alıcıyı **tek bir bölgede** elde et. Karaköy ve Beyoğlu seçildi çünkü:
- Yoğun hırdavat/elektrik/seramik tedarikçi kümesi
- Yürüme mesafesinde 200+ işletme
- Müteahhitlerin sıkça uğradığı bölge
- Saha satış yapılabilir

### 3 Aşamalı GTM

**1. AŞAMA: Karaköy + Beyoğlu Saha Operasyonu (Hafta 1-6)**
- Erdi/asistan **sahada** satıcı kazanır
- Hedef: 50 satıcı, 1 ilçe yoğunluğu
- Yöntem: Yüz yüze + WhatsApp follow-up
- KPI: Haftada 10 satıcı kazanımı

**2. AŞAMA: Müteahhit Tarama (Hafta 4-8)**
- LinkedIn + Instagram + WhatsApp Business grupları
- "İnşaat Borsam'da 50 satıcı var, ücretsiz dene" kampanyası
- Hedef: 200 alıcı kayıt
- KPI: Haftada 50 alıcı kayıt

**3. AŞAMA: İlk Sipariş Garantisi (Hafta 6-12)**
- Her satıcıya **3 ay komisyonsuz garantisi**
- İlk 100 siparişi platform içine getir
- KPI: 100 tamamlanmış sipariş, ₺2M GMV

### Mesajlaşma

**Satıcıya:**
> "Karaköy'deki müteahhitlerle direkt bağlantı kuruyoruz. WhatsApp'tan teklif yöneterek günde 2 saat zamandan kazan. İlk 3 ay komisyonsuz."

**Alıcıya:**
> "Şehrinizdeki 50+ doğrulanmış satıcı tek uygulamada. Ücretsiz fiyat al, RFQ gönder, dakikalar içinde 5 teklif al."

### Kanallar (öncelik sırası)
1. **Saha satış** (Erdi + 1 asistan, Karaköy)
2. **WhatsApp Business grupları** (mevcut müteahhit grupları)
3. **Instagram Reels** (İnşaat içerik etiketlerinde)
4. **LinkedIn outreach** (müteahhit kurucu/satınalmacılara)
5. **Meta Ads** (Faz 2 — €500/ay bütçe)
6. **SEO** (Faz 2 — "İstanbul seramik fiyatları" gibi anahtar kelimeler)

### Bütçe (Faz 1, 90 gün)
| Kalem | Aylık | Toplam |
|---|---|---|
| Asistan (saha satış) | ₺30K (€1K) | ₺90K |
| WhatsApp Business API + n8n | ₺5K | ₺15K |
| Sosyal medya içerik | ₺10K | ₺30K |
| Etkinlik / sahada parça malzeme | ₺5K | ₺15K |
| **TOPLAM Pazarlama** | **₺50K (€1.6K)** | **₺150K (€5K)** |

> Faz 1'de Meta Ads/Google Ads **harcanmaz**. Önce ürün-pazar uyumu, sonra ölçek.

---

## 6. İlk 100 Satıcı Acquisition Planı

### Step 1: Veri Tarama (Hafta 1-2)
Admin Console > Satıcı Kazanım Aracı kullanılarak:
- Lokasyon: **Karaköy, Galata, Beyoğlu, Tophane**
- Kategori: **Seramik & Vitrifiye, Yapı Kimyasalları, Elektrik Malzemesi**
- Veri kaynağı: **Google Maps + Ticaret Sicil**
- Çıktı: ~500 işletme listesi (CSV)

### Step 2: Önceliklendirme (Hafta 2)
Her işletme için **skor**:
- Google rating ≥ 4.0 → +2
- Yorum sayısı ≥ 20 → +1
- Web sitesi var → +1
- Instagram aktif → +1
- WhatsApp Business numarası var → +2

**Skor ≥ 5 = Hedef listede** → ~150 işletme

### Step 3: İlk Temas (Hafta 3-4)
**Yöntem A: Sahada yüz yüze (öncelikli)**
- Erdi + asistan günlük 15 dükkân ziyaret
- 5 dakikalık tanıtım + WhatsApp ekle
- Tablet üstünden canlı demo
- "Tamamen ücretsiz dene, 3 ay komisyonsuz"

**Yöntem B: WhatsApp (sahada bulunmayan için)**
- n8n iş akışı: filtrelenmiş listeden günde 30 işletmeye **kişisel mesaj** (toplu spam değil!)
- Mesaj şablonu:

```
Merhaba [Firma Adı] ekibi,

İnşaat Borsam'ı sizinle paylaşmak istedim. 
İstanbul'da müteahhitlerin malzeme tedarikini hızlandıran 
yeni bir platform — Karaköy bölgesinde ilk satıcıları davet ediyoruz.

İlk 3 ay komisyonsuz. Demo için 5 dakikanızı alabilir miyim?

— Erdi, İnşaat Borsam
+43 ... (Avusturya numarası — meraklı satıcı arasın)
```

### Step 4: Onboarding (Hafta 3-12)
Her satıcı için:
1. WhatsApp üzerinden bilgi topla (firma, kategori, ürün sayısı)
2. Admin Console'dan **manuel hesap aç**
3. Magic link gönder
4. İlk 3 ürünün eklenmesine yardım et (uzaktan ekran paylaşımı)
5. WhatsApp Business entegrasyonu kur (sadece Pro/Enterprise için)
6. Hoş geldin paketi: PDF rehber + video kütüphanesi

### Step 5: Aktivasyon (Sürekli)
Satıcı **aktif** sayılır eğer:
- ≥ 5 ürün eklemiş
- ≥ 1 RFQ'ya teklif vermiş
- ≥ 1 sipariş almış (90 gün içinde)

**Aktivasyon hedefi:** Kayıt olan satıcıların %70'i

### Conversion Funnel (tahmin)
| Aşama | Sayı | Dönüşüm |
|---|---|---|
| Listelenen işletme (tarama) | 500 | — |
| Hedef liste (skor ≥ 5) | 150 | %30 |
| İlk temas (saha/WhatsApp) | 150 | %100 |
| Demo / detaylı görüşme | 75 | %50 |
| Kayıt (Başlangıç planı min.) | 60 | %80 |
| **Aktif satıcı (5 ürün + 1 teklif)** | **50** | %83 |

### İlk 100 satıcıya ulaşma süresi
- İlk 50 (Karaköy): **6-8 hafta**
- 50-100 (genişletme — Ataşehir, Maslak müteahhitlik bölgeleri): **8-12 hafta**

---

## 7. Türkiye Yasal & Regülasyon

> **Disclaimer:** Bu bölüm Claude'un genel bilgisidir, hukuki tavsiye değildir. **Avukat ve mali müşavir görüşü zorunludur.**

### 7.1 Şirket Yapısı

**Faz 1: Erdi'nin Avusturya Einzelunternehmen (NodeWorks)**
- Platform Avusturya'dan operate ediliyor
- Türkiye'de henüz şirket gerek yok (gelir AB'den geliyor — abonelikler)
- Iyzico için **TR alt-temsilcilik** veya **Iyzico Cross-Border** lazım olabilir

**Faz 2 (önerilen): Türkiye'de Limited Şirket veya A.Ş.**
- Yerel iş yapma kolaylığı (Iyzico, TBB, SGK)
- Kurum vergisi avantajı (%20)
- E-fatura zorunluluğu için TR mukim gerekli

> **AKSİYON:** Mali müşavir ile danış — Faz 1 sonu (Ağustos 2026'da).

### 7.2 KVKK (Kişisel Verilerin Korunması Kanunu)

**Zorunlu adımlar:**
- ✅ **VERBİS kayıt** — Veri Sorumluları Sicil Bilgi Sistemi
- ✅ **Aydınlatma metni** — kayıt formunda
- ✅ **Açık rıza** — checkbox + log
- ✅ **Veri işleme envanteri** — hangi veri, nerede, ne kadar saklanıyor
- ✅ **Veri saklama politikası** — bkz. 04-DATABASE.md Bölüm 9
- ✅ **Veri sahibi hakları:** silme talebi, taşıma talebi → email kanalı
- ✅ **Veri ihlali bildirim** — 72 saat içinde KVKK'ya

**KVKK Aydınlatma Metni gerekli bölümler:**
1. Veri sorumlusu (İnşaat Borsam / NodeWorks)
2. İşlenen kişisel veriler
3. İşleme amaçları
4. Aktarım (Supabase EU, Anthropic, OpenAI — yurt dışı transfer açıklaması)
5. Veri sahibi hakları
6. Başvuru yolları

> **AKSİYON:** Bir hukukçudan KVKK metnleri al — Faz 1 başında zorunlu.

### 7.3 e-Ticaret Kanunu (6563 sayılı)

**Marketplace olarak yükümlülükler:**
- ✅ **Aracı hizmet sağlayıcı** olarak T.C. Ticaret Bakanlığı'na bildirim
- ✅ Satıcıların **vergi mükellefiyeti** kontrolü (VKN doğrulama)
- ✅ Satıcı **şikayet mekanizması** + 30 günlük cevap
- ✅ **Mesafeli sözleşme** (Tüketici Hukuku) — B2B'de B2C kadar sıkı değil
- ✅ **Cayma hakkı** — B2B'de sözleşmeye bağlı
- ✅ **Logların saklanması:** 3 yıl (işlem kayıtları)

### 7.4 e-Fatura / e-Arşiv (Faz 2-3)

Türkiye'de **5 milyon TL ciroyu aşan** B2B platformlar **e-fatura zorunlu**:
- Faz 1'de muhtemelen aşılmaz
- Faz 2 sonunda yaklaşılır → **GİB entegrasyonu** (Foriba, Logo, Mikro)
- Komisyon faturalarımız → e-fatura olarak satıcıya
- Satıcı-alıcı arası fatura → onların sorumluluğu (platform sadece kolaylaştırıcı)

### 7.5 SGK / Hizmet Sözleşmeleri
- Erdi şu an **kendi şirketinde**, çalışan yok
- Asistan **freelance / sözleşmeli** → SGK 4B veya alacaklı fatura modeli
- Faz 2+ ekip büyürse → resmi istihdam, SGK kayıtları

### 7.6 Lisans ve İzinler
- ✅ **Domain:** insaatborsam.com (alındı) + insaatborsam.com.tr (Natro üzerinden)
- ✅ **MERSIS kayıt** — Türkiye'de şirket kurulunca
- ✅ **Marka tescili (TÜRKPATENT):** Faz 2'de "İnşaat Borsam" marka başvurusu
- ✅ **SSL + KVKK uyumlu çerez politikası** — web ve mobil

---

## 8. Finans & Cash Flow

### 8.1 Faz 1 Gider Tablosu (90 gün)

| Kalem | Aylık (€) | 3 Ay Toplam (€) |
|---|---|---|
| Supabase Pro | 25 | 75 |
| Vercel Pro | 20 | 60 |
| Hostinger VPS (n8n) | 15 | 45 |
| Sentry + PostHog | 30 | 90 |
| Apple Developer + Google Play | 8 | 25 |
| AI (Claude + OpenAI) | 90 | 270 |
| Iyzico KDV/komisyon (operasyonel) | 50 | 150 |
| Stripe gider | 20 | 60 |
| **Altyapı toplamı** | **258** | **775** |
| | | |
| Saha satış asistanı (TR maaş) | 1,000 | 3,000 |
| Hukuk danışmanlığı (sabit) | 200 | 600 |
| Mali müşavir | 150 | 450 |
| Pazarlama (içerik, etkinlik) | 500 | 1,500 |
| Hukuki tek seferlik (KVKK + sözleşmeler) | — | 1,500 |
| **Operasyon toplamı** | **1,850** | **7,050** |
| | | |
| **GENEL TOPLAM (90 gün)** | **2,108/ay** | **~€7,825** |

### 8.2 Gelir Projeksiyonu (Faz 1, 90 gün)

| Ay | Aktif Satıcı | MRR (€) | GMV (TRY) | Komisyon (€) | **Aylık Gelir (€)** |
|---|---|---|---|---|---|
| Ay 1 | 10 | 100 | ₺200K | 100 | **200** |
| Ay 2 | 30 | 350 | ₺800K | 400 | **750** |
| Ay 3 | 50 | 800 | ₺2M | 1,000 | **1,800** |
| **Toplam** | — | — | ₺3M | €1,500 | **€2,750** |

### 8.3 Faz 1 Net Pozisyon
- Gider: ~€7,825
- Gelir: ~€2,750
- **Açık: ~€5,075** (Erdi'nin yatırması gerek)

### 8.4 Break-even Tahmini
- **Aylık break-even:** ~€2,100 net gelir
- **Satıcı sayısı:** ~70-80 (Pro plan ağırlıklı)
- **Tahmini tarih:** Ekim-Kasım 2026 (Faz 2 başı)

### 8.5 Yatırım Stratejisi
- **Faz 1 finansman:** **Erdi öz kaynak** — ~€8K
- **Faz 2 finansman opsiyonları:**
  - Devam öz kaynak (kar olunca) — tercih
  - **Friends & Family** — akrabalardan / mevcut müteahhit ağından
  - **Melek yatırımcı** — sadece ölçek için, kontrol kaybetmemek için %15-20 max
- **Faz 3+ kararı:** Türkiye'de Pre-Seed/Seed turu (gerekirse)

> **KARAR:** Faz 1'de yatırımcı ARANMAZ. Önce ürün-pazar uyumu, sonra pazarlık gücü.

---

## 9. Birim Ekonomisi

### CAC (Customer Acquisition Cost) — Satıcı
- Saha satış: ₺50K (90 gün) / 50 satıcı = **₺1,000 (~€32) per satıcı**
- WhatsApp/dijital: çok daha düşük, ama dönüşüm de düşük

### LTV (Lifetime Value) — Satıcı
**Varsayım:** Ortalama satıcı **18 ay** kalıyor (B2B SaaS sektör ortalaması)
- Pro plan: €199/ay × 18 = **€3,582**
- Komisyon: ortalama ₺20K/ay × %4 × 18 ay = ₺14,400 (~€460)
- **LTV ≈ €4,000**

### LTV / CAC oranı
**€4,000 / €32 = ~125x**

> Bu rakam **mükemmel**. B2B SaaS için sağlıklı oran 3-5x. Bizim model **inanılmaz verimli** görünüyor.
> Ama dikkat: Bu **tahmin**. Gerçek churn ve LTV Faz 1 sonunda ölçülecek. Aşırı optimistik olabiliriz.

### Payback Period
CAC'i ne kadar sürede geri alıyoruz?
- Pro plan: €199/ay → 1 ay içinde
- Başlangıç plan: €99/ay → 1 ay içinde

> **Payback ≈ 1 ay** → çok hızlı, ölçeklenebilir

---

## 10. Riskler ve Azaltma

| Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|
| **Satıcılar platform dışına kaçar** | Yüksek | Yüksek | Abonelik bağı + WhatsApp entegrasyon değeri + topluluk |
| **Müteahhitler eski (telefon) alışkanlığı bırakmaz** | Yüksek | Yüksek | Saha eğitim + ücretsiz alıcı + komisyonsuz ilk siparişler |
| **Iyzico marketplace anlaşması gecikmesi** | Orta | Yüksek | Plan B: Stripe Connect + havale checkout (Faz 1 başlangıç) |
| **App Store reddi** | Düşük | Çok Yüksek | Web-first model + fiziksel mal vurgusu + zaten test edilmiş yol |
| **KVKK ihlali / cezası** | Düşük | Yüksek | Hukuk danışmanlığı + VERBİS kayıt + veri saklama disiplini |
| **Rakip çıkması (Hepsiburada, Ticimax)** | Orta | Orta | Niş + saha hâkimiyeti + AI dijital farklılaşma |
| **Erdi tek başınalık (bus factor)** | Orta | Çok Yüksek | Erken asistan + dökümante süreçler + AI ajanlar (Faz 2+) |
| **TRY enflasyon / kur şoku** | Yüksek | Orta | Fiyatlar Euro, alacaklar TRY ama hızlı tahsilat |
| **Satıcı dolandırıcılığı** | Orta | Orta | VKN doğrulama + escrow (Faz 3) + rating sistemi |
| **AI maliyeti patlaması** | Düşük | Orta | Cache + model downgrade + günlük spend alert |

### Rakip Analizi (kısa)

| Rakip | Tür | Avantajları | Zayıflıkları | Bizim farkımız |
|---|---|---|---|---|
| **Hepsiburada B2B** | Genel marketplace | Marka + altyapı | İnşaat odaklı değil, müteahhide hitap etmiyor | Niş + saha hâkimiyeti |
| **n11 Pro** | Genel marketplace | Aynı | Aynı | Aynı |
| **Trendyol Hızlı Pazar** | B2B yeni | Yeni, agresif | İnşaat niş yok | Niş + AI |
| **Yapı Marketi siteleri** | Niş web siteleri | Sektör bilir | Mobil zayıf, tek satıcılı | Çoklu satıcı + AI + RFQ |
| **WhatsApp Business grupları** | Organik | Ücretsiz | Dağınık, aranamaz | Yapılandırılmış + searchable + escrow |

> Gerçek rakibimiz **WhatsApp + telefon alışkanlığı**, başka marketplace değil.

---

## Faz 1 Sonu Kontrol Listesi

Faz 1 (Ağustos 2026) sonunda kontrol et:

**İş Modeli Validasyonu:**
- [ ] ≥ 50 aktif satıcı abone
- [ ] ≥ €1,500 MRR
- [ ] ≥ 100 tamamlanmış sipariş
- [ ] LTV/CAC > 5x (gerçek veri)
- [ ] Churn < %15/ay

**Operasyonel Hazırlık:**
- [ ] Iyzico marketplace anlaşması aktif
- [ ] Stripe Connect aktif
- [ ] KVKK + VERBİS kayıt tamam
- [ ] Mali müşavir + hukuk danışmanı sözleşmeleri imzalı
- [ ] e-Ticaret Bakanlığı bildirimi tamam

**Karar Noktaları:**
- [ ] Faz 2'ye geç mi, Faz 1'i derinleştir mi?
- [ ] Asistan/freelancer ekibi büyütülecek mi?
- [ ] Yatırımcı aransın mı?
- [ ] Türkiye'de şirket kurulsun mu?

---

**Bu doküman bitti. Tüm 7 dosya hazır.**

> Faz 1 başlangıcı: **1 Haziran 2026**.
> İlk müşteri kazanım hedefi: **8 Haziran 2026** (Karaköy operasyonu hafta 1).
> Launch: **31 Ağustos 2026**.
