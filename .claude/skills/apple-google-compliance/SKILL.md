---
name: apple-google-compliance
description: Mobile app (React Native, Expo, iOS, Android) için Apple App Store ve Google Play store kuralları. Üyelik/abonelik UI, payment, webview, deep link yazılırken otomatik tetiklenir. Komisyon atlatma stratejisi, anti-steering kuralları, fiziksel mal istisnası. "mobile", "react native", "expo", "ios", "android", "app store", "play store", "subscription", "üye ol", "üyelik", "premium" geçen istekler için.
---

# Apple/Google App Store Compliance

> **Tek bir hata = uygulamamız mağazadan kalkar.**

İnşaat Borsam **"Web-First Subscription Model"** kullanır. Spotify, Netflix, Amazon ile aynı strateji.

## HARD BANS (Mobile App'te asla yapma)

### ❌ Üyelik satın alma UI
```tsx
// ❌ YASAK — mobil uygulamada
<Button>Üye Ol</Button>
<Button>Pro'ya Yükselt</Button>
<Button>Premium'a Geç</Button>
<Button>Aboneliği Başlat</Button>
<Text>€99/ay - Hemen Abone Ol</Text>
```

### ❌ Plan/fiyat ekranları
```tsx
// ❌ YASAK
<PricingScreen plans={['starter', 'pro', 'enterprise']} />
<Text>Başlangıç: €99/ay</Text>
<Text>Pro: €199/ay</Text>
```

### ❌ Web'e yönlendirme (anti-steering)
```tsx
// ❌ YASAK
<Modal>
  <Text>Aboneliğinizi yükseltmek için</Text>
  <Button onPress={() => Linking.openURL('https://insaatborsam.com/satici/yukselt')}>
    Web Sitesine Git
  </Button>
</Modal>

<QRCode value="https://insaatborsam.com/abonelik" />

<Button>WhatsApp'tan İletişime Geç</Button>
```

### ❌ WebView ile checkout
```tsx
// ❌ YASAK
<WebView source={{ uri: 'https://insaatborsam.com/checkout' }} />
```

### ❌ Apple/Google sahip olduğu yöntemleri bypass
```tsx
// ❌ YASAK — Apple/Google haberi olmadan paywall
<Modal visible={!user.isPro}>
  <Text>Bu özellik premium</Text>
  <Button>Şimdi Yükselt</Button>
</Modal>
```

## ALLOWED (Mobile App'te yapılabilir)

### ✅ Giriş Yap akışı
```tsx
// Magic link veya SMS OTP
<Screen>
  <Text>Hesabınız var mı?</Text>
  <Input placeholder="E-posta veya telefon" />
  <Button>Giriş Kodunu Gönder</Button>
</Screen>
```

### ✅ "Hesabınız yok mu?" → sessiz yönlendirme
```tsx
// İzin verilen: sadece bilgilendirici, CTA yok
<Text>
  Hesabınız yok mu? insaatborsam.com adresinden kayıt olabilirsiniz.
</Text>
// Linki tıklanabilir yapma, görsel olarak da CTA olmasın
```

> **Risk:** Bu metin bile sınırda. Güvenli yol — hiç bahsetme. Onboarding **dışarıda** yapılır (WhatsApp/saha).

### ✅ Özellik kapalı ekranı (CTA YOK)
```tsx
// Premium özellik tıklandığında
<Screen>
  <Icon name="lock" />
  <Text>Bu özellik hesabınızda aktif değil.</Text>
  {/* HİÇBİR CTA YOK */}
</Screen>
```

### ✅ Fiziksel mal satışı + Iyzico
İnşaat malzemesi **fiziksel mal**. Apple/Google istisna.

```tsx
// İzin verilen
<ProductDetail>
  <Text>{product.name}</Text>
  <Price>{product.price} ₺</Price>
  <Button onPress={openIyzicoCheckout}>Sepete Ekle</Button>
</ProductDetail>
```

> **Önemli:** App Store metadata'sında uygulama kategorisi "Business" veya "Shopping", abonelik kelimesi geçmez.

## ONBOARDING AKIŞI (Komisyondan Kaçınma)

```
1. Saha satışçı / WhatsApp dış kanal
   └→ Satıcıyı bulur, kişisel olarak tanıtır

2. WhatsApp'tan davet
   └→ "İnşaat Borsam'a hoş geldiniz. Link: insaatborsam.com/davet/abc"

3. Web'de kayıt + ödeme
   └→ Plan seç (Iyzico/Stripe)
   └→ Hesap aktifleşir

4. SMS/Email bildirim
   └→ "Hesabınız aktif. Uygulamayı indirin."

5. App Store/Play'den indir
   └→ "Giriş Yap" akışı (SMS OTP)
   └→ Operasyonel kullanım başlar
```

**Mobil uygulama hiçbir yerde para görmez** (sipariş Iyzico hariç).

## APP STORE METADATA KURALLARI

### App Store Connect / Google Play Console

```yaml
# ❌ YASAK kelimeler description'da
- "abonelik"
- "üyelik satın al"
- "premium plan"
- "Pro'ya yükselt"

# ✅ İZİN VERİLEN
- "B2B marketplace"
- "tedarik platformu"
- "müteahhitler için ürün arama"
- "satıcılar ve alıcıları buluşturur"
```

