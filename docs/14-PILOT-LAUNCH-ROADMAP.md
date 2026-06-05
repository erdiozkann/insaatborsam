# 14 — Pilot Launch Yol Haritası (Gerçek Durum)

**Status:** Aktif | **Last Updated:** 2026-06-05 | **Owner:** Erdi

> Bu doküman, `06-ROADMAP.md`'nin **mobil Faz 1 + ödeme + app store** varsayımı yerine, projenin **gerçekte gittiği yolu** baz alır: **web-first kapalı pilot**. 06 uzun vadeli vizyon olarak geçerli kalır; bu doküman bir sonraki somut hedefe — **4 kişilik kapalı web pilotunu yayına almaya** — kadar yapılacakları sıralar.
>
> Tespit yöntemi: 4 paralel inceleme agent'ı (buyer/seller/admin-infra/product-pilot) gerçek kodu denetledi (2026-06-05).

---

## Gerçek Durum Özeti

**Çalışan (kod tarafı tam):** Web'de uçtan uca lifecycle — alıcı kayıt → profil → RFQ oluştur/takip → (admin davet) → satıcı teklif → teklif karşılaştır/kabul → sipariş taslağı (`pending_payment`) → sipariş takibi. Tam admin paneli (satıcı doğrula, RFQ'ya satıcı davet et, funnel). 72 migration, RLS, audit log. Güvenlik modeli pilot-kalitesinde.

**Bilerek ertelenmiş (doğru karar):** Ödeme (Iyzico/Stripe — şema var, bağlı değil), mobil app'ler (boş iskelet), kargo/nakliyeci modülü, otomasyon, AI ajanlar.

**"Yayına hazır" tanımı (yakın vade):** *Bir dış kullanıcı, yanında sen olmadan alıcı→teklif→sipariş akışını tamamlayabiliyor.* Operasyonel güven, özellik-tamlığı değil. Hedef: **4 kişilik kapalı web pilotu** (alıcı, satıcı/nalbur, admin/operatör, manuel nakliyeci kontağı).

---

## Launch Blocker'ları (pilot bunlar olmadan çalışmaz)

| # | Blocker | Tip | Sahip |
|---|---|---|---|
| B1 | **Login çalışmıyor** — UI sadece SMS-OTP; tek staff hesabı email/şifre seed; email/şifre giriş yolu yok → staff `/admin`'e giremiyor | KOD (+ops) | Claude → Erdi onay |
| B2 | SMS provider Supabase'de yapılandırılmamış (`[auth.sms]` TODO, `enable_signup=false`) | OPS | Erdi |
| B3 | İlk gerçek owner/staff hesabı prod'da yok (service_role runbook) | OPS | Erdi |
| B4 | `/satici-ol` başvuruları kayboluyor (`console.log`, DB/email yok) | KOD | Claude |
| B5 | Migration'lar prod'a push edilmemiş (`supabase db push`) | OPS | Erdi |
| B6 | Mesafeli Satış sözleşmesinde tüzel kişi/adres eksik | HUKUK | Erdi (yalnız ödeme açılırsa zorunlu; pilot ödemesiz → ertelenebilir) |

**Pilot ödemesizdir** → B6 pilot için bloklayıcı değil, public launch öncesi zorunlu.

---

## Pilot Scope: Olmazsa Olmaz / Manuel Kalsın / Ertelensin

**Olmazsa olmaz (yeni yapılacak az iş):**
- Login'in çalışması (B1) — email/şifre giriş yolu.
- RFQ'da **nakliye tercihi** alanı + serbest not (tek alan — nakliyeyi öğrenmenin en ucuz yolu).
- Siparişin `pending_payment` ötesine **manuel** kapanışı (ödemesiz, admin "teslim edildi" işaretler).
- 4 pilot kullanıcısının onboarding'i (admin davet RPC'si zaten var).

**Manuel kalsın (YAPMA):** nakliye dispatch (telefon/WhatsApp + not), ödeme/mutabakat (banka havalesi, admin "ödendi" işaretler), satıcı kaynak/eşleştirme (admin elle davet eder), bildirimler (4 kişi için telefon/email yeter), e-fatura.

**Ertelensin (kapsam dışı):** Iyzico/Stripe ödeme, mobil app'ler, kargo app/transporter marketplace, AI ajanlar, fiyat endeksi otomasyonu, Meta/WhatsApp otomasyonu.

> ⚠️ **En büyük overbuild riski:** ödeme. Şema var diye "neredeyse bitmiş" gibi görünüyor — pilot için bloklayıcı DEĞİL. Sprint 15 debrief'ine kadar web-first / manuel-nakliye / ödemesiz çizgisini koru.

---

## Sprint Sırası (blocker-first, yalın)

