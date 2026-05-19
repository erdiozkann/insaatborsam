-- Migration: 20260519000011_categories_rls.sql
-- Amaç: categories tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Public read (anon + authenticated): aktif kategoriler herkese açık.
--   - Yazma yasak — RLS write policy YOK. Kategori yönetimi yalnızca:
--       1) Migration / seed dosyaları,
--       2) Service_role ile admin paneli (staff Edge Function'ları),
--       3) İleride eklenecek staff policy'leri (000034 sonrası).
--   - Yani RLS aktif + sadece SELECT policy = authenticated kullanıcı kategori
--     EKLEYEMEZ/DEĞİŞTİREMEZ/SİLEMEZ. (RLS açık + matching policy yoksa erişim reddedilir.)

-- RLS'i aç
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;

-- SELECT: aktif kategorileri herkes (anon dahil) görür
CREATE POLICY "categories_public_read"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- INSERT/UPDATE/DELETE policy YOK — staff_users + service_role tarafından yönetilir.
