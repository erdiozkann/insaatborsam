---
name: supabase-rls-validator
description: Supabase tablo, migration, RLS policy, RPC function yazılırken otomatik tetiklenir. Row Level Security kontrol listesi, multi-tenant izolasyon, policy şablonları. "supabase", "migration", "table", "rls", "policy", "postgres", "schema", "rpc", "trigger" geçen istekler için.
---

# Supabase RLS Validator

İnşaat Borsam çoklu kullanıcı tipi (alıcı, satıcı, nakliyeci, admin) içeren bir B2B marketplace. **Her tabloda RLS zorunlu**, yoksa veri sızıntısı kaçınılmaz.

## ALTIN KURAL

> **Her yeni tabloya RLS açılır. Hiçbir istisna yok.**

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

Bu satır migration'da yoksa **migration eksiktir**.

## STANDART POLICY ŞABLONLARI

### Pattern 1: Kullanıcı kendi verisi
Kullanıcının sadece kendi satırlarını görmesi gerektiğinde.

```sql
-- SELECT
CREATE POLICY "users_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- INSERT
CREATE POLICY "users_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE
CREATE POLICY "users_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE
CREATE POLICY "users_delete_own"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);
```

### Pattern 2: Satıcı kendi ürünleri
`seller_id` ile bağlı tablolarda.

```sql
CREATE POLICY "sellers_manage_own_products"
  ON products FOR ALL
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );
```

### Pattern 3: Herkese açık okuma + sahibe yazma
Ürün katalog gibi public read, owner write.

```sql
-- Herkes okuyabilir (anonim dahil)
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Sadece satıcı kendi ürününü değiştirebilir
CREATE POLICY "products_owner_write"
  ON products FOR UPDATE
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
```

### Pattern 4: RFQ — Alıcı + davetli satıcılar
```sql
-- Alıcı kendi RFQ'sunu görür
CREATE POLICY "rfqs_buyer_own"
  ON rfqs FOR SELECT
  TO authenticated
  USING (buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid()));

-- Davetli satıcılar RFQ'yu görür
CREATE POLICY "rfqs_invited_sellers"
  ON rfqs FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT rfq_id FROM rfq_invitations 
      WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
    )
  );
```

### Pattern 5: Admin tam erişim
Admin role kontrolü ayrı tabloda.

```sql
CREATE POLICY "admin_full_access"
  ON ANY_TABLE FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );
```

> **NOT:** Admin policy her tabloda manuel açılır, "service_role" key sadece Edge Function/server tarafında.

## KONTROL LİSTESİ (Migration Önce)

Her migration için:

- [ ] `ALTER TABLE x ENABLE ROW LEVEL SECURITY;` var mı?
- [ ] En az 1 SELECT policy var mı? (yoksa kimse okuyamaz)
- [ ] INSERT policy `WITH CHECK` içeriyor mu?
- [ ] UPDATE policy hem `USING` hem `WITH CHECK` içeriyor mu?
- [ ] Multi-tenant kolon var mı (`seller_id`, `buyer_id`, `tenant_id`)? Policy onu kontrol ediyor mu?
- [ ] Soft delete kullanılıyorsa policy `deleted_at IS NULL` filtresi içeriyor mu?
- [ ] Anonim role'e (anon) erişim **mutlaka** gerekli mi? Yoksa sadece authenticated.
- [ ] Service role kullanımı Edge Function'da mı (client'ta değil)?
- [ ] Foreign key'ler ON DELETE davranışı belirli mi (CASCADE/RESTRICT/SET NULL)?
- [ ] Index'ler doğru (özellikle policy'de WHERE'e giren kolonlarda)?

## YAYGIN HATALAR

### ❌ RLS açık ama policy yok
```sql
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
-- policy yok → kimse erişemez (auth role'leri için)
```
**Çözüm:** En azından SELECT policy ekle.

### ❌ WITH CHECK olmadan INSERT
```sql
CREATE POLICY "x" ON t FOR INSERT TO authenticated USING (true);
-- USING INSERT'te çalışmaz, WITH CHECK gerek
```
**Çözüm:** `WITH CHECK (...)` kullan.

### ❌ Recursive policy
```sql
CREATE POLICY "x" ON sellers FOR SELECT 
  USING (id IN (SELECT seller_id FROM sellers WHERE ...));
-- aynı tabloya bakıyor → sonsuz döngü
```
**Çözüm:** SECURITY DEFINER function ile çöz veya `auth.uid()` direkt karşılaştır.

### ❌ Service role'i client'ta kullanma
```ts
// ❌ YASAK
const supabase = createClient(URL, SERVICE_ROLE_KEY)

// ✅ DOĞRU — sadece Edge Function'da
const supabase = createClient(URL, ANON_KEY)
```

### ❌ Multi-tenant izolasyon eksik
```sql
-- ❌ Tüm sipariş herkes görür
CREATE POLICY "orders_read" ON orders FOR SELECT TO authenticated USING (true);

-- ✅ Sadece kendi siparişleri
CREATE POLICY "orders_read" ON orders FOR SELECT TO authenticated
  USING (
    buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
    OR seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );
```

## RPC FUNCTION GÜVENLİĞİ

Karmaşık sorgular için RPC kullan, ama:

```sql
-- ✅ DOĞRU — SECURITY INVOKER (default)
CREATE OR REPLACE FUNCTION search_products(query text)
RETURNS SETOF products
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM products 
  WHERE name ILIKE '%' || query || '%' 
    AND status = 'active'
$$;
```

`SECURITY DEFINER` sadece **özel olarak gerekiyorsa** kullan (RLS bypass). Kullanırken:
- Function input'larını sanitize et
- `search_path` set et: `SET search_path = public, pg_temp;`
- Kim çağırabilir bunu policy ile kontrol et

## MIGRATION DOSYA İSİMLENDİRME

```
supabase/migrations/
├── 20260601000001_initial_schema.sql
├── 20260601000002_rls_policies.sql
├── 20260602000001_add_rfq_table.sql
└── 20260602000002_rfq_rls.sql
```

Format: `YYYYMMDDHHMMSS_aciklama.sql`. **RLS migration'ları ayrı dosyada** olur, tablo migration'ından sonra.

## TYPE GENERATION

Migration sonrası **mutlaka** type generate et:

```bash
pnpm supabase gen types typescript --project-id <id> > packages/database/src/types.ts
```

Bu olmadan client tip güvenliğinden yoksun kalır.

## SİLME POLİTİKASI

Üretim verisinde **hard delete yok**. Tüm tablolarda:
```sql
deleted_at TIMESTAMPTZ NULL
```

Ve tüm SELECT policy'lerde `AND deleted_at IS NULL` filtresi.

KVKK kapsamında veri silme talebi gelirse hard delete sadece **service role** üzerinden Edge Function'da yapılır.

## REFERANS

Detaylı şema, tüm tablolar ve özel RPC fonksiyonları için: `docs/04-DATABASE.md`
