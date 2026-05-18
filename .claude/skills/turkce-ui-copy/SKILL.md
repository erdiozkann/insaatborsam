---
name: turkce-ui-copy
description: UI metni, label, buton metni, error mesajı, başlık, açıklama, email, bildirim metni yazılırken otomatik tetiklenir. Türkçe sektörel dil, terminoloji, hitap tonu, para/tarih formatları. "label", "button text", "title", "heading", "error message", "placeholder", "metin", "yazı", "kopya", "string", "i18n" geçen istekler için.
---

# Türkçe UI Copy Kuralları

İnşaat Borsam'ın tüm UI metni **Türkçe** ve **sektörel jargon**a sadık. Generic developer çevirisi (Google Translate tarzı) yasak.

## HİTAP TONU

| Konum | Hitap | Örnek |
|---|---|---|
| Tüm UI | **Siz** | "Teklifinizi gönderdik" |
| Hata mesajı | Yumuşak ama net | "Bilgileri kontrol edin" değil "Lütfen iletişim bilgilerinizi kontrol edin" |
| Onay (CTA) | Emir/fiil | "Teklif Gönder", "Sipariş Ver", "İndir" |
| Bilgilendirme | Bildirim | "Yeni RFQ aldınız" |
| Boş ekran | Çağrı + açıklama | "Henüz RFQ yok. İlk RFQ'nuzu oluşturarak başlayın." |

**Asla "Sen":**
- ❌ "Hesabını oluştur" → ✅ "Hesabınızı oluşturun"
- ❌ "Devam et" → ✅ "Devam Edin" veya "Devam"

## SEKTÖR SÖZLÜĞÜ (İngilizce → Türkçe)

### Genel terimler

| İngilizce | Türkçe | Kullanım |
|---|---|---|
| RFQ (Request for Quote) | **Teklif Talebi** | "Yeni Teklif Talebi" |
| Quote / Offer | **Teklif** | "Tekliflerim" |
| Order | **Sipariş** | "Siparişlerim" |
| Cart | **Sepet** | "Sepete Ekle" |
| Wishlist | **Favoriler** | "Favorilerime Ekle" |
| Vendor / Supplier | **Satıcı** veya **Bayi** | Marketplace'te "Satıcı" |
| Buyer | **Alıcı** | Müteahhit veya usta |
| Shipping | **Sevkiyat** | "Sevkiyat Adresi" |
| Delivery | **Teslimat** | "Teslimat Tarihi" |
| Inventory | **Stok** | "Stok Yönetimi" |
| Listing | **İlan** veya **Ürün** | "İlan Ver" |
| Marketplace | **Pazaryeri** veya **Borsa** | Brand: "Borsa" |
| Dashboard | **Panel** | "Yönetici Paneli" |
| Settings | **Ayarlar** | "Hesap Ayarları" |
| Profile | **Profil** | "Profilim" |
| Notification | **Bildirim** | "Bildirimleriniz" |
| Search | **Ara** veya **Arama** | "Ürün Ara" |
| Filter | **Filtre** veya **Filtrele** | "Filtrele" |
| Sort | **Sırala** | "Sırala: Fiyat" |
| Category | **Kategori** | "Kategoriler" |
| Tag | **Etiket** | "Etiketler" |
| Status | **Durum** | "Durum: Aktif" |

### İnşaat sektörü özel

| İngilizce / Yaygın | Türkçe | Açıklama |
|---|---|---|
| Site Manager | **Şantiye Şefi** | Asla "Site Manager" yazma |
| Construction site | **Şantiye** | |
| Site / Project | **Proje** | UI'da proje |
| Bill of Materials | **Metraj Listesi** veya **Malzeme Listesi** | Müteahhit terimi |
| Subcontractor | **Taşeron** | |
| Foreman | **Usta** | |
| Master / Craftsman | **Usta** | |
| Apprentice | **Çırak** | |
| Trades (electric/plumbing) | **Meslek dalı** | |
| Quantity Survey | **Metraj** | |
| Progress Payment | **Hak Ediş** | Müteahhit ödeme terimi |
| Specification | **Şartname** | |
| Blueprint / Plan | **Proje** veya **Çizim** | |
| Permit | **Ruhsat** | |
| KDV (Turkish VAT) | **KDV** | %18, %20 (mevcut) |
| Invoice | **Fatura** | E-Fatura için "E-Fatura" |
| Waybill | **İrsaliye** | E-İrsaliye, yasal |
| Pallet | **Palet** | |
| Wholesale | **Toptan** | |
| Retail | **Perakende** | |
| Hardware store | **Nalbur** veya **Hırdavatçı** | |
| Lumber | **Kereste** | |
| Concrete | **Beton** | |
| Rebar | **İnşaat Demiri** veya **Demir** | |
| Cement | **Çimento** | |
| Tile | **Seramik** veya **Fayans** | |
| Plumbing | **Tesisat** | |
| Electrical materials | **Elektrik Malzemesi** | |
| Paint | **Boya** | |
| Insulation | **Yalıtım** veya **İzolasyon** | |
| Aggregate | **Agrega** | Kum, çakıl |