### Sprint 10 — Auth & Erişim Unblock *(launch-critical)*
- **[KOD]** `/giris`'e email/şifre giriş yolu ekle (additive — mevcut SMS-OTP'yi bozmadan). Staff + pilot kullanıcıları SMS bağımlılığı olmadan girebilsin.
- **[OPS/Erdi]** Karar: pilot için email/şifre mi, SMS provider mı? (Öneri: kapalı pilot için email/şifre — daha kontrollü, SMS maliyeti/config yok.)
- **[OPS/Erdi]** İlk prod owner staff hesabı (service_role 3-adım runbook).
- *Öğrenme hedefi:* erişim güvenli ve sürtünmesiz mi.

### Sprint 11 — Intake & Veri Bütünlüğü
- **[KOD]** `/satici-ol` başvurularını bir tabloya yaz (migration + action) — lead'ler kaybolmasın.
- **[KOD]** Kullanıcıya sızan iç sprint numaralarını temizle ("Sprint 8/9'da açılacak" → nötr metin); yanıltıcı `SALT-OKUMA/DISABLED` yorumunu düzelt.
- *Öğrenme hedefi:* funnel ve metin dürüstlüğü.

### Sprint 12 — Nakliye Niyeti Yakalama *(en yüksek değerli ucuz build)*
- **[KOD]** RFQ'ya nakliye tercihi (örn. "Satıcı getirsin / Kendim alırım / Kararsız") + serbest not; satıcı ve admin görünümlerine yansıt.
- *Öğrenme hedefi:* alıcılar nakliyeden ne bekliyor — modül kurmadan veri topla.

### Sprint 13 — Manuel Sipariş Kapanışı
- **[KOD]** Admin/manuel sipariş status ilerletme: `pending_payment` → confirmed → delivered; ödeme offline "ödendi" işaretlenir. Mevcut `order_status_history` kullanılır. Ödeme entegrasyonu YOK.
- *Öğrenme hedefi:* bir anlaşma uçtan uca (para+nakliye manuel) gerçekten kapanabiliyor mu.

### Sprint 14 — Pilot Onboarding + Gözlemlenebilirlik
- **[KOD]** 4 pilot kullanıcısını seed/davet et; admin funnel ekranını operatör tek ekrandan yürütebilecek şekilde toparla.
- **[KOD/OPS]** Sentry + PostHog bağla (env'ler hazır); minimal CI (`.github/workflows`: typecheck + build — lint atla, bu ortamda takılıyor).
- *Öğrenme hedefi:* admin pazarı tek başına yürütebiliyor mu; hatalar/funnel görünür mü.

### Sprint 15 — Pilot Run + Debrief *(GATE — build yok)*
- Gerçek bir RFQ→sipariş'i 4 kişiyle yürüt; nakliye gerçeğini ve satıcı yanıt süresini topla.
- *Öğrenme hedefi:* satıcı likiditesi gerçek mi, nakliye ne gerektiriyor — ödeme/kargo işine değer olup olmadığını açan iki cevap.

---

## Erdi'nin Operasyon Checklist'i (kod dışı, paralel)

- [ ] Pilot auth kararı: email/şifre mi, SMS provider mı (B1/B2).
- [ ] Supabase prod: SMS provider (seçilirse) + ilk owner staff hesabı (B2/B3).
- [ ] `supabase db push` → migration'lar + RPC'ler prod'da (B5).
- [ ] Vercel monorepo deploy ayarı (root `apps/web`, `prebuild` theme:sync çalışsın); `config.toml project_id` gerçek değere.
- [ ] Sentry + PostHog hesap/key'leri.
- [ ] Logo + favicon + marka assetleri (06-ROADMAP bağımlılığı).
- [ ] (Ödeme açılırsa) Mesafeli Satış tüzel kişi/adres + hukuk onayı (B6).
- [ ] İlk 4 pilot kullanıcısı kim (alıcı/müteahhit, satıcı/nalbur, operatör, nakliyeci kontağı).

---

## Pilot Başarı Sinyalleri (ölçülecek)

- Alıcı, yardımsız RFQ açabiliyor mu? Form doğru şeyleri soruyor mu (birim, metraj, termin)?
- Satıcı teklif veriyor mu, ne kadar hızlı? *(satıcı likiditesi — en kritik bilinmeyen)*
- Nakliye bu kullanıcılar için ne demek? (kim ayarlıyor, kim ödüyor)
- Admin nerede müdahale etmek zorunda kalıyor? (her manuel dokunuş → sonraki sprint sinyali)

---

**Sonraki adım:** Sprint 10 — email/şifre giriş yolu. Detay iş bu branch'te (`sprint-10-pilot-launch-prep`).
