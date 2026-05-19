-- Migration: 20260519000015_product_images_rls.sql
-- Amaç: product_images tablosu için RLS politikaları.
--
-- Politika özeti:
--   - Public read: parent ürün 'active' ve silinmemişse görseller herkese açık.
--   - Owner CRUD: ürünün satıcısı görselleri yönetir.
--   - DELETE: hard delete OK (görsel storage'dan da silinmesi gerek — uygulama
--     katmanı: DB DELETE + Storage DELETE).

-- RLS'i aç
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Önceki policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "product_images_public_read_active" ON public.product_images;
DROP POLICY IF EXISTS "product_images_select_own" ON public.product_images;
DROP POLICY IF EXISTS "product_images_insert_own" ON public.product_images;
DROP POLICY IF EXISTS "product_images_update_own" ON public.product_images;
DROP POLICY IF EXISTS "product_images_delete_own" ON public.product_images;

-- SELECT (public): aktif ürünün görselleri anon dahil herkese açık
CREATE POLICY "product_images_public_read_active"
  ON public.product_images
  FOR SELECT
  TO anon, authenticated
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE status = 'active' AND deleted_at IS NULL
    )
  );

-- SELECT (owner): satıcı kendi tüm ürünlerinin görsellerini görür
CREATE POLICY "product_images_select_own"
  ON public.product_images
  FOR SELECT
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON sp.id = p.seller_id
      WHERE sp.user_id = auth.uid()
    )
  );

-- INSERT: satıcı yalnızca kendi ürününe görsel ekleyebilir
CREATE POLICY "product_images_insert_own"
  ON public.product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON sp.id = p.seller_id
      WHERE sp.user_id = auth.uid()
    )
  );

-- UPDATE: satıcı kendi ürün görsellerini günceller (sıra, alt, primary)
CREATE POLICY "product_images_update_own"
  ON public.product_images
  FOR UPDATE
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON sp.id = p.seller_id
      WHERE sp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON sp.id = p.seller_id
      WHERE sp.user_id = auth.uid()
    )
  );

-- DELETE: satıcı kendi ürün görselini siler (hard delete OK — Storage temizliği
-- uygulama katmanında: DB DELETE → Storage DELETE)
CREATE POLICY "product_images_delete_own"
  ON public.product_images
  FOR DELETE
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.seller_profiles sp ON sp.id = p.seller_id
      WHERE sp.user_id = auth.uid()
    )
  );
