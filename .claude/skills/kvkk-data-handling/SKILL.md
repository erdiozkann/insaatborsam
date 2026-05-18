---
name: kvkk-data-handling
description: KVKK uyumlu veri işleme — kullanıcı verisi içeren backend, log, audit, analytics, email, SMS, AI prompt yazılırken otomatik tetiklenir. PII handling, veri saklama süreleri, yurt dışı transfer, anonimleştirme, kullanıcı hakları. "user data", "personal data", "log", "audit", "tracking", "analytics", "GDPR", "KVKK", "PII", "log writing", "save user" geçen istekler için.
---

# KVKK Veri İşleme Kuralları

İnşaat Borsam Türkiye'de operate eder, **KVKK (6698 sayılı Kanun)** kapsamında veri sorumlusudur. Her hata yasal ceza.

## ZORUNLU KURALLAR

### Kural 1: Aydınlatma yokken veri toplama
> Kayıt formunda KVKK aydınlatma metni linki + açık rıza checkbox YOKSA hiçbir veri toplama kodu yazma.

```tsx
// ✅ Form'da
<label>
  <input type="checkbox" required />
  <a href="/kvkk" target="_blank">Aydınlatma Metni</a>'ni okudum, 
  kişisel verilerimin işlenmesine açık rıza veriyorum.
</label>
```

### Kural 2: Amacı belli olmayan veri toplama yasak
Her toplanan veri için **amaç** belirli olmalı:
- email → giriş + bildirim (zorunlu)
- telefon → SMS OTP (zorunlu) + sipariş bildirim (opsiyonel)
- konum → sipariş teslimat (zorunlu)
- doğum tarihi → **gerek yok, toplama**
- cinsiyet → **gerek yok, toplama**

### Kural 3: PII (kişisel veri) log'a yazılmaz

❌ **YASAK:**
```ts
logger.info('User login', { 
  email: user.email,           // ❌ PII
  phone: user.phone,           // ❌ PII
  tc_kimlik: user.tc_no,       // ❌ Hassas PII (asla)
  password: req.body.password, // ❌ Hassas
  ip: req.ip,                  // ❌ KVKK'ya göre PII
})
```

✅ **DOĞRU:**
```ts
logger.info('User login', { 
  user_id: user.id,                    // ✅ Pseudonym
  user_role: user.role,                // ✅ Non-PII
  ip_hash: hashIp(req.ip),             // ✅ Hash
  user_agent_family: 'Safari',         // ✅ Aggregated
})
```

### Kural 4: Yurt dışı transfer şeffaf
Veri **EU dışına** veya **Türkiye dışına** çıkıyorsa kullanıcıya bildir.

Bu projede yurt dışı transfer eden servisler:
- **Anthropic** (ABD) — AI prompt verisi
- **OpenAI** (ABD) — Embedding verisi
- **Stripe** (İrlanda + ABD) — ödeme verisi
- **Vercel** (ABD) — hosting analytics
- **Sentry** (ABD) — error tracking
- **PostHog** (EU veya self-host) — kontrol et
- **Supabase** (EU bölge tercihi) — kontrol et

**Aydınlatma metninde** her birini listele.

### Kural 5: Hard delete yasak (soft delete zorunlu)

```sql
-- Tüm tablolarda
deleted_at TIMESTAMPTZ NULL
```

KVKK silme talebi gelirse:
1. Service role ile Edge Function çağır
2. Veriyi anonymize et (`name = 'Silinmiş Kullanıcı'`, `email = NULL`)
3. `deleted_at = NOW()`
4. 30 gün sonra cron ile hard delete (yasal saklama bitince)

```ts
// Edge Function — anonymize_user.ts
const anonymizeUser = async (userId: string) => {
  await supabase.rpc('anonymize_user_data', { user_id: userId })
  // - profiles.name = 'Silinmiş Kullanıcı'
  // - profiles.email = NULL  
  // - profiles.phone = NULL
  // - profiles.deleted_at = NOW()
  // - log silme talebi
}
```

## VERİ SAKLAMA SÜRELERİ

| Veri tipi | Süre | Sebep |
|---|---|---|
| Kullanıcı hesabı | Aktif olduğu sürece + 1 yıl pasifleştirme sonrası | Geri dönüş için |
| Sipariş kayıtları | **10 yıl** | TTK 6102 — ticari defter |
| Fatura | **10 yıl** | VUK — vergi kayıtları |
| Mesaj/sohbet | 3 yıl | İletişim kayıtları |
| Login/access log | 2 yıl | 5651 sayılı kanun |
| Analytics | Anonim — sınırsız; PII bağlı — 1 yıl |  |
| KVKK silme talebi | 1 yıl talep kaydı | İspat |
| Marketing email rıza | Rıza geri alınana kadar |  |

```sql
-- 04-DATABASE.md'de detay var
-- pg_cron ile günlük temizlik
```

## AYDINLATMA METNİ ZORUNLU BÖLÜMLER

`/kvkk` sayfasında bulunmalı (Faz 1 öncesi avukatla yazılır):

1. **Veri sorumlusu kimliği** — İnşaat Borsam / NodeWorks bilgileri
2. **İşlenen veriler** — email, telefon, isim, VKN, konum, ödeme bilgisi
3. **İşleme amaçları** — hesap, sipariş, ödeme, iletişim, pazarlama
4. **Toplama yöntemi** — web/mobil form, çerez
5. **Hukuki sebep** — sözleşme + meşru menfaat + açık rıza
6. **Aktarım** — yukarıdaki tüm yurt dışı servisler
7. **Saklama süresi** — yukarıdaki tablo
8. **Veri sahibi hakları** (Madde 11):
   - Verilerin işlenip işlenmediğini öğrenme
   - İşlenmişse bilgi talep etme
   - İşleme amacını öğrenme
   - Yurt içi/dışı aktarılanları bilme
   - Eksik/yanlış verilerin düzeltilmesini isteme
   - Silmesini/yok edilmesini isteme
   - Düzeltme/silmenin aktarıldığı 3. kişilere bildirilmesini isteme
   - Otomatik analize itiraz
   - Zarar varsa tazminat
