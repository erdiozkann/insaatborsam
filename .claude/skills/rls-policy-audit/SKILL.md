---
name: rls-policy-audit
description: Yeni tablo, RLS policy, SELECT/INSERT/UPDATE/DELETE policy yazılırken tetiklenir. Sprint 1'de uygulanan 28 tablo RLS mimarisinin tutarlılığını korur. "supabase", "migration", "table", "rls", "policy", "CREATE POLICY", "ENABLE ROW LEVEL SECURITY", "buyer", "seller", "staff", "service_role" geçen istekler için.
---

# RLS Policy Audit

İnşaat Borsam'da her tabloda RLS zorunlu. Bu skill, Sprint 1'de kurulan 28 tablo mimarisiyle tutarlı policy yazmayı sağlar.  
Referans: `docs/09-SECURITY.md` · `.claude/skills/supabase-rls-validator/SKILL.md` · `supabase/migrations/000003–000059`

## ALTIN KURAL

```sql
ALTER TABLE public.yeni_tablo ENABLE ROW LEVEL SECURITY;
```

Bu satır yoksa migration tamamlanmamıştır. **İstisna yok.**

---

## Kontrol Listesi

### Temel Kontroller

- [ ] `ALTER TABLE x ENABLE ROW LEVEL SECURITY` var mı?
- [ ] En az bir SELECT policy var mı? (yoksa kimse okuyamaz)
- [ ] `anon` rolüne erişim gerçekten gerekli mi? (çoğu tablo `authenticated` yeterli)
- [ ] INSERT policy `WITH CHECK` kullanıyor mu? (`USING` insert'te çalışmaz)
- [ ] UPDATE policy hem `USING` hem `WITH CHECK` içeriyor mu?
- [ ] DELETE politikası gerçekten gerekli mi? (soft delete varsa hayır)

### Multi-Tenant Güvenlik

- [ ] `buyer_id` veya `seller_id` filtresi var mı? (`auth.uid()` JOIN ile)
- [ ] Başka alıcının verisine erişim mümkün mü? → T02 tehdit
- [ ] Başka satıcının verisine erişim mümkün mü? → T01 tehdit
- [ ] `rfq_offers` için gizli teklif prensibi korunuyor mu? (seller sadece kendi teklifini görür)

### Soft Delete Uyumu

- [ ] `deleted_at IS NULL` filtresi SELECT policy'de var mı?
- [ ] Soft-delete tablosunda DELETE policy zorunlu mu? (çoğunlukla hayır — UPDATE ile deleted_at set edilir)

### Staff Erişimi

- [ ] Staff policy bu migration'da mı, yoksa `000064_staff_access_policies.sql`'de mi?
- [ ] Mevcut pattern kullanılıyor mu? `USING (public.is_active_staff())`
- [ ] Rol bazlı kontrol gerekiyorsa: `USING (public.has_staff_role(ARRAY['owner','admin']))`
- [ ] INSERT/UPDATE/DELETE policy staff'a verilmedi mi? (default SELECT only)

### SECURITY DEFINER Fonksiyon

- [ ] `SET search_path = public, pg_temp` var mı?
- [ ] `REVOKE ALL FROM PUBLIC` + `GRANT EXECUTE TO authenticated` var mı?
- [ ] Recursive policy riski yok mu? (kendi tablosuna bakıyorsa dikkat)

### Deny-by-Default Tabloları

Şu tablolara policy ekleme — tamamen kapalı kalmalı:

```
webhook_events → sıfır policy (service_role only)
ai_cache       → sıfır policy (service_role only)
```

`admin_audit_logs` → sadece owner/admin SELECT: `has_staff_role(ARRAY['owner','admin'])`  
`seller_kyc` → sadece owner/admin/operations SELECT: `has_staff_role(ARRAY['owner','admin','operations'])`

---

## Tablo Bazlı Erişim Karar Tablosu

Yeni tablo yazarken hangi pattern'i kullanacağını belirle:

| Senaryo | Pattern |
|---|---|
| Kullanıcı kendi satırı | `auth.uid() = user_id` |
| Buyer kendi kaydı | `buyer_id IN (SELECT id FROM buyer_profiles WHERE user_id = auth.uid())` |
| Seller kendi kaydı | `seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid())` |
| Public okuma (vitrin) | `status = 'active' AND deleted_at IS NULL` (anon + authenticated) |
| Buyer + Seller birlikte | `buyer_id IN (...) OR seller_id IN (...)` |
| Davetli seller | rfq_invitations JOIN (bkz. 000027) |
| Staff tüm erişim | `public.is_active_staff()` |
| Rol bazlı staff | `public.has_staff_role(ARRAY['owner','admin'])` |
| Yok (deny-by-default) | SIFIR POLICY — sadece service_role |

---

## Yaygın Hatalar

### ❌ WITH CHECK olmadan INSERT
```sql
-- Yanlış: USING insert'te çalışmaz
CREATE POLICY "x" ON t FOR INSERT USING (user_id = auth.uid());

-- Doğru
CREATE POLICY "x" ON t FOR INSERT WITH CHECK (user_id = auth.uid());
```

### ❌ Recursive policy
```sql
-- Yanlış: seller_profiles kendi kendine bakıyor → sonsuz döngü riski
CREATE POLICY "x" ON seller_profiles FOR SELECT
  USING (id IN (SELECT seller_id FROM seller_profiles WHERE ...));

-- Doğru
USING (user_id = auth.uid())
-- veya SECURITY DEFINER helper function
```

### ❌ UPDATE policy olmadan kritik kolon değişikliği
```sql
-- seller_profiles.is_verified kilidi (000005 pattern):
CREATE POLICY "seller_profiles_update_own"
  ON seller_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (
    user_id = auth.uid()
    AND is_verified = (SELECT sp.is_verified FROM seller_profiles sp WHERE sp.id = seller_profiles.id)
  );
```

### ❌ DELETE policy yazılmış ama soft delete kullanılıyor
- Soft delete tablolarda DELETE policy genellikle yok
- Kullanıcı `UPDATE x SET deleted_at = NOW()` yapar

---

## Migration Dosya İsimlendirme

Sprint 1 ile tutarlı kalın:

```
YYYYMMDDNNNNNN_tablo_adi.sql
YYYYMMDDNNNNNN_tablo_adi_rls.sql
```

RLS ayrı dosyada — tablo creation'dan sonraki timestamp.

---

## Yeni Migration Sonrası Kontrol

- [ ] `pnpm supabase gen types typescript --project-id ... > packages/database/src/types.ts`
- [ ] `pnpm --filter @insaatborsam/web typecheck`
- [ ] Supabase Dashboard → Database → Policies → yeni policy görünüyor mu?
