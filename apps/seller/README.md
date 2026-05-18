# @insaatborsam/seller

Satıcı (nalbur, bayi, toptancı, distribütör) için React Native + Expo SDK 52 uygulaması.

## Durum

**Sprint 0 sonu:** Sadece package.json placeholder. Gerçek Expo iskeleti Sprint 1'de.

## Sprint 1 Init Komutu

```bash
cd apps/seller
npx create-expo-app@latest . --template tabs
# Sonra: nativewind v4, workspace bağlantıları (ui/database/shared), expo-camera, expo-image-picker
```

## Faz 1 Tab Bar (6 tab)

1. **Yönetim Paneli** — 4 metrik kartı + 30 günlük ciro chart
2. **Ürünler** — CRUD + bulk action
3. **Teklifler (RFQ Inbox)** — Yeni/Yanıt Bekliyor/Kazanılan/Kaybedilen
4. **Siparişler** — kanban (Yeni → Hazırlanıyor → Sevk Edildi → Teslim Edildi)
5. **Mesajlar** — WhatsApp-style chat
6. **Profil** — üyelik bilgisi (web'e text yönlendirme, link DEĞİL)

## Kritik

- Onboarding sadece "Giriş Yap" — kayıt insaatborsam.com'da
- Üyelik yükseltme metni "insaatborsam.com'a gidin" düz metin — link/QR/WebView YASAK
- Detay: `apple-google-compliance` skill