9. **Başvuru yolu** — kvkk@insaatborsam.com (zorunlu kanal)

## VERBİS KAYIT

Veri Sorumluları Sicil Bilgi Sistemi → **Faz 1 öncesi kayıt zorunlu**.
Erdi yapacak, kodda ilgisi yok ama backend'de **VERBIS no** profile/footer'da gösterilmeli (opsiyonel ama profesyonel).

## VERİ İŞLEME ENVANTERİ

Her yeni özellik için kod tarafında envanter:

```ts
// packages/database/data-inventory.ts
export const DATA_INVENTORY = {
  user_registration: {
    fields: ['email', 'phone', 'name', 'password_hash'],
    purpose: 'Account creation, authentication',
    legal_basis: 'contract',
    retention: '1 year after deactivation',
    transfers: ['Supabase (EU)', 'SMS provider (TR)'],
  },
  order_placement: {
    fields: ['user_id', 'address', 'phone', 'items', 'amount'],
    purpose: 'Order fulfillment',
    legal_basis: 'contract',
    retention: '10 years (TTK)',
    transfers: ['Iyzico (TR)', 'Cargo provider (TR)'],
  },
  // ...
}
```

Bu obje hem dokümantasyon hem audit için.

## ÇEREZ POLİTİKASI

Web'de **çerez bildirimi zorunlu** (e-Privacy + KVKK):

```tsx
// İlk ziyaret
<CookieBanner>
  Çerezler kullanıyoruz: zorunlu (giriş), analitik (PostHog), pazarlama (Meta).
  [Hepsini kabul] [Sadece zorunlu] [Tercihleri seç]
</CookieBanner>
```

**Zorunlu çerez:** Onay gerekmez (session, CSRF token).
**Analitik/pazarlama:** Açık onay olmadan **YÜKLEME**.

```ts
// PostHog sadece onay sonrası init
if (cookieConsent.analytics) {
  posthog.init(KEY)
}
```

## AI VERİ İŞLEME (Faz 1 kritik)

Claude/OpenAI'ye gönderilen prompt'lar veri transferi sayılır.

### Kural: Asla ham PII gönderme

```ts
// ❌ KÖTÜ
await claude.complete(`
  Kullanıcı Ahmet Yılmaz (ahmet@firma.com, 0532 123 45 67) için RFQ oluştur:
  ${rfqText}
`)

// ✅ İYİ — anonimize
await claude.complete(`
  Kullanıcı (ID: user_abc123) için RFQ oluştur:
  ${rfqText}
`)
```

### Kural: AI çıktısını log'larken PII'i çıkar

```ts
const result = await claude.complete(prompt)

// Log için
logger.info('AI completion', { 
  user_id: userId,
  input_tokens: result.usage.input_tokens,
  output_tokens: result.usage.output_tokens,
  model: result.model,
  // ❌ NOT: input_text, output_text — saklama
})

// Cache için (Supabase)
await supabase.from('ai_cache').insert({
  prompt_hash: hash(prompt),
  response: result.text,
  // ❌ NOT: orijinal prompt
})
```

### Kural: AI prompt'ları aydınlatma metninde belirt

> "Hizmet kalitesini artırmak için kullanıcı sorularınız Anthropic (ABD) ve OpenAI (ABD) servisleri ile işlenir. Kişisel verileriniz işlemden önce anonimleştirilir."

## SMS / EMAIL İŞARETLEME

Pazarlama içeriği için **ayrı rıza**.

```tsx
// Kayıt formu
<label>
  <input type="checkbox" />
  Kampanya ve pazarlama içerikleri için e-posta/SMS almak istiyorum (opsiyonel)
</label>
```

Transactional (sipariş, OTP) → rıza gerekmez, hizmet için.
Marketing → ayrı checkbox + opt-out linki her emailde.

## YAZIM ÖNCESİ CHECK

Kullanıcı verisi içeren her kod için:

- [ ] Log'a PII yazıyor muyum? (Çıkar veya hash'le)
- [ ] Yeni veri topluyorum, aydınlatma metnine ekledim mi?
- [ ] Yurt dışı servis kullanıyorsam aydınlatmada var mı?
- [ ] Hard delete yapıyor muyum? (Soft delete kullan)
- [ ] Veri saklama süresi sınırlı mı? (Cron temizlik)
- [ ] AI'ya PII gönderiyor muyum? (Anonimize et)
- [ ] Pazarlama içeriği için ayrı rıza var mı?
- [ ] Çerez politikası kontrol ediliyor mu?
- [ ] Audit log için PII pseudonym mü?

## VERİ İHLALİ BİLDİRİMİ (Acil Durum)

İhlal tespitinde:
1. **72 saat içinde** Kişisel Verileri Koruma Kurumu'na bildirim
2. Etkilenen kullanıcılara e-posta
3. Internal incident log
4. Erdi'ye derhal haber

Endpoint hazır olsun: `POST /api/security/incident` → audit log + Sentry critical alert.

## REFERANS

- `docs/04-DATABASE.md` Bölüm 9 — Veri yaşam döngüsü
- `docs/07-BUSINESS.md` Bölüm 7.2 — KVKK yasal
- `docs/05-AI.md` — AI ile KVKK
