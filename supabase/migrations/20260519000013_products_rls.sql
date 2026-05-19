-- Migration: 20260519000013_products_rls.sql
-- Amaç: products tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Public read: status='active' olan ve silinmemiş ürünler herkese açık (anon + auth).
--   - Owner SELECT: satıcı kendi tüm ürünlerini görür (draft, paused, vb. dahil).
--   - Owner INSERT: satıcı sadece kendi seller_profile.id ile ürün yaratabilir.
--   - Owner UPDATE: satıcı kendi ürünlerini günceller. seller_id değiştirilemez.
--   - DELETE policy YOK — soft delete pattern (UPDATE ile deleted_at).
--     Hard delete service_role ile.

-- RLS'i aç
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "products_public_read_active" ON public.products;
DROP POLICY IF EXISTS "products_select_own" ON public.products;
DROP POLICY IF EXISTS "products_insert_own" ON public.products;
DROP POLICY IF EXISTS "products_update_own" ON public.products;

-- SELECT (public): aktif ürünleri herkes (anon dahil) görür
CREATE POLICY "products_public_read_active"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active'
    AND deleted_at IS NULL
  );

-- SELECT (owner): satıcı kendi tüm ürünlerini her durumda görür
CREATE POLICY "products_select_own"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: satıcı yalnızca kendi seller_profile.id ile ürün yaratabilir
CREATE POLICY "products_insert_own"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.seller_profiles
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: satıcı kendi ürünlerini günceller
-- Kritik: seller_id WITH CHECK içinde de doğrulanır — değiştirip başkasının ürünü
-- yapmaya çalışmak engellenir. status='rejected' satırı tekrar 'active' yapma
-- staff onayı ile yapılmalı — uygulama katmanında kontrol.
CREATE POLICY "products_update_own"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.seller_profiles
      WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.seller_profiles
      WHERE user_id = auth.uid()
    )
  );

-- DELETE policy YOK — soft delete pattern.