### Kategori
- App Store: **Business** veya **Shopping**
- Play Store: **Business** veya **Shopping**

### Screenshots
- Plan ekranı, fiyat tablosu **GÖSTERME**
- Sadece operasyonel ekranlar (arama, ürün, RFQ, mesaj)

### Privacy Policy
- KVKK + GDPR uyumlu
- Açıkça: "Üyelik web sitemizden satılır"

## DEEP LINK STRATEJİSİ

### Magic link giriş
```tsx
// Web'de butona basınca:
// → insaatborsam.com/giris-yap?token=xxx
// → Token doğrulanır
// → Mobile app açar (deep link)

// Mobile app handler
Linking.addEventListener('url', ({ url }) => {
  const token = parseToken(url)
  if (token) signInWithToken(token)
})
```

Bu hem komisyondan kaçınma, hem UX iyileştirici.

### Deep link configuration
```ts
// app.json (Expo)
{
  "expo": {
    "scheme": "insaatborsam",
    "ios": {
      "associatedDomains": ["applinks:insaatborsam.com"]
    },
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{
          "scheme": "https",
          "host": "insaatborsam.com",
          "pathPrefix": "/giris-yap"
        }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}
```

## REVIEW REJECTION HAZIRLIK

Apple/Google review'da reddedilirse muhtemel sebepler:

| Sebep | Yanıt |
|---|---|
| "External purchase mention" | Üyelik bahsi yok — `Linking.openURL` reviewer'a açıkla |
| "Subscription not via IAP" | Üyelik fiziksel hizmet aboneliği, B2B SaaS — Reader Rules istisna |
| "Reader App" başvuru | Apple "Reader App" kategorisi başvur — kayıt + giriş allowed |

### Apple "Reader App" 3.1.3(a)
> "Reader apps may allow users to access content, subscriptions, or features acquired elsewhere"

İnşaat Borsam bu kategoriye girer:
- Üyelik elsewhere (web) satın alınır
- Mobil sadece **görüntüleme/erişim**
- Operasyonel araç, satış noktası değil

### Google Play "External" başvuru
Google 2024'ten beri B2B uygulamalar için **external payment** izin veriyor (DMA sonrası AB). Geçiş süreci:

```
1. Play Console > Apps > Monetization setup
2. "Are you offering external billing?" → Yes
3. Türkiye için: B2B kategori başvuru
```

## TEST CHECKLIST (Submit Önce)

### Functional
- [ ] Mobil uygulamada **hiçbir yerde** "Üye Ol" butonu yok mu?
- [ ] Plan/fiyat ekranı **yok** mu?
- [ ] Web'e yönlendiren pop-up **yok** mu?
- [ ] WebView ile checkout **yok** mu?
- [ ] QR kod ile web bilet **yok** mu?
- [ ] Premium özellik kapalı ekranında CTA **yok** mu?

### Metadata
- [ ] App description'da "abonelik" kelimesi **yok** mu?
- [ ] Fiyat screenshot'ı **yok** mu?
- [ ] Privacy policy yayınlandı mı?
- [ ] Reviewer'a not eklendi mi: "B2B SaaS — subscription sold on insaatborsam.com (Reader App)"?

### Test
- [ ] Sandbox login akışı çalışıyor mu?
- [ ] Magic link deep link çalışıyor mu?
- [ ] Iyzico (fiziksel mal) checkout test edildi mi?
- [ ] Özellik kapalı state UX'i test edildi mi?

## SUBMIT NOTU (Reviewer'a)

App Store Connect "App Review Information > Notes":

```
This is a B2B marketplace for the Turkish construction industry.

- User accounts are created on our website (insaatborsam.com)
- Subscriptions are sold on the website (B2B SaaS, not digital content)
- The mobile app is an operational tool for already-registered users
- Physical product purchases happen in-app via Iyzico (Turkey's main payment provider)
- No subscription UI exists in the mobile app
- Users sign in with email/SMS OTP only

This follows the Reader App model (3.1.3a) for accessing externally-purchased B2B services.

Test account:
- Email: review@insaatborsam.com
- OTP: 111111 (sandbox mode)
```

## YAZIM ÖNCESİ CHECK

Mobile UI yazmadan önce:
- [ ] Bu ekranda fiyat, plan, abonelik bahsi var mı? (Varsa SİL)
- [ ] CTA "Üye Ol" / "Yükselt" var mı? (Varsa SİL)
- [ ] Web'e yönlendiren link var mı? (Varsa sessiz hale getir)
- [ ] WebView kullanıyor muyum? (Kullanma)
- [ ] Bu işlem fiziksel mal mı (sipariş)? → Iyzico in-app OK
- [ ] Bu işlem dijital içerik mi (abonelik)? → Mobile DIŞARI

## REFERANSLAR

- `docs/07-BUSINESS.md` Bölüm 3 — Apple/Google Atlatma Stratejisi
- Apple Reader Rules: 3.1.3(a)
- Google Play DMA: B2B external billing
- App Store Review Guidelines (en güncel kontrol et — kurallar değişebilir)

## ÖNEMLİ NOT

Bu kurallar **Mayıs 2026** itibariyle geçerli. Apple/Google kuralları **sık değişir**. Major launch öncesi en güncel kuralları kontrol et:
- https://developer.apple.com/app-store/review/guidelines/
- https://play.google.com/about/developer-content-policy/