### Birimler

| Birim | Türkçe gösterim |
|---|---|
| m² | **m²** (metrekare) |
| m³ | **m³** (metreküp) |
| kg | **kg** |
| ton | **ton** |
| adet | **adet** |
| paket | **paket** |
| metre | **m** |
| litre | **L** veya **lt** |

Etiketlerde uppercase: `M²`, `M³`, `KG`, `TON`, `ADET`

## PARA FORMATI

Türk Lirası:
```
₺1.250         (binlik: nokta)
₺1.250,50      (ondalık: virgül)
₺1.250,00      (ondalık her zaman 2 hane ödeme/fatura'da)
₺12.450        (4+ haneli — okunabilirlik için)
```

Euro (subscription/SaaS fiyatları):
```
€99/ay
€199 yıllık
€1.908 (yıllık ödeme)
```

**Hiçbir zaman:**
- ❌ `$1,250.50` (yanlış format)
- ❌ `TL 1250` (sembol önde, TL kısaltma)
- ❌ `1250 TRY` (kullanıcıya göstermek için)

JavaScript Intl kullan:
```ts
new Intl.NumberFormat('tr-TR', { 
  style: 'currency', 
  currency: 'TRY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(1250.5) // "₺1.250,50"
```

## TARİH FORMATI

| Bağlam | Format | Örnek |
|---|---|---|
| Listede (kısa) | `dd.mm.yyyy` | `15.11.2026` |
| Detay sayfası | `dd Ayadı yyyy` | `15 Kasım 2026` |
| Relative time | `... önce` | `3 saat önce`, `2 gün önce` |
| Saat | `HH:mm` (24h) | `14:30` |
| Tarih + saat | `dd.mm.yyyy HH:mm` | `15.11.2026 14:30` |

```ts
new Intl.DateTimeFormat('tr-TR', { 
  day: 'numeric', month: 'long', year: 'numeric' 
}).format(date) // "15 Kasım 2026"
```

**Ay isimleri:** Ocak, Şubat, Mart, Nisan, Mayıs, Haziran, Temmuz, Ağustos, Eylül, Ekim, Kasım, Aralık.

**Gün isimleri:** Pazartesi, Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar.

## TELEFON FORMATI

```
+90 532 123 45 67     (uluslararası, e.164 ile uyumlu)
0532 123 45 67        (yerel, listede)
```

## VKN / TC FORMAT

```
VKN: 1234567890       (10 hane)
TC:  12345678901      (11 hane) — UI'da gösterme, sadece backend
```

## HATA MESAJLARI

### Kural: "Suçlama yok, çözüm var"

| ❌ Kötü | ✅ İyi |
|---|---|
| "Yanlış email" | "Email formatı geçerli değil. Örnek: ad@firma.com" |
| "Şifre kısa" | "Şifreniz en az 8 karakter olmalı" |
| "Hata oluştu" | "Bağlantı sorunu. Lütfen tekrar deneyin." |
| "Geçersiz" | "Bu alan zorunlu" veya "Lütfen geçerli bir telefon numarası girin" |
| "Failed" | Türkçe yaz, "başarısız" yerine "tamamlanamadı" |

### Boş ekranlar

```
"Henüz teklif almadınız.
RFQ'nuzu paylaşarak satıcılardan teklif almaya başlayın."

[RFQ Oluştur] (CTA)
```

### Yükleme

