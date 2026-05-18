# @insaatborsam/buyer

Alıcı (müteahhit, usta, mühendis, mimar) için React Native + Expo SDK 52 uygulaması.

## Durum

**Sprint 0 sonu:** Sadece package.json placeholder. Gerçek Expo iskeleti Sprint 1'de.

## Sprint 1 Init Komutu

```bash
cd apps/buyer
npx create-expo-app@latest . --template tabs
# Sonra:
# - expo-router (zaten template'te)
# - nativewind v4
# - @insaatborsam/ui, @insaatborsam/database, @insaatborsam/shared workspace bağlantısı
# - expo-secure-store, expo-notifications, expo-image-picker
```

## Faz 1 Tab Bar (4 tab)

1. **Ana Sayfa** — search, kategoriler, fiyat endeksi widget'ı (manuel veri)
2. **Ara** — semantic search + filtre + harita
3. **Sipariş** — aktif + geçmiş siparişler
4. **Profil** — ayarlar, üyelik (sadece görüntüleme, satış yok)

> "Projelerim" Faz 2'ye ertelendi.

## Kritik

- "Üye Ol" butonu **YOK** — sadece "Giriş Yap" (SMS OTP)
- Üyelik satışı mobilde **YOK** — sadece web (Apple/Google anti-steering)
- Detay: `docs/02-SPEC.md` Bölüm 2 + `apple-google-compliance` skill