```
"Yükleniyor..."    (genel)
"Ürünler getiriliyor..."   (spesifik)
"Teklifiniz gönderiliyor..."   (action)
```

### Başarı

```
"Teklifiniz gönderildi."
"Sipariş oluşturuldu. Onay için e-postanızı kontrol edin."
"Profiliniz güncellendi."
```

## BUTON METNİ

Kısa, fiil ile başla, max 3 kelime:

| ✅ İyi | ❌ Kötü |
|---|---|
| `Teklif Gönder` | `Şimdi Teklifinizi Gönderebilirsiniz` |
| `Sepete Ekle` | `Bu Ürünü Sepete Ekle` |
| `İndir` | `Şimdi İndir` |
| `Devam` | `Devam Etmek İçin Tıklayın` |
| `Kaydet` | `Bilgileri Kaydet` (gerekirse "Değişiklikleri Kaydet") |
| `İptal` | `Vazgeç ve Kapat` |

**Uppercase için:** Buton sadece `tracking-wider` ile uppercase görünür, JS'de `TEKLIF GÖNDER` yazma — `Teklif Gönder` yaz, CSS uppercase yapsın.

## YAYGIN METİN PATTERN'LERİ

### Onay diyaloğu
```
Başlık: [Eylem] Onayı
İçerik: [Detay açıklama]
Butonlar: [Vazgeç] [İşlemi Tamamla]
```

Örnek:
```
Başlık: Siparişi İptal Etme Onayı
İçerik: SP-12345 numaralı siparişiniz iptal edilecek. Bu işlem geri alınamaz.
Butonlar: [Vazgeç] [Siparişi İptal Et]
```

### Bildirim
```
[Aksiyon] [obje] [zaman]
```

Örnek:
```
"Demir Yapı A.Ş. teklif gönderdi"
"3 yeni RFQ aldınız"
"Siparişiniz kargoya verildi"
```

### Email konu satırı
```
[Marka] - [Aksiyon/durum]
```

Örnek:
```
İnşaat Borsam - Yeni teklif aldınız (RFQ-1234)
İnşaat Borsam - Sipariş onayı (SP-5678)
```

## TÜRKÇE YAZIM KURALLARI

- "ki" bağlaç ayrı: "biliyorum **ki**", "**çünkü**", "**ancak**"
- "de/da" bağlaç ayrı: "ben **de**", "evde" (lokatif birleşik)
- "mi/mı" soru eki ayrı: "Geldi **mi**?", "Onayladınız **mı**?"
- Apostrof özel isimde: "Türkiye'nin", "İnşaat Borsam'ın"
- Büyük harfle başlayan: özel isim, cümle başı, başlık (her kelime değil)
  - ✅ "Yeni Sipariş Oluştur" (başlık)
  - ❌ "Yeni Sipariş Oluşturun" sentence içinde her kelime büyük yazma

## EMOJI POLİTİKASI

UI'da emoji **yok**. Marketing içerik (landing, blog, social) ve onboarding'de **az** kullan.

İstisna: System icon olarak kullanılabilir (✓ başarı, ⚠ uyarı) — ama tercihen lucide-react icon.

## "DON'T DROP CASE" KURALI

Türkçe'de uppercase:
- ✅ "İNŞAAT BORSAM" (özel isim büyük)
- ✅ "STOKTA" (label)
- ❌ "INSAAT BORSAM" (İ → I yanlış)
- ❌ "stokta" (label'da lowercase yanlış)

Browser'da `lang="tr"` set edilmişse CSS `text-transform: uppercase` doğru çalışır. Test et.

## YAZIM ÖNCESİ CHECK

UI metni yazmadan önce:
- [ ] Hitap "siz" mi (sen değil)?
- [ ] Generic developer çevirisi var mı? (Sektör terimine çevir)
- [ ] Hata mesajı çözüm sunuyor mu?
- [ ] Buton metni 1-3 kelime mi?
- [ ] Para formatı `₺1.250,50` mu?
- [ ] Tarih formatı doğru mu?
- [ ] Birim doğru mu (m² vs m2)?
- [ ] Türkçe yazım (ki/de/mi ayrı) doğru mu?
- [ ] Apostrof özel isimde doğru mu?

## REFERANS

Detaylı sözlük ve sektörel terimler: `docs/02-SPEC.md` (Sektörel Sözlük bölümü)
